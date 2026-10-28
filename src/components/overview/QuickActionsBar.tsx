import React from 'react';
import {
  Play,
  Pause,
  Inbox,
  Bot,
  BookPlus,
  Share2,
  UserPlus,
} from 'lucide-react';

interface QuickActionsBarProps {
  isAgentActive: boolean;
  unansweredCount: number;
  onToggleAgentStatus: () => void;
  onOpenUnanswered: () => void;
  onTestAgent: () => void;
  onAddKnowledge: () => void;
  onConnectChannel: () => void;
  onInviteTeammate: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  isAgentActive,
  unansweredCount,
  onToggleAgentStatus,
  onOpenUnanswered,
  onTestAgent,
  onAddKnowledge,
  onConnectChannel,
  onInviteTeammate,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Quick Actions
        </h3>
        <p className="text-xs text-slate-500 font-normal">
          Immediate shortcuts to control and configure your customer operations
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Pause / Resume */}
        <button
          type="button"
          onClick={onToggleAgentStatus}
          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 group ${
            isAgentActive
              ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
              : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
              isAgentActive
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isAgentActive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {isAgentActive ? 'Pause Agent' : 'Resume Agent'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {isAgentActive ? 'Halt auto-replies' : 'Turn AI on'}
            </div>
          </div>
        </button>

        {/* 2. Open Unanswered Conversations */}
        <button
          type="button"
          onClick={onOpenUnanswered}
          className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 text-left flex flex-col justify-between transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-2 relative">
            <Inbox className="w-4 h-4" />
            {unansweredCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unansweredCount}
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Unanswered Chats
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {unansweredCount} waiting for staff
            </div>
          </div>
        </button>

        {/* 3. Test the Agent */}
        <button
          type="button"
          onClick={onTestAgent}
          className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 text-left flex flex-col justify-between transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-2">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Test Agent
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Simulate customer chat
            </div>
          </div>
        </button>

        {/* 4. Add Knowledge Source */}
        <button
          type="button"
          onClick={onAddKnowledge}
          className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 text-left flex flex-col justify-between transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-2">
            <BookPlus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Add Knowledge
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Upload policies & FAQs
            </div>
          </div>
        </button>

        {/* 5. Connect Another Channel */}
        <button
          type="button"
          onClick={onConnectChannel}
          className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 text-left flex flex-col justify-between transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-2">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Connect Channel
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              WhatsApp, Meta, CRM
            </div>
          </div>
        </button>

        {/* 6. Invite Teammate */}
        <button
          type="button"
          onClick={onInviteTeammate}
          className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 text-left flex flex-col justify-between transition-all duration-200 group"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center mb-2">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Invite Teammate
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Add staff for takeover
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
