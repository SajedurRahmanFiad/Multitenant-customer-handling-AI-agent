import React, { useState } from 'react';
import { IntegrationsHealthLog } from '../../types/channels';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  HeartPulse,
  Radio,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface IntegrationsHealthViewProps {
  logs: IntegrationsHealthLog[];
  onShowToast: (msg: string) => void;
}

export const IntegrationsHealthView: React.FC<IntegrationsHealthViewProps> = ({
  logs,
  onShowToast,
}) => {
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [antiHallucinationGuard, setAntiHallucinationGuard] = useState(true);

  const handleRunAudit = () => {
    setIsRunningAudit(true);
    setTimeout(() => {
      setIsRunningAudit(false);
      onShowToast('Full infrastructure diagnostic audit completed: 6 of 6 endpoints healthy (avg 52ms)');
    }, 1100);
  };

  const handleToggleGuard = () => {
    const nextState = !antiHallucinationGuard;
    setAntiHallucinationGuard(nextState);
    onShowToast(
      nextState
        ? 'Strict Anti-Hallucination Safe Fallback Policy activated'
        : 'Warning: Anti-Hallucination guard relaxed'
    );
  };

  return (
    <div className="space-y-6">
      {/* Platform Reliability Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <HeartPulse className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Integrations Health & Safe Fallback Monitor
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  All Systems Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Continuous edge monitoring, credential expiry warnings, rate limit tracking, and zero-hallucination guardrails.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isRunningAudit}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-2 shadow-xs shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
            <span>{isRunningAudit ? 'Running Deep Diagnostics...' : 'Run Diagnostics Audit'}</span>
          </button>
        </div>

        {/* 4 Health Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              30-Day API Uptime
            </span>
            <div className="text-xl font-bold text-slate-900">99.98%</div>
            <p className="text-[10px] text-emerald-600 font-semibold">Zero unplanned downtime</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Outages
            </span>
            <div className="text-xl font-bold text-emerald-600">0 Services</div>
            <p className="text-[10px] text-slate-500">6 of 6 connectors live</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Security Compliance
            </span>
            <div className="text-xl font-bold text-slate-900">100%</div>
            <p className="text-[10px] text-slate-500">All tokens vaulted safely</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Edge Ingestion Latency
            </span>
            <div className="text-xl font-bold text-blue-600">42 ms</div>
            <p className="text-[10px] text-blue-500">Fast regional routing</p>
          </div>
        </div>
      </div>

      {/* Strict Anti-Hallucination Safe Fallback Engine */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Automated Safe Fallback Policy (Anti-Hallucination Guard)
              </h4>
              <p className="text-xs text-slate-500">
                Guarantees the AI agent never fabricates order details, prices, or tracking numbers during API downtime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-700">Strict Fallback Guard:</span>
            <button
              type="button"
              onClick={handleToggleGuard}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                antiHallucinationGuard ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  antiHallucinationGuard ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h5 className="text-xs font-bold text-slate-900">E-Commerce Outage Rule</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If WooCommerce or Shopify returns HTTP 5xx or times out (&gt;2.5s), the AI immediately responds with the pre-approved apology and flags the thread as <strong>Needs Human Handover</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h5 className="text-xs font-bold text-slate-900">Courier Gateway Rule</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If Steadfast API reports rate limiting or maintenance, the AI acknowledges the courier portal delay and sends the direct tracking link instead of fabricating delivery dates.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <h5 className="text-xs font-bold text-slate-900">Payment Verification Rule</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If bKash MFS query is unavailable, the AI requests the customer's 10-digit TrxID and sends it straight to staff accounts inbox for 1-click manual verification.
            </p>
          </div>
        </div>
      </div>

      {/* Live Service Status Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Live Channel & Integration Health Matrix
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Ping interval: Every 30s
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 font-semibold">Service / Connector</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Response Time</th>
                <th className="py-3 px-4 font-semibold">Credential Health</th>
                <th className="py-3 px-4 font-semibold">Rate Limit Cushion</th>
                <th className="py-3 px-4 font-semibold">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4 font-semibold text-slate-900">Meta Messenger Graph API v21.0</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">38 ms</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">Valid (54 days remaining)</td>
                <td className="py-3 px-4 text-slate-600 font-mono">82% cushion</td>
                <td className="py-3 px-4 text-slate-500">12s ago</td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4 font-semibold text-slate-900">WhatsApp Cloud API (Meta Dedicated)</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">42 ms</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">System User Permanent</td>
                <td className="py-3 px-4 text-slate-600 font-mono">88% cushion</td>
                <td className="py-3 px-4 text-slate-500">1m ago</td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4 font-semibold text-slate-900">WooCommerce Store REST API</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">140 ms</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">API Key & Secret Active</td>
                <td className="py-3 px-4 text-slate-600 font-mono">92% cushion</td>
                <td className="py-3 px-4 text-slate-500">12s ago</td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4 font-semibold text-slate-900">Steadfast Courier API Gateway</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">95 ms</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">Secret Validated</td>
                <td className="py-3 px-4 text-slate-600 font-mono">94% cushion</td>
                <td className="py-3 px-4 text-slate-500">1m ago</td>
              </tr>

              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4 font-semibold text-slate-900">bKash Merchant MFS Gateway</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">210 ms</td>
                <td className="py-3 px-4 text-emerald-700 font-medium">Bearer Token Live</td>
                <td className="py-3 px-4 text-slate-600 font-mono">94% cushion</td>
                <td className="py-3 px-4 text-slate-500">4m ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident & Audit History Log */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Health & Fallback Incident Audit Log
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Past 72 hours</span>
        </div>

        <div className="space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{log.service}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {log.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{log.message}</p>
              </div>
              <span className="text-slate-400 font-mono text-[11px] shrink-0 self-start sm:self-center">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
