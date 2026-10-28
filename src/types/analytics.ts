export type KeyOwnershipType = 'platform_managed' | 'byok_client';

export interface ClientModelPolicy {
  billingTier: 'starter' | 'pro' | 'enterprise';
  keyOwnership: KeyOwnershipType;
  defaultModel: string;
  faqModel: string;
  complexModel: string;
  visionModel: string;
  fallbackModel: string;
  autoRoutingEnabled: boolean;
  maxTokensPerResponse: number;
  dailyTokenBudget: number;
  tokensUsedToday: number;
  perConversationLimitTokens: number;
  monthlyCostEstimatedUsd: number;
  advancedConfig: {
    temperature: number;
    topP: number;
    contextWindowTokens: number;
    systemPromptCacheEnabled: boolean;
  };
}

export type ProviderType = 'google_gemini' | 'openai' | 'anthropic' | 'groq' | 'azure_openai';

export type ProviderCapability = 'text' | 'vision' | 'tool_calling' | 'embeddings' | 'audio';

export interface InternalProviderConfig {
  id: string;
  provider: ProviderType;
  displayName: string;
  apiEndpoint: string;
  secretReference: string;
  maskedKey: string;
  availableModels: string[];
  defaultModel: string;
  capabilities: ProviderCapability[];
  contextLimitTokens: number;
  outputLimitTokens: number;
  rateLimits: {
    requestsPerMin: number;
    tokensPerMin: number;
    dailyQuota: number;
  };
  status: 'active' | 'degraded' | 'disabled' | 'unavailable';
  healthCheck: {
    lastCheckedAt: string;
    status: 'healthy' | 'degraded' | 'failed';
    latencyMs: number;
  };
  billingParty: 'platform' | 'client';
}

export interface ModelRoutingRule {
  id: string;
  name: string;
  intentCondition: 'faq_simple' | 'complex_reasoning' | 'vision_multimodal' | 'embedding_vector' | 'outage_fallback';
  targetModel: string;
  targetProvider: string;
  estCostPer1k: string;
  avgLatency: string;
  isActive: boolean;
  explanation: string;
}

export interface UsageAnalyticsOverview {
  totalTokensToday: number;
  totalTokensMonthly: number;
  estimatedCostTodayUsd: number;
  estimatedCostMonthUsd: number;
  aiResolutionRate: number;
  averageResponseTimeMs: number;
  humanHandoversSaved: number;
  modelUsageBreakdown: Array<{
    modelName: string;
    percentage: number;
    costUsd: number;
    requestsCount: number;
  }>;
  dailyUsageTrend: Array<{
    date: string;
    tokens: number;
    costUsd: number;
    conversations: number;
  }>;
}
