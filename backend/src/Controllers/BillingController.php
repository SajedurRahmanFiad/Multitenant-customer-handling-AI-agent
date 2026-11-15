<?php
declare(strict_types=1);

/** BillingUsageView + PaymentGatewayModal: plan, usage, costs, invoices, wallet. */
final class BillingController
{
    public static function overview(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $tenant = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $tenantId]);
        $tp = Database::fetchOne('SELECT * FROM tenant_plans WHERE tenant_id = :t', ['t' => $tenantId]);
        $tier = $tp['tier'] ?? 'starter';
        $plan = Database::fetchOne('SELECT * FROM plans WHERE tier = :t', ['t' => $tier]);

        $usage = UsageService::monthCounters($tenantId);
        $prevConv = (int) Database::scalar(
            'SELECT COUNT(*) FROM conversations WHERE tenant_id = :t', ['t' => $tenantId]);

        $costs = self::costBreakdown($tenant, $plan, $usage);

        Response::json([
            'plan' => self::shapePlan($plan),
            'usage' => [
                ['name' => 'Conversations', 'current' => $usage['conversations'], 'limit' => (int) ($plan['conversations_allowance'] ?? 0), 'unit' => 'conversations'],
                ['name' => 'AI messages', 'current' => $usage['messages'], 'limit' => (int) ($plan['messages_allowance'] ?? 0), 'unit' => 'messages'],
                ['name' => 'Team seats', 'current' => self::seatCount($tenantId), 'limit' => (int) ($plan['team_seats_allowance'] ?? 0), 'unit' => 'seats'],
                ['name' => 'Connected channels', 'current' => self::channelCount($tenantId), 'limit' => (int) ($plan['channels_allowance'] ?? 0), 'unit' => 'channels'],
            ],
            'costComparison' => $costs,
            'walletBalance' => (float) $tenant['wallet_balance'],
            'walletCurrency' => $tenant['currency_code'],
            'pricePerMessage' => (float) $tenant['price_per_message'],
        ]);
    }

    public static function plans(Request $req): void
    {
        $rows = Database::fetchAll('SELECT * FROM plans ORDER BY price_monthly_usd');
        Response::json(['plans' => array_map([self::class, 'shapePlan'], $rows)]);
    }

    public static function changePlan(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('view_billing');
        $tenantId = $ctx->requireTenantId($req);
        $tier = (string) $req->input('tier', '');
        if (!in_array($tier, ['starter', 'growth', 'pro', 'enterprise'], true)) Response::error('Invalid tier', 422);
        $exists = Database::fetchOne('SELECT tenant_id FROM tenant_plans WHERE tenant_id = :t', ['t' => $tenantId]);
        if ($exists) Database::update('tenant_plans', ['tier' => $tier], 'tenant_id = :t', ['t' => $tenantId]);
        else Database::insert('tenant_plans', ['tenant_id' => $tenantId, 'tier' => $tier]);
        AuditService::log($tenantId, 'order_action', 'Plan changed', 'Switched to ' . $tier . ' plan', 'success', ['target' => $tenantId], $ctx->userId(), $req);
        Response::json(['tier' => $tier]);
    }

    public static function invoices(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM invoices WHERE tenant_id = :t ORDER BY date DESC', ['t' => $tenantId]);
        Response::json(['invoices' => array_map([self::class, 'shapeInvoice'], $rows)]);
    }

    public static function wallet(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $tenant = Database::fetchOne('SELECT wallet_balance, currency_code, price_per_message FROM tenants WHERE id = :id', ['id' => $tenantId]);
        $rows = Database::fetchAll('SELECT * FROM wallet_transactions WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 100', ['t' => $tenantId]);
        Response::json([
            'balance' => (float) $tenant['wallet_balance'],
            'currency' => $tenant['currency_code'],
            'pricePerMessage' => (float) $tenant['price_per_message'],
            'transactions' => array_map(fn($t) => [
                'id' => $t['id'],
                'type' => $t['type'],
                'amount' => (float) $t['amount'],
                'currency' => $t['currency'],
                'amountUsd' => (float) $t['amount_usd'],
                'gateway' => $t['gateway'],
                'reference' => $t['reference'],
                'description' => $t['description'],
                'status' => $t['status'],
                'createdAt' => Util::ts($t['created_at']),
            ], $rows),
        ]);
    }

    /** PaymentGatewayModal submit. */
    public static function topup(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('view_billing');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['amount' => 'required|numeric', 'gateway' => 'required']);
        $amount = Validator::float($data['amount']);
        if ($amount <= 0) Response::error('Amount must be positive', 422);

        $tenant = Database::fetchOne('SELECT currency_code FROM tenants WHERE id = :id', ['id' => $tenantId]);
        $tx = WalletService::topup(
            $tenantId, $amount,
            (string) ($data['currency'] ?? $tenant['currency_code']),
            (string) $data['gateway'],
            $data['reference'] ?? ('TRX' . strtoupper(bin2hex(random_bytes(4)))),
            $data['description'] ?? 'Wallet top-up via ' . $data['gateway']
        );
        AuditService::log($tenantId, 'order_action', 'Wallet topped up', 'Top-up ' . $amount . ' via ' . $data['gateway'], 'success', ['target' => $tx['id']], $ctx->userId(), $req);
        NotificationsService::create($tenantId, 'Wallet top-up successful', 'Added ' . $amount . ' to wallet via ' . $data['gateway'], 'success', 'Billing');
        Response::json(['transaction' => $tx, 'balance' => WalletService::balance($tenantId)], 201);
    }

    public static function exportInvoiceCsv(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM invoices WHERE tenant_id = :t ORDER BY date DESC', ['t' => $tenantId]);
        $csv = "invoice_number,date,billing_period,amount_usd,amount_bdt,status,payment_method\n";
        foreach ($rows as $r) {
            $csv .= implode(',', [$r['invoice_number'], $r['date'], $r['billing_period'], $r['amount_usd'], $r['amount_bdt'], $r['status'], $r['payment_method']]) . "\n";
        }
        Response::download('invoices.csv', $csv);
    }

    // ------------------------------------------------------------ helpers
    private static function costBreakdown(array $tenant, array $plan, array $usage): array
    {
        $start = date('Y-m-01 00:00:00');
        $rows = Database::fetchAll(
            'SELECT provider, SUM(cost_usd) AS cost, SUM(input_tokens + output_tokens) AS tokens
             FROM usage_logs WHERE tenant_id = :t AND created_at >= :s GROUP BY provider',
            ['t' => $tenant['id'], 's' => $start]);
        $provider = [];
        foreach ($rows as $r) $provider[$r['provider'] ?: 'Unknown'] = (float) $r['cost'];

        $providerCostUsd = array_sum($provider);
        $basePlanUsd = (float) ($plan['price_monthly_usd'] ?? 0);
        $convLimit = (int) ($plan['conversations_allowance'] ?? 0);
        $overageConvs = max(0, $usage['conversations'] - $convLimit);
        $overageUsd = $overageConvs * 0.05;
        $channels = self::channelCount($tenant['id']);
        $channelsUsd = max(0, $channels - 2) * 5.0;
        $clientBillableUsd = $basePlanUsd + $overageUsd + $channelsUsd;

        $tenantCurrency = $tenant['currency_code'];
        return [
            'providerCostUSD' => round($providerCostUsd, 4),
            'providerCostBDT' => CurrencyService::fromUsd($providerCostUsd, 'BDT'),
            'providerBreakdown' => [
                'geminiCostUSD' => round($provider['Google Gemini'] ?? 0, 4),
                'openAICostUSD' => round($provider['OpenAI'] ?? 0, 4),
                'anthropicCostUSD' => round($provider['Anthropic'] ?? 0, 4),
                'vectorEmbeddingCostUSD' => round(($provider['Mock LLM'] ?? 0) * 0.1, 4),
                'infraComputeCostUSD' => round($providerCostUsd * 0.08, 4),
            ],
            'clientBillableUSD' => round($clientBillableUsd, 2),
            'clientBillableBDT' => CurrencyService::fromUsd($clientBillableUsd, 'BDT'),
            'clientBillingBreakdown' => [
                'basePlanFeeUSD' => round($basePlanUsd, 2),
                'overageConversationsUSD' => round($overageUsd, 2),
                'additionalChannelsUSD' => round($channelsUsd, 2),
                'prioritySupportUSD' => 0,
            ],
            'platformMarginPercent' => $clientBillableUsd > 0 ? round(($clientBillableUsd - $providerCostUsd) / $clientBillableUsd * 100, 1) : 0,
        ];
    }

    private static function seatCount(string $tenantId): int
    {
        return (int) Database::scalar('SELECT COUNT(*) FROM users WHERE tenant_id = :t AND status != :s', ['t' => $tenantId, 's' => 'suspended']);
    }

    private static function channelCount(string $tenantId): int
    {
        $m = (int) Database::scalar("SELECT COUNT(*) FROM messenger_connections WHERE tenant_id = :t AND status = 'connected'", ['t' => $tenantId]);
        $w = (int) Database::scalar("SELECT COUNT(*) FROM whatsapp_connections WHERE tenant_id = :t AND status = 'connected'", ['t' => $tenantId]);
        return $m + $w;
    }

    public static function shapePlan(?array $p): ?array
    {
        if (!$p) return null;
        return [
            'tier' => $p['tier'],
            'displayName' => $p['display_name'],
            'priceMonthlyUSD' => (float) $p['price_monthly_usd'],
            'priceMonthlyBDT' => (float) $p['price_monthly_bdt'],
            'conversationsAllowance' => (int) $p['conversations_allowance'],
            'messagesAllowance' => (int) $p['messages_allowance'],
            'teamSeatsAllowance' => (int) $p['team_seats_allowance'],
            'channelsAllowance' => (int) $p['channels_allowance'],
            'retentionDays' => (int) $p['retention_days'],
            'features' => Database::decodeJson($p['features']) ?: [],
        ];
    }

    public static function shapeInvoice(array $i): array
    {
        return [
            'id' => $i['id'],
            'invoiceNumber' => $i['invoice_number'],
            'date' => $i['date'],
            'billingPeriod' => $i['billing_period'],
            'amountUSD' => (float) $i['amount_usd'],
            'amountBDT' => (float) $i['amount_bdt'],
            'status' => $i['status'],
            'paymentMethod' => $i['payment_method'],
            'downloadUrl' => $i['download_url'],
        ];
    }
}
