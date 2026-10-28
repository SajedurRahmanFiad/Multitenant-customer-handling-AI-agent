import React from 'react';
import { UsageAnalyticsOverview } from '../../types/analytics';
import {
  TrendingUp,
  DollarSign,
  Cpu,
  CheckCircle2,
  Clock,
  Download,
  Users,
  PieChart,
  BarChart3,
  Scale,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';


interface UsageCostAnalyticsViewProps {
  analytics: UsageAnalyticsOverview;
  onShowToast: (msg: string) => void;
}

export const UsageCostAnalyticsView: React.FC<UsageCostAnalyticsViewProps> = ({
  analytics,
  onShowToast,
}) => {
  const { formatForActiveTenant, activeTenantCurrency } = useCurrency();

  const handleExportCsv = () => {
    onShowToast('Usage and token billing ledger exported as CSV');
  };

  const maxDailyTokens = Math.max(...analytics.dailyUsageTrend.map((d) => d.tokens));

  return (
    <div className="space-y-6">
      {/* 5 Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Estimated Cost ({activeTenantCurrency.code})
          </span>
          <div className="text-xl font-bold text-slate-900">
            {formatForActiveTenant(analytics.estimatedCostMonthUsd)}
          </div>
          <p className="text-[10px] text-slate-500">
            Today: ~{formatForActiveTenant(analytics.estimatedCostTodayUsd)} (${analytics.estimatedCostTodayUsd.toFixed(2)} USD)
          </p>
        </div>


        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Monthly Tokens
          </span>
          <div className="text-xl font-bold text-blue-700">
            {(analytics.totalTokensMonthly / 1000000).toFixed(1)}M
          </div>
          <p className="text-[10px] text-slate-500">Today: {analytics.totalTokensToday.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Resolution Rate
          </span>
          <div className="text-xl font-bold text-emerald-700">
            {analytics.aiResolutionRate}%
          </div>
          <p className="text-[10px] text-emerald-600 font-medium">Without human intervention</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">
            Staff Time Saved
          </span>
          <div className="text-xl font-bold text-purple-700">
            {analytics.humanHandoversSaved} Cases
          </div>
          <p className="text-[10px] text-slate-500">Auto-resolved inquiries</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1 col-span-2 md:col-span-1">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Average Speed
          </span>
          <div className="text-xl font-bold text-amber-700">
            {analytics.averageResponseTimeMs} ms
          </div>
          <p className="text-[10px] text-slate-500">Edge inference turnaround</p>
        </div>
      </div>

      {/* Two-Column: 7-Day Trend vs Model Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Volume Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Daily Token Volume & Conversations Trend
              </h4>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-7 gap-2.5 sm:gap-4 items-end h-44 border-b border-slate-100 pb-3">
              {analytics.dailyUsageTrend.map((day) => {
                const heightPercent = Math.round((day.tokens / maxDailyTokens) * 100);
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-mono text-slate-400 group-hover:text-slate-900 transition">
                      ${day.costUsd.toFixed(2)}
                    </div>
                    <div
                      className="w-full max-w-[42px] bg-blue-500 hover:bg-blue-600 rounded-t-xl transition-all relative group-hover:shadow-md cursor-pointer"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                        {day.conversations} convs
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 font-mono">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Token consumption scaled against 1.5M daily budget</span>
              <span>Average daily cost: $1.49 USD</span>
            </div>
          </div>
        </div>

        {/* Right: Model Distribution Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Model Cost Distribution
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">Past 30 Days</span>
          </div>

          <div className="space-y-3.5">
            {analytics.modelUsageBreakdown.map((m) => (
              <div key={m.modelName} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                    {m.modelName}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-500">{m.percentage}%</span>
                    <strong className="text-slate-900">${m.costUsd.toFixed(2)}</strong>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">
                  {m.requestsCount.toLocaleString()} requests fulfilled
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">Cost Optimization Insight</span>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Automatic model routing directed 54% of customer volume to Flash-Lite, saving approximately <strong>$68.40 USD</strong> this month compared to single-tier models.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
