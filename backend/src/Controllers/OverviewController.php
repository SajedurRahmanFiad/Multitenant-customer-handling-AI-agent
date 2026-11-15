<?php
declare(strict_types=1);

/**
 * OverviewPage aggregate: top status, metric cards, charts, common questions,
 * handover reasons, failed cases, activities — all computed live from tables.
 */
final class OverviewController
{
    public static function dashboard(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $period = (string) $req->q('period', '7d');
        $since = self::periodStart($period);

        $tenant = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $tenantId]);
        $agentCfg = AgentConfigService::liveConfig($tenantId);

        // ---- top status
        $agentMode = $agentCfg['mode'] ?? 'automatic';
        $msn = Database::fetchOne('SELECT status FROM messenger_connections WHERE tenant_id = :t', ['t' => $tenantId]);
        $wa = Database::fetchOne('SELECT status FROM whatsapp_connections WHERE tenant_id = :t', ['t' => $tenantId]);
        $knowledgeReady = (int) Database::scalar("SELECT COUNT(*) FROM knowledge_sources WHERE tenant_id = :t AND status = 'ready'", ['t' => $tenantId]);
        $knowledgeFailed = (int) Database::scalar("SELECT COUNT(*) FROM knowledge_sources WHERE tenant_id = :t AND status = 'failed'", ['t' => $tenantId]);
        $indexedDocs = (int) Database::scalar('SELECT COALESCE(SUM(chunks_count),0) FROM knowledge_sources WHERE tenant_id = :t', ['t' => $tenantId]);
        $provider = Database::fetchOne('SELECT * FROM ai_provider_models WHERE is_default = 1 LIMIT 1');
        $unanswered = (int) Database::scalar(
            "SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND status = 'needs_human'", ['t' => $tenantId]);
        $quotaUsed = self::quotaUsedPercent($tenantId);

        $statusMap = [
            'connected' => 'Connected', 'degraded' => 'Degraded', 'disconnected' => 'Disconnected',
            'needs_reauth' => 'Reconnecting', 'pending' => 'Reconnecting',
        ];
        $agentStatus = match ($agentMode) {
            'disabled' => 'Paused',
            'automatic', 'restricted_automatic' => $knowledgeFailed > 0 ? 'Degraded' : 'Active',
            'suggestion' => 'Degraded',
        };

        $topStatus = [
            'agentStatus' => $agentStatus,
            'messengerStatus' => $statusMap[$msn['status'] ?? 'disconnected'] ?? 'Disconnected',
            'whatsAppStatus' => $statusMap[$wa['status'] ?? 'disconnected'] ?? 'Disconnected',
            'knowledgeStatus' => $knowledgeFailed > 0 ? 'Failed' : ($knowledgeReady > 0 ? 'Ready' : 'Indexing'),
            'indexedDocsCount' => $indexedDocs,
            'aiProvider' => $provider['display_name'] ?? 'Mock LLM',
            'aiProviderStatus' => $quotaUsed > 90 ? 'Approaching Quota' : 'Normal',
            'quotaUsedPercent' => $quotaUsed,
            'unansweredCount' => $unanswered,
        ];

        // ---- metric cards + chart
        $metrics = self::metrics($tenantId, $since, $period);
        $chart = self::chart($tenantId, $since);

        // ---- common questions (clustered keywords from customer messages)
        $questions = self::commonQuestions($tenantId, $since);
        $handoverReasons = self::handoverReasons($tenantId, $since);
        $failedCases = self::failedCases($tenantId);
        $activities = self::activities($tenantId);

        Response::json([
            'status' => $topStatus,
            'metrics' => $metrics,
            'chart' => $chart,
            'commonQuestions' => $questions,
            'handoverReasons' => $handoverReasons,
            'failedOrUnresolved' => $failedCases,
            'activities' => $activities,
            'businessName' => $tenant['business_name'],
        ]);
    }

    public static function testAgent(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $question = trim((string) $req->input('question', ''));
        if ($question === '') Response::error('Test question is required', 422);
        $channel = (string) $req->input('channel', 'whatsapp');
        $dry = Orchestrator::dryRun($tenantId, $question, $channel);
        Response::json($dry);
    }

    public static function quickActions(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $counts = [
            'conversations' => (int) Database::scalar("SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND status = 'needs_human'", ['t' => $tenantId]),
            'failedKnowledge' => (int) Database::scalar("SELECT COUNT(*) FROM knowledge_sources WHERE tenant_id = :t AND status = 'failed'", ['t' => $tenantId]),
            'policiesPending' => (int) Database::scalar("SELECT COUNT(*) FROM business_policies WHERE tenant_id = :t AND approval_status = 'Pending Approval'", ['t' => $tenantId]),
            'unanswered' => (int) Database::scalar("SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND status = 'needs_human'", ['t' => $tenantId]),
        ];
        Response::json(['actions' => [
            ['id' => 'test_agent', 'label' => 'Test the AI Agent', 'href' => '/overview?modal=test'],
            ['id' => 'add_knowledge', 'label' => 'Add Knowledge', 'href' => '/knowledge'],
            ['id' => 'invite_teammate', 'label' => 'Invite a teammate', 'href' => '/team'],
            ['id' => 'review_handovers', 'label' => 'Review AI handovers', 'href' => '/inbox', 'count' => $counts['unanswered']],
            ['id' => 'review_policies', 'label' => 'Approve pending policies', 'href' => '/knowledge', 'count' => $counts['policiesPending']],
        ]]);
    }

    // -------------------------------------------------------------- helpers
    private static function periodStart(string $period): int
    {
        return match ($period) {
            '24h' => strtotime('-24 hours'),
            '30d' => strtotime('-30 days'),
            default => strtotime('-7 days'),
        };
    }

    private static function metrics(string $tenantId, int $since, string $period): array
    {
        $sinceTs = date('Y-m-d H:i:s', $since);
        $prevSince = date('Y-m-d H:i:s', $since - (time() - $since));
        $prevEnd = date('Y-m-d H:i:s', $since);

        $cur = [
            'conversations' => (int) Database::scalar('SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND created_at >= :s', ['t' => $tenantId, 's' => $sinceTs]),
            'messages' => (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND sender != 'system'", ['t' => $tenantId, 's' => $sinceTs]),
            'aiHandled' => (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND sender = 'ai'", ['t' => $tenantId, 's' => $sinceTs]),
            'handoffs' => (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND ai_status_decision = 'handoff'", ['t' => $tenantId, 's' => $sinceTs]),
            'resolved' => (int) Database::scalar("SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND status = 'resolved' AND resolved_at >= :s", ['t' => $tenantId, 's' => $sinceTs]),
        ];
        $prev = [
            'conversations' => (int) Database::scalar('SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND created_at >= :s AND created_at < :e', ['t' => $tenantId, 's' => $prevSince, 'e' => $prevEnd]),
            'messages' => (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND created_at < :e AND sender != 'system'", ['t' => $tenantId, 's' => $prevSince, 'e' => $prevEnd]),
            'aiHandled' => (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND created_at < :e AND sender = 'ai'", ['t' => $tenantId, 's' => $prevSince, 'e' => $prevEnd]),
            'handoffs' => (int) Database::scalar("SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :s AND created_at < :e AND ai_status_decision = 'handoff'", ['t' => $tenantId, 's' => $prevSince, 'e' => $prevEnd]),
            'resolved' => 0,
        ];

        $aiPct = $cur['messages'] > 0 ? round($cur['aiHandled'] / $cur['messages'] * 100, 1) : 0.0;
        $deflection = $cur['conversations'] > 0 ? round(max(0, $cur['conversations'] - $cur['handoffs']) / $cur['conversations'] * 100, 1) : 0.0;
        $firstRows = Database::fetchAll(
            'SELECT created_at, first_response_at FROM conversations
             WHERE tenant_id = :t AND first_response_at IS NOT NULL AND created_at >= :s LIMIT 500',
            ['t' => $tenantId, 's' => $sinceTs]);
        $mins = [];
        foreach ($firstRows as $r) {
            $diff = strtotime($r['first_response_at']) - strtotime($r['created_at']);
            if ($diff >= 0) $mins[] = $diff / 60;
        }
        $avgFirst = $mins ? array_sum($mins) / count($mins) : 0.0;
        $cards = [
            ['id' => 'conversations', 'label' => 'Conversations', 'value' => (string) $cur['conversations'], 'numericValue' => $cur['conversations'], 'explanation' => 'New conversations opened in this period.', 'changePercent' => self::pctChange($cur['conversations'], $prev['conversations'])],
            ['id' => 'aiHandled', 'label' => 'AI-handled messages', 'value' => $aiPct . '%', 'numericValue' => $aiPct, 'unit' => '%', 'explanation' => 'Share of messages answered fully by AI.', 'changePercent' => self::pctChange($cur['aiHandled'], $prev['aiHandled'])],
            ['id' => 'deflection', 'label' => 'Deflection rate', 'value' => $deflection . '%', 'numericValue' => $deflection, 'unit' => '%', 'explanation' => 'Conversations resolved without human handoff.', 'changePercent' => 0],
            ['id' => 'handoffs', 'label' => 'Handoffs to humans', 'value' => (string) $cur['handoffs'], 'numericValue' => $cur['handoffs'], 'explanation' => 'Escalations to staff.', 'changePercent' => self::pctChange($cur['handoffs'], $prev['handoffs']), 'urgent' => $cur['handoffs'] > $cur['conversations'] * 0.5],
            ['id' => 'resolved', 'label' => 'Resolved', 'value' => (string) $cur['resolved'], 'numericValue' => $cur['resolved'], 'explanation' => 'Conversations closed as resolved.', 'changePercent' => 0],
            ['id' => 'responseTime', 'label' => 'Avg first response', 'value' => ($avgFirst > 0 ? round($avgFirst, 1) . ' min' : '—'), 'numericValue' => $avgFirst, 'unit' => 'min', 'explanation' => 'Average time until first agent/AI reply.', 'changePercent' => 0],
        ];
        return array_map(fn($m) => array_merge($m, ['changeType' => ($m['changePercent'] ?? 0) > 0 ? 'positive' : (($m['changePercent'] ?? 0) < 0 ? 'negative' : 'neutral')]), $cards);
    }

    private static function pctChange(int|float $cur, int|float $prev): float
    {
        if ($prev <= 0) return $cur > 0 ? 100.0 : 0.0;
        return round(($cur - $prev) / $prev * 100, 1);
    }

    private static function chart(string $tenantId, int $since): array
    {
        $rows = Database::fetchAll(
            "SELECT DATE(m.created_at) AS d,
                    COUNT(*) AS total,
                    SUM(CASE WHEN m.sender = 'ai' THEN 1 ELSE 0 END) AS ai,
                    SUM(CASE WHEN m.sender = 'staff' THEN 1 ELSE 0 END) AS human,
                    SUM(CASE WHEN c.channel = 'messenger' THEN 1 ELSE 0 END) AS msn,
                    SUM(CASE WHEN c.channel = 'whatsapp' THEN 1 ELSE 0 END) AS wa
             FROM messages m JOIN conversations c ON c.id = m.conversation_id
             WHERE m.tenant_id = :t AND m.created_at >= :s AND m.sender != 'system'
             GROUP BY DATE(m.created_at) ORDER BY d",
            ['t' => $tenantId, 's' => date('Y-m-d H:i:s', $since)]);
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'timeLabel' => date('M j', strtotime($r['d'])),
                'totalConversations' => (int) $r['total'],
                'aiHandled' => (int) $r['ai'],
                'humanHandled' => (int) $r['human'],
                'messengerMsgs' => (int) $r['msn'],
                'whatsAppMsgs' => (int) $r['wa'],
            ];
        }
        return $out;
    }

    private static function commonQuestions(string $tenantId, int $since): array
    {
        $rows = Database::fetchAll(
            "SELECT m.text, COUNT(*) AS cnt,
                    SUM(CASE WHEN m2.id IS NOT NULL THEN 1 ELSE 0 END) AS answered
             FROM messages m
             JOIN conversations c ON c.id = m.conversation_id
             LEFT JOIN messages m2 ON m2.conversation_id = c.id AND m2.sender = 'ai'
                  AND m2.created_at >= m.created_at
             WHERE m.tenant_id = :t AND m.sender = 'customer' AND m.created_at >= :s
             GROUP BY LOWER(SUBSTR(m.text, 1, 60))
             ORDER BY cnt DESC LIMIT 6",
            ['t' => $tenantId, 's' => date('Y-m-d H:i:s', $since)]);
        $out = [];
        $i = 0;
        foreach ($rows as $r) {
            $i++;
            $out[] = [
                'id' => 'q' . $i,
                'question' => mb_substr($r['text'], 0, 90),
                'count' => (int) $r['cnt'],
                'category' => self::classifyQuestion($r['text']),
                'resolvedByAiPercent' => (int) $r['cnt'] > 0 ? round((int) $r['answered'] / (int) $r['cnt'] * 100) : 0,
                'channel' => 'Both',
            ];
        }
        return $out;
    }

    private static function classifyQuestion(string $text): string
    {
        $t = mb_strtolower($text);
        if (preg_match('/refund|return/', $t)) return 'Returns & refunds';
        if (preg_match('/deliver|shipping|courier/', $t)) return 'Delivery';
        if (preg_match('/price|cost|discount|offer/', $t)) return 'Pricing';
        if (preg_match('/stock|available|have/', $t)) return 'Availability';
        if (preg_match('/order|track/', $t)) return 'Orders';
        return 'General';
    }

    private static function handoverReasons(string $tenantId, int $since): array
    {
        $rows = Database::fetchAll(
            "SELECT handover_reason AS reason, COUNT(*) AS cnt FROM conversations
             WHERE tenant_id = :t AND handover_reason IS NOT NULL AND created_at >= :s
             GROUP BY handover_reason ORDER BY cnt DESC LIMIT 6",
            ['t' => $tenantId, 's' => date('Y-m-d H:i:s', $since)]);
        $total = array_sum(array_map(fn($r) => (int) $r['cnt'], $rows)) ?: 1;
        $out = [];
        $i = 0;
        foreach ($rows as $r) {
            $i++;
            $out[] = [
                'id' => 'hr' . $i,
                'reason' => $r['reason'],
                'count' => (int) $r['cnt'],
                'percentage' => round((int) $r['cnt'] / $total * 100, 1),
                'trend' => 'steady',
            ];
        }
        return $out;
    }

    private static function failedCases(string $tenantId): array
    {
        $rows = Database::fetchAll(
            'SELECT f.*, c.id AS conv_id FROM failed_cases f
             LEFT JOIN conversations c ON c.id = f.conversation_id
             WHERE f.tenant_id = :t ORDER BY f.created_at DESC LIMIT 8', ['t' => $tenantId]);
        return array_map(fn($f) => [
            'id' => $f['id'],
            'customerName' => $f['customer_name'],
            'channel' => $f['channel'],
            'snippet' => $f['snippet'],
            'reason' => $f['reason'],
            'timestamp' => Util::ts($f['created_at']),
            'confidence' => (float) $f['confidence'],
            'status' => $f['status'],
            'conversationId' => $f['conv_id'],
        ], $rows);
    }

    private static function activities(string $tenantId): array
    {
        $rows = Database::fetchAll(
            'SELECT * FROM activity_logs WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 10', ['t' => $tenantId]);
        return array_map(fn($a) => [
            'id' => $a['id'],
            'type' => $a['type'],
            'title' => $a['title'],
            'description' => $a['description'],
            'timestamp' => Util::ts($a['created_at']),
            'actor' => $a['actor'],
        ], $rows);
    }

    private static function quotaUsedPercent(string $tenantId): int
    {
        $plan = Database::fetchOne(
            'SELECT p.* FROM plans p JOIN tenant_plans tp ON tp.tier = p.tier WHERE tp.tenant_id = :t', ['t' => $tenantId]);
        if (!$plan) return 0;
        $usage = UsageService::monthCounters($tenantId);
        $limit = (int) $plan['messages_allowance'];
        if ($limit <= 0) return 0;
        return (int) min(100, round($usage['messages'] / $limit * 100));
    }
}
