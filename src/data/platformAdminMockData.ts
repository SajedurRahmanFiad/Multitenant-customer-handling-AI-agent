import {
  TenantClient,
  AIProviderModel,
  PlatformFinancialMetrics,
  TopSpendingTenant,
  QueueMetrics,
  DeadLetterJob,
  SystemComponentHealth,
  SystemIncident,
  SecurityComplianceReport,
  GlobalPipelineLayer,
} from '../types/platformAdmin';


export const INITIAL_TENANTS: TenantClient[] = [
  {
    id: 'ten_loom_01',
    businessName: 'Bengal Loom & Crafts',
    ownerName: 'Sajedur Rahman',
    ownerEmail: 'sajedur@bengalloom.com',
    ownerPhone: '+880 1712-984210',
    currencyCode: 'BDT',
    pricePerMessage: 0.25, // ৳0.25 per AI sent message
    walletBalance: 2450.00, // ৳2,450 current balance
    status: 'active',
    connectedChannels: {
      messengerPages: 1,
      whatsappNumbers: 2,
    },
    primaryModel: 'gemini-2.5-flash',
    monthlySpendUSD: 38.42,
    monthlySpendBDT: 4260,
    conversationsThisMonth: 12480,
    messagesProcessedThisMonth: 48920,
    healthScorePercent: 99.2,
    createdAt: 'Jan 15, 2025',
    lastActiveDate: 'Just now',
    supportNotes: 'High volume apparel store. High satisfaction with bilingual Bangla RAG.',
    assignedSupportOwner: 'Operations Team Lead (Tanvir)',
  },
  {
    id: 'ten_gadget_02',
    businessName: 'Gadget Express BD',
    ownerName: 'Mushfiqur Rahman',
    ownerEmail: 'mushfiq@gadgetexpress.com.bd',
    ownerPhone: '+880 1819-204918',
    currencyCode: 'BDT',
    pricePerMessage: 0.30, // ৳0.30 per AI message
    walletBalance: 4820.00,
    status: 'active',
    connectedChannels: {
      messengerPages: 3,
      whatsappNumbers: 4,
    },
    primaryModel: 'gpt-4o-mini',
    monthlySpendUSD: 112.80,
    monthlySpendBDT: 12500,
    conversationsThisMonth: 34100,
    messagesProcessedThisMonth: 128400,
    healthScorePercent: 97.8,
    createdAt: 'Feb 10, 2025',
    lastActiveDate: '3 mins ago',
    supportNotes: 'Requested live inventory API integration hook.',
    assignedSupportOwner: 'Tech Support (Nusrat)',
  },
  {
    id: 'ten_cloud_03',
    businessName: 'Aarong Handcrafts Reseller',
    ownerName: 'Samira Huq',
    ownerEmail: 'samira@aarongreseller.com',
    ownerPhone: '+880 1911-382910',
    currencyCode: 'BDT',
    pricePerMessage: 0.20, // ৳0.20 per AI message
    walletBalance: 890.00,
    status: 'active',
    connectedChannels: {
      messengerPages: 1,
      whatsappNumbers: 0,
    },
    primaryModel: 'gemini-2.5-flash',
    monthlySpendUSD: 14.20,
    monthlySpendBDT: 1570,
    conversationsThisMonth: 2840,
    messagesProcessedThisMonth: 11200,
    healthScorePercent: 98.4,
    createdAt: 'May 04, 2025',
    lastActiveDate: '12 mins ago',
    supportNotes: 'Steady organic growth across Facebook page.',
    assignedSupportOwner: 'Account Manager (Raihan)',
  },
  {
    id: 'ten_med_04',
    businessName: 'Dhaka Pharma & Care',
    ownerName: 'Dr. Kazi Mahfuz',
    ownerEmail: 'mahfuz@dhakapharma.com',
    ownerPhone: '+880 1711-002941',
    currencyCode: 'BDT',
    pricePerMessage: 0.35, // ৳0.35 per AI message
    walletBalance: 12500.00,
    status: 'active',
    connectedChannels: {
      messengerPages: 4,
      whatsappNumbers: 6,
    },
    primaryModel: 'claude-3-5-sonnet',
    monthlySpendUSD: 245.60,
    monthlySpendBDT: 27200,
    conversationsThisMonth: 61200,
    messagesProcessedThisMonth: 234100,
    healthScorePercent: 99.8,
    createdAt: 'Dec 18, 2024',
    lastActiveDate: 'Just now',
    supportNotes: 'Custom HIPAA/GDPR retention setup with 24/7 autonomous triage.',
    assignedSupportOwner: 'Enterprise Solutions Director',
  },
  {
    id: 'ten_quick_05',
    businessName: 'QuickBite Cloud Kitchens',
    ownerName: 'Rashedul Karim',
    ownerEmail: 'rashed@quickbitebd.com',
    ownerPhone: '+880 1612-491029',
    currencyCode: 'USD',
    pricePerMessage: 0.003, // $0.003 per AI message
    walletBalance: 50.00,
    status: 'suspended',
    connectedChannels: {
      messengerPages: 2,
      whatsappNumbers: 1,
    },
    primaryModel: 'gemini-2.5-flash',
    monthlySpendUSD: 0.00,
    monthlySpendBDT: 0,
    conversationsThisMonth: 0,
    messagesProcessedThisMonth: 0,
    healthScorePercent: 0.0,
    createdAt: 'Mar 12, 2025',
    lastActiveDate: 'Oct 24, 2026',
    supportNotes: 'Account suspended by administrator request.',
    assignedSupportOwner: 'Operations Lead',
  },
];


