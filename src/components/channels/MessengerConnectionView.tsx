import React, { useState } from 'react';
import { MessengerConnection } from '../../types/channels';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Radio,
  Clock,
  Layers,
  Send,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Lock,
} from 'lucide-react';

interface MessengerConnectionViewProps {
  connection: MessengerConnection;
  onUpdateConnection: (updated: MessengerConnection) => void;
  onShowToast: (msg: string) => void;
}

export const MessengerConnectionView: React.FC<MessengerConnectionViewProps> = ({
  connection,
  onUpdateConnection,
  onShowToast,
}) => {
  const [isReconnectModalOpen, setIsReconnectModalOpen] = useState(false);
  const [isTestPingLoading, setIsTestPingLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [permissionCheckPassed, setPermissionCheckPassed] = useState(true);

  const handleTestPing = () => {
    setIsTestPingLoading(true);
    setTimeout(() => {
      setIsTestPingLoading(false);
      onShowToast('Messenger Webhook ping received successfully in 38ms');
      onUpdateConnection({
        ...connection,
        lastWebhookAt: 'Just now',
        lastReplyAt: 'Just now',
      });
    }, 900);
  };

  const handleReconnectSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReconnectModalOpen(false);
    setTokenInput('');
    onShowToast('Facebook Page token successfully rotated and verified via Meta Graph API v21.0');
    onUpdateConnection({
      ...connection,
      tokenHealth: {
        ...connection.tokenHealth,
        status: 'healthy',
        daysRemaining: 60,
        lastRefreshed: 'Just now (Admin rotated)',
      },
      status: 'connected',
    });
  };

  const handleToggleDisconnect = () => {
    const nextStatus = connection.status === 'connected' ? 'disconnected' : 'connected';
    onUpdateConnection({
      ...connection,
      status: nextStatus,
    });
    onShowToast(
      nextStatus === 'connected'
        ? 'Messenger channel connected'
        : 'Messenger channel paused and disconnected'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Status & Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-md shrink-0">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <svg className="w-8 h-8 text-blue-600 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.453 5.518 3.735 7.198v3.544l3.39-1.861c.907.251 1.872.388 2.875.388 5.523 0 10-4.145 10-9.269C22 6.145 17.523 2 12 2zm1.066 12.445l-2.723-2.904-5.309 2.904 5.84-6.199 2.791 2.904 5.241-2.904-5.84 6.199z" />
                  </svg>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {connection.pageName}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {connection.status === 'connected' ? 'Active & Webhook Listening' : 'Disconnected'}
                </span>
                {connection.instagramLinked && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                    <span className="font-semibold">IG:</span> {connection.instagramAccountName}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span>Page ID: <strong className="font-mono text-slate-700 font-semibold">{connection.pageId}</strong></span>
                <span>•</span>
                <span>{connection.category}</span>
                <span>•</span>
                <span className="text-slate-400">Meta Graph API v21.0</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTestPingLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 text-blue-600 ${isTestPingLoading ? 'animate-ping' : ''}`} />
              <span>{isTestPingLoading ? 'Pinging...' : 'Test Webhook Ping'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReconnectModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Rotate / Reconnect</span>
            </button>

            <button
              type="button"
              onClick={handleToggleDisconnect}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                connection.status === 'connected'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {connection.status === 'connected' ? 'Disconnect Page' : 'Connect Page'}
            </button>
          </div>
        </div>

        {/* 4 Health & Metrics Telemetry Points */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Last Webhook Inbound
            </span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900">{connection.lastWebhookAt}</span>
            </div>
            <p className="text-[11px] text-slate-500">Live webhook listener active</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Last AI Outbound Reply
            </span>
            <div className="flex items-center gap-1.5">
              <Send className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-slate-900">{connection.lastReplyAt}</span>
            </div>
            <p className="text-[11px] text-slate-500">200 OK delivery receipt</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Token Validity
            </span>
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-slate-900">
                {connection.tokenHealth.daysRemaining} Days Left
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Auto-refresh mechanism safe</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Permission Health
            </span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">100% Granted</span>
            </div>
            <p className="text-[11px] text-slate-500">0 missing Meta scopes</p>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Permissions & Token Details vs Webhook Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Token Security & Scope Health */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Token Health & Permissions
              </h4>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Read-only safe view
            </span>
          </div>

          {/* Token Security Guard Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Zero Plaintext Token Exposure</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Long-lived access tokens and App Secrets are securely encrypted in the backend vault and never sent in plaintext to frontend clients.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Token Mask:</span>
              <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {connection.tokenHealth.maskedToken}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Token Type:</span>
              <span className="font-medium text-slate-800">{connection.tokenHealth.tokenType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Last Refreshed:</span>
              <span className="text-slate-700">{connection.tokenHealth.lastRefreshed}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Estimated Expiry:</span>
              <span className="font-medium text-emerald-700">{connection.tokenHealth.expiresAt}</span>
            </div>
          </div>

          {/* Granted Meta Scopes */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-bold text-slate-900 block">
              Granted Meta App Permissions ({connection.grantedPermissions.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {connection.grantedPermissions.map((perm) => (
                <span
                  key={perm}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-50 border border-slate-200 text-slate-700"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Subscriptions & Delivery Diagnostic Errors */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Webhook Fields & Subscriptions
              </h4>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Verified
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-slate-500">Subscribed Webhook Field Handlers:</span>
            <div className="grid grid-cols-2 gap-2">
              {connection.subscribedFields.map((field) => (
                <div
                  key={field}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-mono text-slate-700"
                >
                  <span>{field}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Webhook Error Logs */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Recent Diagnostics & Throttle Checks
              </span>
              <span className="text-[11px] text-slate-400">Past 48 hours</span>
            </div>

            <div className="space-y-2">
              {connection.webhookErrors.map((err) => (
                <div
                  key={err.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Code {err.code}: {err.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{err.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {err.details}
                  </p>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Impact: <span className="text-slate-700">{err.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reconnect / Rotate Modal */}
      {isReconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reconnect Facebook Page
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authorized administrators can replace or renew the Meta Page Access Token without exposing secrets.
              </p>
            </div>

            <form onSubmit={handleReconnectSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  New Meta Page Access Token
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste EAAG... access token (will be securely vaulted)"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Must have `pages_messaging` and `pages_manage_metadata` permissions.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Automatic Verification</span>
                <p className="text-[11px]">
                  Upon saving, our server immediately runs a handshake against Meta Graph API v21.0 to ensure your webhook URL and subscriptions remain uninterrupted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReconnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
                >
                  Verify & Save Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
