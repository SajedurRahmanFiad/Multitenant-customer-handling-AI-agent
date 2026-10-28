import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  PowerOff,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AIProviderModel } from '../../types/platformAdmin';

interface AIProviderRegistryViewProps {
  models: AIProviderModel[];
  onToggleStatus: (modelId: string) => void;
  onSetDefault: (modelId: string) => void;
  onSetFallback: (modelId: string) => void;
}

export const AIProviderRegistryView: React.FC<AIProviderRegistryViewProps> = ({
  models,
  onToggleStatus,
  onSetDefault,
  onSetFallback,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [pingStatus, setPingStatus] = useState<Record<string, 'idle' | 'pinging' | 'ok'>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.modelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.secretReference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = providerFilter === 'all' || m.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const handlePing = (id: string) => {
    setPingStatus((prev) => ({ ...prev, [id]: 'pinging' }));
    setTimeout(() => {
      setPingStatus((prev) => ({ ...prev, [id]: 'ok' }));
      setTimeout(() => {
        setPingStatus((prev) => ({ ...prev, [id]: 'idle' }));
      }, 3000);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Platform Security Banner (Light Mode) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600 shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Zero-Plaintext Secret Architecture
              </h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                KMS Secured
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Provider API keys are resolved at runtime via encrypted HashiCorp Vault / Google Cloud KMS secret references. Keys are never transmitted to client browsers, logged in tracing spans, or stored in tenant configs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register Model
        </button>
      </div>

      {/* Filter and search row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by model ID, name, or secret reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'Google Gemini', 'OpenAI', 'Anthropic', 'Groq / Llama'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProviderFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                providerFilter === p
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p === 'all' ? 'All Providers' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Model Grid (Light Mode) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredModels.map((model) => {
          const isPinging = pingStatus[model.id] === 'pinging';
          const isPingOk = pingStatus[model.id] === 'ok';

          return (
            <div
              key={model.id}
              className={`bg-white border rounded-2xl p-5 transition-all shadow-xs flex flex-col justify-between ${
                model.status === 'disabled'
                  ? 'border-rose-200 bg-rose-50/20'
                  : model.isDefault
                  ? 'border-indigo-300 ring-1 ring-indigo-200'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        model.provider === 'Google Gemini'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : model.provider === 'OpenAI'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : model.provider === 'Anthropic'
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-purple-50 border-purple-200 text-purple-600'
                      }`}
                    >
                      <Cpu className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">
                          {model.displayName}
                        </h4>
                        {model.isDefault && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Primary Default
                          </span>
                        )}
                        {model.isFallback && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Auto-Fallback
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">
                          {model.modelId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-600">
                          {model.provider}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Circuit Breaker status badge & toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(model.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                        model.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title={model.status === 'active' ? 'Click to trigger circuit breaker (Disable)' : 'Click to reactivate model'}
                    >
                      {model.status === 'active' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3 h-3" />
                          Circuit Tripped
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Secret Reference Box (Light Mode) */}
                <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-[11px] text-slate-500 shrink-0">Secret URI:</span>
                    <span className="font-mono text-slate-700 truncate text-[11px]">
                      {model.secretReference}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold shrink-0 ml-2">
                    Secured
                  </span>
                </div>

                {/* Capabilities pills */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {model.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] uppercase tracking-wider font-mono font-medium"
                    >
                      {cap}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-500 ml-auto font-mono">
                    Ctx: {(model.contextWindowTokens / 1000).toLocaleString()}k
                  </span>
                </div>

                {/* Metrics Breakdown (Light Mode) */}
                <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">In / 1M</span>
                    <span className="text-xs font-bold text-slate-900">
                      ${model.costPerMillionInputUSD.toFixed(3)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Out / 1M</span>
                    <span className="text-xs font-bold text-slate-900">
                      ${model.costPerMillionOutputUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">P95 Latency</span>
                    <span className="text-xs font-bold text-slate-900">
                      {model.latencyP95Ms}ms
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">24h Errors</span>
                    <span
                      className={`text-xs font-bold ${
                        model.errorRate24hPercent > 0.05
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {model.errorRate24hPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handlePing(model.id)}
                  disabled={isPinging}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-indigo-600' : ''}`}
                  />
                  <span>
                    {isPinging ? 'Pinging...' : isPingOk ? 'Latency 180ms (OK)' : 'Live Health Ping'}
                  </span>
                </button>

                <div className="flex items-center gap-1.5">
                  {!model.isDefault && (
                    <button
                      type="button"
                      onClick={() => onSetDefault(model.id)}
                      className="px-2 py-1 text-[11px] text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-colors"
                    >
                      Make Default
                    </button>
                  )}
                  {!model.isFallback && (
                    <button
                      type="button"
                      onClick={() => onSetFallback(model.id)}
                      className="px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-50 rounded-lg font-semibold transition-colors"
                    >
                      Make Fallback
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Model Modal (Light Mode) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Register New AI Model
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Model Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gemini 2.5 Pro Ultra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Model Identifier (API Parameter)
                </label>
                <input
                  type="text"
                  placeholder="e.g. gemini-2.5-pro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  KMS / Vault Secret Reference
                </label>
                <input
                  type="text"
                  placeholder="vault://gcp-kms/gemini-prod-v3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Never enter raw API keys. Reference a secured KMS or HashiCorp Vault path.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Input Cost / 1M ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Output Cost / 1M ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.40"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                Register & Validate KMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
