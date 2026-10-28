import React, { useState } from 'react';
import {
  InternalProviderConfig,
  ProviderCapability,
  ProviderType,
} from '../../types/analytics';
import {
  Server,
  Lock,
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  ExternalLink,
  Cpu,
  Layers,
  X,
  Database,
  Sparkles,
} from 'lucide-react';

interface InternalProviderConsoleViewProps {
  providers: InternalProviderConfig[];
  onUpdateProvider: (updated: InternalProviderConfig) => void;
  onAddProvider: (newProv: InternalProviderConfig) => void;
  onShowToast: (msg: string) => void;
}

export const InternalProviderConsoleView: React.FC<InternalProviderConsoleViewProps> = ({
  providers,
  onUpdateProvider,
  onAddProvider,
  onShowToast,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<InternalProviderConfig | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // New Provider Form State
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newProviderType, setNewProviderType] = useState<ProviderType>('google_gemini');
  const [newEndpoint, setNewEndpoint] = useState('https://generativelanguage.googleapis.com/v1beta');
  const [newSecretRef, setNewSecretRef] = useState('vault://prod/ai-credentials/');
  const [newMaskedKey, setNewMaskedKey] = useState('');
  const [newAvailableModels, setNewAvailableModels] = useState('gemini-2.5-flash, gemini-2.5-pro');
  const [newDefaultModel, setNewDefaultModel] = useState('gemini-2.5-flash');
  const [newCapabilities, setNewCapabilities] = useState<ProviderCapability[]>([
    'text',
    'vision',
    'tool_calling',
  ]);

  const handleTestPing = (prov: InternalProviderConfig) => {
    setTestingId(prov.id);
    setTimeout(() => {
      setTestingId(null);
      const simulatedLatency = Math.floor(Math.random() * 80) + 90;
      onShowToast(`Provider health check passed: ${prov.displayName} (${simulatedLatency}ms)`);
      onUpdateProvider({
        ...prov,
        healthCheck: {
          lastCheckedAt: 'Just now',
          status: 'healthy',
          latencyMs: simulatedLatency,
        },
        status: 'active',
      });
    }, 800);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProv: InternalProviderConfig = {
      id: `prov_${Date.now()}`,
      provider: newProviderType,
      displayName: newDisplayName.trim(),
      apiEndpoint: newEndpoint.trim(),
      secretReference: newSecretRef.trim(),
      maskedKey: newMaskedKey.slice(0, 7) + '...' + newMaskedKey.slice(-4),
      availableModels: newAvailableModels.split(',').map((s) => s.trim()),
      defaultModel: newDefaultModel.trim(),
      capabilities: newCapabilities,
      contextLimitTokens: 128000,
      outputLimitTokens: 4096,
      rateLimits: {
        requestsPerMin: 600,
        tokensPerMin: 2000000,
        dailyQuota: 20000000,
      },
      status: 'active',
      healthCheck: {
        lastCheckedAt: 'Just now',
        status: 'healthy',
        latencyMs: 140,
      },
      billingParty: 'platform',
    };

    onAddProvider(newProv);
    setIsAddModalOpen(false);
    onShowToast(`Provider "${newProv.displayName}" registered and verified in backend vault`);
  };

  const getStatusBadge = (status: InternalProviderConfig['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Degraded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Disabled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Security Architecture Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Internal AI Provider Management Console
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Admin Restricted
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Connect and manage foundation model providers. API keys are encrypted at rest using dedicated secrets infrastructure (HashiCorp Vault / Cloud Secret Manager), with zero exposure in browser local storage or frontend payloads.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-xs shrink-0 self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Provider</span>
          </button>
        </div>

        {/* Security Isolation Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Vault Isolation:</strong> Tenant credentials strictly segregated</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Redacted Logs:</strong> Plaintext keys never written to disk</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 shrink-0" />
            <span><strong>Health Guard:</strong> Auto-failover on 5xx or latency spikes</span>
          </div>
        </div>
      </div>

      {/* Providers Grid / Table */}
      <div className="grid grid-cols-1 gap-5">
        {providers.map((prov) => (
          <div
            key={prov.id}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                  <Cpu className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-sm font-bold text-slate-900">
                      {prov.displayName}
                    </h4>
                    {getStatusBadge(prov.status)}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {prov.billingParty === 'platform' ? 'Platform Metered' : 'BYOK Direct'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>Endpoint: <strong className="font-mono text-slate-700 font-medium">{prov.apiEndpoint}</strong></span>
                    <span>•</span>
                    <span>Secret Ref: <strong className="font-mono text-slate-700 font-semibold">{prov.secretReference}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => handleTestPing(prov)}
                  disabled={testingId === prov.id}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${testingId === prov.id ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{testingId === prov.id ? 'Pinging...' : 'Test Health'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProvider(prov)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-slate-500" />
                  <span>Configure Limits</span>
                </button>
              </div>
            </div>

            {/* Provider Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* Models Permitted */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Permitted Models ({prov.availableModels.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {prov.availableModels.map((m) => (
                    <span
                      key={m}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium ${
                        m === prov.defaultModel
                          ? 'bg-blue-100 text-blue-800 font-bold'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Supported Modalities
                </span>
                <div className="flex flex-wrap gap-1">
                  {prov.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rate Limits */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Throughput Constraints
                </span>
                <div className="font-mono text-slate-800 space-y-0.5 text-[11px]">
                  <div>RPM Limit: <strong>{prov.rateLimits.requestsPerMin.toLocaleString()}</strong></div>
                  <div>TPM Limit: <strong>{(prov.rateLimits.tokensPerMin / 1000000).toFixed(1)}M</strong></div>
                </div>
              </div>

              {/* Health Check Status */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Health Check Telemetry
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-bold text-slate-900">{prov.healthCheck.latencyMs} ms</span>
                  <span className="text-[11px] text-slate-400">({prov.healthCheck.lastCheckedAt})</span>
                </div>
                <p className="text-[10px] text-emerald-700">Zero active throttles</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Register New Provider Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Register AI Provider Endpoint
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Provider Service</label>
                <select
                  value={newProviderType}
                  onChange={(e) => setNewProviderType(e.target.value as ProviderType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="google_gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI API</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="groq">Groq LPUs</option>
                  <option value="azure_openai">Azure OpenAI</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Display Name</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Gemini 2.5 Flash Production Cluster"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">API Base Endpoint</label>
                <input
                  type="url"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Vault Secret Reference URI
                </label>
                <input
                  type="text"
                  value={newSecretRef}
                  onChange={(e) => setNewSecretRef(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                />
                <p className="text-[11px] text-slate-400">
                  Must point to an encrypted key in Google Secret Manager or HashiCorp Vault.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  API Key Initial Ingestion (Vault Encrypted)
                </label>
                <input
                  type="password"
                  value={newMaskedKey}
                  onChange={(e) => setNewMaskedKey(e.target.value)}
                  placeholder="Paste API Key (Never saved in browser localStorage)"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Permitted Models (Comma separated)</label>
                <input
                  type="text"
                  value={newAvailableModels}
                  onChange={(e) => setNewAvailableModels(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
                >
                  Register in Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Provider Limits Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedProvider.displayName} Configuration
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedProvider.secretReference}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Context Window Limit (Tokens)</label>
                <input
                  type="number"
                  value={selectedProvider.contextLimitTokens}
                  onChange={(e) =>
                    setSelectedProvider({
                      ...selectedProvider,
                      contextLimitTokens: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Rate Limit (Requests / Min)</label>
                <input
                  type="number"
                  value={selectedProvider.rateLimits.requestsPerMin}
                  onChange={(e) =>
                    setSelectedProvider({
                      ...selectedProvider,
                      rateLimits: {
                        ...selectedProvider.rateLimits,
                        requestsPerMin: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Provider Status</label>
                <select
                  value={selectedProvider.status}
                  onChange={(e) =>
                    setSelectedProvider({
                      ...selectedProvider,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="degraded">Degraded</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onUpdateProvider(selectedProvider);
                  setSelectedProvider(null);
                  onShowToast(`Provider "${selectedProvider.displayName}" updated`);
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
              >
                Save Constraints
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
