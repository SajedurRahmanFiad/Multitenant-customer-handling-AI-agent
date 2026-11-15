<?php
declare(strict_types=1);

/**
 * Self-healing schema manager.
 *
 * Every boot (HTTP front controller + CLI bootstrap) it makes sure the database
 * is complete:
 *   1. Missing tables      -> created from the schema file
 *   2. Missing columns     -> ALTER TABLE ADD COLUMN from the schema definition
 *   3. Missing indexes     -> re-created
 *   4. Empty registries    -> canonical rows re-inserted (currencies, plans, ...)
 *   5. Empty demo dataset  -> full demo seed (non-production only)
 *
 * Results are cached in the `schema_state` table so steady-state requests skip
 * the scan. Any query hitting a missing table/column at runtime triggers an
 * immediate forced heal + retry (see Database::run).
 */
final class SchemaHealer
{
    private const SCAN_TTL_SECONDS = 300;
    private static bool $healingNow = false;
    private static bool $healedThisRequest = false;

    public static function ensure(bool $force = false): void
    {
        if (self::$healingNow || (!$force && self::$healedThisRequest)) return;
        self::$healingNow = true;
        try {
            $pdo = Database::pdo();
            self::ensureStateTable($pdo);

            $hash = hash('sha256', Database::driver() . '|' . self::schemaFile());
            $state = Database::fetchOne('SELECT * FROM schema_state WHERE id = 1');
            if (
                !$force && $state && $state['state_hash'] === $hash
                && strtotime((string) $state['checked_at']) > time() - self::SCAN_TTL_SECONDS
            ) {
                return; // recently healed and schema unchanged
            }

            $report = self::heal($pdo);
            Database::run(
                $state
                    ? 'UPDATE schema_state SET state_hash = :h, healed_at = :t, checked_at = :t2, report = :r WHERE id = 1'
                    : 'INSERT INTO schema_state (id, state_hash, healed_at, checked_at, report) VALUES (1, :h, :t, :t2, :r)',
                ['h' => $hash, 't' => Database::now(), 't2' => Database::now(), 'r' => Database::json($report)]
            );
            self::$healedThisRequest = true;
        } finally {
            self::$healingNow = false;
        }
    }

    /** Run after a query failed with a missing-table/column style error. */
    public static function repairFromError(): void
    {
        self::ensure(true);
    }

    // ------------------------------------------------------------ internals

