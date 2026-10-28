export type ChannelConnectionStatus = 'connected' | 'degraded' | 'disconnected' | 'needs_reauth' | 'pending';

export interface MessengerConnection {
  pageName: string;
  pageId: string;
  category: string;
  avatarUrl?: string;
  instagramLinked: boolean;
  instagramAccountName?: string;
  status: ChannelConnectionStatus;
  grantedPermissions: string[];
  missingPermissions: string[];
  lastWebhookAt: string;
  lastReplyAt: string;
  tokenHealth: {
    status: 'healthy' | 'expiring_soon' | 'expired';
    daysRemaining: number;
    tokenType: string;
    lastRefreshed: string;
    expiresAt: string;
    maskedToken: string;
  };
  subscribedFields: string[];
  webhookErrors: Array<{
    id: string;
    timestamp: string;
    code: number;
    title: string;
    details: string;
    impact: string;
    resolved: boolean;
  }>;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'IN_REVIEW' | 'REJECTED';
  bodySample: string;
  lastUpdated: string;
}

export interface WhatsAppConnection {
  wabaName: string;
  wabaId: string;
  businessManagerId: string;
  phoneNumber: string;
  phoneNumberId: string;
  displayName: string;
  verificationStatus: 'verified' | 'unverified' | 'in_review';
  hasGreenTick: boolean;
  status: ChannelConnectionStatus;
  qualityRating: 'GREEN' | 'YELLOW' | 'RED';
  messagingTierLimit: string;
  current24hWindowSent: number;
  lastInboundAt: string;
  lastOutboundAt: string;
  maskedToken: string;
  tokenHealth: {
    status: 'healthy' | 'expiring_soon' | 'expired';
    type: 'System User Permanent Token' | 'User Access Token';
    lastRefreshed: string;
  };
  templates: WhatsAppTemplate[];
  throughputLimit: string;
}

export interface WebhookDiagnosticEvent {
  id: string;
  correlationId: string;
  channel: 'messenger' | 'whatsapp' | 'woocommerce' | 'steadfast';
  eventType: string;
  senderIdMasked: string;
  status: 'processed' | 'received' | 'duplicate_ignored' | 'failed';
  retryCount: number;
  latencyMs: number;
  timestamp: string;
  errorMessage?: string;
  sanitizedSummary: string;
  rawPayloadRedacted: Record<string, unknown>;
}

export interface IntegrationScope {
  key: string;
  name: string;
  description: string;
  granted: boolean;
  risk: 'low' | 'medium' | 'high';
}

export interface BusinessIntegration {
  id: string;
  name: string;
  category: 'ecommerce' | 'courier' | 'inventory' | 'payment' | 'crm' | 'custom_api';
  badge: string;
  description: string;
  status: ChannelConnectionStatus;
  endpointUrl: string;
  authMethod: 'OAuth 2.0' | 'API Key & Secret' | 'Webhook HMAC' | 'Bearer Token';
  lastSyncAt: string;
  rateLimit: {
    used: number;
    max: number;
    resetWindow: string;
  };
  scopes: IntegrationScope[];
  fallbackPolicy: {
    onFailAction: 'human_handover' | 'graceful_message' | 'retry_cached';
    fallbackMessage: string;
    preventHallucination: boolean;
  };
  stats: {
    callsToday: number;
    successRate: number;
    avgLatencyMs: number;
  };
}

export interface IntegrationsHealthLog {
  id: string;
  service: string;
  timestamp: string;
  type: 'rate_limit_warning' | 'credential_warning' | 'fallback_triggered' | 'uptime_check';
  message: string;
  status: 'resolved' | 'active' | 'info';
}
