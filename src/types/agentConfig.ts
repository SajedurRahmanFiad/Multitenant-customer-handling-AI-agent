export type AgentConfigTab =
  | 'identity'
  | 'pipeline'
  | 'instructions'
  | 'behavior'
  | 'tools'
  | 'handover'
  | 'response_rules'
  | 'modes'
  | 'history';

export type PipelineLayerType =
  | 'intent_classification'
  | 'image_processing'
  | 'voice_processing'
  | 'knowledge_retrieval'
  | 'final_generation';

export interface PipelineLayerConfig {
  id: string;
  layerType: PipelineLayerType;
  layerOrder: number;
  title: string;
  subtitle: string;
  description: string;
  selectedModelId: string;
  selectedProvider: string;
  temperature: number;
  systemPrompt: string;
  fallbackModelId?: string;
  maxTokens: number;
  isEnabled: boolean;
  inputDescription: string;
  outputDescription: string;
}

export interface ModelPipelineConfig {
  layers: PipelineLayerConfig[];
  routingStrategy: 'sequential' | 'conditional_branch' | 'adaptive';
  costControlMode: boolean;
  lastUpdated: string;
}

export type AgentModeType =
  | 'disabled'
  | 'suggestion'
  | 'automatic'
  | 'restricted_automatic';

export interface AgentIdentityConfig {
  agentName: string;
  businessName: string;
  welcomeMessage: string;
  supportedLanguages: ('Bangla' | 'English' | 'Banglish')[];
  primaryLanguage: 'Bangla' | 'English' | 'Banglish';
  tone: 'friendly' | 'professional' | 'formal' | 'casual' | 'enthusiastic';
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'expressive';
  messageLength: 'concise' | 'balanced' | 'detailed';
  returningCustomerGreeting: 'personalized' | 'standard';
  returningCustomerTemplate: string;
  discloseAiIdentity: boolean;
  disclosureStatement: string;
  brandTerms: string[];
  forbiddenTerms: string[];
  signatureSignOff: string;
}

export interface SystemInstructionsConfig {
  primaryObjective: string;
  businessDescription: string;
  supportedTopics: string[];
  prohibitedTopics: string[];
  missingInfoStrategy: 'honest_admission' | 'clarify' | 'escalate_immediately';
  ambiguousQuestionsStrategy: 'ask_options' | 'best_guess' | 'handover';
  whenToSearchKnowledge: 'every_message' | 'on_query_intent' | 'never';
  enableLiveTools: boolean;
  liveTools: {
    orderStatusLookup: boolean;
    inventoryCheck: boolean;
    promoCodeValidator: boolean;
    courierTrackingSync: boolean;
  };
  askClarifyingQuestions: boolean;
  maxClarificationAttempts: number;
  mandatoryDisclaimers: string;
  customSafetyRules: string;
}

export interface ConversationBehaviorConfig {
  immediateGreeting: boolean;
  greetingDelaySeconds: number;
  proactivelySuggestProducts: boolean;
  productSuggestionTrigger: 'browse_intent' | 'out_of_stock' | 'cross_sell';
  collectContactDetails: boolean;
  requiredContactFields: ('phone' | 'email' | 'delivery_address' | 'order_id')[];
  summarizeBeforeHandover: boolean;
  autoFollowUpAfterUnanswered: boolean;
  followUpDelayMinutes: number;
  followUpMessage: string;
  detectComplaints: boolean;
  inactivityTimeoutMinutes: number;
  inactivityAction: 'close_session' | 'send_nudge' | 'human_queue';
}

export interface HandoverRule {
  id: string;
  name: string;
  description: string;
  triggerType:
    | 'customer_request'
    | 'sentiment_frustration'
    | 'missing_knowledge'
    | 'refund_exception'
    | 'payment_conflict'
    | 'legal_privacy'
    | 'low_confidence';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  destinationTeam: 'General Support' | 'Sales Escalation' | 'Billing & Claims' | 'Senior Ops';
  handoverMessage: string;
  notificationChannels: ('in_app' | 'slack' | 'telegram' | 'sms' | 'email')[];
  pauseAiImmediately: boolean;
  requireExplicitResume: boolean;
  confidenceThresholdPercent?: number;
  isActive: boolean;
}

export interface ResponseRulesConfig {
  maxResponseCharacters: number;
  maxSentencesPerMessage: number;
  supportedLocales: string[];
  quickTemplates: Array<{
    id: string;
    triggerKeyword: string;
    templateText: string;
  }>;
  restrictedClaims: string[];
  sourceCitationBehavior: 'always' | 'for_policy_pricing' | 'never_in_chat';
  conflictingSourcesBehavior: 'yield_to_newest' | 'escalate_to_human' | 'state_ambiguity';
  noAnswerBehavior: 'admit_and_escalate' | 'admit_and_collect_lead' | 'fallback_faq';
  combineMultipleQuestions: boolean;
}

export interface AgentConfigVersion {
  version: string;
  publishedAt: string;
  publishedBy: string;
  summary: string;
  mode: AgentModeType;
  identity: AgentIdentityConfig;
  instructions: SystemInstructionsConfig;
  behavior: ConversationBehaviorConfig;
  handoverRules: HandoverRule[];
  responseRules: ResponseRulesConfig;
  isLive: boolean;
}
