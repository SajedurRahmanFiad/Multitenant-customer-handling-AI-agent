export type SubscriptionTier = 'starter' | 'growth' | 'pro' | 'enterprise';

export interface PlanFeature {
  name: string;
  included: boolean;
  limitText?: string;
}

export interface PlanDetails {
  tier: SubscriptionTier;
  displayName: string;
  priceMonthlyUSD: number;
  priceMonthlyBDT: number;
  conversationsAllowance: number;
  messagesAllowance: number;
  teamSeatsAllowance: number;
  channelsAllowance: number;
  retentionDays: number;
  features: PlanFeature[];
}

export interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
  percentUsed: number;
  isOverLimit: boolean;
}

export interface CostBreakdownComparison {
  // Metric 1: Provider cost (actual infrastructure & raw model tokens consumed)
  providerCostUSD: number;
  providerCostBDT: number;
  providerBreakdown: {
    geminiCostUSD: number;
    openAICostUSD: number;
    anthropicCostUSD: number;
    vectorEmbeddingCostUSD: number;
    infraComputeCostUSD: number;
  };

  // Metric 2: Client billable usage (plan tier fee + billable value-added usage)
  clientBillableUSD: number;
  clientBillableBDT: number;
  clientBillingBreakdown: {
    basePlanFeeUSD: number;
    overageConversationsUSD: number;
    additionalChannelsUSD: number;
    prioritySupportUSD: number;
  };

  // Gross platform margin on this tenant
  platformMarginPercent: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  date: string;
  billingPeriod: string;
  amountUSD: number;
  amountBDT: number;
  status: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  downloadUrl?: string;
}
