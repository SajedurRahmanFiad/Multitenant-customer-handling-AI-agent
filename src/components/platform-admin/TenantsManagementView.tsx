import React, { useState } from 'react';
import { TenantClient, SupportSessionSession } from '../../types/platformAdmin';
import {
  Building2,
  Search,
  Plus,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  UserCheck,
  X,
  MessageSquare,
  Bot,
  Activity,
  Layers,
  Phone,
  Mail,
  Calendar,
  Coins,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';


interface TenantsManagementViewProps {
  tenants: TenantClient[];
  supportSession: SupportSessionSession;
  onStartSupportSession: (tenantId: string, tenantName: string, reason: string, durationMinutes: number) => void;
  onEndSupportSession: () => void;
  onToggleStatus: (tenantId: string, newStatus: 'active' | 'suspended') => void;
  onUpdateTenant: (tenantId: string, updates: Pick<TenantClient, 'businessName' | 'ownerName' | 'ownerEmail' | 'ownerPhone'>) => void;
  onDeleteTenant: (tenantId: string) => void;
  onCreateTenant: (tenant: Omit<TenantClient, 'id' | 'createdAt'> & { initialPassword: string }) => void;
}

const makeTenantId = (name: string) => name
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 36)
  .replace(/-+$/g, '');

const normalizeTenantId = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 36)
  .replace(/-+$/g, '');

