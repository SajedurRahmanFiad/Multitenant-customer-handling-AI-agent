<?php
declare(strict_types=1);

final class AuthController
{
    public static function login(Request $req): void
    {
        $data = $req->all();
        $data['identifier'] = trim((string) ($data['identifier'] ?? $data['email'] ?? $data['phone'] ?? ''));
        Validator::validateOrFail($data, ['identifier' => 'required', 'password' => 'required']);
        $result = AuthService::login($data['identifier'], (string) $data['password'], $req);
        Response::json($result);
    }

    public static function me(Request $req): void
    {
        /** @var AuthContext $ctx */
        $ctx = $req->auth;
        $user = $ctx->toCurrentUser();
        // include all active tenants for the switcher
        if ($ctx->isSuperAdmin() || $ctx->isPlatform()) {
            $tenants = Database::fetchAll('SELECT id, business_name, status FROM tenants ORDER BY business_name');
            $user['availableTenants'] = array_map(fn($t) => [
                'id' => $t['id'], 'businessName' => $t['business_name'], 'status' => $t['status'],
            ], $tenants);
        }
        Response::json(['user' => $user]);
    }

    public static function logout(Request $req): void
    {
        AuthService::logout($req, $req->auth);
        Response::json(['ok' => true]);
    }

    public static function toggle2fa(Request $req): void
    {
        $ctx = $req->auth;
        $enable = Validator::bool($req->all(), 'enabled', true);
        Database::update('users', ['two_factor_enabled' => $enable ? 1 : 0], 'id = :id', ['id' => $ctx->userId()]);
        AuditService::log($ctx->tenantId($req), 'credentials_changed', $enable ? '2FA enabled' : '2FA disabled', 'Two-factor authentication toggled', 'success', [], $ctx->userId(), $req);
        Response::json(['twoFactorEnabled' => $enable]);
    }

    public static function changePassword(Request $req): void
    {
        $ctx = $req->auth;
        $data = $req->all();
        Validator::validateOrFail($data, ['currentPassword' => 'required', 'newPassword' => 'required|min:8']);
        if (!password_verify((string) $req->input('currentPassword'), $ctx->user['password_hash'])) {
            Response::error('Current password is incorrect', 422);
        }
        Database::update('users', ['password_hash' => password_hash((string) $req->input('newPassword'), PASSWORD_DEFAULT)], 'id = :id', ['id' => $ctx->userId()]);
        AuditService::log($ctx->tenantId($req), 'credentials_changed', 'Password changed', 'User changed their password', 'success', [], $ctx->userId(), $req);
        Response::json(['ok' => true]);
    }
}
