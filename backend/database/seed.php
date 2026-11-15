<?php
declare(strict_types=1);

/**
 * Database seeder CLI — wraps the shared demo_data module.
 * Run: php backend/database/seed.php [--fresh]
 * Idempotent: skips when tenants already exist unless --fresh.
 */

require_once __DIR__ . '/../bootstrap.php';

$fresh = in_array('--fresh', $argv, true);

if ($fresh) {
    echo "Dropping all tables...\n";
    Database::pdo();
    if (Database::driver() === 'sqlite') {
        $tables = Database::fetchAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        Database::pdo()->exec('PRAGMA foreign_keys=OFF');
        foreach ($tables as $t) Database::pdo()->exec('DROP TABLE IF EXISTS ' . $t['name']);
        Database::pdo()->exec('PRAGMA foreign_keys=ON');
    } else {
        $tables = Database::fetchAll('SHOW TABLES');
        Database::pdo()->exec('SET FOREIGN_KEY_CHECKS=0');
        foreach ($tables as $t) Database::pdo()->exec('DROP TABLE IF EXISTS ' . reset($t));
        Database::pdo()->exec('SET FOREIGN_KEY_CHECKS=1');
    }
}
SchemaHealer::ensure(true);
Database::migrate();
if (!$fresh && (int) Database::scalar('SELECT COUNT(*) FROM tenants') > 0) {
    echo "Database already seeded (tenants exist). Use --fresh to reseed.\n";
    exit(0);
}

require_once __DIR__ . '/demo_data.php';
seedDemoData(true);

// ------------------------------------------------------------------ summary
$counts = [
    'tenants' => (int) Database::scalar('SELECT COUNT(*) FROM tenants'),
    'users' => (int) Database::scalar('SELECT COUNT(*) FROM users'),
    'conversations' => (int) Database::scalar('SELECT COUNT(*) FROM conversations'),
    'messages' => (int) Database::scalar('SELECT COUNT(*) FROM messages'),
    'products' => (int) Database::scalar('SELECT COUNT(*) FROM products'),
    'faqs' => (int) Database::scalar('SELECT COUNT(*) FROM faqs'),
    'policies' => (int) Database::scalar('SELECT COUNT(*) FROM business_policies'),
    'currencies' => (int) Database::scalar('SELECT COUNT(*) FROM currencies'),
    'providers' => (int) Database::scalar('SELECT COUNT(*) FROM ai_provider_models'),
    'knowledge_chunks' => (int) Database::scalar('SELECT COUNT(*) FROM knowledge_chunks'),
];
echo "Seed complete:\n";
foreach ($counts as $k => $v) echo "  $k: $v\n";
