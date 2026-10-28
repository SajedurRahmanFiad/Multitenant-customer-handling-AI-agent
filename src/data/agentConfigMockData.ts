import {
  AgentIdentityConfig,
  SystemInstructionsConfig,
  ConversationBehaviorConfig,
  HandoverRule,
  ResponseRulesConfig,
  AgentModeType,
  AgentConfigVersion,
  PipelineLayerConfig,
} from '../types/agentConfig';

export const INITIAL_PIPELINE_LAYERS: PipelineLayerConfig[] = [
  {
    id: 'layer_1_intent',
    layerType: 'intent_classification',
    layerOrder: 1,
    title: 'Layer 1: Customer Intent Classification',
    subtitle: 'NLU Intent Detection & Category Routing',
    description:
      'Analyzes incoming customer messages (Bangla/English/Banglish) to figure out the exact intent: Order Status, Price/Catalogue Inquiry, Return/Dispute, Payment Verification, Human Escalation, or Casual Greeting.',
    selectedModelId: 'gemini-2.5-flash',
    selectedProvider: 'Google Gemini',
    temperature: 0.1,
    systemPrompt:
      'Classify the customer message into primary intent, customer sentiment, detected language, and extracted entities (e.g. order IDs, product names, phone numbers). Return structured JSON.',
    fallbackModelId: 'gpt-4o-mini',
    maxTokens: 512,
    isEnabled: true,
    inputDescription: 'Raw customer message string & conversation history',
    outputDescription: 'JSON intent: { intent: string, entities: object, language: string, urgency: string }',
  },
  {
    id: 'layer_2_image',
    layerType: 'image_processing',
    layerOrder: 2,
    title: 'Layer 2: Vision & Image Processing',
    subtitle: 'Multimodal Photo & Receipt Analysis',
    description:
      'Triggered when customer sends photos on Messenger or WhatsApp: scans bKash/Nagad payment slips, damaged fabric photos, delivery slip labels, or product screenshots.',
    selectedModelId: 'gemini-2.5-flash',
    selectedProvider: 'Google Gemini',
    temperature: 0.2,
    systemPrompt:
      'Examine the attached image. If a mobile financial receipt (bKash/Nagad/Rocket), extract transaction ID, amount, and timestamp. If a damaged product, describe defect severity.',
    fallbackModelId: 'claude-3-5-sonnet-20241022',
    maxTokens: 1024,
    isEnabled: true,
    inputDescription: 'Customer uploaded image buffer / URL + extracted intent',
    outputDescription: 'Image analysis summary: { imageType: "receipt" | "product_defect", extractedDetails: string }',
  },
  {
    id: 'layer_3_voice',
    layerType: 'voice_processing',
    layerOrder: 3,
    title: 'Layer 3: Voice Message Processing',
    subtitle: 'Speech-to-Text & Bengali Audio Understanding',
    description:
      'Processes incoming WhatsApp voice notes and audio clips, converting spoken Bangla, Sylheti/Chatgaya regional phrasing, or English into structured text transcripts with sentiment scores.',
    selectedModelId: 'whisper-large-v3',
    selectedProvider: 'OpenAI',
    temperature: 0.0,
    systemPrompt:
      'Transcribe the audio note accurately preserving Bengali terms and colloquial expressions. Note urgency level and emotional sentiment.',
    fallbackModelId: 'gemini-2.5-flash',
    maxTokens: 2048,
    isEnabled: true,
    inputDescription: 'WhatsApp audio note (.ogg/.mp3/.m4a)',
    outputDescription: 'Transcript text string + audio sentiment score',
  },
  {
    id: 'layer_4_retrieval',
    layerType: 'knowledge_retrieval',
    layerOrder: 4,
    title: 'Layer 4: Knowledge Base & RAG Context Retrieval',
    subtitle: 'Vector Semantic Matching & Tool Injection',
    description:
      'Queries vector database using intent and message tokens to retrieve relevant verified FAQs, product catalogue records, courier policies, and brand voice guidelines.',
    selectedModelId: 'gemini-2.5-flash',
    selectedProvider: 'Google Gemini',
    temperature: 0.1,
    systemPrompt:
      'Retrieve top-3 most relevant chunks from Knowledge Base vectors (FAQs, Catalogue items, Delivery schedules, and Brand identity guidelines).',
    fallbackModelId: 'gpt-4o-mini',
    maxTokens: 4096,
    isEnabled: true,
    inputDescription: 'Classified intent + customer query text + active tenant ID',
    outputDescription: 'Ranked knowledge context chunks + matching product inventory specs',
  },
  {
    id: 'layer_5_final',
    layerType: 'final_generation',
    layerOrder: 5,
    title: 'Final Layer: Response Synthesis & Generation',
    subtitle: 'End-to-End Customer Reply Generation',
    description:
      'The primary customer-facing layer. Receives ALL aggregated information from the knowledge base, intent classification, image/voice data, and conversation history to formulate the final personalized answer sent to the customer.',
    selectedModelId: 'claude-3-5-sonnet-20241022',
    selectedProvider: 'Anthropic',
    temperature: 0.6,
    systemPrompt:
      'You are the official customer service assistant for Bengal Loom & Crafts. Using the supplied Knowledge Base context, Brand Voice guidelines, and customer query, generate a courteous, helpful, and natural reply in the customer\'s preferred language (Bangla/English). Adhere strictly to verified delivery fees and return policies.',
    fallbackModelId: 'gemini-2.5-flash',
    maxTokens: 2048,
    isEnabled: true,
    inputDescription: 'Customer message + Layer 1 intent + Layer 2/3 multimodal outputs + Layer 4 Knowledge Base chunks + Brand Voice context',
    outputDescription: 'Final customer-facing reply message sent to Messenger / WhatsApp',
  },
];

