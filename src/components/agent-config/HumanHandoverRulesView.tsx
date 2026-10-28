import React, { useState } from 'react';
import { HandoverRule } from '../../types/agentConfig';
import {
  ArrowRightLeft,
  Plus,
  AlertTriangle,
  ShieldAlert,
  Bell,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Sliders,
  Send,
  Users,
  Info,
} from 'lucide-react';

interface HumanHandoverRulesViewProps {
  rules: HandoverRule[];
  onAddRule: (newRule: Omit<HandoverRule, 'id'>) => void;
  onUpdateRule: (updatedRule: HandoverRule) => void;
  onDeleteRule: (id: string) => void;
}

const DESTINATION_TEAMS: HandoverRule['destinationTeam'][] = [
  'General Support',
  'Sales Escalation',
  'Billing & Claims',
  'Senior Ops',
];

const NOTIFICATION_CHANNELS = [
  { id: 'in_app' as const, label: 'In-App Inbox' },
  { id: 'slack' as const, label: 'Slack Webhook' },
  { id: 'telegram' as const, label: 'Telegram Bot' },
  { id: 'sms' as const, label: 'SMS Notification' },
  { id: 'email' as const, label: 'Email Alert' },
];

export const HumanHandoverRulesView: React.FC<HumanHandoverRulesViewProps> = ({
  rules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<HandoverRule | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<HandoverRule['triggerType']>('customer_request');
  const [priority, setPriority] = useState<HandoverRule['priority']>('high');
  const [destinationTeam, setDestinationTeam] = useState<HandoverRule['destinationTeam']>('General Support');
  const [handoverMessage, setHandoverMessage] = useState('');
  const [notificationChannels, setNotificationChannels] = useState<HandoverRule['notificationChannels']>([
    'in_app',
    'slack',
  ]);
  const [pauseAiImmediately, setPauseAiImmediately] = useState(true);
  const [requireExplicitResume, setRequireExplicitResume] = useState(true);
  const [confidenceThresholdPercent, setConfidenceThresholdPercent] = useState<number>(65);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTriggerType('customer_request');
    setPriority('high');
    setDestinationTeam('General Support');
    setHandoverMessage('আমি আপনাকে এখনই আমাদের একজন সাপোর্ট এজেন্টের সাথে যুক্ত করে দিচ্ছি।');
    setNotificationChannels(['in_app', 'slack']);
    setPauseAiImmediately(true);
    setRequireExplicitResume(true);
    setConfidenceThresholdPercent(65);
    setEditingRule(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rule: HandoverRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setDescription(rule.description);
    setTriggerType(rule.triggerType);
    setPriority(rule.priority);
    setDestinationTeam(rule.destinationTeam);
    setHandoverMessage(rule.handoverMessage);
    setNotificationChannels(rule.notificationChannels);
    setPauseAiImmediately(rule.pauseAiImmediately);
    setRequireExplicitResume(rule.requireExplicitResume);
    setConfidenceThresholdPercent(rule.confidenceThresholdPercent || 65);
    setIsAddModalOpen(true);
  };

  const handleToggleChannel = (ch: HandoverRule['notificationChannels'][number]) => {
    if (notificationChannels.includes(ch)) {
      if (notificationChannels.length > 1) {
        setNotificationChannels(notificationChannels.filter((c) => c !== ch));
      }
    } else {
      setNotificationChannels([...notificationChannels, ch]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingRule) {
      onUpdateRule({
        ...editingRule,
        name: name.trim(),
        description: description.trim(),
        triggerType,
        priority,
        destinationTeam,
        handoverMessage: handoverMessage.trim(),
        notificationChannels,
        pauseAiImmediately,
        requireExplicitResume,
        confidenceThresholdPercent: triggerType === 'low_confidence' ? confidenceThresholdPercent : undefined,
      });
    } else {
      onAddRule({
        name: name.trim(),
        description: description.trim(),
        triggerType,
        priority,
        destinationTeam,
        handoverMessage: handoverMessage.trim(),
        notificationChannels,
        pauseAiImmediately,
        requireExplicitResume,
        confidenceThresholdPercent: triggerType === 'low_confidence' ? confidenceThresholdPercent : undefined,
        isActive: true,
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleToggleActive = (rule: HandoverRule) => {
    onUpdateRule({
      ...rule,
      isActive: !rule.isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Add Rule button */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Human Handover & Escalation Protocols</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Define clear triggers when the AI must yield control to human staff. Avoid pure sentiment heuristics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Handover Trigger</span>
        </button>
      </div>

      {/* Semantic Guidance Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Multi-Factor Escalation Architecture:</span>
          <p className="text-[11px] leading-relaxed text-indigo-800">
            Rules evaluate semantic meaning, explicit customer intent, verification failures (e.g. invalid bKash transaction IDs), and policy thresholds rather than superficial heuristics like uppercase letters.
          </p>
        </div>
      </div>

      {/* Handover Rules List */}
      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-3xl border transition-all bg-white shadow-2xs space-y-3 ${
              rule.isActive ? 'border-slate-200/90' : 'border-slate-200/50 opacity-60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{rule.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    rule.priority === 'urgent'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : rule.priority === 'high'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {rule.priority} Priority
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  Route to: {rule.destinationTeam}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(rule)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    rule.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rule)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600">{rule.description}</p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Automated Customer Handover Message
              </span>
              <p className="font-sans italic">"{rule.handoverMessage}"</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">Notifications:</span>
                <div className="flex items-center gap-1">
                  {rule.notificationChannels.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 capitalize font-mono text-[10px]"
                    >
                      {c.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {rule.pauseAiImmediately && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Auto-pause AI
                  </span>
                )}
                {rule.requireExplicitResume && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                    Requires staff release
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Handover Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingRule ? 'Edit Handover Rule' : 'New Human Handover Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Customer Dispute"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trigger Description / Condition *
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="When does this rule execute?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Trigger Category
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="customer_request">Customer Explicit Request</option>
                    <option value="sentiment_frustration">Grievance & Dissatisfaction</option>
                    <option value="missing_knowledge">Missing Information</option>
                    <option value="refund_exception">Refund Exception</option>
                    <option value="payment_conflict">Payment TRXID Conflict</option>
                    <option value="legal_privacy">Legal / Security Issue</option>
                    <option value="low_confidence">Low Confidence Threshold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Destination Team
                </label>
                <select
                  value={destinationTeam}
                  onChange={(e) => setDestinationTeam(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  {DESTINATION_TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Handover Notification Message *
                </label>
                <textarea
                  rows={2}
                  required
                  value={handoverMessage}
                  onChange={(e) => setHandoverMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Notification Dispatch Methods
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTIFICATION_CHANNELS.map((ch) => {
                    const isChecked = notificationChannels.includes(ch.id);
                    return (
                      <label
                        key={ch.id}
                        onClick={() => handleToggleChannel(ch.id)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center gap-2 ${
                          isChecked
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-slate-900 focus:ring-0"
                        />
                        <span>{ch.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pauseAiImmediately}
                    onChange={(e) => setPauseAiImmediately(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-0"
                  />
                  <span>Immediately pause AI automated replies in this conversation</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireExplicitResume}
                    onChange={(e) => setRequireExplicitResume(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-0"
                  />
                  <span>Require staff to explicitly click "Return to AI" to resume auto-replies</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                >
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
