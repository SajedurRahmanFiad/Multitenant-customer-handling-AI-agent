<?php
declare(strict_types=1);

/** Token issuing/revoking + middleware resolution. */
final class AuthService
{
    public const SESSION_TTL_DAYS = 30;

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function login(string $identifier, string $password, Request $req): array
    {
        $identifier = trim($identifier);
        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;
        if ($isEmail) {
            $user = Database::fetchOne(
                'SELECT * FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1',
                ['email' => $identifier]
            );
        } else {
            $digits = self::normalizePhone($identifier);
            $validPhone = preg_match('/^\+?[0-9\s().-]+$/', $identifier) === 1;
            $user = $validPhone && $digits !== ''
                ? Database::fetchOne(
                    "SELECT * FROM users WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE :phone LIMIT 1",
                    ['phone' => '%' . $digits]
                )
                : null;
        }
        if (!$user || !password_verify($password, $user['password_hash'])) {
            AuditService::log(null, 'permission_changed', 'Login failed', 'Failed login attempt', 'denied', ['identifierType' => $isEmail ? 'email' : 'phone'], null, $req);
            Response::unauthorized('Invalid email, phone, or password');
        }
        if ($user['status'] === 'suspended') {
            Response::forbidden('Your account is suspended. Contact your administrator.');
        }

        $tenant = $user['tenant_id']
            ? Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $user['tenant_id']])
            : null;
        if ($tenant && $tenant['status'] === 'suspended') {
            Response::forbidden('Business is suspended');
        }

        $token = 'tk_' . bin2hex(random_bytes(24));
        $sessionId = Util::id('ses');
        Database::insert('user_sessions', [
            'id' => $sessionId,
            'user_id' => $user['id'],
            'token_hash' => self::hashToken($token),
            'device' => substr($_SERVER['HTTP_SEC_CH_UA_PLATFORM'] ?? php_uname('s'), 0, 100),
            'browser' => self::browserFromUa($req->userAgent()),
            'ip_address' => $req->ip(),
            'location' => 'Unknown',
            'is_current' => 1,
            'last_active_at' => Database::now(),
            'expires_at' => date('Y-m-d H:i:s', time() + self::SESSION_TTL_DAYS * 86400),
        ]);

        Database::update('users', ['last_active_at' => Database::now()], 'id = :id', ['id' => $user['id']]);

        $perms = self::effectivePermissions($user);
        $ctx = new AuthContext($user, $tenant, $perms);
        return ['token' => $token, 'sessionId' => $sessionId, 'user' => $ctx->toCurrentUser()];
    }

    public static function normalizePhone(string $phone): string
    {
        return preg_replace('/[^0-9]/', '', $phone) ?? '';
    }

    public static function browserFromUa(string $ua): string
    {
        foreach (['Edg/' => 'Edge', 'OPR/' => 'Opera', 'Chrome' => 'Chrome', 'Firefox' => 'Firefox', 'Safari' => 'Safari'] as $needle => $name) {
            if (str_contains($ua, $needle)) return $name;
        }
        return 'Other';
    }

    public static function effectivePermissions(array $user): array
    {
        $custom = Database::decodeJson($user['custom_permissions'] ?? null);
        if (is_array($custom)) return array_values($custom);
        return Permissions::defaultsFor($user['role']);
    }

    /** Resolve request → AuthContext, or null. Also authenticates platform token. */
    public static function resolve(Request $req): ?AuthContext
    {
        $token = $req->bearerToken();
        if (!$token) return null;

        // Platform/system token (server-to-server)
        if (Config::isPlatformToken($token)) {
            $sys = [
                'id' => 'usr_platform', 'tenant_id' => null, 'name' => 'Platform System',
                'phone' => '', 'email' => 'system@platform', 'role' => 'super_admin',
                'status' => 'active', 'avatar_url' => null, 'two_factor_enabled' => 0,
                'custom_permissions' => null, 'last_active_at' => null, 'joined_at' => Database::now(),
            ];
            return new AuthContext($sys, null, Permissions::defaultsFor('super_admin'));
        }

        $session = Database::fetchOne('SELECT * FROM user_sessions WHERE token_hash = :h', ['h' => self::hashToken($token)]);
        if (!$session) return null;

        $user = Database::fetchOne('SELECT * FROM users WHERE id = :id', ['id' => $session['user_id']]);
        if (!$user) return null;

        $tenant = $user['tenant_id']
            ? Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $user['tenant_id']])
            : null;
        if ($tenant && $tenant['status'] === 'suspended') {
            Database::update('user_sessions', ['revoked_at' => Database::now(), 'is_current' => 0], 'id = :id AND revoked_at IS NULL', ['id' => $session['id']]);
            Response::forbidden('Business is suspended');
        }
        if ($user['status'] === 'suspended') return null;

        $session = Database::fetchOne(
            'SELECT * FROM user_sessions WHERE id = :id AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > :now)',
            ['id' => $session['id'], 'now' => Database::now()]
        );
        if (!$session) return null;

        Database::update('user_sessions', ['last_active_at' => Database::now()], 'id = :id', ['id' => $session['id']]);
        $user['session_id'] = $session['id'];
        $user['session_is_current'] = true;

        return new AuthContext($user, $tenant, self::effectivePermissions($user));
    }

    public static function logout(Request $req, AuthContext $ctx): void
    {
        $token = $req->bearerToken();
        if ($token) {
            Database::update('user_sessions', ['revoked_at' => Database::now(), 'is_current' => 0],
                'token_hash = :h', ['h' => self::hashToken($token)]);
        }
        AuditService::log($ctx->tenantId($req), 'permission_changed', 'Signed out', 'User signed out successfully', 'success', [], $ctx->userId(), $req);
    }

    /** Revoke a specific session owned by the current user's tenant. */
    public static function revokeSession(string $sessionId, AuthContext $ctx): void
    {
        $session = Database::fetchOne('SELECT * FROM user_sessions WHERE id = :id', ['id' => $sessionId]);
        if (!$session) Response::notFound('Session not found');
        $owner = Database::fetchOne('SELECT tenant_id FROM users WHERE id = :id', ['id' => $session['user_id']]);
        $scope = $ctx->tenantId(new Request());
        if ($ctx->role() !== 'super_admin' && ($owner['tenant_id'] ?? null) !== $scope) {
            Response::forbidden();
        }
        Database::update('user_sessions', ['revoked_at' => Database::now(), 'is_current' => 0], 'id = :id', ['id' => $sessionId]);
    }
}
