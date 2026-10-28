import React, { useState } from 'react';
import {
  INITIAL_CLIENT_MODEL_POLICY,
  INITIAL_INTERNAL_PROVIDERS,
  INITIAL_ROUTING_RULES,
  INITIAL_USAGE_ANALYTICS,
} from '../data/analyticsMockData';
import {
  ClientModelPolicy,
  InternalProviderConfig,
  ModelRoutingRule,
  UsageAnalyticsOverview,
} from '../types/analytics';
import { ClientModelPolicyView } from '../components/analytics/ClientModelPolicyView';
import { InternalProviderConsoleView } from '../components/analytics/InternalProviderConsoleView';
import { ModelRoutingEngineView } from '../components/analytics/ModelRoutingEngineView';
import { UsageCostAnalyticsView } from '../components/analytics/UsageCostAnalyticsView';
import {
  Sparkles,
  Server,
  GitFork,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { SubPageNav } from '../components/navigation/SubPageNav';

type AnalyticsSubTab = 'client_policy' | 'internal_providers' | 'routing_engine' | 'cost_analytics';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsSubTab>('client_policy');

  const [clientPolicy, setClientPolicy] = useState<ClientModelPolicy>(INITIAL_CLIENT_MODEL_POLICY);
  const [internalProviders, setInternalProviders] = useState<InternalProviderConfig[]>(
    INITIAL_INTERNAL_PROVIDERS
  );
  const [routingRules, setRoutingRules] = useState<ModelRoutingRule[]>(INITIAL_ROUTING_RULES);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalyticsOverview>(
    INITIAL_USAGE_ANALYTICS
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleUpdateProvider = (updated: InternalProviderConfig) => {
    setInternalProviders((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleAddProvider = (newProv: InternalProviderConfig) => {
    setInternalProviders((prev) => [...prev, newProv]);
  };

  const handleToggleRoutingRule = (id: string) => {
    setRoutingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    showToast('Routing rule status updated');
  };

  const SUBPAGES = [
    {
      id: 'client_policy' as AnalyticsSubTab,
      label: 'Model Policy & Limits',
      icon: Sparkles,
      indicatorDot: 'connected' as const,
      group: 'CLIENT CONTROLS',
    },
    {
      id: 'internal_providers' as AnalyticsSubTab,
      label: 'Provider Console',
      icon: Server,
      badge: `${internalProviders.length} Providers`,
      badgeVariant: 'purple' as const,
      group: 'INTERNAL INFRASTRUCTURE',
    },
    {
      id: 'routing_engine' as AnalyticsSubTab,
      label: 'Model Routing Engine',
      icon: GitFork,
      badge: 'Auto Active',
      badgeVariant: 'success' as const,
      group: 'INTERNAL INFRASTRUCTURE',
    },
    {
      id: 'cost_analytics' as AnalyticsSubTab,
      label: 'Cost & Resolution Analytics',
      icon: BarChart3,
      badge: `$${usageAnalytics.estimatedCostMonthUsd.toFixed(2)}`,
      group: 'METRICS & REVENUE',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Tabs (Vertical Sidebar on Desktop, Horizontal Scroll on Mobile) */}
        <SubPageNav
          tabs={SUBPAGES}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        {/* Subpage Tab Contents */}
        <div className="flex-1 min-w-0 w-full">
          {activeTab === 'client_policy' && (
            <ClientModelPolicyView
              policy={clientPolicy}
              onUpdatePolicy={setClientPolicy}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'internal_providers' && (
            <InternalProviderConsoleView
              providers={internalProviders}
              onUpdateProvider={handleUpdateProvider}
              onAddProvider={handleAddProvider}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'routing_engine' && (
            <ModelRoutingEngineView
              rules={routingRules}
              onToggleRule={handleToggleRoutingRule}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'cost_analytics' && (
            <UsageCostAnalyticsView
              analytics={usageAnalytics}
              onShowToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};
