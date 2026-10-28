import React, { useState } from 'react';
import { BusinessIntegration, IntegrationScope } from '../../types/channels';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  FileSpreadsheet,
  Globe,
  Database,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Lock,
  ChevronRight,
  ShieldAlert,
  X,
  Sparkles,
} from 'lucide-react';

interface BusinessSystemsViewProps {
  integrations: BusinessIntegration[];
  onUpdateIntegration: (updated: BusinessIntegration) => void;
  onShowToast: (msg: string) => void;
}

export const BusinessSystemsView: React.FC<BusinessSystemsViewProps> = ({
  integrations,
  onUpdateIntegration,
  onShowToast,
}) => {
  const [selectedInteg, setSelectedInteg] = useState<BusinessIntegration | null>(null);
  const [isSyncingId, setIsSyncingId] = useState<string | null>(null);

  const getCategoryIcon = (category: BusinessIntegration['category']) => {
    switch (category) {
      case 'ecommerce':
        return <ShoppingBag className="w-5 h-5 text-purple-600" />;
      case 'courier':
        return <Truck className="w-5 h-5 text-amber-600" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-rose-600" />;
      case 'inventory':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'custom_api':
        return <Database className="w-5 h-5 text-blue-600" />;
      default:
        return <Globe className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleTestSync = (integ: BusinessIntegration) => {
    setIsSyncingId(integ.id);
    setTimeout(() => {
      setIsSyncingId(null);
      onShowToast(`Successfully connected to ${integ.name} (${integ.stats.avgLatencyMs}ms latency)`);
      onUpdateIntegration({
        ...integ,
        lastSyncAt: 'Just now',
        status: 'connected',
      });
    }, 750);
  };

  const handleToggleConnection = (integ: BusinessIntegration) => {
    const nextStatus = integ.status === 'connected' ? 'disconnected' : 'connected';
    onUpdateIntegration({
      ...integ,
      status: nextStatus,
    });
    onShowToast(
      nextStatus === 'connected'
        ? `Connected to ${integ.name}`
        : `Disconnected ${integ.name} from agent pipeline`
    );
  };

  const handleToggleScope = (scopeKey: string) => {
    if (!selectedInteg) return;
    const updatedScopes = selectedInteg.scopes.map((s) =>
      s.key === scopeKey ? { ...s, granted: !s.granted } : s
    );
    const updated = { ...selectedInteg, scopes: updatedScopes };
    setSelectedInteg(updated);
    onUpdateIntegration(updated);
    onShowToast(`Scope updated for ${selectedInteg.name}`);
  };

  const handleUpdateFallbackMessage = (msg: string) => {
    if (!selectedInteg) return;
    const updated = {
      ...selectedInteg,
      fallbackPolicy: {
        ...selectedInteg.fallbackPolicy,
        fallbackMessage: msg,
      },
    };
    setSelectedInteg(updated);
    onUpdateIntegration(updated);
  };

  return (
    <div className="space-y-6">
      {/* Overview Intro Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Enterprise Business System Connectors
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Connect your live e-commerce databases, courier tracking gateways, and mobile financial services. The AI accesses live data through read-restricted API endpoints with strictly enforced rate limits and hallucination guards.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {integrations.filter((i) => i.status === 'connected').length} Active Connectors
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Business Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((integ) => {
          const isConnected = integ.status === 'connected';
          const grantedCount = integ.scopes.filter((s) => s.granted).length;

          return (
            <div
              key={integ.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-2xs">
                      {getCategoryIcon(integ.category)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {integ.name}
                      </h4>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {integ.badge} • {integ.authMethod}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {integ.description}
                </p>

                {/* Endpoint & Last Sync */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Endpoint:</span>
                    <span className="font-mono text-slate-800 truncate max-w-[170px]" title={integ.endpointUrl}>
                      {integ.endpointUrl}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Last Sync:</span>
                    <span className="text-slate-700 font-medium">{integ.lastSyncAt}</span>
                  </div>
                  {isConnected && (
                    <div className="flex items-center justify-between text-slate-500 pt-0.5">
                      <span>Rate Limit:</span>
                      <span className="font-semibold text-slate-800">
                        {integ.rateLimit.used} / {integ.rateLimit.max} ({integ.rateLimit.resetWindow})
                      </span>
                    </div>
                  )}
                </div>

                {/* Scopes & Safety */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Permissions: <strong className="text-slate-800">{grantedCount} of {integ.scopes.length} active</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedInteg(integ)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleTestSync(integ)}
                  disabled={!isConnected || isSyncingId === integ.id}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-40 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingId === integ.id ? 'animate-spin' : ''}`} />
                  <span>{isSyncingId === integ.id ? 'Testing...' : 'Test Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleConnection(integ)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isConnected
                      ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                      : 'text-white bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration & Scopes Modal */}
      {selectedInteg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  {getCategoryIcon(selectedInteg.category)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedInteg.name} Configuration
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    API Scopes, Safety Limits & Automated Fallback
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInteg(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scopes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Permission Scopes & Least Privilege
                </label>
                <span className="text-[11px] text-slate-400">Toggle to restrict AI actions</span>
              </div>

              <div className="space-y-2">
                {selectedInteg.scopes.map((scope) => (
                  <div
                    key={scope.key}
                    onClick={() => handleToggleScope(scope.key)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                      scope.granted
                        ? 'bg-slate-50/80 border-slate-300'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{scope.name}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            scope.risk === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : scope.risk === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {scope.risk} risk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {scope.description}
                      </p>
                    </div>

                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={scope.granted}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anti-Hallucination Fallback Configuration */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Safe Fallback Policy (No Hallucinations)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                If the integration encounters a 5xx timeout, rate-limit, or network error, the AI is blocked from guessing inventory or orders, and sends this message before escalating:
              </p>
              <textarea
                value={selectedInteg.fallbackPolicy.fallbackMessage}
                onChange={(e) => handleUpdateFallbackMessage(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedInteg(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
