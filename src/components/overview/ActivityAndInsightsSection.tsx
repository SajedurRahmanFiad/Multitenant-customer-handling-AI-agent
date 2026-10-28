import React from 'react';
import {
  CustomerQuestionStat,
  HandoverReasonStat,
  FailedOrUnresolvedItem,
  ActivityLogItem,
} from '../../types/overview';
import {
  HelpCircle,
  ArrowRightLeft,
  AlertTriangle,
  History,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Volume2,
} from 'lucide-react';

interface ActivityAndInsightsSectionProps {
  questions: CustomerQuestionStat[];
  handovers: HandoverReasonStat[];
  unresolvedCases: FailedOrUnresolvedItem[];
  activities: ActivityLogItem[];
  onOpenInbox: () => void;
  onOpenKnowledge: () => void;
}

export const ActivityAndInsightsSection: React.FC<ActivityAndInsightsSectionProps> = ({
  questions,
  handovers,
  unresolvedCases,
  activities,
  onOpenInbox,
  onOpenKnowledge,
}) => {
  return (
    <div className="space-y-6">
      {/* 2-Column: Common Questions + Handover Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Customer Questions */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Most Common Customer Questions
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Frequent customer intents and AI success rates
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenKnowledge}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                <span>Add FAQs</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {questions.map((q) => (
                <div key={q.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{q.category}</span>
                      <span>·</span>
                      <span className="font-mono">{q.count} occurrences</span>
                      <span>·</span>
                      <span>{q.channel}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-emerald-700">
                      {q.resolvedByAiPercent}%
                    </span>
                    <div className="text-[10px] text-slate-400">Auto-resolved</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Handover Reasons */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Handover Reasons
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Triggers transferring conversations from AI to staff
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {handovers.reduce((acc, h) => acc + h.count, 0)} total
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {handovers.map((h) => (
                <div key={h.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                    <span className="truncate pr-2">{h.reason}</span>
                    <span className="font-mono shrink-0 font-semibold text-slate-900">
                      {h.count} ({h.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${h.percentage}%` }}
                      className="h-full bg-slate-800 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Rules can be customized in Agent Configuration to adjust escalation sensitivity.
          </div>
        </div>
      </div>

      {/* 2-Column: Failed & Unresolved Cases + Recent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failed Responses & Unresolved Conversations */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Cases Waiting for Attention
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Failed responses and unanswered customer threads
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenInbox}
                className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
              >
                <span>Open Inbox</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {unresolvedCases.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        · {item.channel}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 italic bg-white p-2 rounded-xl border border-slate-100">
                    "{item.snippet}"
                  </p>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-rose-600 font-medium flex items-center gap-1">
                      {item.status === 'Failed Audio' ? (
                        <Volume2 className="w-3 h-3" />
                      ) : (
                        <MessageSquare className="w-3 h-3" />
                      )}
                      {item.reason}
                    </span>
                    <button
                      type="button"
                      onClick={onOpenInbox}
                      className="text-xs font-semibold text-slate-900 hover:text-slate-700"
                    >
                      Take Over →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Audit trail of staff takeovers, webhooks, and knowledge updates
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{act.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-[11px]">
                      {act.description}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      By: <span className="font-medium text-slate-600">{act.actor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            All handovers and system events are logged for QA compliance.
          </div>
        </div>
      </div>
    </div>
  );
};
