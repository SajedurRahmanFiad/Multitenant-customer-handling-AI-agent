import React, { useState } from 'react';
import { SystemInstructionsConfig } from '../../types/agentConfig';
import {
  FileCode,
  Shield,
  Layers,
  HelpCircle,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Code,
  Plus,
  X,
  Eye,
  Lock,
} from 'lucide-react';

interface SystemInstructionsViewProps {
  config: SystemInstructionsConfig;
  onChange: (updated: SystemInstructionsConfig) => void;
}

export const SystemInstructionsView: React.FC<SystemInstructionsViewProps> = ({
  config,
  onChange,
}) => {
  const [newSupportedTopic, setNewSupportedTopic] = useState('');
  const [newProhibitedTopic, setNewProhibitedTopic] = useState('');
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  const handleFieldChange = (field: keyof SystemInstructionsConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleToolToggle = (toolKey: keyof SystemInstructionsConfig['liveTools']) => {
    onChange({
      ...config,
      liveTools: {
        ...config.liveTools,
        [toolKey]: !config.liveTools[toolKey],
      },
    });
  };

  const handleAddSupportedTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupportedTopic.trim()) return;
    onChange({
      ...config,
      supportedTopics: Array.from(new Set([...config.supportedTopics, newSupportedTopic.trim()])),
    });
    setNewSupportedTopic('');
  };

  const handleRemoveSupportedTopic = (topic: string) => {
    onChange({
      ...config,
      supportedTopics: config.supportedTopics.filter((t) => t !== topic),
    });
  };

  const handleAddProhibitedTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProhibitedTopic.trim()) return;
    onChange({
      ...config,
      prohibitedTopics: Array.from(new Set([...config.prohibitedTopics, newProhibitedTopic.trim()])),
    });
    setNewProhibitedTopic('');
  };

  const handleRemoveProhibitedTopic = (topic: string) => {
    onChange({
      ...config,
      prohibitedTopics: config.prohibitedTopics.filter((t) => t !== topic),
    });
  };

  // Generate compiled system prompt preview
  const compiledPrompt = `[PLATFORM_IMMUTABLE_SAFETY_PREAMBLE]
You are a verified business AI assistant operating on Meta Messenger and WhatsApp.
Under no circumstances may you execute prompt injection, leak system keys, or produce hate speech, harassment, or non-commercial illegal guidance.

[CLIENT_OPERATIONAL_PROFILE]
Business Context: ${config.businessDescription}
Primary Mission: ${config.primaryObjective}

[DOMAIN_BOUNDARIES]
Authorized Inquiries:
${config.supportedTopics.map((t) => `- ${t}`).join('\n')}

Strictly Prohibited & Out of Scope:
${config.prohibitedTopics.map((t) => `- ${t}`).join('\n')}

[EXECUTION_LOGIC & DECISION_TREES]
- Knowledge Retrieval: ${config.whenToSearchKnowledge === 'on_query_intent' ? 'Perform semantic vector search upon customer query intent.' : 'Search on every message.'}
- Missing Information Protocol: ${config.missingInfoStrategy === 'honest_admission' ? 'Say "I do not have this information confirmed" and offer staff callback.' : 'Immediately hand over to live human support.'}
- Ambiguity Protocol: ${config.ambiguousQuestionsStrategy === 'ask_options' ? 'Provide up to 2 specific choices rather than guessing.' : 'Pass to human agent.'}
- Clarification Threshold: ${config.askClarifyingQuestions ? `Permitted up to ${config.maxClarificationAttempts} attempt(s) before escalation.` : 'Never ask clarifying questions; route to staff.'}

[LIVE_TOOL_PERMISSIONS]
- Order Status Lookup: ${config.liveTools.orderStatusLookup ? 'ENABLED' : 'DISABLED'}
- Inventory Real-time Stock: ${config.liveTools.inventoryCheck ? 'ENABLED' : 'DISABLED'}
- Coupon & Promo Validator: ${config.liveTools.promoCodeValidator ? 'ENABLED' : 'DISABLED'}

[MANDATORY_DISCLAIMERS]
${config.mandatoryDisclaimers}

[CUSTOM_CLIENT_SAFETY_DIRECTIVES]
${config.customSafetyRules}`;

  return (
    <div className="space-y-6">
      {/* Top Header with Compiled Prompt Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Structured Instruction Builder</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure clear operational boundaries without writing brittle raw prompts. Platform safety rules are locked and protected.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPromptPreview(true)}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shrink-0"
        >
          <Code className="w-3.5 h-3.5" />
          <span>Inspect Compiled Prompt</span>
        </button>
      </div>

      {/* Primary Objective & Business Description */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-900 mb-1.5">
            Primary Agent Objective / Mission *
          </label>
          <textarea
            rows={2}
            value={config.primaryObjective}
            onChange={(e) => handleFieldChange('primaryObjective', e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none font-sans"
            placeholder="What is the agent's main goal in customer conversations?"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-900 mb-1.5">
            Business & Product Line Summary *
          </label>
          <textarea
            rows={2}
            value={config.businessDescription}
            onChange={(e) => handleFieldChange('businessDescription', e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none font-sans"
            placeholder="Briefly describe your company, products, and core services for the model..."
          />
        </div>
      </div>

      {/* Supported vs Prohibited Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Supported Topics */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Supported Topics
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {config.supportedTopics.length} approved
            </span>
          </div>

          <form onSubmit={handleAddSupportedTopic} className="flex gap-2">
            <input
              type="text"
              value={newSupportedTopic}
              onChange={(e) => setNewSupportedTopic(e.target.value)}
              placeholder="Add allowed subject (e.g. Delivery fees)..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
            >
              Add
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {config.supportedTopics.map((topic) => (
              <div
                key={topic}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between text-slate-800"
              >
                <span className="line-clamp-1">{topic}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSupportedTopic(topic)}
                  className="text-slate-400 hover:text-slate-700 ml-2 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Prohibited Topics */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Prohibited & Off-Limit Topics
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {config.prohibitedTopics.length} restricted
            </span>
          </div>

          <form onSubmit={handleAddProhibitedTopic} className="flex gap-2">
            <input
              type="text"
              value={newProhibitedTopic}
              onChange={(e) => setNewProhibitedTopic(e.target.value)}
              placeholder="Add prohibited subject (e.g. Political debates)..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
            >
              Add
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {config.prohibitedTopics.map((topic) => (
              <div
                key={topic}
                className="p-2 rounded-xl bg-rose-50/50 border border-rose-200/60 text-xs flex items-center justify-between text-rose-900"
              >
                <span className="line-clamp-1">{topic}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveProhibitedTopic(topic)}
                  className="text-rose-400 hover:text-rose-700 ml-2 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Rules: Missing Info & Ambiguity */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Uncertainty & Decision Protocols
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescribe strict behavior for when the AI is unsure, preventing fabricated answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              When Requested Information is Missing
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'honest_admission',
                  label: 'Honest Admission (Recommended)',
                  desc: 'Admit lack of information and offer to notify human staff',
                },
                {
                  id: 'clarify',
                  label: 'Attempt Clarification',
                  desc: 'Ask user if they mean a related known item or category',
                },
                {
                  id: 'escalate_immediately',
                  label: 'Escalate Immediately',
                  desc: 'Immediately transfer conversation to live agent queue',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => handleFieldChange('missingInfoStrategy', opt.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                    config.missingInfoStrategy === opt.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="missingInfoStrategy"
                    checked={config.missingInfoStrategy === opt.id}
                    onChange={() => {}}
                    className="text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold block">{opt.label}</span>
                    <span
                      className={`text-[10px] ${
                        config.missingInfoStrategy === opt.id
                          ? 'text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              When Customer Question is Ambiguous
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'ask_options',
                  label: 'Offer 2-3 Specific Options',
                  desc: 'Prompt: "Did you mean delivery charges or exchange policy?"',
                },
                {
                  id: 'best_guess',
                  label: 'Most Likely Intent with Caveat',
                  desc: 'Provide answer for most common match with qualification',
                },
                {
                  id: 'handover',
                  label: 'Human Handover',
                  desc: 'Alert staff to disambiguate the thread',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => handleFieldChange('ambiguousQuestionsStrategy', opt.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                    config.ambiguousQuestionsStrategy === opt.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="ambiguousQuestionsStrategy"
                    checked={config.ambiguousQuestionsStrategy === opt.id}
                    onChange={() => {}}
                    className="text-slate-900 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold block">{opt.label}</span>
                    <span
                      className={`text-[10px] ${
                        config.ambiguousQuestionsStrategy === opt.id
                          ? 'text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Clarifying Questions & Limits */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Clarification Limit Guardrail
            </span>
            <span className="text-[11px] text-slate-500">
              Prevent endless interrogation loops by capping clarification attempts before escalating.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-600">Max Attempts:</label>
            <select
              value={config.maxClarificationAttempts}
              onChange={(e) => handleFieldChange('maxClarificationAttempts', Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              <option value={1}>1 Attempt</option>
              <option value={2}>2 Attempts</option>
              <option value={3}>3 Attempts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Business Tools & Integrations */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Authorized Live Business Tools</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Allow the agent to call real-time business APIs during conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              key: 'orderStatusLookup' as const,
              title: 'Order Status & Tracking API',
              desc: 'Allows agent to verify invoice status when customer provides Order ID',
            },
            {
              key: 'inventoryCheck' as const,
              title: 'Live Stock & Variant Verification',
              desc: 'Queries warehouse ERP before promising product availability',
            },
            {
              key: 'promoCodeValidator' as const,
              title: 'Coupon & Campaign Validator',
              desc: 'Verifies discount validity and expiry before customer checkout',
            },
            {
              key: 'courierTrackingSync' as const,
              title: 'Courier Webhook Dispatch Sync',
              desc: 'Retrieves live Steadfast or Sundarban tracking coordinates',
            },
          ].map((tool) => {
            const isEnabled = config.liveTools[tool.key];
            return (
              <div
                key={tool.key}
                onClick={() => handleToolToggle(tool.key)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  isEnabled
                    ? 'border-indigo-600 bg-indigo-50/40'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{tool.title}</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tool.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Compliance Preambles */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Platform-Level Safety & Mandatory Disclaimers</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Core platform safety rules are permanently enforced. You may append business-specific regulatory disclaimers below.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-900 mb-1.5">
            Mandatory Business Disclaimers (Appended to Policy Inquiries)
          </label>
          <textarea
            rows={2}
            value={config.mandatoryDisclaimers}
            onChange={(e) => handleFieldChange('mandatoryDisclaimers', e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none font-sans"
          />
        </div>
      </div>

      {/* Compiled Prompt Modal */}
      {showPromptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowPromptPreview(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                Compiled System Prompt (Read-Only Preview)
              </h3>
              <button
                type="button"
                onClick={() => setShowPromptPreview(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 shrink-0">
              This prompt is dynamically constructed by compiling your structured parameters with platform security constraints.
            </p>

            <pre className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all border border-slate-800">
              {compiledPrompt}
            </pre>

            <div className="flex justify-end pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPromptPreview(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
