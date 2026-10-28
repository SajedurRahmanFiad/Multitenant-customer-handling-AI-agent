import React, { useState, useMemo } from 'react';
import { SubPageNav, SubPageTabItem } from '../components/navigation/SubPageNav';
import {
  TeamMember,
  UserSession,
  AdminActionRecord,
  TeamRole,
  PERMISSION_DEFINITIONS,
  ROLE_DEFAULT_PERMISSIONS,
} from '../types/team';
import { CurrentUser } from '../types/auth';
import { TenantClient } from '../types/platformAdmin';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  Trash2,
  CheckCircle2,
  Lock,
  Eye,
  Check,
  X,
  Phone,
  Building2,
  Filter,
} from 'lucide-react';

export type TeamSubTabId = 'members' | 'matrix' | 'sessions' | 'history';

interface TeamPageProps {
  currentUser: CurrentUser;
  selectedTenantId: string; // 'all' or tenantId
  tenants: TenantClient[];
  members: TeamMember[];
  sessions: UserSession[];
  adminActions: AdminActionRecord[];
  onInviteMember: (newMember: Omit<TeamMember, 'id' | 'joinedAt'>) => void;
  onUpdateRole: (memberId: string, newRole: TeamRole) => void;
  onRevokeSession: (sessionId: string) => void;
  onRevokeAllSessions: () => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({
  currentUser,
  selectedTenantId,
  tenants,
  members,
  sessions,
  adminActions,
  onInviteMember,
  onUpdateRole,
  onRevokeSession,
  onRevokeAllSessions,
}) => {
  const [activeTab, setActiveTab] = useState<TeamSubTabId>('members');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<TeamRole>('agent');

  // Multi-tenant scoped members calculation
  const isSuperAdmin = currentUser.role === 'super_admin';

  const scopedMembers = useMemo(() => {
    if (!isSuperAdmin) {
      // Non-super-admin members ONLY see members of their own tenant
      return members.filter((m) => m.tenantId === currentUser.tenantId);
    }
    // Super admin viewing specific tenant or all
    if (selectedTenantId === 'all') {
      return members;
    }
    return members.filter((m) => m.tenantId === selectedTenantId);
  }, [members, isSuperAdmin, currentUser.tenantId, selectedTenantId]);

  const scopedSessions = useMemo(() => {
    if (!isSuperAdmin) {
      return sessions.filter((s) => !s.tenantId || s.tenantId === currentUser.tenantId);
    }
    if (selectedTenantId === 'all') {
      return sessions;
    }
    return sessions.filter((s) => !s.tenantId || s.tenantId === selectedTenantId);
  }, [sessions, isSuperAdmin, currentUser.tenantId, selectedTenantId]);

  const scopedActions = useMemo(() => {
    if (!isSuperAdmin) {
      return adminActions.filter((a) => !a.tenantId || a.tenantId === currentUser.tenantId);
    }
    if (selectedTenantId === 'all') {
      return adminActions;
    }
    return adminActions.filter((a) => !a.tenantId || a.tenantId === selectedTenantId);
  }, [adminActions, isSuperAdmin, currentUser.tenantId, selectedTenantId]);

  const activeTenantName = useMemo(() => {
    if (!isSuperAdmin) return currentUser.tenantName;
    if (selectedTenantId === 'all') return 'All Platform Tenants';
    const match = tenants.find((t) => t.id === selectedTenantId);
    return match ? match.businessName : 'Selected Tenant';
  }, [isSuperAdmin, currentUser.tenantName, selectedTenantId, tenants]);

  // Invite Form State
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('+880 17');
  const [inviteTenantId, setInviteTenantId] = useState(
    isSuperAdmin && selectedTenantId !== 'all' ? selectedTenantId : currentUser.tenantId
  );
  const [inviteRole, setInviteRole] = useState<TeamRole>('agent');
  const [inviteDept, setInviteDept] = useState('Customer Support');
  const [inviteChannels, setInviteChannels] = useState<('messenger' | 'whatsapp')[]>([
    'messenger',
    'whatsapp',
  ]);

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !invitePhone.trim()) return;