export const INITIAL_PROVIDER_MODELS: AIProviderModel[] = [
  {
    id: 'mdl_gemini_flash',
    modelId: 'gemini-2.5-flash',
    displayName: 'Google Gemini 2.5 Flash',
    provider: 'Google Gemini',
    secretReference: 'vault://gcp-kms/gemini-prod-key-v2',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    capabilities: ['text', 'vision', 'tools', 'json'],
    costPerMillionInputUSD: 0.075,
    costPerMillionOutputUSD: 0.30,
    contextWindowTokens: 1048576,
    maxOutputTokens: 8192,
    latencyP95Ms: 580,
    errorRate24hPercent: 0.02,
    status: 'active',
    isDefault: true,
    isFallback: false,
  },
  {
    id: 'mdl_gpt_4o_mini',
    modelId: 'gpt-4o-mini',
    displayName: 'OpenAI GPT-4o Mini',
    provider: 'OpenAI',
    secretReference: 'vault://azure-keyvault/openai-prod-master',
    endpointUrl: 'https://api.openai.com/v1/chat/completions',
    capabilities: ['text', 'vision', 'tools', 'json'],
    costPerMillionInputUSD: 0.15,
    costPerMillionOutputUSD: 0.60,
    contextWindowTokens: 128000,
    maxOutputTokens: 16384,
    latencyP95Ms: 640,
    errorRate24hPercent: 0.05,
    status: 'active',
    isDefault: false,
    isFallback: true,
  },
  {
    id: 'mdl_claude_sonnet',
    modelId: 'claude-3-5-sonnet-20241022',
    displayName: 'Anthropic Claude 3.5 Sonnet',
    provider: 'Anthropic',
    secretReference: 'vault://aws-secrets/anthropic-production-key',
    endpointUrl: 'https://api.anthropic.com/v1/messages',
    capabilities: ['text', 'vision', 'tools', 'json'],
    costPerMillionInputUSD: 3.00,
    costPerMillionOutputUSD: 15.00,
    contextWindowTokens: 200000,
    maxOutputTokens: 8192,
    latencyP95Ms: 890,
    errorRate24hPercent: 0.08,
    status: 'active',
    isDefault: false,
    isFallback: false,
  },
  {
    id: 'mdl_llama_70b',
    modelId: 'llama-3.3-70b-versatile',
    displayName: 'Llama 3.3 70B (Groq Ultra-Fast)',
    provider: 'Groq / Llama',
    secretReference: 'vault://gcp-kms/groq-prod-cluster',
    endpointUrl: 'https://api.groq.com/openai/v1/chat/completions',
    capabilities: ['text', 'tools', 'json'],
    costPerMillionInputUSD: 0.59,
    costPerMillionOutputUSD: 0.79,
    contextWindowTokens: 128000,
    maxOutputTokens: 8192,
    latencyP95Ms: 240,
    errorRate24hPercent: 0.04,
    status: 'active',
    isDefault: false,
    isFallback: false,
  },
  {
    id: 'mdl_gemini_embed',
    modelId: 'text-embedding-004',
    displayName: 'Google Gemini Embedding 004',
    provider: 'Google Gemini',
    secretReference: 'vault://gcp-kms/gemini-prod-key-v2',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    capabilities: ['embeddings'],
    costPerMillionInputUSD: 0.025,
    costPerMillionOutputUSD: 0.00,
    contextWindowTokens: 2048,
    maxOutputTokens: 768,
    latencyP95Ms: 95,
    errorRate24hPercent: 0.01,
    status: 'active',
    isDefault: true,
    isFallback: false,
  },
  {
    id: 'mdl_whisper_v3',
    modelId: 'whisper-large-v3',
    displayName: 'OpenAI Whisper v3 Large (Audio/STT)',
    provider: 'OpenAI',
    secretReference: 'vault://azure-keyvault/openai-prod-master',
    endpointUrl: 'https://api.openai.com/v1/audio/transcriptions',
    capabilities: ['text', 'tools', 'json'],
    costPerMillionInputUSD: 0.36,
    costPerMillionOutputUSD: 0.00,
    contextWindowTokens: 25000,
    maxOutputTokens: 4096,
    latencyP95Ms: 420,
    errorRate24hPercent: 0.03,
    status: 'active',
    isDefault: false,
    isFallback: false,
  },
  {
    id: 'mdl_gemini_pro',
    modelId: 'gemini-2.5-pro',
    displayName: 'Google Gemini 2.5 Pro (Deep Context)',
    provider: 'Google Gemini',
    secretReference: 'vault://gcp-kms/gemini-prod-key-v2',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    capabilities: ['text', 'vision', 'tools', 'json'],
    costPerMillionInputUSD: 1.25,
    costPerMillionOutputUSD: 5.00,
    contextWindowTokens: 2097152,
    maxOutputTokens: 8192,
    latencyP95Ms: 920,
    errorRate24hPercent: 0.02,
    status: 'active',
    isDefault: false,
    isFallback: false,
  },
];

