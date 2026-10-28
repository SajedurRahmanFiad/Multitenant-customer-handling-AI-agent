import React, { useState } from 'react';
import { PageId } from './types/navigation';
import { CurrentUser, DEMO_USERS } from './types/auth';
import { TeamMember, TeamRole, UserSession, AdminActionRecord } from './types/team';
import { TenantClient } from './types/platformAdmin';
import { INITIAL_TEAM_MEMBERS, INITIAL_USER_SESSIONS, INITIAL_ADMIN_ACTIONS } from './data/teamMockData';
import { INITIAL_TENANTS } from './data/platformAdminMockData';

import { FloatingSidebar } from './components/navigation/FloatingSidebar';
import { MobileHeader } from './components/navigation/MobileHeader';
import { MergedHeader } from './components/layout/MergedHeader';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { InboxPage } from './pages/InboxPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { AgentConfigPage } from './pages/AgentConfigPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlatformAdminPage } from './pages/PlatformAdminPage';
import { useCurrency } from './context/CurrencyContext';

export default function App() {
  const { setSelectedTenantId: setCurrencyTenantId } = useCurrency();

  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEMO_USERS[0]); // Default: Sajedur Rahman (super_admin)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ten_loom_01');

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setCurrencyTenantId(tenantId);
  };

  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isPinned, setIsPinned] = useState(false);

  // Shared Team Data
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [sessions, setSessions] = useState<UserSession[]>(INITIAL_USER_SESSIONS);
  const [adminActions, setAdminActions] = useState<AdminActionRecord[]>(INITIAL_ADMIN_ACTIONS);
  const [tenants, setTenants] = useState<TenantClient[]>(INITIAL_TENANTS);

  // Authentication Handlers
  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.role === 'super_admin') {
      handleSelectTenant('all');
    } else {
      handleSelectTenant(user.tenantId);
    }
  };


  const handleSignOut = () => {
    setIsAuthenticated(false);
  };

  // Team Handlers
  const handleInviteMember = (newMember: Omit<TeamMember, 'id' | 'joinedAt'>) => {
    const created: TeamMember = {
      ...newMember,
      id: `usr_${Date.now()}`,
      joinedAt: 'Just now',
    };
    setMembers((prev) => [created, ...prev]);

    // Record admin action
    const actionRecord: AdminActionRecord = {
      id: `act_${Date.now()}`,
      actorName: currentUser.name,
      actorPhone: currentUser.phone,
      tenantId: created.tenantId,
      action: `Invited Member (${created.role})`,
      targetUser: `${created.name} (${created.phone})`,
      timestamp: 'Just now',
      ipAddress: '103.114.98.42',
      details: `Granted ${created.role} role for ${created.department} (${created.tenantName})`,
    };
    setAdminActions((prev) => [actionRecord, ...prev]);
  };

  const handleUpdateRole = (memberId: string, newRole: TeamRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    const target = members.find((m) => m.id === memberId);
    if (target) {
      setAdminActions((prev) => [
        {
          id: `act_${Date.now()}`,
          actorName: currentUser.name,
          actorPhone: currentUser.phone,
          tenantId: target.tenantId,
          action: `Changed Role to ${newRole}`,
          targetUser: `${target.name} (${target.phone})`,
          timestamp: 'Just now',
          ipAddress: '103.114.98.42',
          details: `Role updated from ${target.role} to ${newRole}`,
        },
        ...prev,
      ]);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleRevokeAllSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrentSession));
  };

  // If not authenticated, show pure light-mode login screen with phone and password
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    // If a non-super-admin tries to access platform_admin, redirect to overview
    if (currentPage === 'platform_admin' && currentUser.role !== 'super_admin') {
      return <OverviewPage onNavigate={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'overview':
        return <OverviewPage onNavigate={setCurrentPage} />;
      case 'inbox':
        return <InboxPage />;
      case 'knowledge':
        return <KnowledgePage />;
      case 'agent':
        return <AgentConfigPage />;
      case 'channels':
        return <ChannelsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'team':
        return (
          <TeamPage
            currentUser={currentUser}
            selectedTenantId={selectedTenantId}
            tenants={tenants}
            members={members}
            sessions={sessions}
            adminActions={adminActions}
            onInviteMember={handleInviteMember}
            onUpdateRole={handleUpdateRole}
            onRevokeSession={handleRevokeSession}
            onRevokeAllSessions={handleRevokeAllSessions}
          />
        );
      case 'settings':
        return <SettingsPage />;
      case 'platform_admin':
        return <PlatformAdminPage />;
      default:
        return <OverviewPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Mobile Header (small screens) */}
      <MobileHeader
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        currentUser={currentUser}
        selectedTenantId={selectedTenantId}
        onSelectTenant={handleSelectTenant}
        tenants={tenants}
        onSignOut={handleSignOut}
      />

      {/* Desktop Floating Pill-Shaped Sidebar */}
      <FloatingSidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
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
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <MergedHeader
            currentUser={currentUser}
            onNavigate={setCurrentPage}
            onSignOut={handleSignOut}
          />
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}