export const INITIAL_IDENTITY: AgentIdentityConfig = {
  agentName: 'Aria (Support Assistant)',
  businessName: 'Nexura Lifestyle & Electronics',
  welcomeMessage:
    'আসসালামু আলাইকুম! Nexura Lifestyle-এ আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি? (Hello! Welcome to Nexura. How can I assist you today?)',
  supportedLanguages: ['Bangla', 'English', 'Banglish'],
  primaryLanguage: 'Bangla',
  tone: 'friendly',
  emojiUsage: 'minimal',
  messageLength: 'balanced',
  returningCustomerGreeting: 'personalized',
  returningCustomerTemplate:
    'স্বাগতম ফিরে আসার জন্য, {customer_name}! আপনার বিগত অর্ডার অথবা অন্য কোনো বিষয়ে কি সহায়তা প্রয়োজন?',
  discloseAiIdentity: true,
  disclosureStatement: 'I am Nexura AI assistant, collaborating with our live support staff.',
  brandTerms: ['Nexura Care', 'ট্রানজিট গ্যারান্টি', 'অফিসিয়াল ওয়ারেন্টি', 'bKash মার্চেন্ট'],
  forbiddenTerms: ['সস্তা', 'ফালতু', 'কোনো গ্যারান্টি নাই', 'cheap deal', 'হ্যাক'],
  signatureSignOff: '— Nexura Digital Support Team',
};

export const INITIAL_INSTRUCTIONS: SystemInstructionsConfig = {
  primaryObjective:
    'Provide prompt, accurate, and courteous customer support for product inquiries, shipping rates, bKash payments, order tracking, and warranty claims across Messenger and WhatsApp.',
  businessDescription:
    'Nexura is a premier lifestyle and consumer electronics brand in Bangladesh, providing high-quality accessories, smart gadgets, and winter apparel with island-wide courier coverage.',
  supportedTopics: [
    'Product specifications and variant availability',
    'Delivery timeframes (Dhaka inside 24-48h, outside 48-72h)',
    'bKash and Nagad payment guidelines',
    'Order status tracking via invoice ID',
    'Exchange and damage replacement policy',
    'Store location and official support hours',
  ],
  prohibitedTopics: [
    'Religious, political, or controversial debates',
    'Speculative promises on unreleased models',
    'Competitor defamation or direct comparisons',
    'Custom unapproved bulk pricing without manager sign-off',
    'Sharing internal staff personal contact details',
  ],
  missingInfoStrategy: 'honest_admission',
  ambiguousQuestionsStrategy: 'ask_options',
  whenToSearchKnowledge: 'on_query_intent',
  enableLiveTools: true,
  liveTools: {
    orderStatusLookup: true,
    inventoryCheck: true,
    promoCodeValidator: true,
    courierTrackingSync: false,
  },
  askClarifyingQuestions: true,
  maxClarificationAttempts: 2,
  mandatoryDisclaimers:
    'সকল ক্যাশ-অন-ডেলিভারি অর্ডারে ডেলিভারি চার্জ প্রযোজ্য। ক্যাশ রিফান্ডের ক্ষেত্রে ম্যানেজমেন্ট অনুমোদন প্রয়োজন।',
  customSafetyRules:
    'Strictly decline any request to generate malicious code, bypass payment systems, or provide personal staff numbers. Always route fraud claims to Senior Ops.',
};

