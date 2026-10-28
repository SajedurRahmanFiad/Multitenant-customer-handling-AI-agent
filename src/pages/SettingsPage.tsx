import React, { useState } from 'react';
import { SubPageNav, SubPageTabItem } from '../components/navigation/SubPageNav';
import { BusinessProfileView } from '../components/settings/BusinessProfileView';
import { NotificationsEscalationsView } from '../components/settings/NotificationsEscalationsView';
import { BillingUsageView } from '../components/settings/BillingUsageView';
import { AuditLogsView } from '../components/settings/AuditLogsView';

// Mock Data
import {
  INITIAL_BUSINESS_PROFILE,
  INITIAL_SERVICE_SETTINGS,
  INITIAL_DATA_RETENTION,
  INITIAL_ERASURE_REQUESTS,
} from '../data/businessSettingsMockData';
import {
  INITIAL_ESCALATION_RULES,
  INITIAL_USER_PREFERENCES,
  INITIAL_NOTIFICATIONS,
} from '../data/notificationsMockData';
import {
  CURRENT_PLAN_DETAILS,
  CURRENT_USAGE_METRICS,
  CURRENT_COST_COMPARISON,
  INITIAL_INVOICE_HISTORY,
} from '../data/billingMockData';
import { INITIAL_AUDIT_LOGS } from '../data/auditLogsMockData';

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

import {
  Building2,
  Bell,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export type SettingsTabId = 'business' | 'notifications' | 'billing' | 'audit';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('business');

  // State for Business
  const [profile, setProfile] = useState<BusinessProfile>(INITIAL_BUSINESS_PROFILE);
  const [service, setService] = useState<ServiceSettings>(INITIAL_SERVICE_SETTINGS);
  const [retention, setRetention] = useState<DataRetentionSettings>(INITIAL_DATA_RETENTION);
  const [erasureRequests, setErasureRequests] =
    useState<CustomerErasureRequest[]>(INITIAL_ERASURE_REQUESTS);

  // State for Notifications
  const [rules, setRules] = useState<EscalationRule[]>(INITIAL_ESCALATION_RULES);
  const [preferences, setPreferences] =
    useState<UserNotificationPreference[]>(INITIAL_USER_PREFERENCES);
  const [notifications, setNotifications] =
    useState<SystemNotificationItem[]>(INITIAL_NOTIFICATIONS);

  // State for Billing
  const [billingMetrics, setBillingMetrics] = useState(CURRENT_USAGE_METRICS);

  // State for Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  const handleExecuteErasure = (identifier: string, channel: 'messenger' | 'whatsapp') => {
    const newReq: CustomerErasureRequest = {
      id: `era_${Date.now()}`,
      customerIdentifier: identifier,
      channel,
      requestedAt: 'Just now',
      status: 'completed',
      recordsPurgedCount: Math.floor(Math.random() * 40) + 10,
      requestedBy: 'Sajedur Rahman',
      verificationHash: `sha256-${Math.random().toString(36).substring(2, 10)}...`,
    };
    setErasureRequests((prev) => [newReq, ...prev]);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  };

  const handleUpdatePreference = (
    categoryIndex: number,
    channel: 'inApp' | 'email' | 'smsWhatsapp'
  ) => {
    setPreferences((prev) =>
      prev.map((p, idx) => (idx === categoryIndex ? { ...p, [channel]: !p[channel] } : p))
    );
  };

  const handleMarkNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
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
            onSaveProfile={setProfile}
            onSaveService={setService}
            onSaveRetention={setRetention}
            onExecuteErasure={handleExecuteErasure}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsEscalationsView
            rules={rules}
            preferences={preferences}
            notifications={notifications}
            onToggleRule={handleToggleRule}
            onUpdatePreference={handleUpdatePreference}
            onMarkNotificationRead={handleMarkNotificationRead}
          />
        )}

        {activeTab === 'billing' && (
          <BillingUsageView
            plan={CURRENT_PLAN_DETAILS}
            metrics={billingMetrics}
            costComparison={CURRENT_COST_COMPARISON}
            invoices={INITIAL_INVOICE_HISTORY}
            onUpgradePlan={() => alert('Plan change flow initialized')}
          />
        )}

        {activeTab === 'audit' && <AuditLogsView logs={auditLogs} />}
      </div>
    </div>
  );
};
