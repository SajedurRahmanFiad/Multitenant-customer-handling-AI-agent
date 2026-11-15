<?php
declare(strict_types=1);

/**
 * Application configuration, loaded from .env (backend root) with sane defaults.
 * Works on cPanel/shared hosting — no framework, no composer deps required.
 */
final class Config
{
    private static array $data = [];

    public static function load(string $basePath): void
    {
        $envFile = $basePath . '/.env';
        if (is_readable($envFile)) {
            foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) continue;
                $pos = strpos($line, '=');
                if ($pos === false) continue;
                $key = trim(substr($line, 0, $pos));
                $val = trim(substr($line, $pos + 1));
                $val = trim($val, "\"'");
                self::$data[$key] = $val;
            }
        }
        self::$data['APP_BASE_PATH'] = $basePath;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return self::$data[$key] ?? getenv($key) ?: $default;
    }

    public static function dbDriver(): string
    {
        return (string) self::get('DB_DRIVER', 'mysql');
    }

    public static function isPlatformToken(string $token): bool
    {
        $platform = (string) self::get('PLATFORM_TOKEN', '');
        return $platform !== '' && hash_equals($platform, $token);
    }
}
