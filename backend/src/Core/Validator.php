<?php
declare(strict_types=1);

/** Small validation + sanitization helpers. */
final class Validator
{
    /** Validate required fields; returns array of errors (empty = valid). */
    public static function check(array $data, array $rules): array
    {
        $errors = [];
        foreach ($rules as $field => $ruleStr) {
            $exists = array_key_exists($field, $data);
            $value = $data[$field] ?? null;
            foreach (explode('|', $ruleStr) as $rule) {
                [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
                switch ($name) {
                    case 'required':
                        if (!$exists || $value === null || $value === '' || $value === []) {
                            $errors[$field] = "$field is required";
                        }
                        break;
                    case 'string':
                        if ($exists && $value !== null && !is_string($value)) $errors[$field] = "$field must be a string";
                        break;
                    case 'numeric':
                        if ($exists && $value !== null && !is_numeric($value)) $errors[$field] = "$field must be numeric";
                        break;
                    case 'bool':
                        if ($exists && $value !== null && !is_bool($value) && !in_array($value, [0, 1, '0', '1', 'true', 'false'], true)) {
                            $errors[$field] = "$field must be a boolean";
                        }
                        break;
                    case 'array':
                        if ($exists && $value !== null && !is_array($value)) $errors[$field] = "$field must be an array";
                        break;
                    case 'in':
                        if ($exists && $value !== null && !in_array($value, explode(',', (string) $arg), true)) {
                            $errors[$field] = "$field must be one of: $arg";
                        }
                        break;
                    case 'email':
                        if ($exists && $value && !filter_var($value, FILTER_VALIDATE_EMAIL)) $errors[$field] = "$field must be a valid email";
                        break;
                    case 'min':
                        if ($exists && is_numeric($value) && (float) $value < (float) $arg) $errors[$field] = "$field must be >= $arg";
                        break;
                    case 'maxlen':
                        if ($exists && is_string($value) && strlen($value) > (int) $arg) $errors[$field] = "$field must be <= $arg chars";
                        break;
                }
            }
        }
        return $errors;
    }

    public static function validateOrFail(array $data, array $rules): void
    {
        $errors = self::check($data, $rules);
        if ($errors) Response::validation($errors);
    }

    public static function bool(array $data, string $key, bool $default = false): bool
    {
        $v = $data[$key] ?? $default;
        if (is_bool($v)) return $v;
        return in_array($v, [1, '1', 'true', 'on'], true);
    }

    public static function int(mixed $v, int $default = 0): int
    {
        return is_numeric($v) ? (int) $v : $default;
    }

    public static function float(mixed $v, float $default = 0.0): float
    {
        return is_numeric($v) ? (float) $v : $default;
    }

    public static function str(mixed $v, string $default = ''): string
    {
        return is_string($v) ? $v : $default;
    }

    /** Trim strings recursively in a payload (keeps arrays/booleans intact). */
    public static function sanitizePayload(array $data): array
    {
        array_walk_recursive($data, function (&$v) {
            if (is_string($v)) $v = trim($v);
        });
        return $data;
    }
}
