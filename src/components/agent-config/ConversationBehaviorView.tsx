import React from 'react';
import { ConversationBehaviorConfig } from '../../types/agentConfig';
import {
  MessageSquare,
  Clock,
  Sparkles,
  ShoppingBag,
  UserCheck,
  FileText,
  AlertCircle,
  BellRing,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface ConversationBehaviorViewProps {
  config: ConversationBehaviorConfig;
  onChange: (updated: ConversationBehaviorConfig) => void;
}

export const ConversationBehaviorView: React.FC<ConversationBehaviorViewProps> = ({
  config,
  onChange,
}) => {
  const handleToggle = (field: keyof ConversationBehaviorConfig) => {
    onChange({
      ...config,
      [field]: !config[field],
    });
  };

  const handleFieldChange = (field: keyof ConversationBehaviorConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleContactFieldToggle = (
    field: 'phone' | 'email' | 'delivery_address' | 'order_id'
  ) => {
    let updated = [...config.requiredContactFields];
    if (updated.includes(field)) {
      updated = updated.filter((f) => f !== field);
    } else {
      updated.push(field);
    }
    onChange({
      ...config,
      requiredContactFields: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Immediate Greeting & Pacing */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Greeting Pacing & Conversational Initiation</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure how quickly the AI engages when a customer sends a message on Messenger or WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Send Immediate Greeting
              </span>
              <span className="text-[11px] text-slate-500">
                Trigger welcome reply instantly upon first message receipt
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('immediateGreeting')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                config.immediateGreeting ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.immediateGreeting ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Humanized Typing Delay
              </span>
              <span className="text-[11px] text-slate-500">
                Pause briefly to simulate natural agent typing
              </span>
            </div>
            <select
              value={config.greetingDelaySeconds}
              onChange={(e) => handleFieldChange('greetingDelaySeconds', Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              <option value={0}>0s (Instant)</option>
              <option value={1}>1 second</option>
              <option value={2}>2 seconds</option>
              <option value={3}>3 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Recommendations & Commercial Suggestions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Proactive Product Suggestions & Commerce</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Allow the AI to recommend catalog items when customers ask about styling or stock.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Proactively Suggest Relevant Products
              </span>
              <span className="text-[11px] text-slate-500">
                AI injects product cards or catalog links from the Product Catalogue
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('proactivelySuggestProducts')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                config.proactivelySuggestProducts ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.proactivelySuggestProducts ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {config.proactivelySuggestProducts && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Suggestion Trigger Strategy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'browse_intent',
                    label: 'Browse Intent',
                    desc: 'When customer asks general questions (e.g. "কি কি হুডি আছে?")',
                  },
                  {
                    id: 'out_of_stock',
                    label: 'Out of Stock Alternative',
                    desc: 'Recommend similar variant only when requested size is sold out',
                  },
                  {
                    id: 'cross_sell',
                    label: 'Cross-Sell Accessories',
                    desc: 'Suggest complementary gadgets upon order confirmation',
                  },
                ].map((sOpt) => (
                  <label
                    key={sOpt.id}
                    onClick={() => handleFieldChange('productSuggestionTrigger', sOpt.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      config.productSuggestionTrigger === sOpt.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">{sOpt.label}</div>
                    <div
                      className={`text-[11px] mt-1 ${
                        config.productSuggestionTrigger === sOpt.id
                          ? 'text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {sOpt.desc}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Contact Collection */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Lead Capture & Contact Acquisition</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect missing delivery coordinates and contact info before transferring orders to courier.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Collect Customer Contact Details
              </span>
              <span className="text-[11px] text-slate-500">
                Politely prompt customer for missing details when purchase intent is detected
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('collectContactDetails')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                config.collectContactDetails ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.collectContactDetails ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {config.collectContactDetails && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Mandatory Fields to Collect
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'phone' as const, label: 'Phone Number (bKash/WhatsApp)' },
                  { id: 'delivery_address' as const, label: 'Courier Delivery Address' },
                  { id: 'email' as const, label: 'Customer Email' },
                  { id: 'order_id' as const, label: 'Order / Invoice ID' },
                ].map((item) => {
                  const isChecked = config.requiredContactFields.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => handleContactFieldToggle(item.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs font-semibold flex items-center gap-2 transition-colors ${
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
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automated Follow-Up & Policy Limits */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Automated Follow-Up & Inactivity Timers</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Re-engage inactive threads while respecting WhatsApp and Meta 24-hour messaging windows.
          </p>
        </div>

        {/* Channel Policy Compliance Alert */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Meta Messaging Window Compliance:</span>
            <p className="text-[11px] leading-relaxed">
              Automated re-engagement messages are strictly restricted to the 24-hour customer service window. Follow-ups will be automatically cancelled if the window expires or user opts out.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Auto Follow-up After Unanswered Question
              </span>
              <span className="text-[11px] text-slate-500">
                Send a gentle reminder if a customer goes silent midway through a resolution
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoFollowUpAfterUnanswered')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                config.autoFollowUpAfterUnanswered ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.autoFollowUpAfterUnanswered ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {config.autoFollowUpAfterUnanswered && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Follow-Up Delay
                </label>
                <select
                  value={config.followUpDelayMinutes}
                  onChange={(e) => handleFieldChange('followUpDelayMinutes', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes (Recommended)</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Follow-up Message Copy
                </label>
                <input
                  type="text"
                  value={config.followUpMessage}
                  onChange={(e) => handleFieldChange('followUpMessage', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Session Inactivity Timeout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Session Inactivity Timeout
              </label>
              <select
                value={config.inactivityTimeoutMinutes}
                onChange={(e) => handleFieldChange('inactivityTimeoutMinutes', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Action Upon Inactivity
              </label>
              <select
                value={config.inactivityAction}
                onChange={(e) => handleFieldChange('inactivityAction', e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
              >
                <option value="send_nudge">Send gentle nudge then resolve</option>
                <option value="close_session">Quietly mark resolved</option>
                <option value="human_queue">Transfer to unassigned staff queue</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Handover Summarization & Complaint Detection */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Handover Summaries & Complaint Detection</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate bulleted executive summaries before transferring conversations to live staff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Summarize Before Handover
              </span>
              <span className="text-[11px] text-slate-500">
                AI posts an internal note summarizing customer problem & intent
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('summarizeBeforeHandover')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                config.summarizeBeforeHandover ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.summarizeBeforeHandover ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Automatic Complaint Detection
              </span>
              <span className="text-[11px] text-slate-500">
                Escalate when severe dissatisfaction or repeated issues are detected
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('detectComplaints')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                config.detectComplaints ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.detectComplaints ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