export const INITIAL_PLATFORM_METRICS: PlatformFinancialMetrics = {
  totalMonthlyRevenueUSD: 18450.00,
  totalMonthlyProviderCostUSD: 4120.35,
  grossMarginPercent: 77.6,
  totalTokensConsumed24h: 38491020,
  currentBurnRateTokensPerSec: 445,
  averageCostPerConversationUSD: 0.0031,
  anomalyProtectionPolicy: 'switch_to_fallback',
};

export const INITIAL_TOP_TENANTS: TopSpendingTenant[] = [
  {
    tenantId: 'ten_med_04',
    businessName: 'Dhaka Pharma & Care',
    primaryModel: 'claude-3-5-sonnet',
    spendUSD: 245.60,
    tokenCount: 14200000,
    conversationsCount: 61200,
  },
  {
    tenantId: 'ten_gadget_02',
    businessName: 'Gadget Express BD',
    primaryModel: 'gpt-4o-mini',
    spendUSD: 112.80,
    tokenCount: 8400000,
    conversationsCount: 34100,
  },
  {
    tenantId: 'ten_loom_01',
    businessName: 'Bengal Loom & Crafts',
    primaryModel: 'gemini-2.5-flash',
    spendUSD: 38.42,
    tokenCount: 3100000,
    conversationsCount: 12480,
  },
  {
    tenantId: 'ten_cloud_03',
    businessName: 'Aarong Handcrafts Reseller',
    primaryModel: 'gemini-2.5-flash',
    spendUSD: 14.20,
    tokenCount: 920000,
    conversationsCount: 2840,
  },
];

export const INITIAL_QUEUE_METRICS: QueueMetrics = {
  incomingWebhookRatePerSec: 18.4,
  queuedJobs: 12,
  activeProcessingJobs: 6,
  completedJobs24h: 189420,
  failedDlqJobs: 3,
  oldestJobWaitTimeMs: 380,
  workerCountActive: 8,
  workerCpuPercent: 28.5,
  workerMemoryPercent: 44.2,
  dbPoolActive: 16,
  dbPoolMax: 60,
  dbPoolWaitTimeMs: 1.4,
  redisMemoryUsedMB: 1420,
  redisHitRatePercent: 96.8,
};

