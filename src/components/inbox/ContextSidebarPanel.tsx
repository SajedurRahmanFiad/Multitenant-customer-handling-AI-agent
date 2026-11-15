import React, { useState } from 'react';
import {
  Conversation,
  PriorityType,
} from '../../types/inbox';
import {
  X,
  AlertCircle,
  Phone,
  MapPin,
} from 'lucide-react';

interface ContextSidebarPanelProps {
  conversation: Conversation;
  onUpdatePriority: (p: PriorityType) => void;
  onCloseMobileDrawer?: () => void;
  isMobile?: boolean;
}

export const ContextSidebarPanel: React.FC<ContextSidebarPanelProps> = ({
  conversation,
  onUpdatePriority,
  onCloseMobileDrawer,
  isMobile,
}) => {
  const customer = conversation.customer;

  return (
    <aside className="w-full h-full bg-white flex flex-col shrink-0 overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Customer & AI Context
        </h3>
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-5 overflow-y-auto overflow-x-hidden flex-1">
        {/* Customer Profile Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {customer.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {customer.name}
              </h4>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {customer.externalId}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{customer.city}</span>
            </div>
          </div>
        </div>

        {/* Essential Conversation Controls */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Conversation Controls
          </span>

          {/* Priority Picker */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['urgent', 'high', 'medium', 'low'] as PriorityType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onUpdatePriority(p)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-xl capitalize border text-center transition-colors ${
                    conversation.priority === p
                      ? p === 'urgent'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : p === 'high'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* AI Operational Decision */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            AI Operational Decision
          </span>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-semibold">
              <span className="text-slate-600">Agent Thread State</span>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-md ${
                  conversation.aiStatus === 'human_controlled'
                    ? 'bg-amber-100 text-amber-900'
                    : conversation.aiStatus === 'paused'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {conversation.aiStatus === 'human_controlled'
                  ? 'Human Controlled'
                  : conversation.aiStatus === 'paused'
                  ? 'Paused'
                  : 'Active'}
              </span>
            </div>

            {conversation.handoverReason && (
              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wider">
                  <AlertCircle className="w-3 h-3" />
                  Escalation Trigger
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans break-words whitespace-normal">
                  {conversation.handoverReason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Orders & Business Details */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Recent Order
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {customer.totalSpent} total
            </span>
          </div>

          {customer.lastOrder ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-900 font-mono">{customer.lastOrder.id}</span>
                <span className="text-emerald-700">{customer.lastOrder.amount}</span>
              </div>
              <p className="text-slate-600 font-medium text-[11px] break-words whitespace-normal">
                {customer.lastOrder.items}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-200/60">
                <span>{customer.lastOrder.status}</span>
                <span>{customer.lastOrder.date}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No previous orders recorded.</p>
          )}
        </div>

      </div>
    </aside>
  );
};
