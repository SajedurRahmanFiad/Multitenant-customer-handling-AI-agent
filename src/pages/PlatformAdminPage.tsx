import React, { useEffect, useState } from 'react';
import {
  Building2,
  Cpu,
  Layers,
  Coins,
  Server,
} from 'lucide-react';
import { SubPageNav, SubPageTabItem } from '../components/navigation/SubPageNav';
import {
  PlatformAdminTab,
  SupportSessionSession,
  AIProviderModel,
  TenantClient,
  GlobalPipelineLayer,
  QueueMetrics,
  DeadLetterJob,
} from '../types/platformAdmin';
import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';

import { TenantsManagementView } from '../components/platform-admin/TenantsManagementView';
import { CurrencyManagementView } from '../components/platform-admin/CurrencyManagementView';
import { GlobalPipelineAdminView } from '../components/platform-admin/GlobalPipelineAdminView';
import { AIProviderRegistryView } from '../components/platform-admin/AIProviderRegistryView';
import { InfrastructureQueuesView } from '../components/platform-admin/InfrastructureQueuesView';
import { useCurrency } from '../context/CurrencyContext';
import { useUrlQueryState } from '../hooks/useUrlQueryState';


export const PlatformAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useUrlQueryState<PlatformAdminTab>('tab', 'tenants', [
    'tenants', 'currencies', 'global_pipeline', 'provider_registry', 'queues',
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    currencies,
    exchangeRatesByCode,
    exchangeRatesStatus,
    platformDefaultCurrencyCode,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    setPlatformDefaultCurrency,
    setTenantCurrency,
  } = useCurrency();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // State
  const [tenants, setTenants] = useState<TenantClient[]>([]);
  const [globalLayers, setGlobalLayers] = useState<GlobalPipelineLayer[]>([]);
  const [supportSession, setSupportSession] = useState<SupportSessionSession>({
    isActive: false,
  });

  const [models, setModels] = useState<AIProviderModel[]>([]);
  const tenantsQ=useApiData<{tenants:TenantClient[]}>('/platform/tenants');
  const pipelineQ=useApiData<{layers:GlobalPipelineLayer[]}>('/platform/global-pipeline');
  const providersQ=useApiData<{models:AIProviderModel[]}>('/platform/providers');
  const supportQ=useApiData<{session:SupportSessionSession|null}>('/platform/support-session');
  const queuesQ=useApiData<{metrics:QueueMetrics;deadLetterJobs:DeadLetterJob[]}>('/platform/queues');
  useEffect(()=>{if(tenantsQ.data)setTenants(tenantsQ.data.tenants);},[tenantsQ.data]);
  useEffect(()=>{if(pipelineQ.data)setGlobalLayers(pipelineQ.data.layers);},[pipelineQ.data]);
  useEffect(()=>{if(providersQ.data)setModels(providersQ.data.models);},[providersQ.data]);
  useEffect(()=>{setSupportSession(supportQ.data?.session??{isActive:false});},[supportQ.data]);

  const handleUpdateTenantCurrency = (tenantId: string, currencyCode: string) => {
    api.patch(`/platform/tenants/${tenantId}`,{currencyCode}).then(()=>{setTenantCurrency(tenantId,currencyCode);tenantsQ.reload();}).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not update tenant currency'));
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
      badge: `${currencies.length}`,
      group: 'CLIENTS & TENANTS',
    },
    {
      id: 'global_pipeline',
      label: 'Global Pipeline Layers',
      icon: Layers,
      group: 'INFRASTRUCTURE & ORCHESTRATION',
    },

    {
      id: 'provider_registry',
      label: 'AI Provider Registry',
      icon: Cpu,
      badge: 'KMS',
      group: 'INFRASTRUCTURE & ORCHESTRATION',
    },
    { id:'queues',label:'Queues & Failed Jobs',icon:Server,group:'INFRASTRUCTURE & ORCHESTRATION' },

  ];

  // Handlers for Tenants
  const handleToggleTenantStatus = (id: string, status?: 'active'|'suspended') => {
    const tenant=tenants.find(t=>t.id===id); if(!tenant)return;
    api.patch(`/platform/tenants/${id}`,{status:status??(tenant.status==='suspended'?'active':'suspended')}).then(()=>tenantsQ.reload()).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not update tenant'));
  };

  const handleUpdateTenant = (tenantId: string, updates: Pick<TenantClient, 'businessName' | 'ownerName' | 'ownerEmail' | 'ownerPhone'>) => {
    api.patch(`/platform/tenants/${tenantId}`, updates).then(() => {
      tenantsQ.reload();
      showToast('Tenant updated');
    }).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not update tenant'));
  };

  const handleDeleteTenant = (tenantId: string) => {
    const tenant = tenants.find((item) => item.id === tenantId);
    api.del(`/platform/tenants/${tenantId}`).then(() => {
      tenantsQ.reload();
      showToast(`${tenant?.businessName ?? 'Tenant'} deleted`);
    }).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not delete tenant'));
  };

  const handleStartSupportSession = (tenantId: string, reason: string, durationMinutes: number) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    api.post('/platform/support-session',{tenantId:tenant.id,reason,durationMinutes}).then(()=>supportQ.reload()).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not start support session'));
  };

  const handleEndSupportSession = () => {
    api.post('/platform/support-session/end',{id:supportSession.auditSessionId}).then(()=>supportQ.reload()).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not end support session'));
  };

  // Handlers for Models
  const handleToggleModelStatus = (modelId: string) => {
    const model=models.find(m=>m.id===modelId);if(!model)return;
    api.patch(`/platform/providers/${modelId}`,{status:model.status==='active'?'disabled':'active'}).then(()=>providersQ.reload()).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not update model'));
  };

  const handleSaveModel = (updatedModel: AIProviderModel) => {
    const alreadyRegistered = models.some((model) => model.id === updatedModel.id);
    const payload: Partial<AIProviderModel>={...updatedModel};
    if(alreadyRegistered && updatedModel.apiKey.includes('•')) delete payload.apiKey;
    const req=alreadyRegistered?api.patch(`/platform/providers/${updatedModel.id}`,payload):api.post('/platform/providers',payload);
    req.then(()=>{providersQ.reload();showToast(alreadyRegistered ? `${updatedModel.displayName} updated` : `${updatedModel.displayName} registered`);}).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not save model'));
  };

  const handleDeleteModel = (modelId: string) => {
    const model = models.find((registeredModel) => registeredModel.id === modelId);
    api.del(`/platform/providers/${modelId}`).then(() => {
      providersQ.reload();
      showToast(`${model?.displayName ?? 'Model'} deleted`);
    }).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not delete model'));
  };

  const handleSetDefaultModel = (modelId: string) => {
    api.patch(`/platform/providers/${modelId}`,{isDefault:true}).then(()=>providersQ.reload()).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not set default model'));
  };

  const handleSetFallbackModel = (modelId: string) => {
    api.patch(`/platform/providers/${modelId}`,{isFallback:true}).then(()=>providersQ.reload()).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not set fallback model'));
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
              onUpdateTenant={handleUpdateTenant}
              onDeleteTenant={handleDeleteTenant}
              onCreateTenant={(newTenant) => {
                api.post<{tenant:TenantClient}>('/platform/tenants',newTenant).then(({tenant})=>{tenantsQ.reload();showToast(`Provisioned tenant "${tenant.businessName}".`);}).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not create tenant'));
              }}
            />
          )}

          {activeTab === 'currencies' && (
            <CurrencyManagementView
              currencies={currencies}
              exchangeRatesByCode={exchangeRatesByCode}
              exchangeRatesStatus={exchangeRatesStatus}
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
              onSaveLayer={(updated) => { api.patch(`/platform/global-pipeline/${updated.id}`,updated).then(()=>{pipelineQ.reload();showToast(`Saved ${updated.title}`);}).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not save layer')); }}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'provider_registry' && (
            <AIProviderRegistryView
              models={models}
              onSaveModel={handleSaveModel}
              onDeleteModel={handleDeleteModel}
              onToggleStatus={handleToggleModelStatus}
              onSetDefault={handleSetDefaultModel}
              onSetFallback={handleSetFallbackModel}
            />
          )}

          {activeTab==='queues' && queuesQ.data && <InfrastructureQueuesView metrics={queuesQ.data.metrics} dlqJobs={queuesQ.data.deadLetterJobs} onRetryDlqJob={id=>api.post(`/platform/queues/dlq/${id}/retry`,{}).then(()=>queuesQ.reload()).catch((e:unknown)=>{showToast(e instanceof Error?e.message:'Could not retry job');})} onDismissDlqJob={id=>api.post(`/platform/queues/dlq/${id}/dismiss`,{}).then(()=>queuesQ.reload()).catch((e:unknown)=>showToast(e instanceof Error?e.message:'Could not dismiss job'))}/>}

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
