import React, { useState } from 'react';
import { WhatsAppConnection, WhatsAppTemplate } from '../../types/channels';
import {
  CheckCircle2,
  RefreshCw,
  Phone,
  ShieldCheck,
  Radio,
  FileText,
  Lock,
  ChevronRight,
} from 'lucide-react';

interface WhatsAppConnectionViewProps {
  connection: WhatsAppConnection;
  onUpdateConnection: (updated: WhatsAppConnection) => void;
  onShowToast: (msg: string) => void;
}

export const WhatsAppConnectionView: React.FC<WhatsAppConnectionViewProps> = ({
  connection,
  onUpdateConnection,
  onShowToast,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  const handleToggleDisconnect = () => {
    const nextStatus = connection.status === 'connected' ? 'disconnected' : 'connected';
    onUpdateConnection({
      ...connection,
      status: nextStatus,
    });
    onShowToast(
      nextStatus === 'connected'
        ? 'WhatsApp Business channel active'
        : 'WhatsApp Business channel disconnected'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Overview & Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-500 p-0.5 shadow-md shrink-0">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <svg className="w-8 h-8 text-emerald-600 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  {connection.displayName}
                  {connection.hasGreenTick && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Official Green Tick Verified
                    </span>
                  )}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {connection.status === 'connected' ? 'Cloud API Active' : 'Disconnected'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <strong className="font-mono text-slate-800 font-semibold">{connection.phoneNumber}</strong>
                </span>
                <span>•</span>
                <span>Phone ID: <strong className="font-mono text-slate-700">{connection.phoneNumberId}</strong></span>
                <span>•</span>
                <span>WABA ID: <strong className="font-mono text-slate-700">{connection.wabaId}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live message test is not configured</span>
            </button>

            <button
              type="button"
              onClick={handleToggleDisconnect}
              disabled={connection.status !== 'connected'}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                connection.status === 'connected'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {connection.status === 'connected' ? 'Disconnect WABA' : 'Connect with Facebook above'}
            </button>
          </div>
        </div>

        {/* 4 Quality & Tier Performance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block">
                Quality Rating
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-emerald-800">{connection.qualityRating === 'UNKNOWN' ? 'Not reported' : connection.qualityRating}</span>
            </div>
            <p className="text-[11px] text-slate-500">Quality rating returned by Meta, when available.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Messaging Tier Limit
            </span>
            <div className="text-sm font-bold text-slate-900">
              {connection.messagingTierLimit || 'Not reported by Meta'}
            </div>
            <p className="text-[10px] text-slate-500 pt-0.5">
              Message volume is not collected by this backend.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Inbound / Outbound
            </span>
            <div className="space-y-0.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Inbound:</span>
                <span className="font-semibold text-slate-800">{connection.lastInboundAt || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outbound:</span>
                <span className="font-semibold text-slate-800">{connection.lastOutboundAt || 'Not recorded'}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">Webhook activity logging is not configured here.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Cloud Throughput
            </span>
            <div className="text-sm font-bold text-slate-900">
              {connection.throughputLimit || 'Not reported by Meta'}
            </div>
            <p className="text-[11px] text-slate-500">Throughput metrics are not collected by this backend.</p>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Pre-approved WhatsApp Templates & System User Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Manager (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Pre-Approved Message Templates ({connection.templates.length})
              </h4>
            </div>
            <button
              type="button"
              disabled
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/70 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Template sync is not configured</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            WhatsApp requires pre-approved HSM templates for sending proactive notifications (order confirmations, delivery dispatches, and customer care re-engagement outside the 24-hour service window).
          </p>

          <div className="space-y-3">
            {connection.templates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl)}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 transition cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-900">
                      {tmpl.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {tmpl.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200 text-slate-700">
                      {tmpl.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Updated {tmpl.lastUpdated}
                  </span>
                </div>

                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 font-sans leading-relaxed">
                  "{tmpl.bodySample}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Language: <strong className="text-slate-700 font-medium">{tmpl.language}</strong></span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    View Dynamic Parameters <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security & Permanent Token Vault */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Security & Meta Vault
              </h4>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Zero Leakage
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Token Masking Active</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Permanent system user access tokens are hidden from ordinary workspace members. Only admins can replace tokens via authenticated rotation.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Token Mask:</span>
              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {connection.maskedToken}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Token Type:</span>
              <span className="font-medium text-slate-800">{connection.tokenHealth.type}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Business Manager ID:</span>
              <span className="font-mono text-slate-700">{connection.businessManagerId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Last Verified:</span>
              <span className="text-slate-700">{connection.tokenHealth.lastRefreshed}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-xs font-bold text-slate-900 block">
              Auto-Recovery & Fallback
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Provider delivery and retry health are not measured by this connection screen.
            </p>
          </div>
        </div>
      </div>

      {/* Template Detail Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">
                  {selectedTemplate.name}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {selectedTemplate.category} • {selectedTemplate.language}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {selectedTemplate.status}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Template Text Body:</label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed">
                {selectedTemplate.bodySample}
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1">
              <span className="font-semibold block">Dynamic Variable Substitution</span>
              <p className="text-[11px]">
                Variables like <code>&#123;&#123;1&#125;&#125;</code> and <code>&#123;&#123;2&#125;&#125;</code> are filled automatically with the customer's name, order ID, or tracking number before sending.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
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
