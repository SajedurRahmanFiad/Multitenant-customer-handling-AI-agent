import React, { useState } from 'react';
import {
  KnowledgeTab,
  KnowledgeSource,
  FaqItem,
  BusinessPolicy,
  ProductRecord,
  TrainingJob,
  TestCase,
  KnowledgeSnapshot,
  BrandIdentityKnowledge,
} from '../types/knowledge';
import {
  INITIAL_KNOWLEDGE_SOURCES,
  INITIAL_FAQS,
  INITIAL_POLICIES,
  INITIAL_PRODUCTS,
  INITIAL_TRAINING_JOBS,
  INITIAL_TEST_CASES,
  INITIAL_SNAPSHOTS,
  INITIAL_BRAND_IDENTITY,
} from '../data/knowledgeMockData';
import { KnowledgeSourcesView } from '../components/knowledge/KnowledgeSourcesView';
import { FaqManagerView } from '../components/knowledge/FaqManagerView';
import { BusinessPoliciesView } from '../components/knowledge/BusinessPoliciesView';
import { ProductCatalogueView } from '../components/knowledge/ProductCatalogueView';
import { BrandIdentityView } from '../components/knowledge/BrandIdentityView';
import { TrainingJobsView } from '../components/knowledge/TrainingJobsView';
import { KnowledgeTestingView } from '../components/knowledge/KnowledgeTestingView';
import { KnowledgeVersioningView } from '../components/knowledge/KnowledgeVersioningView';
import {
  Database,
  HelpCircle,
  ShieldCheck,
  Package,
  Sparkles,
  Cpu,
  FlaskConical,
  GitBranch,
  CheckCircle2,
} from 'lucide-react';
import { SubPageNav } from '../components/navigation/SubPageNav';

