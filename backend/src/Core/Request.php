<?php
declare(strict_types=1);

require_once __DIR__ . '/../Auth/AuthContext.php';

/** HTTP request abstraction: body JSON, query params, headers. */
final class Request
{
    public string $method;
    public string $path;
    public array $query;
    public array $body;
    public array $headers;
    public array $params = [];        // route params
    public ?AuthContext $auth = null; // set by AuthMiddleware

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        // Strip subdirectory prefixes (e.g. /backend/public) if present.
        $script = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
        if ($script !== '/' && str_starts_with($path, $script)) {
            $path = substr($path, strlen($script));
        }
        $this->path = '/' . trim($path, '/');
        $this->query = $_GET;
        $this->headers = array_change_key_case(function_exists('getallheaders') ? (getallheaders() ?: []) : [], CASE_LOWER);
        $this->body = $this->parseBody();
    }

    private function parseBody(): array
    {
        $type = $this->header('content-type', '');
        if (str_contains($type, 'application/json')) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw ?: '', true);
            return is_array($data) ? $data : [];
        }
        if (str_contains($type, 'multipart/form-data') || str_contains($type, 'application/x-www-form-urlencoded')) {
            return $_POST;
        }
        return [];
    }

    public function header(string $name, ?string $default = null): ?string
    {
        return $this->headers[strtolower($name)] ?? null ?? $default;
    }

    public function bearerToken(): ?string
    {
        $h = $this->header('authorization');
        if ($h && preg_match('/Bearer\s+(.+)/i', $h, $m)) return trim($m[1]);
        return $this->header('x-api-token');
    }

    public function apiKey(): ?string
    {
        return $this->header('x-api-key') ?? $this->bearerToken();
    }

    public function q(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $default;
    }

    public function all(): array
    {
        return $this->body;
    }

    public function file(string $key): ?array
    {
        return $_FILES[$key] ?? null;
    }

    public function ip(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    public function userAgent(): string
    {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    }
}
