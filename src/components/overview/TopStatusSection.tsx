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
}

export const TopStatusSection: React.FC<TopStatusSectionProps> = ({
  status,
  onToggleAgentStatus,
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

        {/* Right: Quick Operational Toggle */}
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
        </div>
      </div>
    </section>
  );
};