export const INITIAL_BEHAVIOR: ConversationBehaviorConfig = {
  immediateGreeting: true,
  greetingDelaySeconds: 2,
  proactivelySuggestProducts: true,
  productSuggestionTrigger: 'browse_intent',
  collectContactDetails: true,
  requiredContactFields: ['phone', 'delivery_address', 'order_id'],
  summarizeBeforeHandover: true,
  autoFollowUpAfterUnanswered: true,
  followUpDelayMinutes: 45,
  followUpMessage:
    'আমরা কি আপনার প্রশ্নের সঠিক উত্তর দিতে পেরেছি? আর কোনো তথ্য জানার থাকলে নির্দ্বিধায় মেসেজ দিন!',
  detectComplaints: true,
  inactivityTimeoutMinutes: 30,
  inactivityAction: 'send_nudge',
};

export const INITIAL_HANDOVER_RULES: HandoverRule[] = [
  {
    id: 'rule_1',
    name: 'Explicit Human Agent Request',
    description: 'Customer asks to talk to a human agent, staff, or representative in Bangla or English.',
    triggerType: 'customer_request',
    priority: 'urgent',
    destinationTeam: 'General Support',
    handoverMessage:
      'অবশ্যই! আমি আপনাকে এখনই আমাদের একজন সাপোর্ট এজেন্টের সাথে যুক্ত করে দিচ্ছি। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।',
    notificationChannels: ['in_app', 'slack', 'telegram'],
    pauseAiImmediately: true,
    requireExplicitResume: true,
    isActive: true,
  },
  {
    id: 'rule_2',
    name: 'Customer Grievance & Extreme Frustration',
    description: 'Customer expresses severe dissatisfaction, foul language, or repeats unanswered grievance.',
    triggerType: 'sentiment_frustration',
    priority: 'urgent',
    destinationTeam: 'Senior Ops',
    handoverMessage:
      'আপনার অসন্তুষ্টির জন্য আমরা আন্তরিকভাবে দুঃখিত। বিষয়টি দ্রুত সমাধানে আমাদের সিনিয়র টিম লিড সরাসরি টেকওভার করছেন।',
    notificationChannels: ['in_app', 'slack', 'telegram', 'sms'],
    pauseAiImmediately: true,
    requireExplicitResume: true,
    isActive: true,
  },
  {
    id: 'rule_3',
    name: 'Refund & Financial Exceptions',
    description: 'Customer asks for immediate cash refund or return exceeding normal exchange SLA.',
    triggerType: 'refund_exception',
    priority: 'high',
    destinationTeam: 'Billing & Claims',
    handoverMessage:
      'রিফান্ড সংক্রান্ত আবেদনটি আমাদের বিলিং অ্যান্ড ক্লেইমস টিমের যাচাইকরণ সাপেক্ষে অনুমোদিত হয়। আমাদের প্রতিনিধি শীঘ্রই যোগাযোগ করবেন।',
    notificationChannels: ['in_app', 'slack'],
    pauseAiImmediately: true,
    requireExplicitResume: true,
    isActive: true,
  },
  {
    id: 'rule_4',
    name: 'Payment TRXID Discrepancy',
    description: 'Provided bKash or Nagad transaction code fails verification or duplicate receipt submitted.',
    triggerType: 'payment_conflict',
    priority: 'high',
    destinationTeam: 'Billing & Claims',
    handoverMessage:
      'আপনার দেওয়া পেমেন্ট ট্রানজেকশন আইডিটি পুনরায় চেক করতে আমাদের অ্যাকাউন্টস অফিসার বিষয়টি খতিয়ে দেখছেন।',
    notificationChannels: ['in_app'],
    pauseAiImmediately: true,
    requireExplicitResume: true,
    isActive: true,
  },
  {
    id: 'rule_5',
    name: 'Low Retrieval Grounding Confidence',
    description: 'When similarity score of retrieved knowledge base is under 60% and no clear answer exists.',
    triggerType: 'low_confidence',
    priority: 'medium',
    destinationTeam: 'General Support',
    handoverMessage:
      'এই তথ্যটি সঠিকভাবে নিশ্চিত করতে আমি আমাদের টিমকে ইনফর্ম করেছি, তারা আপনাকে সঠিক বিবরণ জানিয়ে মেসেজ দিচ্ছেন।',
    notificationChannels: ['in_app'],
    pauseAiImmediately: true,
    requireExplicitResume: false,
    confidenceThresholdPercent: 60,
    isActive: true,
  },
];

