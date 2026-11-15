<?php
declare(strict_types=1);

/** TeamPage: members CRUD, sessions, admin actions, permission definitions. */
final class TeamController
{
    public static function listTeams(Request $req): void
    {
        $tenantId = $req->auth->requireTenantId($req);
        $rows = Database::fetchAll('SELECT id, name, description FROM teams WHERE tenant_id = :t ORDER BY name', ['t' => $tenantId]);
        Response::json(['teams' => $rows]);
    }

    public static function listMembers(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->tenantId($req);
        if ($ctx->isSuperAdmin() && !$tenantId) {
            $rows = Database::fetchAll(
                'SELECT u.*, t.business_name AS tenant_name
                 FROM users u LEFT JOIN tenants t ON t.id = u.tenant_id
                 WHERE u.tenant_id IS NOT NULL ORDER BY u.joined_at DESC'
            );
            $out = array_map(fn($u) => self::shape($u, $u['tenant_name'] ?? ''), $rows);
        } else {
            $tenantId = $ctx->requireTenantId($req);
            $rows = Database::fetchAll(
                'SELECT * FROM users WHERE tenant_id = :t ORDER BY joined_at DESC',
                ['t' => $tenantId]
            );
            $tenant = Database::fetchOne('SELECT business_name FROM tenants WHERE id = :id', ['id' => $tenantId]);
            $out = array_map(fn($u) => self::shape($u, $tenant['business_name'] ?? ''), $rows);
        }
        Response::json(['members' => $out]);
    }

    public static function updateSuperAdminProfile(Request $req): void
    {
        $ctx = $req->auth;
        if (!$ctx->isSuperAdmin()) Response::forbidden('Super admin access required');

        $data = $req->all();
        $data['name'] = trim((string) ($data['name'] ?? ''));
        $data['phone'] = trim((string) ($data['phone'] ?? ''));
        Validator::validateOrFail($data, ['name' => 'required', 'phone' => 'required']);

        $userId = $ctx->userId();
        $normalizedPhone = AuthService::normalizePhone($data['phone']);
        $phoneMatches = Database::fetchAll('SELECT id, phone FROM users WHERE id != :id', ['id' => $userId]);
        foreach ($phoneMatches as $match) {
            if (AuthService::normalizePhone((string) $match['phone']) === $normalizedPhone) {
                Response::error('A user with this phone number already exists', 422);
            }
        }

        $update = ['name' => $data['name'], 'phone' => $data['phone']];
        $password = $data['password'] ?? null;
        if ($password !== null && $password !== '') {
            if (!is_string($password) || strlen($password) < 8) {
                Response::error('Password must be at least 8 characters', 422);
            }
            $update['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        }

        Database::update('users', $update, 'id = :id', ['id' => $userId]);
        Response::json(['user' => ['id' => $userId, 'name' => $data['name'], 'phone' => $data['phone']]]);
    }

    public static function inviteMember(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_team');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, [
            'name' => 'required', 'phone' => 'required',
            'role' => 'required|in:admin,agent,analyst',
        ]);
        if (!Permissions::isValid((string) $data['role'])) Response::error('Invalid role', 422);

        $phone = AuthService::normalizePhone((string) $data['phone']);
        if (Database::fetchOne('SELECT id FROM users WHERE phone LIKE :p', ['p' => '%' . $phone])) {
            Response::error('A user with this phone number already exists', 422);
        }

        $id = Util::id('usr');
        $tempPassword = (string) ($data['password'] ?? ('pass' . bin2hex(random_bytes(3))));
        $channels = array_values(array_intersect((array) ($data['assignedChannels'] ?? []), ['messenger', 'whatsapp']));

        Database::insert('users', [
            'id' => $id,
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'password_hash' => password_hash($tempPassword, PASSWORD_DEFAULT),
            'role' => $data['role'],
            'status' => 'invited',
            'two_factor_enabled' => Validator::bool($data, 'twoFactorEnabled'),
            'assigned_channels' => Database::json($channels),
            'custom_permissions' => isset($data['customPermissions']) ? Database::json($data['customPermissions']) : null,
        ]);
        foreach ($channels as $ch) {
            Database::insert('user_permissions', ['user_id' => $id, 'permission' => 'channel_' . $ch]);
        }

        AuditService::adminAction($tenantId, $ctx, 'Invited Member (' . $data['role'] . ')', $data['name'] . ' (' . $data['phone'] . ')', "Granted {$data['role']} role", $req);
        AuditService::log($tenantId, 'permission_changed', 'Member invited', "Invited {$data['name']} as {$data['role']}", 'success', ['target' => $id], $ctx->userId(), $req);
        NotificationsService::create($tenantId, 'New team member invited', $data['name'] . ' was invited as ' . $data['role'], 'success', 'Team');

        $user = Database::fetchOne('SELECT * FROM users WHERE id = :id', ['id' => $id]);
        $tenant = Database::fetchOne('SELECT business_name FROM tenants WHERE id = :id', ['id' => $tenantId]);
        Response::json(['member' => self::shape($user, $tenant['business_name'] ?? ''), 'tempPassword' => $tempPassword], 201);
    }

