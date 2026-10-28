import React, { useState } from 'react';
import {
  DollarSign,
  PieChart,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Download,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { PlatformFinancialMetrics, TopSpendingTenant } from '../../types/platformAdmin';

interface UsageCostControlViewProps {
  metrics: PlatformFinancialMetrics;
  topTenants: TopSpendingTenant[];
  onUpdatePolicy: (policy: PlatformFinancialMetrics['anomalyProtectionPolicy']) => void;
}

export const UsageCostControlView: React.FC<UsageCostControlViewProps> = ({
  metrics,
  topTenants,
  onUpdatePolicy,
}) => {
  const [selectedPolicy, setSelectedPolicy] = useState(metrics.anomalyProtectionPolicy);
  const [isSaved, setIsSaved] = useState(false);

  const handleSavePolicy = () => {
    onUpdatePolicy(selectedPolicy);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Platform Margin & Financial Overview (Light Mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Billable Revenue */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Monthly Revenue
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ${metrics.totalMonthlyRevenueUSD.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tenant usage & platform billings collected</p>
        </div>

        {/* Raw Provider Cost */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Raw AI Provider Cost
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ${metrics.totalMonthlyProviderCostUSD.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">
              Avg ${(metrics.averageCostPerConversationUSD * 1000).toFixed(2)} / 1k msgs
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct token & API infrastructure expense</p>
        </div>

        {/* Platform Gross Margin */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Platform Gross Margin
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">
              {metrics.grossMarginPercent}%
            </span>
            <span className="text-xs font-medium text-slate-600">
              Net: ${(metrics.totalMonthlyRevenueUSD - metrics.totalMonthlyProviderCostUSD).toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Healthy unit economics across all tenants
          </p>
        </div>

        {/* Burn Rate */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Burn Rate
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.currentBurnRateTokensPerSec}
            </span>
            <span className="text-xs text-slate-500">tokens / sec</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {(metrics.totalTokensConsumed24h / 1_000_000).toFixed(1)}M tokens in past 24 hours
          </p>
        </div>
      </div>

      {/* Automated Anomaly & Loop Protection (Light Mode, No Plans/Quotas) */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Automated Anomaly & Runaway Loop Protection
              </h3>
              <p className="text-xs text-slate-500">
                Safety circuit breaker triggered if abnormal recursive token loops or upstream provider errors are detected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePolicy}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs shrink-0"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            {isSaved ? 'Policy Saved' : 'Save Policy'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {[
            {
              id: 'switch_to_fallback',
              title: 'Auto-Switch to Low-Cost Fallback',
              desc: 'Seamlessly reroutes to Gemini 2.5 Flash or Llama 3.3. Preserves customer experience without disruption.',
              recommended: true,
            },
            {
              id: 'safe_non_ai_message',
              title: 'Offline Staff Notification Template',
              desc: 'Sends a polite branded non-AI notification and notifies live agents to step in.',
              recommended: false,
            },
            {
              id: 'pause_automation',
              title: 'Temporary Ingestion Pause',
              desc: 'Pauses automated generation for the offending thread until administrator review.',
              recommended: false,
            },
          ].map((option) => (
            <label
              key={option.id}
              onClick={() => setSelectedPolicy(option.id as any)}
              className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                selectedPolicy === option.id
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="anomalyPolicy"
                      checked={selectedPolicy === option.id}
                      onChange={() => setSelectedPolicy(option.id as any)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      {option.title}
                    </span>
                  </div>
                  {option.recommended && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-5">
                  {option.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Top Consuming Tenants Table (Light Mode, No Plans/Quotas) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Top Consuming Tenants by Volume
            </h3>
            <p className="text-xs text-slate-500">
              Live consumption monitor tracking message throughput and infrastructure cost
            </p>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Tenant Business</th>
                <th className="px-4 py-3">Primary Model</th>
                <th className="px-4 py-3">Conversations</th>
                <th className="px-4 py-3">Token Volume</th>
                <th className="px-4 py-3 text-right">Raw Provider Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topTenants.map((t) => (
                <tr key={t.tenantId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">
                      {t.businessName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{t.tenantId}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Sparkles className="w-3 h-3 text-slate-400" />
                      {t.primaryModel}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-semibold text-slate-900">
                    {t.conversationsCount.toLocaleString()}
                  </td>

                  <td className="px-4 py-3.5 font-mono text-slate-700">
                    {(t.tokenCount / 1_000_000).toFixed(2)}M tokens
                  </td>

                  <td className="px-4 py-3.5 font-bold text-slate-900 text-right">
                    ${t.spendUSD.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