export const INITIAL_DEAD_LETTER_JOBS: DeadLetterJob[] = [
  {
    id: 'dlq_01',
    tenantId: 'ten_gadget_02',
    channel: 'whatsapp',
    eventType: 'messages.received',
    failedAt: '18 mins ago',
    retryAttempts: 5,
    sanitizedPayload: '{"from":"wa_88019182019","type":"interactive_button_reply","msg_id":"wamid.HBg..."}',
    errorMessage: 'External inventory ERP webhook timed out after 5000ms',
  },
  {
    id: 'dlq_02',
    tenantId: 'ten_loom_01',
    channel: 'messenger',
    eventType: 'messages.received',
    failedAt: '1 hour ago',
    retryAttempts: 5,
    sanitizedPayload: '{"sender":{"id":"5819284"},"message":{"mid":"mid.192...","sticker_id":"369239"}}',
    errorMessage: 'Unsupported multimedia sticker payload parsing error',
  },
  {
    id: 'dlq_03',
    tenantId: 'ten_quick_05',
    channel: 'messenger',
    eventType: 'messages.received',
    failedAt: '3 hours ago',
    retryAttempts: 5,
    sanitizedPayload: '{"sender":{"id":"9182741"},"recipient":{"id":"page_99182"}}',
    errorMessage: 'Tenant account suspended: inbound message rejected at gateway',
  },
];

export const INITIAL_SYSTEM_COMPONENTS: SystemComponentHealth[] = [
  {
    name: 'Public Webhook Gateway (Meta Graph & Cloud API)',
    type: 'core',
    status: 'operational',
    uptime90dPercent: 99.99,
    latencyMs: 38,
  },
  {
    name: 'Real-time Inbox WebSockets & PubSub',
    type: 'core',
    status: 'operational',
    uptime90dPercent: 100.0,
    latencyMs: 18,
  },
  {
    name: 'AI Model Orchestrator & Token Rate Limiter',
    type: 'core',
    status: 'operational',
    uptime90dPercent: 99.96,
    latencyMs: 540,
  },
  {
    name: 'PostgreSQL Relational Storage (Row Level Isolation)',
    type: 'storage',
    status: 'operational',
    uptime90dPercent: 100.0,
    latencyMs: 2.1,
  },
  {
    name: 'Redis Cache & Distributed Job Queues',
    type: 'storage',
    status: 'operational',
    uptime90dPercent: 100.0,
    latencyMs: 0.9,
  },
  {
    name: 'Vector Database & Embedding Retrieval',
    type: 'storage',
    status: 'operational',
    uptime90dPercent: 99.98,
    latencyMs: 64,
  },
  {
    name: 'Google Gemini API Services',
    type: 'external',
    status: 'operational',
    uptime90dPercent: 99.97,
    latencyMs: 580,
  },
  {
    name: 'Meta Graph & WhatsApp Cloud API',
    type: 'external',
    status: 'operational',
    uptime90dPercent: 99.92,
    latencyMs: 120,
  },
];

export const INITIAL_INCIDENTS: SystemIncident[] = [
  {
    id: 'inc_01',
    title: 'Intermittent 429 Rate Limits from OpenAI Endpoint',
    severity: 'p3_minor',
    status: 'resolved',
    affectedComponents: ['AI Model Orchestrator'],
    startedAt: 'Oct 26, 2026 at 10:14 AM',
    resolvedAt: 'Oct 26, 2026 at 10:28 AM',
    summary: 'Automated fallback to Gemini 2.5 Flash triggered smoothly. Zero customer messages dropped.',
  },
  {
    id: 'inc_02',
    title: 'Meta Graph Webhook Certificate Renewal',
    severity: 'p3_minor',
    status: 'resolved',
    affectedComponents: ['Public Webhook Gateway'],
    startedAt: 'Oct 20, 2026 at 03:00 AM',
    resolvedAt: 'Oct 20, 2026 at 03:08 AM',
    summary: 'Scheduled TLS certificate rotation completed during maintenance window.',
  },
];

export const INITIAL_COMPLIANCE_REPORT: SecurityComplianceReport = {
  lastIsolationAudit: 'Today at 04:00 AM (Automated Canary)',
  isolationStatus: 'passing',
  kmsKeyRotationAgeDays: 24,
  nextRotationScheduled: 'In 36 days',
  gdprPendingErasuresCount: 0,
  gdprCompletedErasuresCount: 18,
  soc2AuditExportReady: true,
  backupStatus: 'healthy',
  lastDisasterRecoveryTest: 'Oct 25, 2026 at 02:00 AM',
  disasterRecoveryTestOutcome: 'pass',
  rpoMinutes: 3,
  rtoMinutes: 12,
};