    public static function updateMember(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_team');
        $tenantId = $ctx->requireTenantId($req);
        $id = $req->params['id'];
        $user = Database::fetchOne('SELECT * FROM users WHERE id = :id AND tenant_id = :t', ['id' => $id, 't' => $tenantId]);
        if (!$user) Response::notFound('Member not found');

        $data = Validator::sanitizePayload($req->all());
        $update = [];
        if (isset($data['name'])) $update['name'] = $data['name'];
        if (isset($data['phone'])) $update['phone'] = $data['phone'];
        if (isset($data['email'])) $update['email'] = $data['email'];
        if (isset($data['avatarUrl'])) $update['avatar_url'] = $data['avatarUrl'];
        if (isset($data['role'])) {
            if (!in_array($data['role'], ['admin', 'agent', 'analyst'], true)) {
                Response::error('Invalid tenant role', 422);
            }
            if ($user['role'] === 'admin' && $data['role'] !== 'admin' && self::adminCount($tenantId) <= 1) {
                Response::error('Cannot demote the only admin of this tenant', 422);
            }
            $update['role'] = $data['role'];
        }
        if (isset($data['status']) && in_array($data['status'], ['active', 'invited', 'suspended'], true)) {
            $update['status'] = $data['status'];
        }
        if (isset($data['assignedChannels']) && is_array($data['assignedChannels'])) {
            $update['assigned_channels'] = Database::json(array_values(array_intersect($data['assignedChannels'], ['messenger', 'whatsapp'])));
        }
        if (array_key_exists('customPermissions', $data)) {
            $update['custom_permissions'] = $data['customPermissions'] ? Database::json(array_values($data['customPermissions'])) : null;
        }
        if (isset($data['twoFactorEnabled'])) $update['two_factor_enabled'] = Validator::bool($data, 'twoFactorEnabled') ? 1 : 0;
        if (isset($data['password'])) $update['password_hash'] = password_hash((string) $data['password'], PASSWORD_DEFAULT);

        Database::update('users', $update, 'id = :id', ['id' => $id]);
        if (isset($update['status']) && $update['status'] === 'suspended') {
            Database::run('UPDATE user_sessions SET revoked_at = :n WHERE user_id = :u AND revoked_at IS NULL', ['n' => Database::now(), 'u' => $id]);
        }

        AuditService::adminAction($tenantId, $ctx, 'Updated Team Member', ($user['name'] ?? '') . ' (' . ($user['phone'] ?? '') . ')', 'Updated member profile, role, or channel assignments.', $req);
        $user = Database::fetchOne('SELECT * FROM users WHERE id = :id', ['id' => $id]);
        $tenant = Database::fetchOne('SELECT business_name FROM tenants WHERE id = :id', ['id' => $tenantId]);
        Response::json(['member' => self::shape($user, $tenant['business_name'] ?? '')]);
    }

    public static function deleteMember(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_team');
        $tenantId = $ctx->requireTenantId($req);
        $id = $req->params['id'];
        $user = Database::fetchOne('SELECT * FROM users WHERE id = :id AND tenant_id = :t', ['id' => $id, 't' => $tenantId]);
        if (!$user) Response::notFound('Member not found');
        if ($user['id'] === $ctx->userId()) Response::error('You cannot remove your own account', 422);
        if ($user['role'] === 'admin' && self::adminCount($tenantId) <= 1) {
            Response::error('Cannot remove the only admin of this tenant', 422);
        }

        Database::delete('users', 'id = :id', ['id' => $id]);
        AuditService::adminAction($tenantId, $ctx, 'Removed Team Member', ($user['name'] ?? '') . ' (' . ($user['phone'] ?? '') . ')', "Removed {$user['name']} from tenant.", $req);
        Response::json(['ok' => true]);
    }

    public static function toggle2fa(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_team');
        $tenantId = $ctx->requireTenantId($req);
        $id = $req->params['id'];
        $user = Database::fetchOne('SELECT * FROM users WHERE id = :id AND tenant_id = :t', ['id' => $id, 't' => $tenantId]);
        if (!$user) Response::notFound();
        Database::update('users', ['two_factor_enabled' => Validator::bool($req->all(), 'enabled', true) ? 1 : 0], 'id = :id', ['id' => $id]);
        AuditService::adminAction($tenantId, $ctx, 'Toggled 2FA', $user['name'], 'Two-factor authentication ' . (Validator::bool($req->all(), 'enabled') ? 'enabled' : 'disabled'), $req);
        Response::json(['ok' => true]);
    }

    public static function permissions(Request $req): void
    {
        Response::json([
            'definitions' => Permissions::DEFINITIONS,
            'roleDefaults' => Permissions::ROLE_DEFAULTS,
        ]);
    }