export const KnowledgePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>('sources');

  // State
  const [sources, setSources] = useState<KnowledgeSource[]>(INITIAL_KNOWLEDGE_SOURCES);
  const [faqs, setFaqs] = useState<FaqItem[]>(INITIAL_FAQS);
  const [policies, setPolicies] = useState<BusinessPolicy[]>(INITIAL_POLICIES);
  const [products, setProducts] = useState<ProductRecord[]>(INITIAL_PRODUCTS);
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentityKnowledge>(INITIAL_BRAND_IDENTITY);
  const [jobs, setJobs] = useState<TrainingJob[]>(INITIAL_TRAINING_JOBS);
  const [testCases, setTestCases] = useState<TestCase[]>(INITIAL_TEST_CASES);
  const [snapshots, setSnapshots] = useState<KnowledgeSnapshot[]>(INITIAL_SNAPSHOTS);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Sources Handlers
  const handleAddSource = (newSource: Omit<KnowledgeSource, 'id'>) => {
    const src: KnowledgeSource = {
      ...newSource,
      id: `src_${Date.now()}`,
    };
    setSources((prev) => [src, ...prev]);

    // Add a corresponding training job
    const newJob: TrainingJob = {
      id: `job_${Date.now()}`,
      sourceName: src.name,
      jobType: 'Initial Indexing',
      status: 'running',
      documentsProcessed: 0,
      totalDocuments: src.recordChunksCount || 10,
      recordsSkipped: 0,
      durationMs: 0,
      startedAt: 'Just now',
    };
    setJobs((prev) => [newJob, ...prev]);
    showToast(`Source "${src.name}" added and queued for vectorization`);
  };

  const handleRefreshSource = (id: string) => {
    const source = sources.find((s) => s.id === id);
    if (!source) return;

    setSources((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: 'processing', lastIndexed: 'Just now' } : s
      )
    );

    const reindexJob: TrainingJob = {
      id: `job_${Date.now()}`,
      sourceName: source.name,
      jobType: 'Re-index',
      status: 'running',
      documentsProcessed: 0,
      totalDocuments: source.recordChunksCount,
      recordsSkipped: 0,
      durationMs: 0,
      startedAt: 'Just now',
    };
    setJobs((prev) => [reindexJob, ...prev]);
    showToast(`Re-indexing triggered for "${source.name}"`);
  };

  const handleDeleteSource = (id: string) => {
    const src = sources.find((s) => s.id === id);
    setSources((prev) => prev.filter((s) => s.id !== id));
    showToast(`Source "${src?.name || 'Item'}" removed from training pipeline`);
  };

  const handleToggleSourceActive = (id: string) => {
    setSources((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: s.status === 'ready' ? 'outdated' : 'ready',
            }
          : s
      )
    );
    showToast('Source status updated');
  };

  // 2. FAQ Handlers
  const handleAddFaq = (newFaq: Omit<FaqItem, 'id'>) => {
    const faq: FaqItem = {
      ...newFaq,
      id: `faq_${Date.now()}`,
    };
    setFaqs((prev) => [faq, ...prev]);
    showToast(`FAQ added: "${faq.question.slice(0, 30)}..."`);
  };

  const handleUpdateFaq = (updatedFaq: FaqItem) => {
    setFaqs((prev) => prev.map((f) => (f.id === updatedFaq.id ? updatedFaq : f)));
    showToast('FAQ updated successfully');
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    showToast('FAQ removed');
  };

  // 3. Policies Handlers
  const handleAddPolicy = (newPolicy: Omit<BusinessPolicy, 'id'>) => {
    const policy: BusinessPolicy = {
      ...newPolicy,
      id: `pol_${Date.now()}`,
    };
    setPolicies((prev) => [policy, ...prev]);
    showToast(`Operational policy "${policy.name}" saved`);
  };

  const handleUpdatePolicy = (updatedPolicy: BusinessPolicy) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === updatedPolicy.id ? updatedPolicy : p))
    );
    showToast('Policy updated');
  };

  const handleDeletePolicy = (id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    showToast('Policy deleted');
  };

  // 4. Product Catalogue Handlers
  const handleAddProduct = (newProduct: Omit<ProductRecord, 'id'>) => {
    const prod: ProductRecord = {
      ...newProduct,
      id: `prod_${Date.now()}`,
    };
    setProducts((prev) => [prod, ...prev]);
    showToast(`Product "${prod.name}" added to active catalogue`);
  };

  const handleUpdateProduct = (updatedProduct: ProductRecord) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`Product "${updatedProduct.name}" updated`);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product removed from catalogue');
  };

  const handleImportCsv = (count: number) => {
    showToast(`Imported ${count} new products from CSV into staging catalogue`);
  };

  // 5. Training Jobs Handlers
  const handleRetryJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'running',
              startedAt: 'Just now',
              errorMessage: undefined,
              recordsSkipped: 0,
            }
          : j
      )
    );
    showToast('Training job restarted');
  };

  const handleCancelJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'failed', errorMessage: 'Cancelled by user' } : j))
    );
    showToast('Job cancelled');
  };

  const handleTriggerFullReindex = () => {
    const fullJob: TrainingJob = {
      id: `job_${Date.now()}`,
      sourceName: 'Complete System Re-index (All Active Sources)',
      jobType: 'Re-index',
      status: 'running',
      documentsProcessed: 0,
      totalDocuments: sources.reduce((acc, s) => acc + s.recordChunksCount, 0),
      recordsSkipped: 0,
      durationMs: 0,
      startedAt: 'Just now',
    };
    setJobs((prev) => [fullJob, ...prev]);
    showToast('Full workspace re-index queued across all sources');
  };

  // 6. Testing Handlers
  const handleAddTestCase = (tc: TestCase) => {
    setTestCases((prev) => [tc, ...prev]);
  };

  const handleUpdateVerdict = (id: string, verdict: 'correct' | 'incorrect' | 'incomplete') => {
    setTestCases((prev) =>
      prev.map((t) => (t.id === id ? { ...t, verdict } : t))
    );
    showToast(`Test marked as ${verdict}`);
  };

  // 7. Versioning Handlers
  const handlePublishStaging = (summary: string) => {
    const nextVer = 'v2.5';
    const newProductionSnapshot: KnowledgeSnapshot = {
      version: nextVer,
      label: 'Production - Live',
      state: 'production',
      publishedAt: 'Just now',
      publishedBy: 'Sajedur Rahman',
      sourcesCount: sources.length,
      totalChunks: sources.reduce((acc, s) => acc + s.recordChunksCount, 0),
      changeSummary: summary,
    };

    setSnapshots((prev) => [
      newProductionSnapshot,
      ...prev.map((s) => (s.state === 'production' ? { ...s, state: 'archived' as const } : s)),
    ]);

    showToast(`Knowledge version ${nextVer} is now LIVE on Messenger & WhatsApp!`);
  };

  const handleRollback = (version: string) => {
    setSnapshots((prev) =>
      prev.map((s) => {
        if (s.version === version) {
          return { ...s, state: 'production' as const, label: `${version} (Restored Production)` };
        }
        if (s.state === 'production') {
          return { ...s, state: 'archived' as const };
        }
        return s;
      })
    );
    showToast(`Rolled back live knowledge base to ${version}`);
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
      id: 'faqs' as KnowledgeTab,
      label: 'FAQ Manager',
      icon: HelpCircle,
      count: faqs.length,
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
      group: 'TRAINING & RELEASE',
    },
    {
      id: 'testing' as KnowledgeTab,
      label: 'Knowledge Testing',
      icon: FlaskConical,
      count: testCases.length,
      group: 'TRAINING & RELEASE',
    },
    {
      id: 'versions' as KnowledgeTab,
      label: 'Versions & Release',
      icon: GitBranch,
      badge: 'v2.5-draft',
      group: 'TRAINING & RELEASE',
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
            onToggleActive={handleToggleSourceActive}
          />
        )}

        {activeTab === 'faqs' && (
          <FaqManagerView
            faqs={faqs}
            onAddFaq={handleAddFaq}
            onUpdateFaq={handleUpdateFaq}
            onDeleteFaq={handleDeleteFaq}
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
            onSave={setBrandIdentity}
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

        {activeTab === 'testing' && (
          <KnowledgeTestingView
            testCases={testCases}
            onAddTestCase={handleAddTestCase}
            onUpdateVerdict={handleUpdateVerdict}
          />
        )}

        {activeTab === 'versions' && (
          <KnowledgeVersioningView
            snapshots={snapshots}
            onPublishStaging={handlePublishStaging}
            onRollback={handleRollback}
          />
        )}
        </div>
      </div>
    </div>
  );
};
