import React, { useEffect, useState } from 'react';
import {
  KnowledgeTab,
  KnowledgeSource,
  BusinessPolicy,
  ProductRecord,
  TrainingJob,
  BrandIdentityKnowledge,
} from '../types/knowledge';
import { api } from '../lib/api';
import { useApiData } from '../hooks/useApiData';
import { KnowledgeSourcesView } from '../components/knowledge/KnowledgeSourcesView';
import { BusinessPoliciesView } from '../components/knowledge/BusinessPoliciesView';
import { ProductCatalogueView } from '../components/knowledge/ProductCatalogueView';
import { BrandIdentityView } from '../components/knowledge/BrandIdentityView';
import { TrainingJobsView } from '../components/knowledge/TrainingJobsView';
import {
  Database,
  ShieldCheck,
  Package,
  Sparkles,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { SubPageNav } from '../components/navigation/SubPageNav';
import { useUrlQueryState } from '../hooks/useUrlQueryState';

export const KnowledgePage: React.FC = () => {
  const [activeTab, setActiveTab] = useUrlQueryState<KnowledgeTab>('tab', 'sources', [
    'sources', 'policies', 'catalogue', 'brand', 'jobs',
  ]);

  // State
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [policies, setPolicies] = useState<BusinessPolicy[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentityKnowledge>({ tagline: '', brandVoice: '', tonePillars: [], vocabularyGuidelines: { preferredTerms: [], forbiddenTerms: [] }, greetingConvention: '', culturalNuances: '', lastUpdated: '' });
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const sourcesQ = useApiData<{ sources: KnowledgeSource[] }>('/knowledge/sources');
  const policiesQ = useApiData<{ policies: BusinessPolicy[] }>('/knowledge/policies');
  const productsQ = useApiData<{ products: ProductRecord[] }>('/knowledge/products');
  const brandQ = useApiData<{ brand: BrandIdentityKnowledge }>('/knowledge/brand');
  const jobsQ = useApiData<{ jobs: TrainingJob[] }>('/knowledge/jobs');
  useEffect(() => { if (sourcesQ.data) setSources(sourcesQ.data.sources); }, [sourcesQ.data]);
  useEffect(() => { if (policiesQ.data) setPolicies(policiesQ.data.policies); }, [policiesQ.data]);
  useEffect(() => { if (productsQ.data) setProducts(productsQ.data.products); }, [productsQ.data]);
  useEffect(() => { if (brandQ.data) setBrandIdentity(brandQ.data.brand); }, [brandQ.data]);
  useEffect(() => { if (jobsQ.data) setJobs(jobsQ.data.jobs); }, [jobsQ.data]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshKnowledge = () => { sourcesQ.reload(); policiesQ.reload(); productsQ.reload(); brandQ.reload(); jobsQ.reload(); };
  // 1. Sources Handlers
  const handleAddSource = (newSource: Omit<KnowledgeSource, 'id'>) => {
    api.post('/knowledge/sources', newSource).then(() => { sourcesQ.reload(); jobsQ.reload(); showToast(`Source "${newSource.name}" saved`); }).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not save source'));
  };

  const handleRefreshSource = (id: string) => {
    const source = sources.find((s) => s.id === id);
    if (!source) return;

    api.post(`/knowledge/sources/${id}/reindex`, {}).then(() => { sourcesQ.reload(); jobsQ.reload(); showToast(`Re-index queued for "${source.name}"`); }).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not re-index source'));
  };

  const handleDeleteSource = (id: string) => {
    const src = sources.find((s) => s.id === id);
    api.del(`/knowledge/sources/${id}`).then(() => { sourcesQ.reload(); showToast(`Source "${src?.name || 'Item'}" removed`); }).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not delete source'));
  };

  // 2. Policies Handlers
  const handleAddPolicy = (newPolicy: Omit<BusinessPolicy, 'id'>) => {
    api.post('/knowledge/policies', newPolicy).then(() => policiesQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not save policy'));
  };

  const handleUpdatePolicy = (updatedPolicy: BusinessPolicy) => {
    api.patch(`/knowledge/policies/${updatedPolicy.id}`, updatedPolicy).then(() => policiesQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not update policy'));
  };

  const handleDeletePolicy = (id: string) => {
    api.del(`/knowledge/policies/${id}`).then(() => policiesQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not delete policy'));
  };

  // 3. Product Catalogue Handlers
  const handleAddProduct = (newProduct: Omit<ProductRecord, 'id'>) => {
    const payload = { ...newProduct, price: Number(String(newProduct.price).replace(/[^\d.]/g, '')), discountedPrice: newProduct.discountedPrice ? Number(String(newProduct.discountedPrice).replace(/[^\d.]/g, '')) : null };
    api.post('/knowledge/products', payload).then(() => productsQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not save product'));
  };

  const handleUpdateProduct = (updatedProduct: ProductRecord) => {
    const payload = { ...updatedProduct, price: Number(String(updatedProduct.price).replace(/[^\d.]/g, '')), discountedPrice: updatedProduct.discountedPrice ? Number(String(updatedProduct.discountedPrice).replace(/[^\d.]/g, '')) : null };
    api.patch(`/knowledge/products/${updatedProduct.id}`, payload).then(() => productsQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not update product'));
  };

  const handleDeleteProduct = (id: string) => {
    api.del(`/knowledge/products/${id}`).then(() => productsQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not delete product'));
  };

  const handleImportCsv = (rows: Omit<ProductRecord, 'id'>[]) => {
    Promise.all(rows.map((product) => api.post('/knowledge/products', { ...product, price: Number(product.price) })))
      .then(() => { productsQ.reload(); showToast(`Imported ${rows.length} products`); })
      .catch((e: unknown) => { productsQ.reload(); showToast(e instanceof Error ? `Import stopped: ${e.message}` : 'Product import failed'); });
  };

  // 4. Training Jobs Handlers
  const handleRetryJob = (id: string) => {
    api.post(`/knowledge/jobs/${id}/retry`, {}).then(() => jobsQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not retry job'));
  };

  const handleCancelJob = (id: string) => {
    api.post(`/knowledge/jobs/${id}/cancel`, {}).then(() => jobsQ.reload()).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not cancel job'));
  };

  const handleTriggerFullReindex = () => {
    if (!sources.length) { showToast('Add a knowledge source before re-indexing'); return; }
    Promise.all(sources.filter((source) => source.isActive).map((source) => api.post(`/knowledge/sources/${source.id}/reindex`, {})))
      .then(() => { sourcesQ.reload(); jobsQ.reload(); showToast('Re-index queued for active sources'); })
      .catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not queue re-index'));
  };

  // Subpage tabs configuration
  const SUBPAGES = [
    {
      id: 'sources' as KnowledgeTab,
      label: 'Knowledge Sources',
      icon: Database,
      count: sources.length,
      group: 'KNOWLEDGE BASE',
    },
    {
      id: 'policies' as KnowledgeTab,
      label: 'Business Policies',
      icon: ShieldCheck,
      count: policies.length,
      group: 'KNOWLEDGE BASE',
    },
    {
      id: 'catalogue' as KnowledgeTab,
      label: 'Product Catalogue',
      icon: Package,
      count: products.length,
      group: 'KNOWLEDGE BASE',
    },
    {
      id: 'brand' as KnowledgeTab,
      label: 'Brand Voice & Tagline',
      icon: Sparkles,
      group: 'KNOWLEDGE BASE',
    },
    {
      id: 'jobs' as KnowledgeTab,
      label: 'Training Jobs',
      icon: Cpu,
      badge: jobs.filter((j) => j.status === 'running').length > 0 ? 'Active' : undefined,
      badgeVariant: 'success' as const,
      group: 'TRAINING & TESTING',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
          extraSidebarContent={
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTriggerFullReindex}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-index Workspace</span>
              </button>
            </div>
          }
        />

        {/* Active Subpage Component */}
        <div className="flex-1 min-w-0 w-full">
        {activeTab === 'sources' && (
          <KnowledgeSourcesView
            sources={sources}
            onAddSource={handleAddSource}
            onRefreshSource={handleRefreshSource}
            onDeleteSource={handleDeleteSource}
          />
        )}

        {activeTab === 'policies' && (
          <BusinessPoliciesView
            policies={policies}
            onAddPolicy={handleAddPolicy}
            onUpdatePolicy={handleUpdatePolicy}
            onDeletePolicy={handleDeletePolicy}
          />
        )}

        {activeTab === 'catalogue' && (
          <ProductCatalogueView
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onImportCsv={handleImportCsv}
          />
        )}

        {activeTab === 'brand' && (
          <BrandIdentityView
            brandIdentity={brandIdentity}
            onSave={(value) => api.put('/knowledge/brand', value).then(() => { setBrandIdentity(value); showToast('Brand identity saved'); }).catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not save brand identity'))}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'jobs' && (
          <TrainingJobsView
            jobs={jobs}
            onRetryJob={handleRetryJob}
            onCancelJob={handleCancelJob}
            onTriggerFullReindex={handleTriggerFullReindex}
          />
        )}

        </div>
      </div>
    </div>
  );
};
