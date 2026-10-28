import React, { useState } from 'react';
import {
  EscalationRule,
  UserNotificationPreference,
  SystemNotificationItem,
} from '../../types/notifications';
import {
  Bell,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Volume2,
  Mail,
  Smartphone,
  CheckCircle2,
  Sliders,
  Check,
  X,
  Radio,
  Zap,
} from 'lucide-react';

interface NotificationsEscalationsViewProps {
  rules: EscalationRule[];
  preferences: UserNotificationPreference[];
  notifications: SystemNotificationItem[];
  onToggleRule: (ruleId: string) => void;
  onUpdatePreference: (categoryIndex: number, channel: 'inApp' | 'email' | 'smsWhatsapp') => void;
  onMarkNotificationRead: (notifId: string) => void;
}

export const NotificationsEscalationsView: React.FC<NotificationsEscalationsViewProps> = ({
  rules,
  preferences,
  notifications,
  onToggleRule,
  onUpdatePreference,
  onMarkNotificationRead,
}) => {
  const [activeTab, setActiveTab] = useState<'escalation_rules' | 'preferences' | 'feed'>('escalation_rules');
  const [quietHoursStart, setQuietHoursStart] = useState('23:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);

  return (
    <div className="space-y-6">
      {/* Internal Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('escalation_rules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'escalation_rules'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Escalation Triggers ({rules.filter((r) => r.isEnabled).length} active)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'preferences'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Channel & Quiet Hours
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'feed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Feed ({notifications.filter((n) => !n.isRead).length} unread)
          </button>
        </div>
      </div>

      {/* 1. Escalation Rules Tab */}
      {activeTab === 'escalation_rules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Automated Operational Escalation Rules</p>
              <p className="text-slate-500 text-xs">
                Trigger alerts or transfer conversations to human supervisors whenever safety or operational thresholds are breached.
              </p>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                    rule.isEnabled
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        rule.triggerType === 'negative_sentiment_complaint' ||
                        rule.triggerType === 'channel_disconnected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {rule.triggerType === 'negative_sentiment_complaint' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{rule.name}</span>
                        {rule.thresholdValue && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                            Threshold: {rule.thresholdValue}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                          Routes to: {rule.assignedRole}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{rule.description}</p>
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                        <span className="font-medium text-slate-600">Dispatches via:</span>
                        {rule.notifyChannels.map((c) => (
                          <span key={c} className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium uppercase text-[9px]">
                            {c.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => onToggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rule.isEnabled ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          rule.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Preferences & Quiet Hours */}
      {activeTab === 'preferences' && (
        <div className="space-y-5">
          {/* Channel Preferences Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Staff Notification Delivery Channels</p>
              <p className="text-slate-500 text-xs">
                Configure where alert notifications should be broadcast across the workspace.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Alert Category</th>
                    <th className="px-4 py-3 text-center">In-App Banner & Sound</th>
                    <th className="px-4 py-3 text-center">Email Dispatch</th>
                    <th className="px-4 py-3 text-center">SMS / WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preferences.map((pref, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{pref.category}</span>
                          <span className="text-[11px] text-slate-500">{pref.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={pref.inApp}
                          onChange={() => onUpdatePreference(idx, 'inApp')}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={pref.email}
                          onChange={() => onUpdatePreference(idx, 'email')}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={pref.smsWhatsapp}
                          onChange={() => onUpdatePreference(idx, 'smsWhatsapp')}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">Quiet Hours (Non-Urgent Alerts)</p>
                <p className="text-slate-500 text-xs">
                  Mute non-critical sound pings and SMS during rest hours. P1 critical incidents override quiet hours.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs font-semibold text-slate-800">Enable Quiet Hours</span>
              </label>
            </div>

            {quietHoursEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quiet Hours Start</label>
                  <input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quiet Hours End</label>
                  <input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. System Notification Feed */}
      {activeTab === 'feed' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="pb-2 border-b border-slate-100">
            <p className="font-bold text-slate-900 text-sm">System & Escalation Event Feed</p>
            <p className="text-slate-500 text-xs">
              Live notifications recorded across all workspace modules.
            </p>
          </div>

          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                  notif.isRead ? 'bg-slate-50/60 border-slate-200' : 'bg-white border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      notif.type === 'urgent'
                        ? 'bg-red-50 text-red-700'
                        : notif.type === 'warning'
                        ? 'bg-amber-50 text-amber-700'
                        : notif.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{notif.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                        {notif.sourceModule}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{notif.message}</p>
                    <span className="text-slate-400 text-[10px] mt-1 block">{notif.timestamp}</span>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => onMarkNotificationRead(notif.id)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
