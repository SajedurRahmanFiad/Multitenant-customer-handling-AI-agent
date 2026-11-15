<?php
declare(strict_types=1);

final class Util
{
    /** Prefixed unique id, e.g. msg_9f2c... (matches frontend id style). */
    public static function id(string $prefix): string
    {
        try {
            $rand = bin2hex(random_bytes(9));
        } catch (Throwable) {
            $rand = bin2hex(uniqid('', true));
        }
        return $prefix . '_' . $rand;
    }

    public static function correlationId(): string
    {
        return 'corr_' . bin2hex(random_bytes(8));
    }

    /** snake_case row -> camelCase array (recursive). */
    public static function camelize(array $row): array
    {
        $out = [];
        foreach ($row as $k => $v) {
            $key = is_string($k) ? lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $k)))) : $k;
            if (is_array($v)) $v = self::camelize($v);
            $out[$key] = $v;
        }
        return $out;
    }

    /** camelCase array -> snake_case (for request payloads). */
    public static function snakeize(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) {
            $key = strtolower((string) preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', (string) $k));
            if (is_array($v)) $v = self::snakeize($v);
            $out[$key] = $v;
        }
        return $out;
    }

    public static function ts(?string $value): ?string
    {
        if (!$value) return null;
        $t = strtotime($value);
        return $t ? date('c', $t) : null;
    }

    public static function mask(string $value, int $keep = 4): string
    {
        $len = strlen($value);
        if ($len <= $keep) return str_repeat('*', $len);
        return str_repeat('*', max(0, $len - $keep)) . substr($value, -$keep);
    }

    public static function maskPhone(string $phone): string
    {
        return preg_replace('/\d(?=\d{2})/', '*', $phone) ?? $phone;
    }

    /** Deterministic pseudo-embedding from text (mock LLM mode retrieval). */
    public static function pseudoEmbedding(string $text, int $dim = 64): array
    {
        $vec = array_fill(0, $dim, 0.0);
        $tokens = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($text)) ?: [];
        foreach ($tokens as $token) {
            if ($token === '') continue;
            $h = crc32($token);
            $vec[$h % $dim] += 1.0 + (($h >> 8) % 100) / 100.0;
        }
        $norm = sqrt(array_sum(array_map(fn($x) => $x * $x, $vec))) ?: 1.0;
        return array_map(fn($x) => round($x / $norm, 6), $vec);
    }

    public static function cosineSimilarity(array $a, array $b): float
    {
        $n = min(count($a), count($b));
        $dot = 0.0; $na = 0.0; $nb = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $dot += $a[$i] * $b[$i];
            $na += $a[$i] * $a[$i];
            $nb += $b[$i] * $b[$i];
        }
        return ($na > 0 && $nb > 0) ? $dot / (sqrt($na) * sqrt($nb)) : 0.0;
    }

    /** Keywords shared between two strings (for keyword-prefilter retrieval). */
    public static function keywords(string $text, int $minLen = 3): array
    {
        $tokens = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($text)) ?: [];
        $stop = ['the','and','for','with','what','when','how','can','you','your','did','does','this','that','have','has','are','was','were','will','not','but','all','any','out','from','about','like','just','get','got','итд'];
        $out = [];
        foreach ($tokens as $t) {
            if (strlen($t) >= $minLen && !in_array($t, $stop, true)) $out[$t] = true;
        }
        return array_keys($out);
    }

    public static function relativeTime(?string $ts): string
    {
        if (!$ts) return 'never';
        $diff = time() - (strtotime($ts) ?: time());
        if ($diff < 60) return 'Just now';
        if ($diff < 3600) return floor($diff / 60) . 'm ago';
        if ($diff < 86400) return floor($diff / 3600) . 'h ago';
        if ($diff < 86400 * 30) return floor($diff / 86400) . 'd ago';
        return date('M j, Y', strtotime($ts));
    }
}
