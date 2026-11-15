<?php
declare(strict_types=1);

/** Usage metering: usage_logs + usage_counters + chart rollups. */
final class UsageService
{
    public static function logTurn(string $tenantId, ?string $conversationId, ?string $messageId, ?string $modelId, string $providerName, int $inputTokens, int $outputTokens, int $latencyMs): void
    {
        $costUsd = LLMFactory::costUsd($modelId, $inputTokens, $outputTokens);

        // Tenant price per message (in tenant currency) — deduct on AI send.
        $tenant = Database::fetchOne('SELECT currency_code, price_per_message FROM tenants WHERE id = :id', ['id' => $tenantId]);
        $costTenant = (float) ($tenant['price_per_message'] ?? 0);

        Database::insert('usage_logs', [
            'id' => Util::id('use'),
            'tenant_id' => $tenantId,
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
            'model_id' => $modelId,
            'provider' => $providerName,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'cost_usd' => round($costUsd, 6),
            'cost_tenant' => $costTenant,
            'latency_ms' => $latencyMs,
        ]);

        self::bumpCounter($tenantId, $conversationId !== null);
    }

    public static function bumpCounter(string $tenantId, bool $countMessage = true): void
    {
        $period = date('Y-m-01');
        Database::run(
            'INSERT INTO usage_counters (tenant_id, period_start, conversations, messages)
             VALUES (:t, :p, 1, :m)
             ON CONFLICT DO NOTHING',
            ['t' => $tenantId, 'p' => $period, 'm' => $countMessage ? 1 : 0]
        );
        // portable upsert (sqlite + mysql both support the ON CONFLICT above in sqlite;
        // for MySQL we retry with ON DUPLICATE KEY syntax)
        if (Database::driver() === 'mysql') {
            Database::run(
                'INSERT INTO usage_counters (tenant_id, period_start, conversations, messages) VALUES (:t, :p, 1, :m)
                 ON DUPLICATE KEY UPDATE conversations = conversations + 1, messages = messages + :m2',
                ['t' => $tenantId, 'p' => $period, 'm' => 0, 'm2' => $countMessage ? 1 : 0]
            );
        }
    }

    public static function bumpConversationCounter(string $tenantId): void
    {
        $period = date('Y-m-01');
        if (Database::driver() === 'mysql') {
            Database::run(
                'INSERT INTO usage_counters (tenant_id, period_start, conversations) VALUES (:t, :p, 1)
                 ON DUPLICATE KEY UPDATE conversations = conversations + 1',
                ['t' => $tenantId, 'p' => $period]
            );
        } else {
            Database::run(
                'INSERT INTO usage_counters (tenant_id, period_start, conversations) VALUES (:t, :p, 1)
                 ON CONFLICT(tenant_id, period_start) DO UPDATE SET conversations = conversations + 1',
                ['t' => $tenantId, 'p' => $period]
            );
        }
    }

    public static function bumpHandoff(string $tenantId): void
    {
        $period = date('Y-m-01');
        if (Database::driver() === 'mysql') {
            Database::run(
                'INSERT INTO usage_counters (tenant_id, period_start, handoffs) VALUES (:t, :p, 1)
                 ON DUPLICATE KEY UPDATE handoffs = handoffs + 1',
                ['t' => $tenantId, 'p' => $period]
            );
        } else {
            Database::run(
                'INSERT INTO usage_counters (tenant_id, period_start, handoffs) VALUES (:t, :p, 1)
                 ON CONFLICT(tenant_id, period_start) DO UPDATE SET handoffs = handoffs + 1',
                ['t' => $tenantId, 'p' => $period]
            );
        }
    }

    /** Current month counters for a tenant. */
    public static function monthCounters(string $tenantId): array
    {
        $period = date('Y-m-01');
        $row = Database::fetchOne(
            'SELECT conversations, messages, ai_messages, handoffs FROM usage_counters WHERE tenant_id = :t AND period_start = :p',
            ['t' => $tenantId, 'p' => $period]
        );
        if (!$row) {
            // derive from live tables as fallback
            $start = date('Y-m-01 00:00:00');
            $convs = (int) Database::scalar('SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND created_at >= :s', ['t' => $tenantId, 's' => $start]);
            $msgs = (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND sender != 'system'", ['t' => $tenantId, 's' => $start]);
            $ai = (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND sender = 'ai'", ['t' => $tenantId, 's' => $start]);
            return ['conversations' => $convs, 'messages' => $msgs, 'aiMessages' => $ai, 'handoffs' => 0];
        }
        return [
            'conversations' => (int) $row['conversations'],
            'messages' => (int) $row['messages'],
            'aiMessages' => (int) $row['ai_messages'],
            'handoffs' => (int) $row['handoffs'],
        ];
    }
}
