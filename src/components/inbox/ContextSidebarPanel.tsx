import React, { useState } from 'react';
import {
  Conversation,
  PriorityType,
} from '../../types/inbox';
import {
  X,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ArrowRightLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface ContextSidebarPanelProps {
  conversation: Conversation;
  onUpdatePriority: (p: PriorityType) => void;
  onUpdateAssignedStaff: (staff: string | null) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onOpenTransferModal: () => void;
  onCloseMobileDrawer?: () => void;
  isMobile?: boolean;
}

const STAFF_LIST = ['Rafiq Islam', 'Nusrat Jahan', 'Tanvir Ahmed', 'Sajedur Rahman'];

export const ContextSidebarPanel: React.FC<ContextSidebarPanelProps> = ({
  conversation,
  onUpdatePriority,
  onUpdateAssignedStaff,
  onAddTag,
  onRemoveTag,
  onOpenTransferModal,
  onCloseMobileDrawer,
  isMobile,
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const customer = conversation.customer;

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    onAddTag(newTagInput.trim());
    setNewTagInput('');
    setIsAddingTag(false);
  };

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
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
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
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{customer.city}</span>
            </div>
          </div>

          {/* Persistent Customer Memory */}
          {customer.memoryNotes && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                AI Customer Memory
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans break-words whitespace-normal">
                {customer.memoryNotes}
              </p>
            </div>
          )}
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

          {/* Staff Assignment Dropdown */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
              Assigned Staff Member
            </label>
            <select
              value={conversation.assignedStaff || ''}
              onChange={(e) => onUpdateAssignedStaff(e.target.value || null)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            >
              <option value="">Unassigned</option>
              {STAFF_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Department Button */}
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Department: {conversation.assignedTeam || 'General'}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
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

        {/* Retrieved Knowledge for this Conversation */}
        {conversation.retrievedSources && conversation.retrievedSources.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Retrieved Knowledge Sources
            </span>

            <div className="space-y-2">
              {conversation.retrievedSources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="truncate pr-2">{src.title}</span>
                    <span className="text-[10px] font-mono text-emerald-700 shrink-0">
                      {(src.score * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans break-words whitespace-normal line-clamp-4">
                    "{src.snippet}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Conversation Tags */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Conversation Tags
            </span>
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {conversation.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTag(t)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {isAddingTag && (
            <form onSubmit={handleAddTagSubmit} className="flex gap-1 pt-1">
              <input
                type="text"
                autoFocus
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="e.g. VIP, Return"
                className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Save
              </button>
            </form>
          )}
        </div>
      </div>
    </aside>
  );
};
