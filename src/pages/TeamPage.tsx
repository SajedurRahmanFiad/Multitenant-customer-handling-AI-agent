import React, { useState, useMemo } from 'react';
import { SubPageNav, SubPageTabItem } from '../components/navigation/SubPageNav';
import { useUrlQueryState } from '../hooks/useUrlQueryState';
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
import { MessengerConnection, WhatsAppConnection } from '../types/channels';
import { useApiData } from '../hooks/useApiData';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  Trash2,
  Lock,
  Eye,
  Check,
  X,
  Phone,
  Building2,
  Filter,
  Pencil,
} from 'lucide-react';

export type TeamSubTabId = 'members' | 'matrix' | 'sessions' | 'history';
type EditableTeamMember = Pick<TeamMember, 'name' | 'phone' | 'role' | 'assignedChannels'>;
type EditingTeamMember = {
  id: string;
  tenantId: string;
  draft: EditableTeamMember;
  isSuperAdmin: boolean;
  password: string;
};

interface TeamPageProps {
  currentUser: CurrentUser;
  selectedTenantId: string; // 'all' or tenantId
  tenants: TenantClient[];
  members: TeamMember[];
  sessions: UserSession[];
  adminActions: AdminActionRecord[];
  onInviteMember: (newMember: Omit<TeamMember, 'id' | 'joinedAt'>) => void;
  onUpdateMember: (memberId: string, updates: EditableTeamMember, tenantId?: string) => void;
  onUpdateSuperAdmin: (updates: { name: string; phone: string; password?: string }) => Promise<void>;
  onDeleteMember: (memberId: string, tenantId?: string) => void;
  onRevokeSession: (sessionId: string, tenantId?: string) => void;
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
  onUpdateMember,
  onUpdateSuperAdmin,
  onDeleteMember,
  onRevokeSession,
  onRevokeAllSessions,
}) => {
  const [activeTab, setActiveTab] = useUrlQueryState<TeamSubTabId>('tab', 'members', [
    'members', 'matrix', 'sessions', 'history',
  ]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditingTeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
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

  const listedMembers = useMemo(() => {
    if (!isSuperAdmin) return scopedMembers;
    const superAdminMember: TeamMember = {
      id: currentUser.id,
      name: currentUser.name,
      phone: currentUser.phone,
      tenantId: currentUser.tenantId,
      tenantName: 'Platform',
      role: 'super_admin',
      assignedChannels: [],
      status: 'active',
      twoFactorEnabled: false,
      lastActive: 'Current account',
      joinedAt: '',
    };
    return [superAdminMember, ...scopedMembers.filter((member) => member.id !== currentUser.id)];
  }, [scopedMembers, isSuperAdmin, currentUser.id, currentUser.name, currentUser.phone, currentUser.tenantId]);

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
  const messengerConnectionQ = useApiData<{ connection: MessengerConnection | null }>('/channels/messenger');
  const whatsappConnectionQ = useApiData<{ connection: WhatsAppConnection | null }>('/channels/whatsapp');
  const connectedMessenger = messengerConnectionQ.data?.connection?.status === 'connected';
  const connectedWhatsApp = whatsappConnectionQ.data?.connection?.status === 'connected';

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
      assignedChannels: [],
      status: 'invited',
      twoFactorEnabled: false,
      lastActive: 'Invitation sent just now',
    });

    setInviteName('');
    setInvitePhone('+880 17');
    setIsInviteModalOpen(false);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.draft.name.trim() || !editingMember.draft.phone.trim()) return;
    const updates = {
      ...editingMember.draft,
      name: editingMember.draft.name.trim(),
      phone: editingMember.draft.phone.trim(),
    };
    if (editingMember.isSuperAdmin) {
      await onUpdateSuperAdmin({
        name: updates.name,
        phone: updates.phone,
        ...(editingMember.password ? { password: editingMember.password } : {}),
      });
    } else {
      onUpdateMember(editingMember.id, updates, editingMember.tenantId);
    }
    setEditingMember(null);
  };

  const handleDeleteMember = () => {
    if (!memberToDelete) return;
    onDeleteMember(memberToDelete.id, memberToDelete.tenantId);
    setMemberToDelete(null);
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
      count: listedMembers.length,
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
                  {listedMembers.length} active member{listedMembers.length !== 1 ? 's' : ''}
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
                    <th className="px-5 py-3">Channels</th>
                    <th className="px-5 py-3">Last seen</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{member.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 whitespace-nowrap">
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
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {connectedMessenger && (
                            <img
                              src="/uploads/messenger.png"
                              alt="Messenger"
                              title="Messenger"
                              className="w-5 h-5 shrink-0 object-contain"
                            />
                          )}
                          {connectedWhatsApp && (
                            <img
                              src="/uploads/whatsapp.png"
                              alt="WhatsApp"
                              title="WhatsApp"
                              className="w-5 h-5 shrink-0 object-contain"
                            />
                          )}
                          {!connectedMessenger && !connectedWhatsApp && (
                            <span className="text-[11px] text-slate-400">None connected</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {member.lastActive}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingMember({
                              id: member.id,
                              tenantId: member.tenantId,
                              isSuperAdmin: member.role === 'super_admin' && member.id === currentUser.id,
                              password: '',
                              draft: {
                                name: member.name,
                                phone: member.phone,
                                role: member.role,
                                assignedChannels: [...member.assignedChannels],
                              },
                            })}
                            disabled={member.role === 'super_admin' && member.id !== currentUser.id || !isSuperAdmin && member.id === currentUser.id}
                            title={`Edit ${member.name}`}
                            aria-label={`Edit ${member.name}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberToDelete(member)}
                            disabled={member.role === 'super_admin' || !isSuperAdmin && member.id === currentUser.id}
                            title={`Delete ${member.name}`}
                            aria-label={`Delete ${member.name}`}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                disabled={selectedTenantId === 'all'}
                title={selectedTenantId === 'all' ? 'Select a tenant to revoke other sessions' : undefined}
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
                      onClick={() => onRevokeSession(sess.id, sess.tenantId)}
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

        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <form onSubmit={handleSaveMember} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingMember.isSuperAdmin ? 'Edit Super Admin' : 'Edit Team Member'}
                </h3>
                <button type="button" onClick={() => setEditingMember(null)} aria-label="Close edit dialog" className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Name
                <input
                  required
                  value={editingMember.draft.name}
                  onChange={(e) => setEditingMember((previous) => previous ? { ...previous, draft: { ...previous.draft, name: e.target.value } } : previous)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-normal"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Phone
                <input
                  required
                  value={editingMember.draft.phone}
                  onChange={(e) => setEditingMember((previous) => previous ? { ...previous, draft: { ...previous.draft, phone: e.target.value } } : previous)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-normal"
                />
              </label>
              {editingMember.isSuperAdmin ? (
                <label className="block text-xs font-semibold text-slate-700">
                  New Password
                  <input
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={editingMember.password}
                    onChange={(e) => setEditingMember((previous) => previous ? { ...previous, password: e.target.value } : previous)}
                    placeholder="Leave blank to keep current password"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-normal"
                  />
                </label>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-slate-700">
                    Role
                    <select
                      value={editingMember.draft.role}
                      onChange={(e) => setEditingMember((previous) => previous ? { ...previous, draft: { ...previous.draft, role: e.target.value as TeamRole } } : previous)}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-normal bg-white"
                    >
                      {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                      <option value="admin">Administrator</option>
                      <option value="agent">Support Agent</option>
                      <option value="analyst">Analyst</option>
                    </select>
                  </label>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingMember(null)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg">Save Changes</button>
              </div>
            </form>
          </div>
        )}

        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Delete team member?</h3>
              <p className="text-xs text-slate-600">{memberToDelete.name} will be removed from the team.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setMemberToDelete(null)} className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="button" onClick={handleDeleteMember} className="px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
