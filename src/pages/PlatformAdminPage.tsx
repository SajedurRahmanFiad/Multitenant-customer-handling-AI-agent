import React, { useState } from 'react';
import {
  Building2,
  Cpu,
  DollarSign,
  Layers,
  Activity,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { SubPageNav, SubPageTabItem } from '../components/navigation/SubPageNav';
import {
  PlatformAdminTab,
  SupportSessionSession,
  AIProviderModel,
  PlatformFinancialMetrics,
  DeadLetterJob,
  TenantClient,
  GlobalPipelineLayer,
} from '../types/platformAdmin';
import {
  INITIAL_TENANTS,
  INITIAL_PROVIDER_MODELS,
  INITIAL_PLATFORM_METRICS,
  INITIAL_TOP_TENANTS,
  INITIAL_QUEUE_METRICS,
  INITIAL_DEAD_LETTER_JOBS,
  INITIAL_SYSTEM_COMPONENTS,
  INITIAL_INCIDENTS,
  INITIAL_COMPLIANCE_REPORT,
  INITIAL_GLOBAL_PIPELINE_LAYERS,
} from '../data/platformAdminMockData';

import { TenantsManagementView } from '../components/platform-admin/TenantsManagementView';
import { CurrencyManagementView } from '../components/platform-admin/CurrencyManagementView';
import { GlobalPipelineAdminView } from '../components/platform-admin/GlobalPipelineAdminView';
import { AIProviderRegistryView } from '../components/platform-admin/AIProviderRegistryView';
import { UsageCostControlView } from '../components/platform-admin/UsageCostControlView';
import { InfrastructureQueuesView } from '../components/platform-admin/InfrastructureQueuesView';
import { SystemHealthAlertsView } from '../components/platform-admin/SystemHealthAlertsView';
import { SecurityComplianceView } from '../components/platform-admin/SecurityComplianceView';
import { useCurrency } from '../context/CurrencyContext';


export const PlatformAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlatformAdminTab>('tenants');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    currencies,
    platformDefaultCurrencyCode,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    setPlatformDefaultCurrency,
    setTenantCurrency,
    setTenantPricing,
  } = useCurrency();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // State
  const [tenants, setTenants] = useState<TenantClient[]>(INITIAL_TENANTS);
  const [globalLayers, setGlobalLayers] = useState<GlobalPipelineLayer[]>(INITIAL_GLOBAL_PIPELINE_LAYERS);
  const [supportSession, setSupportSession] = useState<SupportSessionSession>({
    isActive: false,
  });

  const [models, setModels] = useState<AIProviderModel[]>(INITIAL_PROVIDER_MODELS);
  const [financialMetrics, setFinancialMetrics] = useState<PlatformFinancialMetrics>(INITIAL_PLATFORM_METRICS);
  const [topTenants, setTopTenants] = useState(INITIAL_TOP_TENANTS);
  const [queueMetrics, setQueueMetrics] = useState(INITIAL_QUEUE_METRICS);
  const [dlqJobs, setDlqJobs] = useState<DeadLetterJob[]>(INITIAL_DEAD_LETTER_JOBS);

  const handleUpdateTenantCurrency = (tenantId: string, currencyCode: string) => {
    setTenantCurrency(tenantId, currencyCode);
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, currencyCode } : t))
    );
  };

  // Tabs config using SubPageTabItem (No commercial plans tab)
  const tabs: SubPageTabItem<PlatformAdminTab>[] = [
    {
      id: 'tenants',
      label: 'Tenants Directory',
      icon: Building2,
      count: tenants.length,
      group: 'CLIENTS & TENANTS',
    },
    {
      id: 'currencies',
      label: 'Currency System & Rates',
      icon: Coins,
      badge: `${currencies.length} Currencies`,
      group: 'CLIENTS & TENANTS',
    },
    {
      id: 'global_pipeline',
      label: 'Global Pipeline Layers',
      icon: Layers,
      badge: `${globalLayers.length} Layers`,
      group: 'INFRASTRUCTURE & ORCHESTRATION',
    },

    {
      id: 'provider_registry',
      label: 'AI Provider Registry',
      icon: Cpu,
      badge: 'KMS',
      group: 'INFRASTRUCTURE & ORCHESTRATION',
    },
    {
      id: 'cost_control',
      label: 'Usage & Cost Control',
      icon: DollarSign,
      group: 'INFRASTRUCTURE & ORCHESTRATION',
    },

    {
      id: 'infrastructure_queues',
      label: 'Queues & BullMQ',
      icon: Layers,
      count: dlqJobs.length > 0 ? dlqJobs.length : undefined,
      badgeVariant: dlqJobs.length > 0 ? 'warning' : undefined,
      group: 'INFRASTRUCTURE & ORCHESTRATION',
    },
    {
      id: 'system_health',
      label: 'System Health & SLA',
      icon: Activity,
      badge: '99.98%',
      badgeVariant: 'success',
      group: 'OPERATIONS & COMPLIANCE',
    },
    {
      id: 'security_compliance',
      label: 'Security & Canaries',
      icon: ShieldCheck,
      group: 'OPERATIONS & COMPLIANCE',
    },
  ];

  // Handlers for Tenants
  const handleToggleTenantStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'suspended' ? 'active' : 'suspended';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleStartSupportSession = (tenantId: string, reason: string, durationMinutes: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    setSupportSession({
      isActive: true,
      tenantId: tenant.id,
      tenantName: tenant.businessName,
      adminName: 'Sajedur Rahman (Super Admin)',
      reason,
      startedAt: 'Just now',
      expiresAt: `In ${durationMinutes} minutes`,
      auditSessionId: `aud_sess_${Math.random().toString(36).substring(2, 9)}`,
    });
  };

  const handleEndSupportSession = () => {
    setSupportSession({ isActive: false });
  };

  // Handlers for Models
  const handleToggleModelStatus = (modelId: string) => {
    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId
          ? { ...m, status: m.status === 'active' ? 'disabled' : 'active' }
          : m
      )
    );
  };

  const handleSetDefaultModel = (modelId: string) => {
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === modelId,
      }))
    );
  };

  const handleSetFallbackModel = (modelId: string) => {
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        isFallback: m.id === modelId,
      }))
    );
  };

  // Handlers for DLQ
  const handleRetryDlqJob = (jobId: string) => {
    setDlqJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleDismissDlqJob = (jobId: string) => {
    setDlqJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Responsive Layout with SubPageNav (vertical on desktop, horizontal on mobile) */}
      <div className="flex flex-col lg:flex-row gap-6">
        <SubPageNav
          tabs={tabs}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        {/* Tab Content View */}
        <div className="flex-1 min-w-0">
          {activeTab === 'tenants' && (
            <TenantsManagementView
              tenants={tenants}
              supportSession={supportSession}
              onStartSupportSession={(tenantId, _tenantName, reason, duration) =>
                handleStartSupportSession(tenantId, reason, duration)
              }
              onEndSupportSession={handleEndSupportSession}
              onToggleStatus={(tenantId) => handleToggleTenantStatus(tenantId)}
              onCreateTenant={(newTenant) => {
                const newId = `ten_${Date.now().toString(36)}`;
                const created: TenantClient = {
                  ...newTenant,
                  id: newId,
                  createdAt: 'Just now',
                };
                setTenants((prev) => [created, ...prev]);
                if (newTenant.currencyCode) {
                  setTenantCurrency(newId, newTenant.currencyCode);
                }
                setTenantPricing(newId, newTenant.pricePerMessage, newTenant.walletBalance);
                showToast(`Provisioned tenant "${created.businessName}" with ${newTenant.currencyCode} wallet.`);
              }}
            />
          )}

          {activeTab === 'currencies' && (
            <CurrencyManagementView
              currencies={currencies}
              tenants={tenants}
              platformDefaultCurrencyCode={platformDefaultCurrencyCode}
              onAddCurrency={addCurrency}
              onUpdateCurrency={updateCurrency}
              onDeleteCurrency={deleteCurrency}
              onSetPlatformDefault={setPlatformDefaultCurrency}
              onUpdateTenantCurrency={handleUpdateTenantCurrency}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'global_pipeline' && (

            <GlobalPipelineAdminView
              layers={globalLayers}
              availableModels={models}
              onSaveLayer={(updated) => {
                setGlobalLayers((prev) =>
                  prev.map((l) => (l.id === updated.id ? updated : l))
                );
              }}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'provider_registry' && (
            <AIProviderRegistryView
              models={models}
              onToggleStatus={handleToggleModelStatus}
              onSetDefault={handleSetDefaultModel}
              onSetFallback={handleSetFallbackModel}
            />
          )}


          {activeTab === 'cost_control' && (
            <UsageCostControlView
              metrics={financialMetrics}
              topTenants={topTenants}
              onUpdatePolicy={(policy) =>
                setFinancialMetrics((prev) => ({ ...prev, anomalyProtectionPolicy: policy }))
              }
            />
          )}

          {activeTab === 'infrastructure_queues' && (
            <InfrastructureQueuesView
              metrics={queueMetrics}
              dlqJobs={dlqJobs}
              onRetryDlqJob={handleRetryDlqJob}
              onDismissDlqJob={handleDismissDlqJob}
            />
          )}

          {activeTab === 'system_health' && (
            <SystemHealthAlertsView
              components={INITIAL_SYSTEM_COMPONENTS}
              incidents={INITIAL_INCIDENTS}
            />
          )}

          {activeTab === 'security_compliance' && (
            <SecurityComplianceView report={INITIAL_COMPLIANCE_REPORT} />
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );

};