export const TenantsManagementView: React.FC<TenantsManagementViewProps> = ({
  tenants,
  supportSession,
  onStartSupportSession,
  onEndSupportSession,
  onToggleStatus,
  onUpdateTenant,
  onDeleteTenant,
  onCreateTenant,
}) => {
  const {
    currencies,
    platformDefaultCurrencyCode,
  } = useCurrency();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Support Session modal state
  const [sessionModalTenant, setSessionModalTenant] = useState<TenantClient | null>(null);
  const [sessionReason, setSessionReason] = useState('');
  const [sessionDuration, setSessionDuration] = useState(30);
  const [editingTenant, setEditingTenant] = useState<TenantClient | null>(null);
  const [tenantEditDraft, setTenantEditDraft] = useState({
    businessName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
  });
  const [deletingTenant, setDeletingTenant] = useState<TenantClient | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // New Tenant modal
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newTenantId, setNewTenantId] = useState('');
  const [hasCustomTenantId, setHasCustomTenantId] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newInitialPassword, setNewInitialPassword] = useState('');
  const [newCurrencyCode, setNewCurrencyCode] = useState<string>(platformDefaultCurrencyCode || 'BDT');
  const [newPricePerMessage, setNewPricePerMessage] = useState<number>(0.25);
  const [newInitialBalance, setNewInitialBalance] = useState<number>(500);

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = `${t.businessName} ${t.id} ${t.ownerEmail} ${t.ownerName}`.toLowerCase();
      return match.includes(q);
    }
    return true;
  });

  const handleLaunchSupportSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionModalTenant || !sessionReason.trim()) return;
    onStartSupportSession(sessionModalTenant.id, sessionModalTenant.businessName, sessionReason.trim(), sessionDuration);
    setSessionModalTenant(null);
    setSessionReason('');
  };

  const handleCreateNewTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim() || !newTenantId || !newOwnerEmail.trim() || newInitialPassword.length < 8) return;

    onCreateTenant({
      tenantId: newTenantId,
      businessName: newBizName.trim(),
      ownerName: newOwnerName.trim() || 'Business Owner',
      ownerEmail: newOwnerEmail.trim(),
      ownerPhone: newOwnerPhone.trim() || '+880 1700-000000',
      initialPassword: newInitialPassword,
      currencyCode: newCurrencyCode,
      pricePerMessage: Number(newPricePerMessage) || 0.25,
      walletBalance: Number(newInitialBalance) || 0,
      status: 'active',
      connectedChannels: { messengerPages: 1, whatsappNumbers: 1 },
      primaryModel: 'gemini-2.5-flash',
      monthlySpendUSD: 0,
      monthlySpendBDT: 0,
      conversationsThisMonth: 0,
      messagesProcessedThisMonth: 0,
      healthScorePercent: 100,
      lastActiveDate: 'Just registered',
      supportNotes: 'New tenant onboarded via Super Admin Console.',
      assignedSupportOwner: 'Platform Operations Team',
    });

    setNewBizName('');
    setNewTenantId('');
    setHasCustomTenantId(false);
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewOwnerPhone('');
    setNewInitialPassword('');
    setNewCurrencyCode(platformDefaultCurrencyCode || 'BDT');
    setNewPricePerMessage(0.25);
    setNewInitialBalance(500);
    setIsNewTenantModalOpen(false);
  };

  const openEditTenant = (tenant: TenantClient) => {
    setEditingTenant(tenant);
    setTenantEditDraft({
      businessName: tenant.businessName,
      ownerName: tenant.ownerName,
      ownerEmail: tenant.ownerEmail,
      ownerPhone: tenant.ownerPhone,
    });
  };

  const handleSaveTenant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTenant) return;
    onUpdateTenant(editingTenant.id, {
      businessName: tenantEditDraft.businessName.trim(),
      ownerName: tenantEditDraft.ownerName.trim(),
      ownerEmail: tenantEditDraft.ownerEmail.trim(),
      ownerPhone: tenantEditDraft.ownerPhone.trim(),
    });
    setEditingTenant(null);
  };

  const handleDeleteTenant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!deletingTenant || deleteConfirmation !== deletingTenant.businessName) return;
    onDeleteTenant(deletingTenant.id);
    setDeletingTenant(null);
    setDeleteConfirmation('');
  };


  return (
    <div className="space-y-6">
      {/* Active Support Session Banner (Audited Impersonation) */}
      {supportSession.isActive && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 border border-amber-300 rounded-xl text-amber-800 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  Audited Support Impersonation Active
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 text-amber-900">
                  {supportSession.auditSessionId}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Session tenant: <strong>{supportSession.tenantName}</strong> ({supportSession.tenantId}) · Reason: &quot;{supportSession.reason}&quot; · Expires {supportSession.expiresAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEndSupportSession}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            End Support Session
          </button>
        </div>
      )}

      {/* Overview Cards (Light Mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tenants</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{tenants.length}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {tenants.filter((t) => t.status === 'active').length} actively serving customers
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Conversations</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {tenants.reduce((sum, t) => sum + t.conversationsThisMonth, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Autonomous chats this month</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Messages Processed</span>
            <Bot className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {tenants.reduce((sum, t) => sum + t.messagesProcessedThisMonth, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total inbound & outbound turns</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Connected Channels</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {tenants.reduce((sum, t) => sum + t.connectedChannels.messengerPages + t.connectedChannels.whatsappNumbers, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Messenger & WhatsApp live endpoints</div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by business name, ID, or owner email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setNewTenantId(makeTenantId(newBizName));
              setHasCustomTenantId(false);
              setIsNewTenantModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Onboard Tenant
          </button>
        </div>
      </div>

      {/* Tenants Table (Light Mode, No Plans or Quotas) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Business / Tenant</th>
                <th className="py-3 px-4">Owner Contact</th>
                <th className="py-3 px-4">Messages Processed</th>
                <th className="py-3 px-4">Operating Currency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No tenants found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Business Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{t.businessName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{t.id}</div>
                    </td>

                    {/* Owner Info */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{t.ownerName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{t.ownerEmail}</div>
                      <div className="text-[10px] text-slate-400">{t.ownerPhone}</div>
                    </td>

                    {/* Messages Processed */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {t.messagesProcessedThisMonth.toLocaleString()}
                    </td>

                    {/* Operating Currency */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 font-mono text-xs">
                        {t.currencyCode || 'BDT'} ({currencies.find((currency) => currency.code === (t.currencyCode || 'BDT'))?.symbol || ''})
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {t.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Suspended
                        </span>
                      )}
                    </td>


                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(t.id, t.status === 'active' ? 'suspended' : 'active')}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                            t.status === 'active'
                              ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {t.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditTenant(t)}
                          title={`Edit ${t.businessName}`}
                          aria-label={`Edit ${t.businessName}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeletingTenant(t); setDeleteConfirmation(''); }}
                          title={`Delete ${t.businessName}`}
                          aria-label={`Delete ${t.businessName}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <form onSubmit={handleSaveTenant} className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 id="edit-tenant-title" className="text-sm font-bold text-slate-900">Edit Tenant</h3>
              <button type="button" onClick={() => setEditingTenant(null)} aria-label="Close edit tenant form" className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Business Name *
                <input required value={tenantEditDraft.businessName} onChange={(event) => setTenantEditDraft((draft) => ({ ...draft, businessName: event.target.value }))} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Owner Name
                <input value={tenantEditDraft.ownerName} onChange={(event) => setTenantEditDraft((draft) => ({ ...draft, ownerName: event.target.value }))} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Owner Email *
                <input type="email" required value={tenantEditDraft.ownerEmail} onChange={(event) => setTenantEditDraft((draft) => ({ ...draft, ownerEmail: event.target.value }))} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Owner Phone
                <input value={tenantEditDraft.ownerPhone} onChange={(event) => setTenantEditDraft((draft) => ({ ...draft, ownerPhone: event.target.value }))} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </label>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setEditingTenant(null)} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {deletingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <form onSubmit={handleDeleteTenant} role="alertdialog" aria-modal="true" aria-labelledby="delete-tenant-title" className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0"><Trash2 className="w-5 h-5" /></div>
              <div>
                <h3 id="delete-tenant-title" className="text-sm font-bold text-slate-900">Delete {deletingTenant.businessName}?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">This permanently deletes the tenant and its associated data. Type the business name exactly to confirm.</p>
              </div>
            </div>
            <label className="block text-xs font-bold text-slate-700">
              Business Name
              <input autoComplete="off" required value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={deletingTenant.businessName} className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </label>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button type="button" onClick={() => { setDeletingTenant(null); setDeleteConfirmation(''); }} className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={deleteConfirmation !== deletingTenant.businessName} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Tenant
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Support Session Launch Modal (Audited Access Control) */}
      {sessionModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Audited Tenant Support Session</span>
              </div>
              <button
                type="button"
                onClick={() => setSessionModalTenant(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are establishing an audited impersonation session for{' '}
              <strong>{sessionModalTenant.businessName}</strong> ({sessionModalTenant.id}). Every message sent, prompt altered, or setting configured will be recorded with your administrator ID in the immutable security audit log.
            </p>

            <form onSubmit={handleLaunchSupportSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justification / Support Ticket Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diagnosing webhook delivery delay with customer approval"
                  value={sessionReason}
                  onChange={(e) => setSessionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Session Expiry Window
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSessionDuration(mins)}
                      className={`py-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                        sessionDuration === mins
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSessionModalTenant(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!sessionReason.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Launch Audited Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard New Tenant Modal (No Plans, No Quotas) */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-slate-700" />
                <span>Onboard New Tenant Client</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTenantModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTenant} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artisan Footwear BD"
                  value={newBizName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewBizName(value);
                    if (!hasCustomTenantId) setNewTenantId(makeTenantId(value));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tenant ID *
                </label>
                <input
                  type="text"
                  required
                  maxLength={36}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Use lowercase letters, numbers, and hyphens."
                  placeholder="Generated from the business name"
                  value={newTenantId}
                  onChange={(e) => {
                    setHasCustomTenantId(true);
                    setNewTenantId(normalizeTenantId(e.target.value));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Lowercase name-based ID, up to 36 characters. You can edit it.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahir Faysal"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1711-223344"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. mahir@artisanfootwear.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Admin Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={newInitialPassword}
                  onChange={(e) => setNewInitialPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operating Currency *
                  </label>
                  <select
                    value={newCurrencyCode}
                    onChange={(e) => setNewCurrencyCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} ({curr.symbol}) — {curr.name} (1 USD = {curr.exchangeRateFromUSD} {curr.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    All workspace pages, analytics, and billing for this tenant will use this currency.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price Per Message ({currencies.find((c) => c.code === newCurrencyCode)?.symbol || '$'}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      placeholder="e.g. 0.25"
                      value={newPricePerMessage}
                      onChange={(e) => setNewPricePerMessage(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">
                      / sent msg
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Deducted from tenant balance for each AI reply sent.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Balance / Credit ({currencies.find((c) => c.code === newCurrencyCode)?.symbol || '$'}) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="e.g. 500"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Preloaded account balance available immediately.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTenantModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