export const INITIAL_GLOBAL_PIPELINE_LAYERS: GlobalPipelineLayer[] = [
  {
    id: 'layer_1_intent',
    layerType: 'intent_classification',
    layerOrder: 1,
    title: 'Layer 1: Customer Intent Classification',
    subtitle: 'NLU Intent Detection & Entity Extraction',
    description:
      'Analyzes incoming customer messages (Bangla/English/Banglish) to figure out the exact intent: Order Status, Price/Catalogue Inquiry, Return/Dispute, Payment Verification, Human Escalation, or Casual Greeting.',
    defaultModelId: 'gemini-2.5-flash',
    defaultFallbackModelId: 'gpt-4o-mini',
    defaultTemperature: 0.1,
    defaultMaxTokens: 512,
    systemPrompt: `You are the global intent classifier for multi-tenant e-commerce conversational agents.
Analyze the incoming customer query (which may be in Bengali, English, or phonetic Banglish) and extract:
1. Primary Intent: ("order_status", "price_catalog", "payment_verification", "delivery_inquiry", "human_handover", "product_defect", "greeting")
2. Extracted Entities: (Order numbers, courier invoice codes, product names, phone numbers, quantities)
3. Customer Language: ("Bangla", "English", "Banglish")
4. Urgency Level: ("normal", "high", "urgent")
5. Sentiment Frustration: Score from 0.0 to 1.0

Return strictly valid JSON matching the schema without markdown decoration.`,
    guidanceNotes:
      'Operates deterministically (temp <= 0.1). High-speed parsing required before downstream media processing or RAG.',
    inputDescription: 'Raw customer message text & previous message turns',
    outputDescription: 'Structured JSON: { intent, entities, language, urgency, frustration_score }',
    isMandatory: true,
    isActiveGlobally: true,
    lastUpdated: 'Oct 28, 2026 by Platform Security & Engineering',
  },
  {
    id: 'layer_2_image',
    layerType: 'image_processing',
    layerOrder: 2,
    title: 'Layer 2: Vision & Image Processing',
    subtitle: 'Multimodal Photo, Receipt & Slip Analysis',
    description:
      'Triggered when customer sends photos on Messenger or WhatsApp: scans bKash/Nagad payment slips, damaged fabric photos, delivery slip labels, or product screenshots.',
    defaultModelId: 'gemini-2.5-flash',
    defaultFallbackModelId: 'claude-3-5-sonnet-20241022',
    defaultTemperature: 0.2,
    defaultMaxTokens: 1024,
    systemPrompt: `You are an automated vision specialist for conversational commerce.
Evaluate the uploaded image asset:
- If a mobile financial receipt (bKash, Nagad, Rocket, Bank Transfer): Extract Transaction ID (TrxID), payment amount in BDT, recipient merchant number, and transaction timestamp.
- If a product defect or damage photo: Describe defect location, fabric/seam condition, and severity ("cosmetic", "damaged_in_transit", "incorrect_item").
- If a product catalog screenshot: Identify color, pattern, and matching catalogue item.

Do not hallucinate payment amounts. If blurred, return "unreadable_receipt" with confidence score.`,
    guidanceNotes:
      'Bypassed automatically if incoming customer payload does not include image attachments.',
    inputDescription: 'Image buffer or secure temporary storage URL + Intent from Layer 1',
    outputDescription: 'Structured Vision JSON: { mediaType: "financial_receipt"|"defect"|"catalog_reference", details: object, confidence: number }',
    isMandatory: false,
    isActiveGlobally: true,
    lastUpdated: 'Oct 28, 2026 by Platform Security & Engineering',
  },
  {
    id: 'layer_3_voice',
    layerType: 'voice_processing',
    layerOrder: 3,
    title: 'Layer 3: Voice Message Processing',
    subtitle: 'Speech-to-Text & Bengali Regional Dialects',
    description:
      'Processes incoming WhatsApp voice notes and audio clips, converting spoken Bangla, Sylheti/Chatgaya regional phrasing, or English into structured text transcripts with sentiment scores.',
    defaultModelId: 'whisper-large-v3',
    defaultFallbackModelId: 'gemini-2.5-flash',
    defaultTemperature: 0.0,
    defaultMaxTokens: 2048,
    systemPrompt: `You are a specialized Bengali speech-to-text transcribing engine.
Transcribe the audio accurately into standard Bengali unicode script (or English if spoken in English).
Preserve regional dialect nuances and emotional cadence:
- Mark speaker sentiment ("calm", "frustrated", "inquiring")
- Mark any critical customer-stated phone numbers, delivery addresses, or order references.
Output cleaned transcript for consumption by downstream RAG and response generator.`,
    guidanceNotes:
      'Supports WhatsApp Opus / AAC voice notes up to 120 seconds. Bypassed for text-only messages.',
    inputDescription: 'Binary audio stream (.ogg/.aac/.mp3) + Channel metadata',
    outputDescription: 'Transcript text string + audio sentiment score + duration metrics',
    isMandatory: false,
    isActiveGlobally: true,
    lastUpdated: 'Oct 28, 2026 by Platform Security & Engineering',
  },
  {
    id: 'layer_4_retrieval',
    layerType: 'knowledge_retrieval',
    layerOrder: 4,
    title: 'Layer 4: Knowledge Base & RAG Context Retrieval',
    subtitle: 'Vector Semantic Matching & Business Rules Injection',
    description:
      'Queries vector database using intent and message tokens to retrieve relevant verified FAQs, product catalogue records, courier policies, and brand voice guidelines.',
    defaultModelId: 'gemini-2.5-flash',
    defaultFallbackModelId: 'gpt-4o-mini',
    defaultTemperature: 0.1,
    defaultMaxTokens: 4096,
    systemPrompt: `You are the retrieval grounding evaluator for tenant knowledge bases.
Using the customer query and intent classification:
1. Score similarity across verified tenant documents, product inventory, and shipping policies.
2. Select top 3-5 authoritative chunks.
3. Reject out-of-date policy drafts or unverified items.
4. Synthesize ground-truth facts with strict citation tags [KB-CHUNK-ID].
If no verified source answers the question, flag "knowledge_gap: true".`,
    guidanceNotes:
      'Enforces tenant data boundary. Never retrieves knowledge chunks belonging to a different tenant ID.',
    inputDescription: 'Classified intent + customer query text + active tenant ID isolation token',
    outputDescription: 'Ranked knowledge context chunks + verified shipping rates + stock status',
    isMandatory: true,
    isActiveGlobally: true,
    lastUpdated: 'Oct 28, 2026 by Platform Security & Engineering',
  },
  {
    id: 'layer_5_final',
    layerType: 'final_generation',
    layerOrder: 5,
    title: 'Layer 5: Response Synthesis & Generation',
    subtitle: 'End-to-End Customer Reply Generation',
    description:
      'The primary customer-facing layer. Receives ALL aggregated information from the knowledge base, intent classification, image/voice data, and conversation history to formulate the final personalized answer sent to the customer.',
    defaultModelId: 'claude-3-5-sonnet-20241022',
    defaultFallbackModelId: 'gemini-2.5-flash',
    defaultTemperature: 0.6,
    defaultMaxTokens: 2048,
    systemPrompt: `You are the official conversational representative of the tenant's business.
You are given:
- The customer's message, sentiment, and communication channel
- Outputs from multimodal layers (e.g. verified receipt TrxID, voice transcript)
- Ground-truth Knowledge Base context (pricing, delivery timelines, return policies)
- The tenant's Brand Voice (tone, welcome greetings, sign-offs)

RULES:
1. Always reply in the customer's chosen language (courteous Bengali, English, or conversational Banglish).
2. Never contradict the verified Knowledge Base facts. If information is not in the KB, honestly inform the customer and offer human specialist assistance.
3. Keep answers concise, helpful, and formatted for mobile chat (Messenger / WhatsApp) with readable spacing.
4. Adhere to all handover escalation rules if customer expresses severe frustration.`,
    guidanceNotes:
      'Final customer-facing output. Enforces brand voice, zero hallucinations, and platform safety guidelines.',
    inputDescription: 'Full aggregated context (Customer message + Layer 1 intent + Layer 2/3 vision/voice + Layer 4 Knowledge chunks + Brand Voice)',
    outputDescription: 'Final customer-facing message string sent to Messenger or WhatsApp webhook',
    isMandatory: true,
    isActiveGlobally: true,
    lastUpdated: 'Oct 28, 2026 by Platform Security & Engineering',
  },
];

