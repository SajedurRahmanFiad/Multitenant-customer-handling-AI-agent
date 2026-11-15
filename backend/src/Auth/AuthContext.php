<?php
declare(strict_types=1);

/**
 * The authenticated request context resolved from a Bearer token:
 * current user row, tenant scope, effective permissions.
 */
final class AuthContext
{
    public array $user;          // raw users row
    public ?array $tenant = null;
    public array $permissions;
    public ?string $impersonatedTenantId = null;  // super_admin selecting a tenant

    public function __construct(array $user, ?array $tenant, array $permissions)
    {
        $this->user = $user;
        $this->tenant = $tenant;
        $this->permissions = $permissions;
    }

    public function userId(): string
    {
        return $this->user['id'];
    }

    public function role(): string
    {
        return $this->user['role'];
    }

    public function isSuperAdmin(): bool
    {
        return $this->user['role'] === 'super_admin';
    }

    public function isPlatform(): bool
    {
        return $this->user['tenant_id'] === null;
    }

    /** Tenant id used for scoping queries (honours ?tenant= / X-Tenant-ID for super admins). */
    public function tenantId(Request $req): ?string
    {
        $requested = (string) ($req->params['tenant'] ?? $req->q('tenant') ?? $req->header('x-tenant-id') ?? '');
        if ($this->isSuperAdmin() || $this->isPlatform()) {
            if ($requested !== '' && $requested !== 'all') {
                $this->impersonatedTenantId = $requested;
                return $requested;
            }
            return $this->user['tenant_id'];
        }
        return $this->user['tenant_id'];
    }

    /** Strict tenant id or 404 — for tenant-scoped mutations. */
    public function requireTenantId(Request $req): string
    {
        $id = $this->tenantId($req);
        if (!$id) {
            Response::error('Select a specific tenant for this page', 404);
        }
        return $id;
    }

    public function has(string $permission): bool
    {
        return in_array($permission, $this->permissions, true);
    }

    public function require(string $permission): void
    {
        if (!$this->has($permission)) {
            Response::forbidden("Missing permission: $permission");
        }
    }

    /** Safe user shape for frontend CurrentUser. */
    public function toCurrentUser(): array
    {
        $u = $this->user;
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'phone' => $u['phone'],
            'role' => $u['role'],
            'tenantId' => $u['tenant_id'] ?? 'all',
            'tenantName' => $this->tenant['business_name'] ?? 'Platform',
            'avatarUrl' => $u['avatar_url'],
            'twoFactorEnabled' => (bool) $u['two_factor_enabled'],
            'status' => $u['status'],
            'email' => $u['email'],
            'customPermissions' => $this->permissions,
        ];
    }
}
