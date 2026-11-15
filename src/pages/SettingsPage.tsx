import React, { useEffect, useState } from 'react';
import { SubPageNav, SubPageTabItem } from '../components/navigation/SubPageNav';
import { BusinessProfileView } from '../components/settings/BusinessProfileView';
import { NotificationsEscalationsView } from '../components/settings/NotificationsEscalationsView';
import { BillingUsageView } from '../components/settings/BillingUsageView';
import { AuditLogsView } from '../components/settings/AuditLogsView';

import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { PlanDetails, UsageMetric, CostBreakdownComparison, InvoiceItem } from '../types/billing';

// Types
import {
  BusinessProfile,
  ServiceSettings,
  DataRetentionSettings,
  CustomerErasureRequest,
} from '../types/businessSettings';
import {
  EscalationRule,
  UserNotificationPreference,
  SystemNotificationItem,
} from '../types/notifications';
import { AuditLogEntry } from '../types/auditLogs';
import { useUrlQueryState } from '../hooks/useUrlQueryState';
import { useAuth } from '../context/AuthContext';

import {
  Building2,
  Bell,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export type SettingsTabId = 'business' | 'notifications' | 'billing' | 'audit';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useUrlQueryState<SettingsTabId>('tab', 'business', [
    'business', 'notifications', 'billing', 'audit',
  ]);

  // State for Business
  const [profile, setProfile] = useState<BusinessProfile>({ businessName: '', industry: '', businessDescription: '', website: '', contactPhone: '', supportEmail: '', businessHoursStart: '09:00', businessHoursEnd: '18:00', timeZone: 'Asia/Dhaka', operatingLocations: [] });
  const [service, setService] = useState<ServiceSettings>({ deliveryAreas: [], customerSupportHours: '', escalationSupervisorName: '', escalationSupervisorEmail: '', escalationSupervisorPhone: '', supportPhone: '', supportEmail: '', outOfHoursBehavior: 'polite_closed_notice', defaultGreetingMessage: '', outOfHoursMessage: '' });
  const [retention, setRetention] = useState<DataRetentionSettings>({ retentionWindow: '90_days', autoPurgeCustomerPII: false, autoPurgeVoiceNotes: false, privacyNoticeUrl: '', dataProcessingAgreementSigned: false, erasureRequestsCount: 0 });
  const [erasureRequests, setErasureRequests] = useState<CustomerErasureRequest[]>([]);
  const profileQ = useApiData<{ profile: BusinessProfile }>('/settings/business-profile');
  const serviceQ = useApiData<{ service: Omit<ServiceSettings, 'deliveryAreas'> | null; deliveryAreas: Array<Record<string, any>> }>('/settings/service');
  const retentionQ = useApiData<{ retention: DataRetentionSettings | null; erasureRequests: CustomerErasureRequest[] }>('/settings/retention');
  useEffect(() => {
    if (!profileQ.data) return;
    setProfile({
      ...profileQ.data.profile,
      businessName: profileQ.data.profile.businessName || user?.tenantName || '',
    });
  }, [profileQ.data, user?.tenantName]);
  useEffect(() => { if (serviceQ.data) setService({ ...(serviceQ.data.service ?? {}), deliveryAreas: serviceQ.data.deliveryAreas.map((area) => ({ ...area, standardFeeBDT: area.standardFee })) } as ServiceSettings); }, [serviceQ.data]);
  useEffect(() => { if (retentionQ.data) { if (retentionQ.data.retention) setRetention(retentionQ.data.retention); setErasureRequests(retentionQ.data.erasureRequests); } }, [retentionQ.data]);

  // State for Notifications
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [preferences, setPreferences] = useState<UserNotificationPreference[]>([]);
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([]);
  const [quietHours,setQuietHours]=useState<{enabled:boolean;start:string;end:string}>({enabled:true,start:'23:00',end:'07:00'});

  // State for Billing
  const [billingMetrics, setBillingMetrics] = useState<UsageMetric[]>([]);
  const billingQ = useApiData<{ plan: PlanDetails; usage: Array<{ name: string; current: number; limit: number; unit: string }>; costComparison: CostBreakdownComparison }>('/billing/overview');
  const invoicesQ = useApiData<{ invoices: InvoiceItem[] }>('/billing/invoices');
  useEffect(() => { if (billingQ.data) setBillingMetrics(billingQ.data.usage.map((metric) => ({ ...metric, percentUsed: metric.limit > 0 ? Math.min(100, metric.current / metric.limit * 100) : 0, isOverLimit: metric.limit > 0 && metric.current > metric.limit }))); }, [billingQ.data]);

  // State for Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const rulesQ = useApiData<{ rules: EscalationRule[] }>('/settings/escalation-rules');
  const preferencesQ = useApiData<{ preferences: (UserNotificationPreference & { id: string })[];quietHours?:{enabled:boolean;start:string;end:string} }>('/settings/notification-preferences');
  const notificationsQ = useApiData<{ notifications: SystemNotificationItem[] }>('/settings/notifications');
  const auditQ = useApiData<{ logs: AuditLogEntry[] }>('/settings/audit-logs');
  useEffect(() => { if (rulesQ.data) setRules(rulesQ.data.rules); }, [rulesQ.data]);
  useEffect(() => { if (preferencesQ.data) {setPreferences(preferencesQ.data.preferences);if(preferencesQ.data.quietHours)setQuietHours(preferencesQ.data.quietHours);} }, [preferencesQ.data]);
  useEffect(() => { if (notificationsQ.data) setNotifications(notificationsQ.data.notifications); }, [notificationsQ.data]);
  useEffect(() => { if (auditQ.data) setAuditLogs(auditQ.data.logs); }, [auditQ.data]);

  const handleExecuteErasure = (identifier: string, channel: 'messenger' | 'whatsapp') => {
    api.post('/settings/erasures', { customerIdentifier: identifier, channel }).then(() => retentionQ.reload()).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not create erasure request'));
  };

  const handleToggleRule = (ruleId: string) => {
    const rule = rules.find((item) => item.id === ruleId);
    if (!rule) return;
    api.post('/settings/escalation-rules', { ...rule, isEnabled: !rule.isEnabled }).then(() => rulesQ.reload()).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not update rule'));
  };

  const handleUpdatePreference = (
    categoryIndex: number,
    channel: 'inApp' | 'email' | 'smsWhatsapp'
  ) => {
    const preference = preferences[categoryIndex] as UserNotificationPreference & { id?: string };
    if (!preference?.id) return;
    api.post('/settings/notification-preferences', { id: preference.id, [channel]: !preference[channel] }).then(() => preferencesQ.reload()).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not update notification preference'));
  };

  const handleMarkNotificationRead = (notifId: string) => {
    api.post(`/settings/notifications/${notifId}/read`, {}).then(() => notificationsQ.reload()).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not mark notification read'));
  };

  const SETTINGS_TABS: SubPageTabItem<SettingsTabId>[] = [
    {
      id: 'business',
      label: 'Business Settings',
      icon: Building2,
      group: 'WORKSPACE',
    },
    {
      id: 'notifications',
      label: 'Notifications & Escalations',
      icon: Bell,
      count: rules.filter((r) => r.isEnabled).length,
      group: 'OPERATIONS',
    },
    {
      id: 'billing',
      label: 'Billing & Platform Usage',
      icon: CreditCard,
      badge: 'Active Tier',
      badgeVariant: 'purple',
      group: 'OPERATIONS',
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: ShieldCheck,
      count: auditLogs.length,
      group: 'SECURITY',
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <SubPageNav<SettingsTabId>
        tabs={SETTINGS_TABS}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      <div className="flex-1 min-w-0 w-full">
        {activeTab === 'business' && (
          <BusinessProfileView
            profile={profile}
            service={service}
            retention={retention}
            erasureRequests={erasureRequests}
            onSaveProfile={(value) => api.put<any>('/settings/business-profile', value).then(({ profile: saved }) => setProfile(saved)).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not save profile'))}
            onSaveService={(value) => api.put<any>('/settings/service', { ...value, deliveryAreas: value.deliveryAreas.map((area) => ({ ...area, standardFee: area.standardFeeBDT })) }).then(({ service: saved, deliveryAreas }) => setService({ ...saved, deliveryAreas: deliveryAreas.map((area: any) => ({ ...area, standardFeeBDT: area.standardFee })) })).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not save service settings'))}
            onSaveRetention={(value) => api.put<any>('/settings/retention', value).then(({ retention: saved }) => { setRetention(saved); retentionQ.reload(); }).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not save retention settings'))}
            onExecuteErasure={handleExecuteErasure}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsEscalationsView
            rules={rules}
            preferences={preferences}
            quietHours={quietHours}
            onUpdateQuietHours={(value)=>api.post('/settings/notification-preferences',value).then(()=>preferencesQ.reload()).catch((e:unknown)=>window.alert(e instanceof Error?e.message:'Could not save quiet hours'))}
            notifications={notifications}
            onToggleRule={handleToggleRule}
            onUpdatePreference={handleUpdatePreference}
            onMarkNotificationRead={handleMarkNotificationRead}
          />
        )}

        {activeTab === 'billing' && (
          <BillingUsageView
            plan={billingQ.data?.plan ?? { tier: 'starter', displayName: 'Starter', priceMonthlyUSD: 0, priceMonthlyBDT: 0, conversationsAllowance: 0, messagesAllowance: 0, teamSeatsAllowance: 0, channelsAllowance: 0, retentionDays: 0, features: [] }}
            metrics={billingMetrics}
            costComparison={billingQ.data?.costComparison ?? { providerCostUSD: 0, providerCostBDT: 0, providerBreakdown: { geminiCostUSD: 0, openAICostUSD: 0, anthropicCostUSD: 0, vectorEmbeddingCostUSD: 0, infraComputeCostUSD: 0 }, clientBillableUSD: 0, clientBillableBDT: 0, clientBillingBreakdown: { basePlanFeeUSD: 0, overageConversationsUSD: 0, additionalChannelsUSD: 0, prioritySupportUSD: 0 }, platformMarginPercent: 0 }}
            invoices={invoicesQ.data?.invoices ?? []}
            onUpgradePlan={() => api.get<{plans: Array<{tier:string;displayName?:string}>}>('/billing/plans').then(async ({plans}) => {
              const choices = plans.map((plan) => `${plan.tier}${plan.displayName ? ` (${plan.displayName})` : ''}`).join(', ');
              const tier = window.prompt(`Choose a plan tier: ${choices}`)?.trim().toLowerCase();
              if (!tier) return;
              if (!plans.some((plan) => plan.tier === tier)) { window.alert('That plan tier is not available.'); return; }
              await api.post('/billing/change-plan', {tier});
              await billingQ.reload();
              window.alert(`Plan changed to ${tier}.`);
            }).catch((e: unknown) => window.alert(e instanceof Error ? e.message : 'Could not change plan'))}
          />
        )}

        {activeTab === 'audit' && <AuditLogsView logs={auditLogs} />}
      </div>
    </div>
  );
};
