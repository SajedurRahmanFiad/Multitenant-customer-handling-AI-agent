import React, { useState } from 'react';
import { PageId } from '../types/navigation';
import { TimePeriod, TopStatusData } from '../types/overview';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import type { TeamMember } from '../types/team';
import { PerformanceCards } from '../components/overview/PerformanceCards';
import { ChartsSection } from '../components/overview/ChartsSection';
import { ActivityAndInsightsSection } from '../components/overview/ActivityAndInsightsSection';
import { InviteTeammateModal } from '../components/overview/InviteTeammateModal';
import { AddKnowledgeModal } from '../components/overview/AddKnowledgeModal';
import { CheckCircle2, Users, AlertCircle, TrendingUp, Wallet, Plus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { PaymentGatewayModal } from '../components/billing/PaymentGatewayModal';
import { useUrlQueryState } from '../hooks/useUrlQueryState';

interface OverviewPageProps {
  onNavigate?: (page: PageId) => void;
  onInviteMember: (member: Omit<TeamMember, 'id' | 'joinedAt'>) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate, onInviteMember }) => {
  const [selectedPeriod, setSelectedPeriod] = useUrlQueryState<TimePeriod>('period', '24h', ['24h', '7d', '30d']);
  const overviewQ = useApiData<{ status: TopStatusData; metrics: any[]; chart: any[]; commonQuestions: any[]; handoverReasons: any[]; failedOrUnresolved: any[]; activities: any[] }>(`/overview?period=${selectedPeriod}`, [selectedPeriod]);
  const statusData = overviewQ.data?.status ?? { agentStatus: 'Disconnected', messengerStatus: 'Disconnected', whatsAppStatus: 'Disconnected', knowledgeStatus: 'Indexing', indexedDocsCount: 0, aiProvider: 'Not configured', aiProviderStatus: 'Normal', quotaUsedPercent: 0, unansweredCount: 0 } as TopStatusData;
  const currentMetrics = overviewQ.data?.metrics ?? [];
  const currentChartData = overviewQ.data?.chart ?? [];
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    activeTenantCurrency,
    getTenantBalance,
    getTenantPricePerMessage,
    formatRawAmount,
  } = useCurrency();

  const currentBalance = getTenantBalance();
  const pricePerMsg = getTenantPricePerMessage();
  const estimatedRemainingMessages = pricePerMsg > 0 ? Math.floor(currentBalance / pricePerMsg) : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleKnowledgeAdded = ({ title, content, type }: { title: string; content: string; type: 'policy' | 'faq' | 'manual' }) => {
    api.post('/knowledge/sources', { name: title, type: type === 'faq' ? 'faq' : 'manual', content, originDetails: 'Added from overview' })
      .then(() => { overviewQ.reload(); showToast(`"${title}" saved and queued for indexing`); })
      .catch((e: unknown) => showToast(e instanceof Error ? e.message : 'Could not save knowledge source'));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Immediate 4-Question Executive Summary Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Q1: Is my AI agent working? */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Agent Status</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">Workflow setup pending</span>
          </div>
          <div className="my-2">
            <div className="text-sm font-bold text-slate-900">
              {statusData.agentStatus === 'Active' ? 'Active & Healthy' : 'Currently Paused'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Agent workflow is not configured yet
            </p>
          </div>
          <div className="mt-2 text-[10px] text-emerald-700 font-semibold font-mono">
            {statusData.aiProvider} · {statusData.aiProviderStatus}
          </div>
        </div>

        {/* Q2: What is happening with my customers? */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Customer Activity</span>
          </div>
          <div className="my-2">
            <div className="text-sm font-bold text-slate-900">
              {currentMetrics[0]?.value ?? '—'} conversations
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {overviewQ.loading ? 'Loading activity…' : 'Recorded in this workspace'}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {currentMetrics[1]?.value ?? '—'} messages exchanged
          </div>
        </div>

        {/* Q3: Is anything waiting for my attention? */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Needs Attention</span>
          </div>
          <div className="my-2">
            <div className="text-sm font-bold text-amber-800">
              {statusData.unansweredCount} cases pending review
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Payment verification & return disputes
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('inbox')}
            className="text-[10px] font-semibold text-slate-900 hover:underline text-left"
          >
            Open unanswered inbox →
          </button>
        </div>

        {/* Q4: Account Balance & Credits */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>4. Balance & Credits</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRechargeOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all"
            >
              <Plus className="w-3 h-3" />
              Recharge
            </button>
          </div>

          <div className="my-2">
            <div className="text-lg font-black text-slate-900 font-mono tracking-tight">
              {formatRawAmount(currentBalance, activeTenantCurrency.code)}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-slate-600">
                {formatRawAmount(pricePerMsg, activeTenantCurrency.code)} / AI msg
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">
                Live Wallet
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100">
            Capacity: ~{estimatedRemainingMessages.toLocaleString()} msgs
          </div>
        </div>
      </section>

      {/* Key Performance Cards */}
      <PerformanceCards
        metrics={currentMetrics}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        onOpenUnanswered={() => onNavigate?.('inbox')}
      />

      {/* Charts Section */}
      <ChartsSection
        chartData={currentChartData}
        selectedPeriod={selectedPeriod}
      />

      {/* Activity & Insights: Common Questions, Handovers, Unresolved Cases, Timeline */}
      <ActivityAndInsightsSection
        questions={overviewQ.data?.commonQuestions ?? []}
        handovers={overviewQ.data?.handoverReasons ?? []}
        unresolvedCases={overviewQ.data?.failedOrUnresolved ?? []}
        activities={overviewQ.data?.activities ?? []}
        onOpenInbox={() => onNavigate?.('inbox')}
        onOpenKnowledge={() => setIsAddKnowledgeOpen(true)}
      />

      {/* Modals */}
      <InviteTeammateModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={onInviteMember}
      />

      <AddKnowledgeModal
        isOpen={isAddKnowledgeOpen}
        onClose={() => setIsAddKnowledgeOpen(false)}
        onSuccess={handleKnowledgeAdded}
      />

      <PaymentGatewayModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        currency={activeTenantCurrency}
        currentBalance={currentBalance}
        pricePerMessage={pricePerMsg}
      />
    </div>
  );
};
