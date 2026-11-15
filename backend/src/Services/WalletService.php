<?php
declare(strict_types=1);

/** Prepaid wallet: topups + per-message deductions in tenant currency. */
final class WalletService
{
    public static function balance(string $tenantId): float
    {
        return (float) (Database::fetchOne('SELECT wallet_balance FROM tenants WHERE id = :id', ['id' => $tenantId])['wallet_balance'] ?? 0);
    }

    public static function topup(string $tenantId, float $amount, string $currency, string $gateway, ?string $reference, ?string $description = null): array
    {
        $usd = CurrencyService::toUsd($amount, $currency);
        $txId = Util::id('wtx');
        Database::transaction(function () use ($tenantId, $amount, $currency, $usd, $gateway, $reference, $description, $txId) {
            Database::insert('wallet_transactions', [
                'id' => $txId,
                'tenant_id' => $tenantId,
                'type' => 'topup',
                'amount' => $amount,
                'currency' => $currency,
                'amount_usd' => $usd,
                'gateway' => $gateway,
                'reference' => $reference,
                'description' => $description,
                'status' => 'completed',
            ]);
            Database::run('UPDATE tenants SET wallet_balance = wallet_balance + :amt WHERE id = :id', ['amt' => $amount, 'id' => $tenantId]);
        });
        return ['id' => $txId, 'amount' => $amount, 'currency' => $currency, 'amountUsd' => $usd, 'gateway' => $gateway];
    }

    /** Deduct price_per_message for an AI-sent message; returns false if insufficient. */
    public static function chargeMessage(string $tenantId): bool
    {
        $tenant = Database::fetchOne('SELECT price_per_message, currency_code, wallet_balance FROM tenants WHERE id = :id', ['id' => $tenantId]);
        if (!$tenant) return false;
        $price = (float) $tenant['price_per_message'];
        if ($price <= 0.0) return true; // free tier / no metering
        if ((float) $tenant['wallet_balance'] < $price) return false;

        Database::transaction(function () use ($tenantId, $price, $tenant) {
            Database::run('UPDATE tenants SET wallet_balance = wallet_balance - :p WHERE id = :id AND wallet_balance >= :p', ['p' => $price, 'id' => $tenantId]);
            Database::insert('wallet_transactions', [
                'id' => Util::id('wtx'),
                'tenant_id' => $tenantId,
                'type' => 'charge',
                'amount' => -$price,
                'currency' => $tenant['currency_code'],
                'amount_usd' => CurrencyService::toUsd($price, $tenant['currency_code']),
                'description' => 'AI message charge',
                'status' => 'completed',
            ]);
        });
        return true;
    }
}