    public static function sessions(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->tenantId($req);
        if ($ctx->isSuperAdmin() && !$tenantId) {
            $rows = Database::fetchAll(
                'SELECT s.*, u.name AS user_name, u.tenant_id AS user_tenant
                 FROM user_sessions s JOIN users u ON u.id = s.user_id
                 WHERE u.tenant_id IS NOT NULL AND s.revoked_at IS NULL
                 ORDER BY s.last_active_at DESC'
            );
        } else {
            $tenantId = $ctx->requireTenantId($req);
            $rows = Database::fetchAll(
                'SELECT s.*, u.name AS user_name, u.tenant_id AS user_tenant
                 FROM user_sessions s JOIN users u ON u.id = s.user_id
                 WHERE u.tenant_id = :t AND s.revoked_at IS NULL
                 ORDER BY s.last_active_at DESC',
                ['t' => $tenantId]
            );
        }
        $out = array_map(fn($s) => [
            'id' => $s['id'],
            'userId' => $s['user_id'],
            'userName' => $s['user_name'],
            'tenantId' => $s['user_tenant'],
            'device' => $s['device'] ?: 'Desktop',
            'browser' => $s['browser'] ?: 'Unknown',
            'ipAddress' => $s['ip_address'] ?: '0.0.0.0',
            'location' => $s['location'] ?: 'Unknown',
            'isCurrentSession' => (bool) $s['is_current'],
            'lastActive' => Util::relativeTime($s['last_active_at']),
        ], $rows);
        Response::json(['sessions' => $out]);
    }

    public static function revokeSession(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_team');
        AuthService::revokeSession($req->params['id'], $ctx);
        $tenantId = $ctx->tenantId($req);
        if (!$tenantId && $ctx->isSuperAdmin()) {
            $tenantId = Database::scalar(
                'SELECT u.tenant_id FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.id = :id',
                ['id' => $req->params['id']]
            );
        }
        AuditService::adminAction($tenantId ?: $ctx->requireTenantId($req), $ctx, 'Revoked Session', null, 'Revoked user session ' . $req->params['id'], $req);
        Response::json(['ok' => true]);
    }

    public static function revokeOthers(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_team');
        $tenantId = $ctx->requireTenantId($req);
        Database::run(
            'UPDATE user_sessions s JOIN users u ON u.id = s.user_id
             SET s.revoked_at = :n, s.is_current = 0
             WHERE u.tenant_id = :t AND s.revoked_at IS NULL AND s.id != :cur',
            ['n' => Database::now(), 't' => $tenantId, 'cur' => $ctx->user['session_id'] ?? '']
        );
        AuditService::adminAction($tenantId, $ctx, 'Revoked All Other Sessions', null, 'Signed out all other users/sessions', $req);
        Response::json(['ok' => true]);
    }

    public static function adminActions(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->tenantId($req);
        $limit = min(200, Validator::int($req->q('limit'), 100));
        if ($ctx->isSuperAdmin() && !$tenantId) {
            $rows = Database::fetchAll(
                'SELECT * FROM admin_actions WHERE tenant_id IS NOT NULL ORDER BY created_at DESC LIMIT ' . $limit
            );
        } else {
            $tenantId = $ctx->requireTenantId($req);
            $rows = Database::fetchAll(
                'SELECT * FROM admin_actions WHERE tenant_id = :t ORDER BY created_at DESC LIMIT ' . $limit,
                ['t' => $tenantId]
            );
        }
        $out = array_map(fn($a) => [
            'id' => $a['id'],
            'actorName' => $a['actor_name'],
            'actorPhone' => $a['actor_phone'],
            'tenantId' => $a['tenant_id'],
            'action' => $a['action'],
            'targetUser' => $a['target_user'],
            'timestamp' => Util::ts($a['created_at']),
            'ipAddress' => $a['ip_address'],
            'details' => $a['details'],
        ], $rows);
        Response::json(['actions' => $out]);
    }

    private static function adminCount(string $tenantId): int
    {
        return (int) Database::scalar("SELECT COUNT(*) FROM users WHERE tenant_id = :t AND role = 'admin' AND status != 'suspended'", ['t' => $tenantId]);
    }

    public static function shape(array $u, string $tenantName): array
    {
        $channels = Database::decodeJson($u['assigned_channels'] ?? null) ?: [];
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'phone' => $u['phone'],
            'email' => $u['email'],
            'tenantId' => $u['tenant_id'],
            'tenantName' => $tenantName,
            'avatarUrl' => $u['avatar_url'],
            'role' => $u['role'],
            'assignedChannels' => $channels,
            'status' => $u['status'],
            'twoFactorEnabled' => (bool) $u['two_factor_enabled'],
            'lastActive' => Util::relativeTime($u['last_active_at']),
            'joinedAt' => Util::ts($u['joined_at']),
            'customPermissions' => Database::decodeJson($u['custom_permissions'] ?? null) ?? Permissions::defaultsFor($u['role']),
        ];
    }
}