    private static function ensureStateTable(PDO $pdo): void
    {
        $driver = Database::driver();
        if ($driver === 'mysql') {
            $pdo->exec('CREATE TABLE IF NOT EXISTS schema_state (
                id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
                state_hash VARCHAR(64) NULL,
                healed_at DATETIME NULL,
                checked_at DATETIME NULL,
                report TEXT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        } else {
            $pdo->exec('CREATE TABLE IF NOT EXISTS schema_state (
                id INTEGER PRIMARY KEY,
                state_hash TEXT,
                healed_at TEXT,
                checked_at TEXT,
                report TEXT
            )');
        }
    }

    private static function schemaFile(): string
    {
        return Database::driver() === 'sqlite'
            ? Config::get('APP_BASE_PATH') . '/database/schema.sqlite.sql'
            : Config::get('APP_BASE_PATH') . '/database/schema.mysql.sql';
    }

    /** @return string[] human-readable list of repairs performed */
    private static function heal(PDO $pdo): array
    {
        $report = [];
        require_once Config::get('APP_BASE_PATH') . '/database/registries.php';
        $tables = self::parseSchema();

        // 1-2. Tables + columns
        foreach ($tables as $name => $def) {
            if (!self::tableExists($pdo, $name)) {
                $pdo->exec($def['create']);
                $report[] = "created table $name";
            }
            $missing = array_diff(array_keys($def['columns']), self::columnsOf($pdo, $name));
            foreach ($missing as $col) {
                try {
                    $pdo->exec("ALTER TABLE `$name` ADD COLUMN " . $def['columns'][$col]);
                    $report[] = "added column $name.$col";
                } catch (PDOException $e) {
                    error_log('[healer] failed to add column ' . $name . '.' . $col . ': ' . $e->getMessage());
                }
            }
        }

        // 3. Indexes
        foreach (self::parseIndexes() as $idxName => $stmt) {
            if (!self::indexExists($pdo, $idxName)) {
                try {
                    $pdo->exec($stmt);
                    $report[] = "created index $idxName";
                } catch (PDOException $e) {
                    error_log('[healer] index ' . $idxName . ': ' . $e->getMessage());
                }
            }
        }

        if (Database::driver() === 'mysql') {
            foreach ([
                'jobs' => "ENUM('pending','running','completed','failed','dead','cancelled','dismissed') NOT NULL DEFAULT 'pending'",
                'training_jobs' => "ENUM('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued'",
            ] as $table => $definition) {
                $column = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'status'")->fetch(PDO::FETCH_ASSOC);
                if ($column && (!str_contains((string)$column['Type'], 'cancelled') || ($table === 'jobs' && !str_contains((string)$column['Type'], 'dismissed')))) {
                    $pdo->exec("ALTER TABLE `$table` MODIFY status $definition");
                    $report[] = "updated $table.status lifecycle values";
                }
            }
            $quality = $pdo->query("SHOW COLUMNS FROM `whatsapp_connections` LIKE 'quality_rating'")->fetch(PDO::FETCH_ASSOC);
            if ($quality && !str_contains((string)$quality['Type'], 'UNKNOWN')) {
                $pdo->exec("ALTER TABLE `whatsapp_connections` MODIFY quality_rating ENUM('GREEN','YELLOW','RED','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN'");
                $report[] = 'updated whatsapp_connections.quality_rating values';
            }
        }

        // 4. Registries
        foreach (RegistryData::healRegistries() as $table) {
            $report[] = "re-hydrated registry $table";
        }

        // 5. Demo data (only for fresh local/dev databases)
        if ((int) Database::scalar('SELECT COUNT(*) FROM users') === 0
            && Config::get('APP_ENV', 'local') !== 'production') {
            require_once Config::get('APP_BASE_PATH') . '/database/demo_data.php';
            $report = array_merge($report, seedDemoData(false));
            $report[] = 'seeded demo dataset';
        }

        if ($report) {
            error_log('[healer] ' . implode('; ', $report));
        }
        return $report;
    }

    // -------------------------------------------------------- schema parsing

    /** @return array<string, array{create: string, columns: array<string, string>}> */
    private static function parseSchema(): array
    {
        $raw = file_get_contents(self::schemaFile()) ?: '';
        $lines = array_values(array_filter(explode("\n", $raw), fn(string $l): bool => !preg_match('/^\s*--/', $l)));
        $clean = implode("\n", $lines);

        $tables = [];
        if (!preg_match_all('/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(/i', $clean, $m, PREG_OFFSET_CAPTURE)) {
            return $tables;
        }
        foreach ($m[0] as $i => $fullMatch) {
            $name = strtolower($m[1][$i][0]);
            $stmtStart = $fullMatch[1];                 // offset of "CREATE TABLE"
            $open = strpos($clean, '(', $stmtStart);
            $depth = 0;
            $close = $open;
            for ($j = $open, $len = strlen($clean); $j < $len; $j++) {
                $ch = $clean[$j];
                if ($ch === '(') $depth++;
                elseif ($ch === ')') { $depth--; if ($depth === 0) { $close = $j; break; } }
            }
            $body = substr($clean, $open + 1, $close - $open - 1);
            $semi = strpos($clean, ';', $close);
            $tail = $semi !== false ? substr($clean, $close + 1, $semi - $close - 1) : '';
            $columns = [];
            foreach (self::splitTopLevel($body) as $part) {
                $p = trim($part);
                if ($p === '' || preg_match('/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE\s+(KEY|INDEX)|KEY\s|INDEX\s|CHECK\s)/i', $p)) {
                    continue;
                }
                if (!preg_match('/^["`]?(\w+)["`]?\s+(.+)$/s', $p, $cm)) continue;
                $colName = strtolower($cm[1]);
                $colDef = trim(preg_replace('/\s+/', ' ', $cm[2]) ?? '');
                $columns[$colName] = $colName . ' ' . $colDef;
            }
            $tables[$name] = [
                'create' => substr($clean, $stmtStart, $close - $stmtStart + 1) . $tail,
                'columns' => $columns,
            ];
        }
        return $tables;
    }

    /** @return array<string, string> index name => CREATE statement */
    private static function parseIndexes(): array
    {
        $sql = file_get_contents(self::schemaFile()) ?: '';
        $lines = array_values(array_filter(explode("\n", $sql), fn(string $l): bool => !preg_match('/^\s*--/', $l)));
        $clean = implode("\n", $lines);
        $out = [];
        if (preg_match_all('/CREATE (UNIQUE )?INDEX (\w+) ON (\w+)[^;]+;/i', $clean, $m, PREG_SET_ORDER)) {
            foreach ($m as $set) {
                $out[strtolower($set[2])] = $set[0];
            }
        }
        return $out;
    }

    /** @return string[] top-level comma-split parts (respecting parentheses) */
    private static function splitTopLevel(string $body): array
    {
        $parts = [];
        $depth = 0;
        $cur = '';
        $inQuote = false;
        $q = '';
        for ($i = 0, $len = strlen($body); $i < $len; $i++) {
            $ch = $body[$i];
            if ($inQuote) {
                $cur .= $ch;
                if ($ch === $q) $inQuote = false;
                continue;
            }
            if ($ch === "'" || $ch === '"') {
                $inQuote = true;
                $q = $ch;
                $cur .= $ch;
                continue;
            }
            if ($ch === '(') $depth++;
            elseif ($ch === ')') $depth--;
            if ($ch === ',' && $depth === 0) {
                $parts[] = $cur;
                $cur = '';
                continue;
            }
            $cur .= $ch;
        }
        if (trim($cur) !== '') $parts[] = $cur;
        return $parts;
    }

    private static function tableExists(PDO $pdo, string $name): bool
    {
        if (Database::driver() === 'mysql') {
            return (bool) $pdo->query('SHOW TABLES LIKE ' . $pdo->quote($name))->fetchColumn();
        }
        return (bool) $pdo->query(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = " . $pdo->quote($name)
        )->fetchColumn();
    }

    /** @return string[] column names of a table */
    private static function columnsOf(PDO $pdo, string $name): array
    {
        if (Database::driver() === 'mysql') {
            $rows = $pdo->query("SHOW COLUMNS FROM `$name`")->fetchAll(PDO::FETCH_ASSOC);
            return array_map(fn($r) => strtolower($r['Field']), $rows);
        }
        $rows = $pdo->query('PRAGMA table_info(' . $name . ')')->fetchAll(PDO::FETCH_ASSOC);
        return array_map(fn($r) => strtolower($r['name']), $rows);
    }

    private static function indexExists(PDO $pdo, string $name): bool
    {
        if (Database::driver() === 'mysql') {
            return (bool) $pdo->query(
                'SELECT COUNT(*) FROM information_schema.STATISTICS WHERE INDEX_SCHEMA = DATABASE() AND INDEX_NAME = ' . $pdo->quote($name)
            )->fetchColumn();
        }
        return (bool) $pdo->query(
            "SELECT name FROM sqlite_master WHERE type = 'index' AND name = " . $pdo->quote($name)
        )->fetchColumn();
    }
}
