import React, { useState } from 'react';
import { AgentModeType } from '../../types/agentConfig';
import {
  Power,
  Bot,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface AgentModesViewProps {
  currentMode: AgentModeType;
  onChangeMode: (mode: AgentModeType) => void;
}

const MODES: {
  id: AgentModeType;
  title: string;
  badge: string;
  badgeColor: string;
  icon: any;
  description: string;
  bestFor: string;
  implications: string[];
}[] = [
  {
    id: 'automatic',
    title: 'Automatic Mode (Full Autonomous)',
    badge: 'Standard Production',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: Zap,
    description:
      'AI directly responds to customers across all connected channels (WhatsApp and Messenger) in real time without human intervention unless an escalation rule triggers.',
    bestFor: 'High-volume businesses with validated knowledge bases and active staff monitoring.',
    implications: [
      'Responds instantly 24/7 within 1-3 seconds',
      'Follows all response length, tone, and brand guardrails',
      'Yields immediately to staff if handover triggers fire',
    ],
  },
  {
    id: 'restricted_automatic',
    title: 'Restricted Automatic Mode',
    badge: 'Safeguarded Hybrid',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: ShieldCheck,
    description:
      'AI autonomously answers only approved standard categories (e.g., shipping rates, bKash guidelines, office hours). All pricing negotiations, refund questions, and custom queries route to human staff.',
    bestFor: 'Businesses transitioning to AI who want guaranteed guardrails on critical financial decisions.',
    implications: [
      'Handles routine delivery and payment inquiries automatically',
      'Safeguards refunds and custom requests behind staff approval',
      'Minimizes operational liability while deflecting 60%+ of tickets',
    ],
  },
  {
    id: 'suggestion',
    title: 'Suggestion Mode (Human-in-the-Loop)',
    badge: 'Safe Onboarding & QA',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Bot,
    description:
      'AI generates draft replies in the Inbox composer, but NEVER sends them automatically. Staff review, edit if necessary, and click "Send".',
    bestFor: 'Initial pilot phase, agent evaluation, or training new customer service representatives.',
    implications: [
      'Zero risk of hallucinated customer messages',
      'Staff can test and correct answers in real time',
      'Helps collect golden QA corrections for model fine-tuning',
    ],
  },
  {
    id: 'disabled',
    title: 'Disabled (Emergency Shutdown)',
    badge: 'Inactive',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: Power,
    description:
      'Complete suspension of AI generation across all channels. All incoming customer messages go directly into the unassigned human staff queue.',
    bestFor: 'System maintenance, catalog overhauls, or unexpected business policy transitions.',
    implications: [
      'No AI replies or draft suggestions are generated',
      'All incoming messages wait for human response',
      'Can be reactivated in one click at any time',
    ],
  },
];

export const AgentModesView: React.FC<AgentModesViewProps> = ({
  currentMode,
  onChangeMode,
}) => {
  const [restrictedCategories, setRestrictedCategories] = useState<string[]>([
    'Delivery and shipping fees',
    'bKash and Nagad payment steps',
    'Store locations and operating hours',
    'Standard exchange policy overview',
  ]);

  const handleToggleCategory = (cat: string) => {
    if (restrictedCategories.includes(cat)) {
      if (restrictedCategories.length > 1) {
        setRestrictedCategories(restrictedCategories.filter((c) => c !== cat));
      }
    } else {
      setRestrictedCategories([...restrictedCategories, cat]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Autonomous Operational Modes</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Control the degree of autonomy given to the AI across your customer communication channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Current Mode:</span>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-900 text-white capitalize">
            {currentMode.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODES.map((mode) => {
          const isSelected = currentMode === mode.id;
          const Icon = mode.icon;

          return (
            <div
              key={mode.id}
              onClick={() => onChangeMode(mode.id)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 bg-white shadow-2xs ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {mode.title}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-0.5 inline-block ${mode.badgeColor}`}
                      >
                        {mode.badge}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {mode.description}
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Ideal Scenario
                  </span>
                  <p className="text-[11px] text-slate-700">{mode.bestFor}</p>
                </div>
              </div>

              {/* Bullet implications */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                {mode.implications.map((imp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[11px] text-slate-500"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conditional Configuration for Restricted Automatic Mode */}
      {currentMode === 'restricted_automatic' && (
        <div className="bg-white rounded-3xl border border-indigo-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Approved Autonomous Categories for Restricted Mode</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select which customer query subjects the AI is permitted to answer without human supervision.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              'Delivery and shipping fees',
              'bKash and Nagad payment steps',
              'Store locations and operating hours',
              'Standard exchange policy overview',
              'Product variant stock check',
              'Courier tracking link lookup',
            ].map((cat) => {
              const isChecked = restrictedCategories.includes(cat);
              return (
                <label
                  key={cat}
                  onClick={() => handleToggleCategory(cat)}
                  className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2.5 transition-colors ${
                    isChecked
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="rounded text-slate-900 focus:ring-0"
                  />
                  <span className="font-semibold">{cat}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
