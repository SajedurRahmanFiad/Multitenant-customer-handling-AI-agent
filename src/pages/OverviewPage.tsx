import React, { useState } from 'react';
import { PageId } from '../types/navigation';
import { TimePeriod, TopStatusData } from '../types/overview';
import {
  initialStatusData,
  metricsByPeriod,
  chartDataByPeriod,
  commonCustomerQuestions,
  handoverReasons,
  failedOrUnresolvedCases,
  recentActivities,
} from '../data/overviewMockData';
import { TopStatusSection } from '../components/overview/TopStatusSection';
import { PerformanceCards } from '../components/overview/PerformanceCards';
import { ChartsSection } from '../components/overview/ChartsSection';
import { ActivityAndInsightsSection } from '../components/overview/ActivityAndInsightsSection';
import { QuickActionsBar } from '../components/overview/QuickActionsBar';
import { TestAgentModal } from '../components/overview/TestAgentModal';
import { InviteTeammateModal } from '../components/overview/InviteTeammateModal';
import { AddKnowledgeModal } from '../components/overview/AddKnowledgeModal';
import { CheckCircle2, Users, AlertCircle, TrendingUp, Wallet, Plus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { PaymentGatewayModal } from '../components/billing/PaymentGatewayModal';

interface OverviewPageProps {
  onNavigate?: (page: PageId) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('24h');
  const [statusData, setStatusData] = useState<TopStatusData>(initialStatusData);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddKnowledgeOpen, setIsAddKnowledgeOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    activeTenantCurrency,
    getTenantBalance,
    getTenantPricePerMessage,
    rechargeTenantBalance,
    deductMessageBalance,
    formatRawAmount,
  } = useCurrency();

  const currentBalance = getTenantBalance();
  const pricePerMsg = getTenantPricePerMessage();
  const estimatedRemainingMessages = pricePerMsg > 0 ? Math.floor(currentBalance / pricePerMsg) : 0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleAgentStatus = () => {
    const nextStatus = statusData.agentStatus === 'Active' ? 'Paused' : 'Active';
    setStatusData((prev) => ({
      ...prev,
      agentStatus: nextStatus,
    }));
    showToast(
      nextStatus === 'Active'
        ? 'AI Agent resumed and actively answering customers'
        : 'AI Agent paused. Inbound messages will route to human inbox'
    );
  };

  const handleKnowledgeAdded = (title: string) => {
    setStatusData((prev) => ({
      ...prev,
      indexedDocsCount: prev.indexedDocsCount + 1,
    }));
    showToast(`"${title}" added and queued for vector embedding`);
  };

  const currentMetrics = metricsByPeriod[selectedPeriod];
  const currentChartData = chartDataByPeriod[selectedPeriod];

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
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Agent Status</span>
          </div>
          <div className="my-2">
            <div className="text-sm font-bold text-slate-900">
              {statusData.agentStatus === 'Active' ? 'Active & Healthy' : 'Currently Paused'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Messenger & WhatsApp webhooks operational
            </p>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold font-mono">
            Avg reply 1.4s · 0 outages
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
              {currentMetrics[0].value} conversations
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              High volume around delivery inquiries
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {currentMetrics[1].value} messages exchanged
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

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100">
            <span>Capacity: ~{estimatedRemainingMessages.toLocaleString()} msgs</span>
            <button
              type="button"
              onClick={() => {
                const res = deductMessageBalance();
                if (res.success) {
                  showToast(
                    `Simulated AI reply: Deducted ${formatRawAmount(res.deducted, activeTenantCurrency.code)} (New bal: ${formatRawAmount(res.newBalance, activeTenantCurrency.code)})`
                  );
                } else {
                  showToast('Insufficient wallet balance! Please recharge.');
                }
              }}
              title="Test real-time deduction of 1 AI reply message"
              className="text-slate-600 hover:text-slate-900 hover:underline font-sans font-medium"
            >
              Test Deduct
            </button>
          </div>
        </div>
      </section>

      {/* Top Status Section */}
      <TopStatusSection
        status={statusData}
        onToggleAgentStatus={handleToggleAgentStatus}
        onOpenTest={() => setIsTestOpen(true)}
      />

      {/* Quick Actions Bar */}
      <QuickActionsBar
        isAgentActive={statusData.agentStatus === 'Active'}
        unansweredCount={statusData.unansweredCount}
        onToggleAgentStatus={handleToggleAgentStatus}
        onOpenUnanswered={() => onNavigate?.('inbox')}
        onTestAgent={() => setIsTestOpen(true)}
        onAddKnowledge={() => setIsAddKnowledgeOpen(true)}
        onConnectChannel={() => onNavigate?.('channels')}
        onInviteTeammate={() => setIsInviteOpen(true)}
      />

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
        questions={commonCustomerQuestions}
        handovers={handoverReasons}
        unresolvedCases={failedOrUnresolvedCases}
        activities={recentActivities}
        onOpenInbox={() => onNavigate?.('inbox')}
        onOpenKnowledge={() => setIsAddKnowledgeOpen(true)}
      />

      {/* Modals */}
      <TestAgentModal
        isOpen={isTestOpen}
        onClose={() => setIsTestOpen(false)}
      />

      <InviteTeammateModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <AddKnowledgeModal
        isOpen={isAddKnowledgeOpen}
        onClose={() => setIsAddKnowledgeOpen(false)}
        onSuccess={handleKnowledgeAdded}
      />

      <PaymentGatewayModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onConfirmRecharge={(amount, gateway, trxId) => {
          showToast(
            `Wallet successfully recharged with ${formatRawAmount(amount, activeTenantCurrency.code)} via ${gateway.toUpperCase()} (Trx: ${trxId})!`
          );
        }}
      />
    </div>
  );
};
