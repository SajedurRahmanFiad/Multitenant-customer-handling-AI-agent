export type KnowledgeTab =
  | 'sources'
  | 'policies'
  | 'catalogue'
  | 'brand'
  | 'jobs'
  | 'testing';

export interface BrandIdentityKnowledge {
  tagline: string;
  brandVoice: string;
  tonePillars: {
    name: string;
    description: string;
  }[];
  vocabularyGuidelines: {
    preferredTerms: string[];
    forbiddenTerms: string[];
  };
  greetingConvention: string;
  culturalNuances: string;
  lastUpdated: string;
}

export type SourceType =
  | 'website'
  | 'document'
  | 'faq'
  | 'catalogue'
  | 'manual'
  | 'sheets';

export type SourceStatus =
  | 'ready'
  | 'processing'
  | 'queued'
  | 'failed'
  | 'outdated';

export interface KnowledgeSource {
  id: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  lastIndexed: string;
  lastContentUpdate: string;
  recordChunksCount: number;
  originDetails: string;
  errorReason?: string;
  isActive: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  alternativeQuestions: string[];
  approvedAnswer: string;
  category: string;
  applicableChannel: 'All' | 'WhatsApp' | 'Messenger' | 'Website';
  language: 'Bangla' | 'English' | 'Mixed';
  status: 'Published' | 'Draft' | 'Archived';
  priority: number;
  reviewDate: string;
  internalNotes?: string;
}

export type PolicyCategory =
  | 'Delivery and shipping'
  | 'Returns and exchanges'
  | 'Refunds'
  | 'Warranty'
  | 'Cancellations'
  | 'Payments'
  | 'Discounts and promotional offers'
  | 'Customer eligibility'
  | 'Complaints and escalation'
  | 'Privacy and customer data'
  | 'General operations'
  | 'Products and services'
  | 'Sales and pricing'
  | 'Human resources'
  | 'Workplace health and safety'
  | 'Finance and accounting'
  | 'Legal and compliance'
  | 'Information security'
  | 'Facilities and equipment'
  | 'Procurement and suppliers'
  | 'Quality assurance'
  | 'Marketing and communications'
  | 'Travel and expenses'
  | 'Environmental and sustainability';

export interface BusinessPolicy {
  id: string;
  name: string;
  category: PolicyCategory;
  fullText: string;
  rulesAndExceptions: string[];
  effectiveDate: string;
  permanent?: boolean;
  reviewDate?: string;
  publicationStatus: 'Published' | 'Draft' | 'Under Review';
  approvalStatus: 'Approved' | 'Pending Approval';
  version: string;
  lastApprovedBy: string;
  lastUpdated: string;
}

export interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  variants: string[];
  price: string;
  currency: string;
  discountedPrice?: string;
  inventoryStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Live API Verified';
  stockCount: number;
  imageUrl?: string;
  imageUrls?: string[];
  shippingRestrictions?: string;
  warrantyInfo?: string;
  productUrl?: string;
  isActive: boolean;
}

export interface TrainingJob {
  id: string;
  sourceName: string;
  jobType: 'Initial Indexing' | 'Re-index' | 'Scheduled Sync' | 'Chunk Embeddings';
  status: 'running' | 'completed' | 'failed' | 'queued' | 'cancelled';
  documentsProcessed: number;
  totalDocuments: number;
  recordsSkipped: number;
  durationMs: number;
  startedAt: string;
  finishedAt?: string;
  errorMessage?: string;
}

export interface TestCase {
  id: string;
  question: string;
  draftAnswer: string;
  retrievedSources: Array<{
    title: string;
    passage: string;
    relevanceScore: number;
  }>;
  isGrounded: boolean;
  expectedAnswer?: string;
  verdict: 'correct' | 'incorrect' | 'incomplete' | 'untested';
  testedAt: string;
}

