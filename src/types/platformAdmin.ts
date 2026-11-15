export type PlatformAdminTab =
  | 'tenants'
  | 'currencies'
  | 'global_pipeline'
  | 'provider_registry'
  | 'queues';

// Global Pipeline Layer Template (Applies to all tenants globally)
export interface GlobalPipelineLayer {
  id: string;
  layerType:
    | 'intent_classification'
    | 'image_processing'
    | 'voice_processing'
    | 'knowledge_retrieval'
    | 'final_generation';
  layerOrder: number;
  title: string;
  subtitle: string;
  description: string;
  defaultModelId: string;
  defaultFallbackModelId?: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  systemPrompt: string;
  guidanceNotes: string;
  inputDescription: string;
  outputDescription: string;
  isMandatory: boolean;
  isActiveGlobally: boolean;
  lastUpdated: string;
}


// 1. Tenants / Client Management (No artificial plans or quota limits)
export interface TenantClient {
  id: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  currencyCode?: string; // e.g. "BDT", "USD", "EUR", "AED"
  pricePerMessage: number; // Cost in tenant's currency deducted per AI sent message
  walletBalance: number; // Current prepaid wallet balance in tenant's currency
  status: 'active' | 'suspended';
  connectedChannels: {
    messengerPages: number;
    whatsappNumbers: number;
  };
  primaryModel: string;
  monthlySpendUSD: number;
  monthlySpendBDT: number;
  conversationsThisMonth: number;
  messagesProcessedThisMonth: number;
  healthScorePercent: number;
  createdAt: string;
  lastActiveDate: string;
  supportNotes: string;
  assignedSupportOwner: string;
}



export interface SupportSessionSession {
  isActive: boolean;
  tenantId?: string;
  tenantName?: string;
  adminName?: string;
  reason?: string;
  startedAt?: string;
  expiresAt?: string;
  auditSessionId?: string;
}

// 2. AI Provider Registry
export interface AIProviderModel {
  id: string;
  modelId: string;
  displayName: string;
  provider: 'Google Gemini' | 'OpenAI' | 'Anthropic' | 'Groq / Llama' | 'Ollama Dedicated';
  apiKey: string;
  endpointUrl: string;
  capabilities: ('text' | 'vision' | 'tools' | 'json' | 'embeddings' | 'voice')[];
  costPerMillionInputUSD: number;
  costPerMillionOutputUSD: number;
  contextWindowTokens: number;
  maxOutputTokens: number;
  latencyP95Ms: number;
  errorRate24hPercent: number;
  status: 'active' | 'degraded' | 'disabled';
  isDefault: boolean;
  isFallback: boolean;
}

// 3. Infrastructure & Queue Monitoring
export interface QueueMetrics {
  incomingWebhookRatePerSec: number;
  queuedJobs: number;
  activeProcessingJobs: number;
  completedJobs24h: number;
  failedDlqJobs: number;
  oldestJobWaitTimeMs: number;
  workerCountActive: number | null;
  workerCpuPercent: number | null;
  workerMemoryPercent: number | null;
  dbPoolActive: number | null;
  dbPoolMax: number | null;
  dbPoolWaitTimeMs: number | null;
  redisMemoryUsedMB: number | null;
  redisHitRatePercent: number | null;
}

export interface DeadLetterJob {
  id: string;
  tenantId: string;
  channel: 'messenger' | 'whatsapp';
  eventType: string;
  failedAt: string;
  retryAttempts: number;
  sanitizedPayload: string;
  errorMessage: string;
}

