import React from 'react';
import {
  TopStatusData,
  AgentStatusType,
  ConnectionStatusType,
  KnowledgeStatusType,
} from '../../types/overview';
import {
  Play,
  Pause,
  MessageCircle,
  PhoneCall,
  Database,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface TopStatusSectionProps {
  status: TopStatusData;
  onToggleAgentStatus: () => void;
  onOpenTest: () => void;
}

export const TopStatusSection: React.FC<TopStatusSectionProps> = ({
  status,
  onToggleAgentStatus,
  onOpenTest,
}) => {
  const isAgentActive = status.agentStatus === 'Active';

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-5 border-b border-slate-100">
        {/* Left: Primary Agent Operational State */}
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isAgentActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            {isAgentActive ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Pause className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Agent Status
              </span>
              <span
                className={`text-xs font-semibold ${
                  isAgentActive ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {status.agentStatus}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {isAgentActive
                ? 'AI Agent is actively responding to customers'
                : 'AI Agent is paused — staff must handle incoming inquiries'}
            </h2>
          </div>
        </div>

        {/* Right: Quick Operational Toggles */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleAgentStatus}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border flex items-center gap-2 transition-colors ${
              isAgentActive
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isAgentActive ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Agent</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Agent</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTest}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Test Simulator
          </button>
        </div>
      </div>

      {/* Sub-status Strip: Messenger, WhatsApp, Knowledge Base, Provider & Quota */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
        {/* Messenger */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              Facebook Messenger
            </div>
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <span>{status.messengerStatus}</span>
              <span className="text-[10px] text-slate-400 font-normal">· Webhook live</span>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              WhatsApp Business
            </div>
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <span>{status.whatsAppStatus}</span>
              <span className="text-[10px] text-slate-400 font-normal">· Cloud API</span>
            </div>
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              Knowledge Base
            </div>
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <span>{status.knowledgeStatus}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                · {status.indexedDocsCount} docs indexed
              </span>
            </div>
          </div>
        </div>

        {/* AI Provider & Usage Limits */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              AI Provider & Limits
            </div>
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <span>{status.aiProvider}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                · {status.quotaUsedPercent}% daily quota
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
