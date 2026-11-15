<?php
declare(strict_types=1);

/** In-app notifications + escalation rule evaluation. */
final class NotificationsService
{
    public static function create(string $tenantId, string $title, string $message, string $type = 'info', ?string $sourceModule = null, ?string $actionUrl = null, ?string $userId = null): void
    {
        Database::insert('notifications', [
            'id' => Util::id('ntf'),
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'source_module' => $sourceModule,
            'action_url' => $actionUrl,
        ]);
    }

    public static function notifyHandoff(string $tenantId, string $conversationId, string $customerName, ?string $reason): void
    {
        $rules = Database::fetchAll(
            "SELECT * FROM escalation_rules WHERE tenant_id = :t AND trigger_type = 'human_attention_requested' AND is_enabled = 1",
            ['t' => $tenantId]
        );
        $title = "Handover: $customerName needs attention";
        $message = trim((string) ($reason ?? 'AI handed this conversation to staff'));
        self::create($tenantId, $title, $message, 'urgent', 'Inbox', '/inbox');

        foreach ($rules as $rule) {
            $action = $rule['action'];
            $msg = "$title — $message (" . ($rule['assigned_role'] ?? 'support staff') . ")";
            if ($action === 'escalate_supervisor' || $action === 'page_engineer') {
                self::create($tenantId, 'Escalation raised', $msg, 'warning', 'Escalations', '/settings');
            }
            // in_app/email/whatsapp/webhook dispatch beyond app is an integration point.
        }
    }

    public static function notifyUsageThreshold(string $tenantId, string $metric, int $percent): void
    {
        $rules = Database::fetchAll(
            "SELECT * FROM escalation_rules WHERE tenant_id = :t AND trigger_type = 'usage_threshold_reached' AND is_enabled = 1",
            ['t' => $tenantId]
        );
        if (!$rules) return;
        self::create(
            $tenantId,
            "Usage threshold reached: $metric",
            "$metric usage hit $percent% of plan allowance.",
            'warning',
            'Billing',
            '/settings'
        );
    }
}