export const INITIAL_RESPONSE_RULES: ResponseRulesConfig = {
  maxResponseCharacters: 420,
  maxSentencesPerMessage: 3,
  supportedLocales: ['bn-BD', 'en-US', 'bn-Latin'],
  quickTemplates: [
    {
      id: 'tpl_1',
      triggerKeyword: '!delivery',
      templateText:
        'ঢাকার ভিতরে ডেলিভারি ৬০ টাকা (২৪-৪৮ ঘণ্টা), ঢাকার বাইরে ১২০ টাকা (৪৮-৭২ ঘণ্টা)।',
    },
    {
      id: 'tpl_2',
      triggerKeyword: '!bkash',
      templateText:
        'আমাদের bKash মার্চেন্ট অ্যাকাউন্ট নম্বর: 01700-112233। অনুগ্রহ করে Make Payment ব্যবহার করুন।',
    },
    {
      id: 'tpl_3',
      triggerKeyword: '!exchange',
      templateText:
        'পণ্য পৌঁছানোর ৩ দিনের মধ্যে আনবক্সিং ছবি পাঠালে ত্রুটিপূর্ণ আইটেম সম্পূর্ণ বিনামূল্যে বদলে দেওয়া হয়।',
    },
  ],
  restrictedClaims: [
    '১০০% ক্যাশব্যাক কোনো শর্ত ছাড়াই',
    '১ ঘণ্টায় সারা দেশে ফ্রি ডেলিভারি',
    'লাইফটাইম আনলিমিটেড ফ্রি রিপ্লেসমেন্ট',
  ],
  sourceCitationBehavior: 'for_policy_pricing',
  conflictingSourcesBehavior: 'yield_to_newest',
  noAnswerBehavior: 'admit_and_escalate',
  combineMultipleQuestions: true,
};

export const INITIAL_CONFIG_VERSIONS: AgentConfigVersion[] = [
  {
    version: 'v2.4.1',
    publishedAt: 'Oct 26, 2026, 4:15 PM',
    publishedBy: 'Sajedur Rahman',
    summary: 'Updated tone to Friendly, added bKash TRXID payment discrepancy handover rule.',
    mode: 'automatic',
    identity: INITIAL_IDENTITY,
    instructions: INITIAL_INSTRUCTIONS,
    behavior: INITIAL_BEHAVIOR,
    handoverRules: INITIAL_HANDOVER_RULES,
    responseRules: INITIAL_RESPONSE_RULES,
    isLive: true,
  },
  {
    version: 'v2.4.0',
    publishedAt: 'Oct 18, 2026, 11:00 AM',
    publishedBy: 'Rafiq Islam',
    summary: 'Enabled Banglish language support and set 420 character length limit for mobile readability.',
    mode: 'automatic',
    identity: {
      ...INITIAL_IDENTITY,
      messageLength: 'concise',
    },
    instructions: INITIAL_INSTRUCTIONS,
    behavior: INITIAL_BEHAVIOR,
    handoverRules: INITIAL_HANDOVER_RULES.slice(0, 4),
    responseRules: INITIAL_RESPONSE_RULES,
    isLive: false,
  },
  {
    version: 'v2.3.0',
    publishedAt: 'Oct 02, 2026, 2:30 PM',
    publishedBy: 'Sajedur Rahman',
    summary: 'Initial baseline production agent setup in suggestion mode before full autonomous launch.',
    mode: 'suggestion',
    identity: {
      ...INITIAL_IDENTITY,
      tone: 'formal',
    },
    instructions: INITIAL_INSTRUCTIONS,
    behavior: INITIAL_BEHAVIOR,
    handoverRules: INITIAL_HANDOVER_RULES.slice(0, 3),
    responseRules: INITIAL_RESPONSE_RULES,
    isLive: false,
  },
];
