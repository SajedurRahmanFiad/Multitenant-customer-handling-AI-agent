<?php
declare(strict_types=1);

/** Tiny cURL JSON helper (no external deps). */
final class Http
{
    public static function postJson(string $url, array $body, array $headers = [], int $timeout = 45): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
            CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
        ]);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($res === false) throw new RuntimeException("HTTP request failed: $err");
        $data = json_decode((string) $res, true);
        if (!is_array($data)) throw new RuntimeException("HTTP $status: invalid JSON response");
        if ($status >= 400) {
            $msg = $data['error']['message'] ?? $data['message'] ?? ("HTTP $status");
            throw new RuntimeException((string) $msg);
        }
        return $data;
    }

    public static function getJson(string $url, array $headers = [], int $timeout = 30): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => $headers,
        ]);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($res === false) throw new RuntimeException("HTTP request failed: $err");
        $data = json_decode((string) $res, true);
        if (!is_array($data)) throw new RuntimeException("HTTP $status: invalid JSON response");
        if ($status >= 400) throw new RuntimeException("HTTP $status error");
        return $data;
    }
}
