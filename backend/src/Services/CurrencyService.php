<?php
declare(strict_types=1);

/** Currency helpers backed by the currencies table. */
final class CurrencyService
{
    public static function all(bool $activeOnly = false): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM currencies' . ($activeOnly ? ' WHERE is_active = 1' : '') . ' ORDER BY is_platform_default DESC, code ASC'
        );
        return array_map([self::class, 'shape'], $rows);
    }

    public static function byCode(string $code): ?array
    {
        $row = Database::fetchOne('SELECT * FROM currencies WHERE code = :c', ['c' => strtoupper($code)]);
        return $row ? self::shape($row) : null;
    }

    public static function shape(array $row): array
    {
        return [
            'id' => $row['id'],
            'code' => $row['code'],
            'name' => $row['name'],
            'symbol' => $row['symbol'],
            'symbolPosition' => $row['symbol_position'],
            'symbolSpacing' => (bool) $row['symbol_spacing'],
            'exchangeRateFromUSD' => (float) $row['exchange_rate_from_usd'],
            'decimalPlaces' => (int) $row['decimal_places'],
            'thousandsSeparator' => $row['thousands_separator'],
            'decimalSeparator' => $row['decimal_separator'],
            'isPlatformDefault' => (bool) $row['is_platform_default'],
            'isActive' => (bool) $row['is_active'],
            'createdAt' => Util::ts($row['created_at'] ?? null),
            'description' => $row['description'] ?? null,
        ];
    }

    public static function toUsd(float $amount, string $currencyCode): float
    {
        $c = self::byCode($currencyCode);
        $rate = $c ? (float) $c['exchangeRateFromUSD'] : 1.0;
        return $rate > 0 ? round($amount / $rate, 4) : $amount;
    }

    public static function fromUsd(float $amountUsd, string $currencyCode): float
    {
        $c = self::byCode($currencyCode);
        $rate = $c ? (float) $c['exchangeRateFromUSD'] : 1.0;
        return round($amountUsd * $rate, 4);
    }

    /** Format per currency config (mirrors frontend formatCurrencyAmount). */
    public static function format(float $amount, array $currency): string
    {
        $neg = $amount < 0;
        $fixed = number_format(abs($amount), (int) $currency['decimalPlaces'], '.', '');
        $parts = explode('.', $fixed);
        $int = preg_replace('/\B(?=(\d{3})+(?!\d))/', (string) $currency['thousandsSeparator'], $parts[0]);
        $num = $int;
        if ((int) $currency['decimalPlaces'] > 0 && isset($parts[1])) {
            $num .= $currency['decimalSeparator'] . $parts[1];
        }
        $space = $currency['symbolSpacing'] ? ' ' : '';
        $res = $currency['symbolPosition'] === 'before'
            ? $currency['symbol'] . $space . $num
            : $num . $space . $currency['symbol'];
        return $neg ? '-' . $res : $res;
    }
}
