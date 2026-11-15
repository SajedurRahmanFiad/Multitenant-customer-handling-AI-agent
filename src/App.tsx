import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { PageId } from './types/navigation';
import { CurrentUser } from './types/auth';
import { TeamMember, UserSession, AdminActionRecord } from './types/team';
import { TenantClient } from './types/platformAdmin';

import { FloatingSidebar } from './components/navigation/FloatingSidebar';
import { MobileHeader } from './components/navigation/MobileHeader';
import { MergedHeader } from './components/layout/MergedHeader';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { InboxPage } from './pages/InboxPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { AgentConfigPage } from './pages/AgentConfigPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlatformAdminPage } from './pages/PlatformAdminPage';
import { useCurrency } from './context/CurrencyContext';
import { useAuth } from './context/AuthContext';
import { useApiData } from './hooks/useApiData';
import { api, setApiTenant } from './lib/api';

const PAGE_PATHS: Record<PageId, string> = {
  overview: '/overview',
  inbox: '/inbox',
  knowledge: '/knowledge',
  agent: '/agent',
  channels: '/channels',
  team: '/team',
  settings: '/settings',
  platform_admin: '/platform-admin',
};

export default function App() {
  const { user, logout, booting, availableTenants, refresh } = useAuth();
  const { setSelectedTenantId: setCurrencyTenantId } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();

  // Tenant selection: URL param wins, otherwise "all" for super admins.
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    () => new URLSearchParams(window.location.search).get('tenant') || 'all'
  );

  // Keep the module-level API tenant header in sync before children fetch.
  setApiTenant(selectedTenantId === 'all' ? null : selectedTenantId);

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setCurrencyTenantId(tenantId);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tenant', tenantId);
    navigate({ pathname: location.pathname, search: `?${searchParams.toString()}` }, { replace: true });
  };

  const currentPage = (Object.entries(PAGE_PATHS).find(([, path]) => path === location.pathname)?.[0] || 'overview') as PageId;
  // Tenant-scoped data pages must select a real tenant; only platform admin is cross-tenant.
  const allTenantPages: PageId[] = ['platform_admin', 'team'];
  const requiresSpecificTenant = user?.role === 'super_admin'
    && selectedTenantId === 'all'
    && !allTenantPages.includes(currentPage);
  const handleNavigatePage = (page: PageId) => {
    const searchParams = new URLSearchParams();
    searchParams.set('tenant', selectedTenantId);
    navigate({ pathname: PAGE_PATHS[page], search: `?${searchParams.toString()}` });
  };

  useEffect(() => {
    const tenantId = new URLSearchParams(location.search).get('tenant');
    if (tenantId && tenantId !== selectedTenantId) {
      setSelectedTenantId(tenantId);
      setCurrencyTenantId(tenantId);
    }
  }, [location.search, selectedTenantId, setCurrencyTenantId]);

  // Non-super-admins are locked to their own tenant once auth resolves.
  useEffect(() => {
    if (user && user.role !== 'super_admin' && selectedTenantId !== user.tenantId) {
      handleSelectTenant(user.tenantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.tenantId]);

  const [isPinned, setIsPinned] = useState(false);

  // Shared Team Data (live from API)
  const membersQ = useApiData<{ members: TeamMember[] }>('/team/members');
  const sessionsQ = useApiData<{ sessions: UserSession[] }>('/team/sessions');
  const actionsQ = useApiData<{ actions: AdminActionRecord[] }>('/team/admin-actions');
  const members = membersQ.data?.members ?? [];
  const sessions = sessionsQ.data?.sessions ?? [];
  const adminActions = actionsQ.data?.actions ?? [];

  // Tenants for sidebar/header/team â€” full list for super admins.
  const platformTenantsQ = useApiData<{ tenants: TenantClient[] }>(
    user?.role === 'super_admin' ? '/platform/tenants' : null
  );
  const tenants: TenantClient[] =
    platformTenantsQ.data?.tenants ??
    (user
      ? ([
          {
            id: user.tenantId,
            businessName: user.tenantName,
            ownerName: user.name,
            ownerPhone: user.phone,
            status: 'active',
          } as TenantClient,
        ])
      : []);

  // Team Handlers (API-backed)
  const handleInviteMember = (newMember: Omit<TeamMember, 'id' | 'joinedAt'>) => {
    return api
      .post<{ tempPassword: string }>(
        '/team/members',
        {
          name: newMember.name,
          phone: newMember.phone,
          role: newMember.role,
          assignedChannels: newMember.assignedChannels,
        },
        { tenant: newMember.tenantId || selectedTenantId }
      )
      .then(({ tempPassword }: { tempPassword: string }) => {
        membersQ.reload();
        actionsQ.reload();
        window.alert(`Member added. Share this temporary password with them securely: ${tempPassword}`);
        return true;
      })
      .catch((err: unknown) => { window.alert(err instanceof Error ? err.message : 'Invite failed'); return false; });
  };

  const handleUpdateMember = (
    memberId: string,
    updates: Pick<TeamMember, 'name' | 'phone' | 'role' | 'assignedChannels'>,
    tenantId?: string
  ) => {
    api
      .patch(`/team/members/${memberId}`, {
        name: updates.name,
        phone: updates.phone,
        role: updates.role,
        assignedChannels: updates.assignedChannels,
      }, { tenant: tenantId || selectedTenantId })
      .then(() => {
        membersQ.reload();
        actionsQ.reload();
      })
      .catch((err: unknown) => console.error('Update failed', err));
  };

  const handleUpdateSuperAdmin = (updates: { name: string; phone: string; password?: string }) =>
    api.patch('/team/super-admin/profile', updates)
      .then(() => refresh())
      .catch((err: unknown) => window.alert(err instanceof Error ? err.message : 'Could not update super admin profile'));

  const handleDeleteMember = (memberId: string, tenantId?: string) => {
    api
      .del(`/team/members/${memberId}`, { tenant: tenantId || selectedTenantId })
      .then(() => {
        membersQ.reload();
        sessionsQ.reload();
        actionsQ.reload();
      })
      .catch((err: unknown) => console.error('Delete failed', err));
  };

  const handleRevokeSession = (sessionId: string, tenantId?: string) => {
    api
      .del(`/team/sessions/${sessionId}`, { tenant: tenantId || selectedTenantId })
      .then(() => {
        sessionsQ.reload();
        actionsQ.reload();
      })
      .catch((err: unknown) => console.error('Revoke failed', err));
  };

  const handleRevokeAllSessions = () => {
    api
      .post('/team/sessions/revoke-others')
      .then(() => {
        sessionsQ.reload();
        actionsQ.reload();
      })
      .catch((err: unknown) => console.error('Revoke-all failed', err));
  };

  // Boot / login gate
  if (booting) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="animate-pulse text-sm text-slate-500">Loading workspaceâ€¦</div>
      </div>
    );
  }
  if (!user) {
    return <LoginPage />;
  }

  const currentUser: CurrentUser = user;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Mobile Header (small screens) */}
      <MobileHeader
        currentPage={currentPage}
        onSelectPage={handleNavigatePage}
        currentUser={currentUser}
        selectedTenantId={selectedTenantId}
        onSelectTenant={handleSelectTenant}
        tenants={tenants}
        onSignOut={logout}
      />

      {/* Desktop Floating Pill-Shaped Sidebar */}
      <FloatingSidebar
        currentPage={currentPage}
        onSelectPage={handleNavigatePage}
        isPinned={isPinned}
        onTogglePin={() => setIsPinned((prev) => !prev)}
        currentUser={currentUser}
        selectedTenantId={selectedTenantId}
        onSelectTenant={handleSelectTenant}
        tenants={tenants}
      />


      {/* Main Workspace Layout */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isPinned ? 'lg:pl-[316px]' : 'lg:pl-28'
        }`}
      >
        <main
          className={`flex-1 w-full max-w-[1600px] mx-auto ${
            currentPage === 'inbox'
              ? 'h-[calc(100dvh-57px)] overflow-hidden p-0 space-y-0 lg:h-auto lg:overflow-visible lg:p-8 lg:space-y-6'
              : 'p-4 sm:p-6 lg:p-8 space-y-6'
          }`}
        >
          <MergedHeader
            currentUser={currentUser}
            onNavigate={handleNavigatePage}
            onSignOut={logout}
          />
          {requiresSpecificTenant ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center px-6 text-center">
              <h2 className="text-base font-semibold text-slate-900">Select a specific tenant</h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Choose a tenant from the sidebar to view this page.
              </p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage onNavigate={handleNavigatePage} onInviteMember={handleInviteMember} />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/agent" element={<AgentConfigPage />} />
              <Route path="/channels" element={<ChannelsPage />} />
              <Route path="/team" element={
                <TeamPage
                  currentUser={currentUser}
                  selectedTenantId={selectedTenantId}
                  tenants={tenants}
                  members={members}
                  sessions={sessions}
                  adminActions={adminActions}
                  onInviteMember={handleInviteMember}
                  onUpdateMember={handleUpdateMember}
                  onUpdateSuperAdmin={handleUpdateSuperAdmin}
                  onDeleteMember={handleDeleteMember}
                  onRevokeSession={handleRevokeSession}
                  onRevokeAllSessions={handleRevokeAllSessions}
                />
              } />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/platform-admin" element={
                currentUser.role === 'super_admin' ? <PlatformAdminPage /> : <Navigate to="/overview" replace />
              } />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
}