    const assignedTenant =
      tenants.find((t) => t.id === inviteTenantId) || {
        id: currentUser.tenantId,
        businessName: currentUser.tenantName,
      };

    onInviteMember({
      name: inviteName.trim(),
      phone: invitePhone.trim(),
      tenantId: assignedTenant.id,
      tenantName: assignedTenant.businessName,
      role: inviteRole,
      department: inviteDept.trim(),
      assignedChannels: inviteChannels,
      status: 'invited',
      twoFactorEnabled: false,
      lastActive: 'Invitation sent just now',
    });

    setInviteName('');
    setInvitePhone('+880 17');
    setIsInviteModalOpen(false);
  };

  const getRoleBadge = (role: TeamRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3" /> Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Shield className="w-3 h-3" /> Administrator
          </span>
        );
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Users className="w-3 h-3" /> Support Agent
          </span>
        );
      case 'analyst':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="w-3 h-3" /> Read-Only Analyst
          </span>
        );
    }
  };

  const TEAM_TABS: SubPageTabItem<TeamSubTabId>[] = [
    {
      id: 'members',
      label: 'Team Members',
      icon: Users,
      count: scopedMembers.length,
      group: 'WORKSPACE',
    },
    {
      id: 'matrix',
      label: 'Permissions Matrix',
      icon: Shield,
      group: 'WORKSPACE',
    },
    {
      id: 'sessions',
      label: 'Active Sessions',
      icon: Laptop,
      count: scopedSessions.length,
      group: 'SECURITY',
    },
    {
      id: 'history',
      label: 'Admin Activity',
      icon: KeyRound,
      count: scopedActions.length,
      group: 'SECURITY',
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Responsive Left Navigation Tabs (desktop vertical / mobile horizontal) */}
      <SubPageNav<TeamSubTabId>
        tabs={TEAM_TABS}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      <div className="flex-1 min-w-0 w-full space-y-6">
        {/* Scoped Tenant Indicator Banner */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{activeTenantName}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-slate-100 text-slate-700">
                  {scopedMembers.length} active member{scopedMembers.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isSuperAdmin
                  ? selectedTenantId === 'all'
                    ? 'Showing team directory across all registered platform tenants.'
                    : `Scoped view for tenant ID "${selectedTenantId}". Use the sidebar dropdown to switch.`
                  : `You are authenticated as ${currentUser.name} (${currentUser.role.replace('_', ' ')}). You only see members belonging to ${currentUser.tenantName}.`}
              </p>
            </div>
          </div>

          {activeTab === 'members' && (
            <button
              type="button"
              onClick={() => {
                setInviteTenantId(
                  isSuperAdmin && selectedTenantId !== 'all'
                    ? selectedTenantId
                    : currentUser.tenantId
                );
                setIsInviteModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs self-start sm:self-auto shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Member
            </button>
          )}
        </div>

        {/* 1. Team Members List */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Tenant</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Channels</th>
                    <th className="px-5 py-3">Security & Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{member.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {member.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {member.tenantName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">{getRoleBadge(member.role)}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {member.department}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {member.assignedChannels.includes('messenger') && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                              Messenger
                            </span>
                          )}
                          {member.assignedChannels.includes('whatsapp') && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                              WhatsApp
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                member.status === 'active'
                                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                                  : member.status === 'invited'
                                  ? 'bg-amber-500 ring-2 ring-amber-500/20'
                                  : 'bg-red-500'
                              }`}
                            />
                            <span className="font-medium text-slate-700 capitalize">
                              {member.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            {member.twoFactorEnabled ? (
                              <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> 2FA Active
                              </span>
                            ) : (
                              <span className="text-slate-400">2FA Off</span>
                            )}
                            <span>·</span>
                            <span>{member.lastActive}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={member.role}
                          onChange={(e) => onUpdateRole(member.id, e.target.value as TeamRole)}
                          disabled={member.role === 'super_admin' || !isSuperAdmin && member.id === currentUser.id}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:bg-slate-50"
                        >
                          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                          <option value="admin">Administrator</option>
                          <option value="agent">Support Agent</option>
                          <option value="analyst">Analyst</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Granular Permissions Matrix */}
        {activeTab === 'matrix' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-900 text-sm">Role Capability Matrix</p>
                <p className="text-slate-500 text-xs">
                  Inspect which role presets can execute specific business, AI, and administrative actions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Highlight Preset:</span>
                <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs">
                  {(['super_admin', 'admin', 'agent', 'analyst'] as TeamRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRoleForMatrix(r)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium ${
                        selectedRoleForMatrix === r
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Capability / Permission</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-3 py-3 text-center">Super Admin</th>
                    <th className="px-3 py-3 text-center">Admin</th>
                    <th className="px-3 py-3 text-center">Agent</th>
                    <th className="px-3 py-3 text-center">Analyst</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERMISSION_DEFINITIONS.map((perm) => {
                    return (
                      <tr key={perm.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {perm.name}
                              {perm.isRestricted && (
                                <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-semibold border border-red-200">
                                  Restricted
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500">{perm.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {perm.category}
                          </span>
                        </td>
                        {(['super_admin', 'admin', 'agent', 'analyst'] as TeamRole[]).map((role) => {
                          const hasPerm = ROLE_DEFAULT_PERMISSIONS[role].includes(perm.id);
                          const isHighlightedRole = selectedRoleForMatrix === role;
                          return (
                            <td
                              key={role}
                              className={`px-3 py-3 text-center ${
                                isHighlightedRole ? 'bg-slate-50/80 font-bold' : ''
                              }`}
                            >
                              {hasPerm ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 mx-auto">
                                  <X className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Active Sessions */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-900 text-sm">Active Workspace Sessions</p>
                <p className="text-slate-500 text-xs">
                  Devices currently logged into this tenant environment. Revoke unrecognized logins immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={onRevokeAllSessions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Revoke All Other Sessions
              </button>
            </div>

            <div className="space-y-2.5">
              {scopedSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl text-slate-700 shrink-0 mt-0.5">
                      {sess.device.includes('iPhone') ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{sess.device}</span>
                        {sess.isCurrentSession && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            Current Device
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {sess.userName} · {sess.browser} · IP: {sess.ipAddress} ({sess.location})
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Last seen: {sess.lastActive}
                      </span>
                    </div>
                  </div>

                  {!sess.isCurrentSession && (
                    <button
                      type="button"
                      onClick={() => onRevokeSession(sess.id)}
                      className="self-end sm:self-center px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Admin Activity History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Security & Team Administrative Actions</p>
              <p className="text-slate-500 text-xs">
                Audit trails of role assignments, invitations, and session revocations.
              </p>
            </div>

            <div className="space-y-3">
              {scopedActions.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 text-purple-700 rounded-xl shrink-0 mt-0.5">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{act.action}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">{act.details}</span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Target: {act.targetUser} · Actor: {act.actorName} ({act.actorPhone})
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      {act.timestamp}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">IP {act.ipAddress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 text-white rounded-xl">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Invite Team Member</p>
                    <p className="text-slate-500 text-[11px]">Send invitation SMS/WhatsApp link</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateInvite} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahir Faisal"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+880 1718-000000"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {/* Tenant Field */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Tenant</label>
                  {isSuperAdmin ? (
                    <select
                      value={inviteTenantId}
                      onChange={(e) => setInviteTenantId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    >
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.businessName} ({t.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                      {currentUser.tenantName}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                    >
                      <option value="agent">Support Agent</option>
                      <option value="analyst">Analyst</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={inviteDept}
                      onChange={(e) => setInviteDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Assigned Conversation Channels
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inviteChannels.includes('messenger')}
                        onChange={(e) => {
                          if (e.target.checked) setInviteChannels([...inviteChannels, 'messenger']);
                          else setInviteChannels(inviteChannels.filter((c) => c !== 'messenger'));
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-medium text-slate-700">Facebook Messenger</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inviteChannels.includes('whatsapp')}
                        onChange={(e) => {
                          if (e.target.checked) setInviteChannels([...inviteChannels, 'whatsapp']);
                          else setInviteChannels(inviteChannels.filter((c) => c !== 'whatsapp'));
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-medium text-slate-700">WhatsApp Business</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
