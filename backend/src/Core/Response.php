<?php
declare(strict_types=1);

final class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400, array $extra = []): never
    {
        self::json(array_merge(['error' => ['message' => $message, 'code' => $status]], $extra), $status);
    }

    public static function unauthorized(string $message = 'Unauthenticated'): never
    {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Forbidden'): never
    {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Not found'): never
    {
        self::error($message, 404);
    }

    public static function validation(array $errors): never
    {
        self::json(['error' => ['message' => 'Validation failed', 'code' => 422, 'fields' => $errors]], 422);
    }

    public static function noContent(): never
    {
        http_response_code(204);
        exit;
    }

    /** Stream a file download (CSV export etc). */
    public static function download(string $filename, string $content, string $mime = 'text/csv'): never
    {
        header("Content-Type: $mime; charset=utf-8");
        header("Content-Disposition: attachment; filename=\"$filename\"");
        header('Content-Length: ' . strlen($content));
        echo $content;
        exit;
    }
}
