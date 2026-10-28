import React, { useState } from 'react';
import {
  PlanDetails,
  UsageMetric,
  CostBreakdownComparison,
  InvoiceItem,
} from '../../types/billing';
import {
  CreditCard,
  Zap,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
  FileText,
  DollarSign,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

interface BillingUsageViewProps {
  plan: PlanDetails;
  metrics: UsageMetric[];
  costComparison: CostBreakdownComparison;
  invoices: InvoiceItem[];
  onUpgradePlan: () => void;
}

export const BillingUsageView: React.FC<BillingUsageViewProps> = ({
  plan,
  metrics,
  costComparison,
  invoices,
}) => {
  const { activeTenantCurrency, formatForActiveTenant } = useCurrency();
  const [showUSD, setShowUSD] = useState(false);

  return (
    <div className="space-y-6">
      {/* Account Infrastructure & Usage Status (Light Mode, No Plans/Quotas) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
              Account Status
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active · Unlimited Capacity & Zero Quotas
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">Dedicated Business Tenant</h3>
            <span className="text-slate-500 text-sm font-medium">
              ({showUSD ? `$${costComparison.clientBillableUSD.toFixed(2)}/mo` : `${formatForActiveTenant(costComparison.clientBillableUSD)}/mo`})
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            Uncapped conversation throughput across Facebook Messenger & WhatsApp Cloud API with full autonomous AI triage, live human staff takeover, and continuous vector memory.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowUSD(!showUSD)}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            Display Currency: {showUSD ? 'USD ($)' : `${activeTenantCurrency.code} (${activeTenantCurrency.symbol})`}
          </button>
        </div>
      </div>


      {/* TWO SEPARATE COST METRICS COMPARISON (Clean Light Mode) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold tracking-tight text-slate-900">
                Cost Transparency: Provider Cost vs. Platform Billable Usage
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly distinguishing raw underlying model token & infrastructure expense from client platform billing.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5" />
            Platform Margin: {costComparison.platformMarginPercent}%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metric 1: Provider Cost */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                1. Underlying Provider Cost (Actual Raw Tokens)
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {showUSD
                  ? `$${costComparison.providerCostUSD.toFixed(2)}`
                  : formatForActiveTenant(costComparison.providerCostUSD)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Total compute charges incurred by this tenant across Google Gemini API, OpenAI token completion, vector embeddings, and server worker threads.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Google Gemini (Flash 2.5):</span>
                <span className="font-mono font-medium text-slate-900">
                  {showUSD ? `$${costComparison.providerBreakdown.geminiCostUSD.toFixed(2)}` : formatForActiveTenant(costComparison.providerBreakdown.geminiCostUSD)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OpenAI Fallback (4o mini):</span>
                <span className="font-mono font-medium text-slate-900">
                  {showUSD ? `$${costComparison.providerBreakdown.openAICostUSD.toFixed(2)}` : formatForActiveTenant(costComparison.providerBreakdown.openAICostUSD)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vector Knowledge Embeddings:</span>
                <span className="font-mono font-medium text-slate-900">
                  {showUSD ? `$${costComparison.providerBreakdown.vectorEmbeddingCostUSD.toFixed(2)}` : formatForActiveTenant(costComparison.providerBreakdown.vectorEmbeddingCostUSD)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Server & Redis Queue Worker:</span>
                <span className="font-mono font-medium text-slate-900">
                  {showUSD ? `$${costComparison.providerBreakdown.infraComputeCostUSD.toFixed(2)}` : formatForActiveTenant(costComparison.providerBreakdown.infraComputeCostUSD)}
                </span>
              </div>
            </div>
          </div>

          {/* Metric 2: Client Billable Usage */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                2. Client Billable Usage (Platform Total)
              </span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {showUSD
                  ? `$${costComparison.clientBillableUSD.toFixed(2)}`
                  : formatForActiveTenant(costComparison.clientBillableUSD)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">

              Standard recurring platform service fee for managed AI autonomy, omnichannel unification, security, and human handover tooling.
            </p>
            <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Managed AI & Platform Infrastructure:</span>
                <span className="font-mono font-medium text-slate-900">
                  ${costComparison.clientBillingBreakdown.basePlanFeeUSD.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Connected Messenger & WhatsApp Endpoints:</span>
                <span className="font-mono font-medium text-slate-900">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Continuous Vector Index & Memory:</span>
                <span className="font-mono font-medium text-slate-900">Included</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Net Platform Margin:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  ${(costComparison.clientBillableUSD - costComparison.providerCostUSD).toFixed(2)} ({costComparison.platformMarginPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Volume Consumption (No Limits or Quotas) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 text-sm">Monthly Volume & Consumption Monitor</p>
            <p className="text-slate-500 text-xs">
              Current billing period cycle: Oct 01 - Oct 31, 2026. Zero conversation caps or hard limits.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            Uncapped Volume
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Conversations Handled</span>
            <span className="text-xl font-bold text-slate-900">12,480</span>
            <span className="text-[11px] text-slate-500 block">autonomous customer threads</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Messages Processed</span>
            <span className="text-xl font-bold text-slate-900">48,920</span>
            <span className="text-[11px] text-slate-500 block">inbound & outbound turns</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Channels</span>
            <span className="text-xl font-bold text-slate-900">3 Channels</span>
            <span className="text-[11px] text-slate-500 block">1 Messenger, 2 WhatsApp</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Team Seats</span>
            <span className="text-xl font-bold text-slate-900">4 Active</span>
            <span className="text-[11px] text-slate-500 block">agents & administrators</span>
          </div>
        </div>
      </div>

      {/* Invoices History (Light Mode) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">Invoices & Receipts</p>
          </div>
          <span className="text-[11px] text-slate-500">Auto-billed on 1st of every month</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200 text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-2.5">Invoice #</th>
                <th className="px-5 py-2.5">Billing Period</th>
                <th className="px-5 py-2.5">Payment Method</th>
                <th className="px-5 py-2.5">Amount</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-slate-600">{inv.billingPeriod}</td>
                  <td className="px-5 py-3 text-slate-600">{inv.paymentMethod}</td>
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">
                    {showUSD ? `$${inv.amountUSD.toFixed(2)}` : formatForActiveTenant(inv.amountUSD)}
                  </td>

                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paid
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
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
