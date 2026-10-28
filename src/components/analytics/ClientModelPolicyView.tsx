import React, { useState } from 'react';
import { ClientModelPolicy, KeyOwnershipType } from '../../types/analytics';
import {
  Sparkles,
  Zap,
  Brain,
  Eye,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  HelpCircle,
  Save,
  CheckCircle2,
  Lock,
  Layers,
  Scale,
  Settings,
} from 'lucide-react';

interface ClientModelPolicyViewProps {
  policy: ClientModelPolicy;
  onUpdatePolicy: (updated: ClientModelPolicy) => void;
  onShowToast: (msg: string) => void;
}

const APPROVED_MODELS = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google', costTier: 'Ultra Cheap ($0.075/1M)', speed: 'Fastest (~140ms)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', costTier: 'Balanced ($0.15/1M)', speed: 'Fast (~220ms)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', costTier: 'Premium Reasoning ($1.25/1M)', speed: 'Standard (~450ms)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', costTier: 'Affordable ($0.15/1M)', speed: 'Fast (~240ms)' },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', costTier: 'Balanced ($0.25/1M)', speed: 'Fast (~250ms)' },
];

export const ClientModelPolicyView: React.FC<ClientModelPolicyViewProps> = ({
  policy,
  onUpdatePolicy,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<ClientModelPolicy>(policy);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePolicy(formData);
    onShowToast('Client AI model policy and usage limits saved');
  };

  const handleToggleKeyOwnership = (ownership: KeyOwnershipType) => {
    setFormData((prev) => ({ ...prev, keyOwnership: ownership }));
    onShowToast(
      ownership === 'platform_managed'
        ? 'Switched to Platform Managed AI keys (Platform metered billing)'
        : 'Switched to BYOK (Client provided isolated API keys)'
    );
  };

  const budgetUsagePercent = Math.min(
    100,
    Math.round((formData.tokensUsedToday / formData.dailyTokenBudget) * 100)
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Key Ownership & Quota Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Model Allocation & Billing Scope
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                {formData.billingTier} Tier
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select which AI models handle your customer conversations. Configure safe daily token budgets to prevent unexpected charges.
            </p>
          </div>

          {/* Key Ownership Toggle Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl text-xs shrink-0">
            <button
              type="button"
              onClick={() => handleToggleKeyOwnership('platform_managed')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                formData.keyOwnership === 'platform_managed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Platform Managed (Unified Billing)
            </button>
            <button
              type="button"
              onClick={() => handleToggleKeyOwnership('byok_client')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                formData.keyOwnership === 'byok_client'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              BYOK (Client Direct Keys)
            </button>
          </div>
        </div>

        {/* Daily Token Budget Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              Today's Token Quota Utilization
            </span>
            <span className="font-mono text-slate-600">
              <strong className="text-slate-900 font-bold">{formData.tokensUsedToday.toLocaleString()}</strong> / {formData.dailyTokenBudget.toLocaleString()} tokens ({budgetUsagePercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetUsagePercent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Estimated Cost Today: ~${(formData.tokensUsedToday * 0.0000034).toFixed(2)} USD</span>
            <span>Resets at midnight UTC+6</span>
          </div>
        </div>
      </div>

      {/* Main Model Selection Cards (Simplified for Business Clients) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Role-Based Model Assignment
            </h4>
            <p className="text-xs text-slate-500">
              Assign specialized models to specific conversational needs for the ideal balance of cost and intelligence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Auto-Routing:</span>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  autoRoutingEnabled: !prev.autoRoutingEnabled,
                }))
              }
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                formData.autoRoutingEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  formData.autoRoutingEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Default Model */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-bold text-slate-900">
                Default Conversation Model
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Used for standard greetings, general customer inquiries, and conversation flow.
            </p>
            <select
              value={formData.defaultModel}
              onChange={(e) => setFormData({ ...formData, defaultModel: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              {APPROVED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.costTier})
                </option>
              ))}
            </select>
          </div>

          {/* Simple FAQ Model */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <label className="text-xs font-bold text-slate-900">
                Inexpensive Model for Simple FAQs
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ultra-low latency model for high-frequency queries like store hours and delivery fees.
            </p>
            <select
              value={formData.faqModel}
              onChange={(e) => setFormData({ ...formData, faqModel: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              {APPROVED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.costTier})
                </option>
              ))}
            </select>
          </div>

          {/* Complex Reasoning Model */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <label className="text-xs font-bold text-slate-900">
                Stronger Model for Complex Reasoning
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Higher capability model for multi-item size matching, return claims, and detailed policies.
            </p>
            <select
              value={formData.complexModel}
              onChange={(e) => setFormData({ ...formData, complexModel: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              {APPROVED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.costTier})
                </option>
              ))}
            </select>
          </div>

          {/* Vision / Multimodal Model */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-600" />
              <label className="text-xs font-bold text-slate-900">
                Vision Model for Photos & Receipts
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Parses customer photos of defective clothing, courier slips, and payment screenshots.
            </p>
            <select
              value={formData.visionModel}
              onChange={(e) => setFormData({ ...formData, visionModel: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              {APPROVED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.costTier})
                </option>
              ))}
            </select>
          </div>

          {/* Fallback Model */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <label className="text-xs font-bold text-slate-900">
                Emergency Fallback Model (Cross-Provider Resilience)
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If your primary provider encounters a network spike or outage, the agent instantly switches to this fallback model to maintain 100% uptime.
            </p>
            <select
              value={formData.fallbackModel}
              onChange={(e) => setFormData({ ...formData, fallbackModel: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              {APPROVED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Safety Quotas & Response Constraints */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
        <h4 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          Response Length & Budget Quotas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Max Response Length (Tokens)
            </label>
            <input
              type="number"
              min={100}
              max={1500}
              step={50}
              value={formData.maxTokensPerResponse}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxTokensPerResponse: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
            />
            <p className="text-[11px] text-slate-400">
              ~{Math.round(formData.maxTokensPerResponse * 0.75)} words per reply. Prevents verbose run-ons.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Per-Conversation Cap (Tokens)
            </label>
            <input
              type="number"
              min={2000}
              max={30000}
              step={1000}
              value={formData.perConversationLimitTokens}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  perConversationLimitTokens: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Caps long looping chats and auto-triggers human review.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Daily Account Budget (Tokens)
            </label>
            <input
              type="number"
              min={100000}
              max={10000000}
              step={100000}
              value={formData.dailyTokenBudget}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dailyTokenBudget: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Hard limit: alerts administrators if consumption spikes.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Technical Settings (Safe Collapsible Accordion) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-600" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Advanced Generation Settings
              </h4>
              <p className="text-xs text-slate-400">
                Temperature, sampling penalties, and context cache (Safe defaults already tuned)
              </p>
            </div>
          </div>
          {isAdvancedOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isAdvancedOpen && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Temperature: {formData.advancedConfig.temperature}</span>
                <span className="text-slate-400">Strict & Fact-Adherent</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={formData.advancedConfig.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advancedConfig: {
                      ...formData.advancedConfig,
                      temperature: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-400">
                Lower values (0.2–0.4) ensure high fidelity to knowledge bases and strict product facts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">Context Window Cap: {formData.advancedConfig.contextWindowTokens.toLocaleString()} tokens</span>
                <span className="text-slate-400">Trim Old History</span>
              </div>
              <input
                type="range"
                min="4000"
                max="64000"
                step="4000"
                value={formData.advancedConfig.contextWindowTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advancedConfig: {
                      ...formData.advancedConfig,
                      contextWindowTokens: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-400">
                Compresses long conversation transcripts to avoid high token waste.
              </p>
            </div>

            <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  System Prompt Context Caching
                </span>
                <p className="text-[11px] text-slate-500">
                  Caches system instructions and FAQ vectors at the model edge to cut latency by 50% and reduce recurring prompt token costs.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.advancedConfig.systemPromptCacheEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advancedConfig: {
                      ...formData.advancedConfig,
                      systemPromptCacheEnabled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Client Model Policy</span>
        </button>
      </div>
    </form>
  );
};
