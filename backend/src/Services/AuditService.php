<?php
declare(strict_types=1);

/** Writes admin_actions + audit_logs rows (sanitized). */
final class AuditService
{
    public static function log(
        ?string $tenantId,
        string $actionType,
        string $actionTitle,
        string $description,
        string $outcome = 'success',
        array $metadata = [],
        ?string $actorUserId = null,
        ?Request $req = null,
    ): void {
        $ctx = $req?->auth;
        $actor = $ctx?->user ?? [];
        $actorEmail = $actor['email'] ?? null;
        Database::insert('audit_logs', [
            'id' => Util::id('aud'),
            'tenant_id' => $tenantId,
            'actor_name' => $actor['name'] ?? 'System',
            'actor_email' => $actorEmail,
            'actor_role' => $actor['role'] ?? 'system',
            'ip_address' => $req?->ip(),
            'action_type' => $actionType,
            'action_title' => $actionTitle,
            'description' => $description,
            'outcome' => $outcome,
            'correlation_id' => Util::correlationId(),
            'sanitized_metadata' => Database::json(self::sanitize($metadata)),
            'target_resource' => (string) ($metadata['target'] ?? $actionTitle),
        ]);
    }

    /** TeamPage admin action record. */
    public static function adminAction(
        ?string $tenantId,
        AuthContext $ctx,
        string $action,
        ?string $targetUser,
        string $details,
        ?Request $req = null,
    ): void {
        Database::insert('admin_actions', [
            'id' => Util::id('act'),
            'tenant_id' => $tenantId,
            'actor_user_id' => $ctx->userId(),
            'actor_name' => $ctx->user['name'],
            'actor_phone' => $ctx->user['phone'],
            'action' => $action,
            'target_user' => $targetUser,
            'ip_address' => $req?->ip(),
            'details' => $details,
        ]);
    }

    /** Strip values that look like secrets/tokens before persisting. */
    private static function sanitize(array $meta): array
    {
        $out = [];
        foreach ($meta as $k => $v) {
            $key = (string) $k;
            if (preg_match('/token|secret|password|key|credential/i', $key)) {
                $out[$key] = is_string($v) ? Util::mask($v) : '***';
                continue;
            }
            if (is_scalar($v) || $v === null) {
                $out[$key] = $v;
            } elseif (is_array($v) && count($out) < 20) {
                $out[$key] = array_slice(self::sanitize($v), 0, 20);
            }
        }
        return $out;
    }

    public static function activity(?string $tenantId, string $type, string $title, string $description, string $actor): void
    {
        Database::insert('activity_logs', [
            'id' => Util::id('act'),
            'tenant_id' => $tenantId,
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'actor' => $actor,
        ]);
    }
}
