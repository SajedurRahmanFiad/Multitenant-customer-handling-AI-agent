import React, { useState } from 'react';
import {
  INITIAL_MESSENGER_CONNECTION,
  INITIAL_WHATSAPP_CONNECTION,
  INITIAL_WEBHOOK_EVENTS,
  INITIAL_BUSINESS_INTEGRATIONS,
  INITIAL_HEALTH_LOGS,
} from '../data/channelsMockData';
import {
  MessengerConnection,
  WhatsAppConnection,
  WebhookDiagnosticEvent,
  BusinessIntegration,
  IntegrationsHealthLog,
} from '../types/channels';
import { MessengerConnectionView } from '../components/channels/MessengerConnectionView';
import { WhatsAppConnectionView } from '../components/channels/WhatsAppConnectionView';
import { WebhooksDiagnosticView } from '../components/channels/WebhooksDiagnosticView';
import { BusinessSystemsView } from '../components/channels/BusinessSystemsView';
import { IntegrationsHealthView } from '../components/channels/IntegrationsHealthView';
import {
  MessageSquare,
  Phone,
  Activity,
  Layers,
  HeartPulse,
  CheckCircle2,
} from 'lucide-react';
import { SubPageNav } from '../components/navigation/SubPageNav';

type ChannelSubTab = 'messenger' | 'whatsapp' | 'webhooks' | 'business_systems' | 'health';

export const ChannelsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ChannelSubTab>('messenger');

  // State for all subpage domains
  const [messengerConnection, setMessengerConnection] = useState<MessengerConnection>(
    INITIAL_MESSENGER_CONNECTION
  );
  const [whatsAppConnection, setWhatsAppConnection] = useState<WhatsAppConnection>(
    INITIAL_WHATSAPP_CONNECTION
  );
  const [webhookEvents, setWebhookEvents] = useState<WebhookDiagnosticEvent[]>(
    INITIAL_WEBHOOK_EVENTS
  );
  const [businessIntegrations, setBusinessIntegrations] = useState<BusinessIntegration[]>(
    INITIAL_BUSINESS_INTEGRATIONS
  );
  const [healthLogs, setHealthLogs] = useState<IntegrationsHealthLog[]>(
    INITIAL_HEALTH_LOGS
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Simulate an inbound webhook arriving live
  const handleTriggerTestEvent = () => {
    const isWa = Math.random() > 0.5;
    const newEvent: WebhookDiagnosticEvent = {
      id: `evt_sim_${Date.now()}`,
      correlationId: `corr_sim_${Math.random().toString(36).substring(2, 8)}`,
      channel: isWa ? 'whatsapp' : 'messenger',
      eventType: isWa ? 'messages.text' : 'messaging_postbacks',
      senderIdMasked: isWa ? 'wa_8801712***999' : 'psid_928104***112',
      status: 'processed',
      retryCount: 0,
      latencyMs: Math.floor(Math.random() * 40) + 25,
      timestamp: new Date().toLocaleTimeString(),
      sanitizedSummary: isWa
        ? 'Customer asked for latest size chart in chat'
        : 'Customer clicked "Track My Parcel" persistent menu button',
      rawPayloadRedacted: {
        simulated: true,
        source: isWa ? 'Meta Cloud API Edge Node' : 'Meta Graph API Webhook',
        payload_security: 'Token & PII masked in sandbox',
      },
    };

    setWebhookEvents((prev) => [newEvent, ...prev]);
    showToast(`Live inbound webhook simulated: [${newEvent.channel}] ${newEvent.correlationId}`);
  };

  const handleUpdateBusinessIntegration = (updated: BusinessIntegration) => {
    setBusinessIntegrations((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  };

  const SUBPAGES = [
    {
      id: 'messenger' as ChannelSubTab,
      label: 'Messenger',
      icon: MessageSquare,
      indicatorDot: messengerConnection.status === 'connected' ? ('connected' as const) : ('disconnected' as const),
      group: 'MESSAGING CHANNELS',
    },
    {
      id: 'whatsapp' as ChannelSubTab,
      label: 'WhatsApp Business',
      icon: Phone,
      indicatorDot: whatsAppConnection.status === 'connected' ? ('connected' as const) : ('disconnected' as const),
      group: 'MESSAGING CHANNELS',
    },
    {
      id: 'webhooks' as ChannelSubTab,
      label: 'Webhooks & Delivery',
      icon: Activity,
      count: webhookEvents.length,
      group: 'INFRASTRUCTURE',
    },
    {
      id: 'business_systems' as ChannelSubTab,
      label: 'Business Systems',
      icon: Layers,
      badge: `${businessIntegrations.filter((i) => i.status === 'connected').length} Active`,
      badgeVariant: 'success' as const,
      group: 'INFRASTRUCTURE',
    },
    {
      id: 'health' as ChannelSubTab,
      label: 'Health & Fallback',
      icon: HeartPulse,
      badge: '99.98%',
      group: 'INFRASTRUCTURE',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Tabs (Vertical Sidebar on Desktop, Horizontal Scroll on Mobile) */}
        <SubPageNav
          tabs={SUBPAGES}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
        />

        {/* Subpage Contents */}
        <div className="flex-1 min-w-0 w-full">
          {activeTab === 'messenger' && (
            <MessengerConnectionView
              connection={messengerConnection}
              onUpdateConnection={setMessengerConnection}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppConnectionView
              connection={whatsAppConnection}
              onUpdateConnection={setWhatsAppConnection}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'webhooks' && (
            <WebhooksDiagnosticView
              events={webhookEvents}
              onTriggerTestEvent={handleTriggerTestEvent}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'business_systems' && (
            <BusinessSystemsView
              integrations={businessIntegrations}
              onUpdateIntegration={handleUpdateBusinessIntegration}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'health' && (
            <IntegrationsHealthView
              logs={healthLogs}
              onShowToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};
