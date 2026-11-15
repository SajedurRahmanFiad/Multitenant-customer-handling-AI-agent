<?php
declare(strict_types=1);

/**
 * PDO wrapper with MySQL (prod) + SQLite (dev/fallback) support, mirroring the
 * original Python app's cPanel-friendly fallback strategy.
 */
final class Database
{
    private static ?PDO $pdo = null;
    private static string $driver = 'mysql';

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) return self::$pdo;

        $driver = Config::dbDriver();
        if ($driver === 'sqlite') {
            $path = (string) Config::get('DB_SQLITE_PATH', 'database/app.sqlite');
            if (!preg_match('#^([A-Za-z]:[/\\\\]|/)#', $path)) {
                // Relative paths resolve against the backend root, not the CWD.
                $path = Config::get('APP_BASE_PATH') . '/' . ltrim($path, '/');
            }
            $dir = dirname($path);
            if (!is_dir($dir)) @mkdir($dir, 0775, true);
            self::$pdo = new PDO('sqlite:' . $path);
            self::$driver = 'sqlite';
            self::$pdo->exec('PRAGMA journal_mode=WAL');
            self::$pdo->exec('PRAGMA foreign_keys=ON');
            self::$pdo->exec('PRAGMA busy_timeout=5000');
        } else {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                (string) Config::get('DB_HOST', '127.0.0.1'),
                (string) Config::get('DB_PORT', '3306'),
                (string) Config::get('DB_NAME', 'ai_support')
            );
            self::$pdo = new PDO($dsn, (string) Config::get('DB_USER', 'root'), (string) Config::get('DB_PASSWORD', ''), [
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ]);
            self::$driver = 'mysql';
        }

        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        self::$pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        return self::$pdo;
    }

    public static function driver(): string
    {
        self::pdo();
        return self::$driver;
    }

    /** Run all statements of the matching schema file, skipping existing tables. */
    public static function migrate(): void
    {
        $pdo = self::pdo();
        $file = self::$driver === 'sqlite'
            ? __DIR__ . '/../../database/schema.sqlite.sql'
            : __DIR__ . '/../../database/schema.mysql.sql';
        $sql = file_get_contents($file);
        // Strip comment lines so statement chunks never begin with a comment.
        $lines = array_values(array_filter(
            explode("\n", $sql),
            fn(string $l): bool => !preg_match('/^\s*--/', $l)
        ));
        $sql = implode("\n", $lines);
        // Run one statement at a time; skip statements for already-existing tables.
        $parts = array_filter(array_map('trim', preg_split('/;\s*[\r\n]+/', $sql) ?: []));
        foreach ($parts as $stmt) {
            if ($stmt === '') continue;
            if (preg_match('/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i', $stmt, $m)) {
                $exists = self::$driver === 'mysql'
                    ? $pdo->query("SHOW TABLES LIKE " . $pdo->quote($m[1]))->fetchColumn()
                    : $pdo->query(
                        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = " . $pdo->quote($m[1])
                    )->fetchColumn();
                if ($exists) continue;
            }
            try { $pdo->exec($stmt); } catch (PDOException $e) {
                if (!str_contains($e->getMessage(), 'already exists')) throw $e;
            }
        }
    }

    public static function run(string $sql, array $params = []): PDOStatement
    {
        try {
            $stmt = self::pdo()->prepare($sql);
            foreach ($params as $k => $v) {
                $stmt->bindValue(is_int($k) ? $k + 1 : ':' . ltrim((string) $k, ':'), $v);
            }
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            // Self-healing: a missing table/column is repaired from the schema
            // files and the query is retried once. MySQL throws on prepare,
            // SQLite on execute — hence the wide try.
            if (self::isSchemaError($e)) {
                SchemaHealer::repairFromError();
                $stmt = self::pdo()->prepare($sql);
                foreach ($params as $k => $v) {
                    $stmt->bindValue(is_int($k) ? $k + 1 : ':' . ltrim((string) $k, ':'), $v);
                }
                $stmt->execute();
                return $stmt;
            }
            throw $e;
        }
    }

    private static function isSchemaError(PDOException $e): bool
    {
        $msg = strtolower($e->getMessage());
        return str_contains($msg, 'no such table')
            || str_contains($msg, 'no such column')
            || str_contains($msg, 'unknown column')
            || str_contains($msg, "doesn't exist")
            || str_contains($msg, 'not found');
    }

    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    public static function scalar(string $sql, array $params = []): mixed
    {
        return self::run($sql, $params)->fetchColumn();
    }

    public static function insert(string $table, array $data): void
    {
        $cols = array_keys($data);
        $ph = array_map(fn($c) => ':' . $c, $cols);
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table, implode(', ', $cols), implode(', ', $ph)
        );
        self::run($sql, $data);
    }

    public static function update(string $table, array $data, string $where, array $whereParams = []): void
    {
        if ($data === []) return;
        $sets = implode(', ', array_map(fn($c) => "$c = :$c", array_keys($data)));
        $sql = "UPDATE $table SET $sets WHERE $where";
        self::run($sql, array_merge($data, $whereParams));
    }

    public static function delete(string $table, string $where, array $params = []): void
    {
        self::run("DELETE FROM $table WHERE $where", $params);
    }

    public static function transaction(callable $fn): mixed
    {
        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $result = $fn();
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }

    /** MySQL JSON columns vs SQLite TEXT: encode JSON for both. */
    public static function json(mixed $value): ?string
    {
        return $value === null ? null : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function decodeJson(?string $raw): mixed
    {
        if ($raw === null || $raw === '') return null;
        $v = json_decode($raw, true);
        return json_last_error() === JSON_ERROR_NONE ? $v : null;
    }

    public static function now(): string
    {
        return date('Y-m-d H:i:s');
    }
}
