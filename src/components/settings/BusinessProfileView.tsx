import React, { useState } from 'react';
import {
  BusinessProfile,
  ServiceSettings,
  DataRetentionSettings,
  CustomerErasureRequest,
} from '../../types/businessSettings';
import {
  Building2,
  Clock,
  Globe,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  MessageSquare,
  Lock,
  Coins,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';


interface BusinessProfileViewProps {
  profile: BusinessProfile;
  service: ServiceSettings;
  retention: DataRetentionSettings;
  erasureRequests: CustomerErasureRequest[];
  onSaveProfile: (profile: BusinessProfile) => void;
  onSaveService: (service: ServiceSettings) => void;
  onSaveRetention: (retention: DataRetentionSettings) => void;
  onExecuteErasure: (identifier: string, channel: 'messenger' | 'whatsapp') => void;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  profile,
  service,
  retention,
  erasureRequests,
  onSaveProfile,
  onSaveService,
  onSaveRetention,
  onExecuteErasure,
}) => {
  const {
    currencies,
    activeTenantCurrency,
    selectedTenantId,
    setTenantCurrency,
    formatForActiveTenant,
  } = useCurrency();

  const [activeTab, setActiveTab] = useState<'profile' | 'service' | 'data'>('profile');


  // Local editing states
  const [localProfile, setLocalProfile] = useState<BusinessProfile>(profile);
  const [localService, setLocalService] = useState<ServiceSettings>(service);
  const [localRetention, setLocalRetention] = useState<DataRetentionSettings>(retention);

  // Erasure form state
  const [erasureInput, setErasureInput] = useState('');
  const [erasureChannel, setErasureChannel] = useState<'messenger' | 'whatsapp'>('whatsapp');
  const [erasureConfirmed, setErasureConfirmed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAll = () => {
    if (activeTab === 'profile') {
      onSaveProfile(localProfile);
      showToast('Business profile updated successfully');
    } else if (activeTab === 'service') {
      onSaveService(localService);
      showToast('Service & delivery settings saved');
    } else {
      onSaveRetention(localRetention);
      showToast('Data retention policies saved');
    }
  };

  const handleTriggerErasure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!erasureInput.trim()) return;
    onExecuteErasure(erasureInput.trim(), erasureChannel);
    showToast(`GDPR Erasure executed for ${erasureInput}`);
    setErasureInput('');
    setErasureConfirmed(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Internal Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Business Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'service'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Service & Logistics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'data'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data & Retention
          </button>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>

      {/* 1. Business Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">General Company Information</p>
              <p className="text-slate-500 text-xs">
                Essential business context injected automatically into the AI system prompt and customer greeting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={localProfile.businessName}
                  onChange={(e) => setLocalProfile({ ...localProfile, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={localProfile.industry}
                  onChange={(e) => setLocalProfile({ ...localProfile, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Business Description</label>
                <textarea
                  rows={2}
                  value={localProfile.businessDescription}
                  onChange={(e) => setLocalProfile({ ...localProfile, businessDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Website</label>
                <input
                  type="url"
                  value={localProfile.website}
                  onChange={(e) => setLocalProfile({ ...localProfile, website: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={localProfile.contactPhone}
                  onChange={(e) => setLocalProfile({ ...localProfile, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={localProfile.supportEmail}
                  onChange={(e) => setLocalProfile({ ...localProfile, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={localProfile.timeZone}
                  onChange={(e) => setLocalProfile({ ...localProfile, timeZone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Operating Currency & Financial Localization Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Tenant Operating Currency</h4>
                  <p className="text-slate-500 text-xs">
                    Choose the currency used across all analytics, token bills, order lookups, and message costs for this tenant.
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 self-start sm:self-auto font-mono">
                Active: {activeTenantCurrency.code} ({activeTenantCurrency.symbol})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  Select Currency for Workspace
                </label>
                <select
                  value={activeTenantCurrency.code}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setTenantCurrency(selectedTenantId, newCode);
                    showToast(`Operating currency updated to ${newCode} (${currencies.find((c) => c.code === newCode)?.name})`);
                  }}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold text-slate-900 text-xs"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) — {curr.name} (1 USD = {curr.exchangeRateFromUSD} {curr.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Configured and maintained globally in Platform Admin Settings.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <span className="font-bold text-slate-900 block">Currency Specifications</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Exchange Rate:</span>
                    <span className="font-mono font-bold text-slate-900">
                      1 USD = {activeTenantCurrency.exchangeRateFromUSD} {activeTenantCurrency.code}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Symbol Placement:</span>
                    <span className="font-medium text-slate-900">
                      {activeTenantCurrency.symbolPosition === 'before' ? 'Before amount' : 'After amount'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Live Sample ($100 USD):</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatForActiveTenant(100)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Decimal Precision:</span>
                    <span className="font-mono text-slate-900">
                      {activeTenantCurrency.decimalPlaces} decimals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 2. Service & Logistics Tab */}
      {activeTab === 'service' && (
        <div className="space-y-5">
          {/* Delivery Areas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Delivery Zones & Courier Partners</p>
              <p className="text-slate-500 text-xs">
                Delivery estimates and shipping fee rules provided to customers inquiring about orders.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Coverage Zone</th>
                    <th className="px-4 py-2.5">Courier Partner</th>
                    <th className="px-4 py-2.5">Delivery Time</th>
                    <th className="px-4 py-2.5">Fee (BDT)</th>
                    <th className="px-4 py-2.5">Cash On Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localService.deliveryAreas.map((area, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">{area.zone}</td>
                      <td className="px-4 py-3 text-slate-700">{area.courierPartner}</td>
                      <td className="px-4 py-3 text-slate-700">{area.estimatedDelivery}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">৳{area.standardFeeBDT}</td>
                      <td className="px-4 py-3">
                        {area.cashOnDeliveryAvailable ? (
                          <span className="text-emerald-700 font-medium">Available</span>
                        ) : (
                          <span className="text-slate-400">Prepaid only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Out of hours & Greetings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Customer Support Hours & Out-of-Hours Policy</p>
              <p className="text-slate-500 text-xs">
                Control how the system behaves when messages arrive outside standard operating windows.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Support Hours Label</label>
                  <input
                    type="text"
                    value={localService.customerSupportHours}
                    onChange={(e) => setLocalService({ ...localService, customerSupportHours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Out-of-Hours Mode</label>
                  <select
                    value={localService.outOfHoursBehavior}
                    onChange={(e) =>
                      setLocalService({
                        ...localService,
                        outOfHoursBehavior: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="automated_faq_and_queue">
                      Answer FAQs automatically & queue complex queries for morning
                    </option>
                    <option value="polite_closed_notice">
                      Send polite "Office Closed" notice and silence AI
                    </option>
                    <option value="emergency_ai_only">
                      Full autonomous AI 24/7 without human handover
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Greeting</label>
                <textarea
                  rows={2}
                  value={localService.defaultGreetingMessage}
                  onChange={(e) => setLocalService({ ...localService, defaultGreetingMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Out-of-Hours Auto-Notice</label>
                <textarea
                  rows={2}
                  value={localService.outOfHoursMessage}
                  onChange={(e) => setLocalService({ ...localService, outOfHoursMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Data & Retention Tab */}
      {activeTab === 'data' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <p className="font-bold text-slate-900 text-sm">Conversation Storage & Privacy Retention</p>
              <p className="text-slate-500 text-xs">
                Control how long conversations and customer context are stored in database tables before automated purge.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Retention Window</label>
                <select
                  value={localRetention.retentionWindow}
                  onChange={(e) =>
                    setLocalRetention({
                      ...localRetention,
                      retentionWindow: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="30_days">30 Days (Strict Compliance)</option>
                  <option value="90_days">90 Days (Recommended for E-Commerce)</option>
                  <option value="365_days">1 Year (365 Days)</option>
                  <option value="indefinite">Indefinite (Until Customer Erasure)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Privacy Notice Link</label>
                <input
                  type="url"
                  value={localRetention.privacyNoticeUrl}
                  onChange={(e) => setLocalRetention({ ...localRetention, privacyNoticeUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localRetention.autoPurgeCustomerPII}
                    onChange={(e) =>
                      setLocalRetention({ ...localRetention, autoPurgeCustomerPII: e.target.checked })
                    }
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-800">
                    Auto-mask sensitive payment cards & bank transaction tokens in customer messages
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localRetention.autoPurgeVoiceNotes}
                    onChange={(e) =>
                      setLocalRetention({ ...localRetention, autoPurgeVoiceNotes: e.target.checked })
                    }
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-800">
                    Automatically delete raw WhatsApp voice audio files after transcription (keep text only)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* GDPR / Privacy Erasure Workflow */}
          <div className="bg-white rounded-2xl border border-red-200/80 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-red-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Customer Right-to-Erasure Workflow (GDPR & Data Privacy)
                </p>
                <p className="text-slate-500 text-xs">
                  Permanently purge a customer's conversation history, AI memory profile, and contact records upon request.
                </p>
              </div>
            </div>

            <form onSubmit={handleTriggerErasure} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Identifier (Phone / FB PSID / Email)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1712-000000 or FB PSID"
                    value={erasureInput}
                    onChange={(e) => setErasureInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Channel</label>
                  <select
                    value={erasureChannel}
                    onChange={(e) => setErasureChannel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                  >
                    <option value="whatsapp">WhatsApp Business</option>
                    <option value="messenger">Facebook Messenger</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={erasureConfirmed}
                  onChange={(e) => setErasureConfirmed(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-600"
                />
                <span className="text-slate-700 font-medium">
                  I confirm this customer erasure is verified and understand it cannot be undone.
                </span>
              </label>

              <button
                type="submit"
                disabled={!erasureConfirmed || !erasureInput.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Execute Verified Erasure
              </button>
            </form>

            {/* Recent Erasure Records */}
            {erasureRequests.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Recent Verified Erasure Logs
                </p>
                <div className="space-y-2">
                  {erasureRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{req.customerIdentifier}</span>
                        <span className="text-slate-500 text-[11px] block">
                          Purged {req.recordsPurgedCount} messages · Hash: {req.verificationHash}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Purged
                        </span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">{req.requestedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
