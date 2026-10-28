import {
  PlanDetails,
  UsageMetric,
  CostBreakdownComparison,
  InvoiceItem,
} from '../types/billing';

export const CURRENT_PLAN_DETAILS: PlanDetails = {
  tier: 'growth',
  displayName: 'Growth Tier',
  priceMonthlyUSD: 149,
  priceMonthlyBDT: 16500,
  conversationsAllowance: 15000,
  messagesAllowance: 60000,
  teamSeatsAllowance: 10,
  channelsAllowance: 5,
  retentionDays: 90,
  features: [
    { name: 'Unified Messenger & WhatsApp Routing', included: true },
    { name: 'Automated AI + Human Handover', included: true },
    { name: 'Custom Brand Knowledge (PDF, URLs, FAQ)', included: true },
    { name: 'Custom Tools & Order Actions (Read & Write)', included: true },
    { name: 'Priority Webhook Queue Delivery', included: true },
    { name: 'Granular Role-Based Access Control', included: true },
    { name: 'Dedicated Account Manager & SLA 99.9%', included: false, limitText: 'Enterprise only' },
  ],
};

export const CURRENT_USAGE_METRICS: UsageMetric[] = [
  {
    name: 'Monthly Conversations',
    current: 12480,
    limit: 15000,
    unit: 'conversations',
    percentUsed: 83.2,
    isOverLimit: false,
  },
  {
    name: 'Total Messages (In + Out)',
    current: 48290,
    limit: 60000,
    unit: 'messages',
    percentUsed: 80.5,
    isOverLimit: false,
  },
  {
    name: 'Active Team Seats',
    current: 6,
    limit: 10,
    unit: 'seats',
    percentUsed: 60,
    isOverLimit: false,
  },
  {
    name: 'Connected Channels',
    current: 3,
    limit: 5,
    unit: 'channels',
    percentUsed: 60,
    isOverLimit: false,
  },
  {
    name: 'Indexed Knowledge Chunks',
    current: 4210,
    limit: 10000,
    unit: 'chunks',
    percentUsed: 42.1,
    isOverLimit: false,
  },
];

// CRITICAL REQUIREMENT: Two distinct cost metrics
// Metric 1: Provider cost (what the AI provider + hosting costs in raw compute)
// Metric 2: Client billable usage (what the client pays / gets invoiced)
export const CURRENT_COST_COMPARISON: CostBreakdownComparison = {
  providerCostUSD: 38.42,
  providerCostBDT: 4260,
  providerBreakdown: {
    geminiCostUSD: 24.15,
    openAICostUSD: 8.20,
    anthropicCostUSD: 2.10,
    vectorEmbeddingCostUSD: 1.85,
    infraComputeCostUSD: 2.12,
  },
  clientBillableUSD: 149.00,
  clientBillableBDT: 16500,
  clientBillingBreakdown: {
    basePlanFeeUSD: 149.00,
    overageConversationsUSD: 0.00,
    additionalChannelsUSD: 0.00,
    prioritySupportUSD: 0.00,
  },
  platformMarginPercent: 74.2,
};

export const INITIAL_INVOICE_HISTORY: InvoiceItem[] = [
  {
    id: 'inv_01',
    invoiceNumber: 'INV-2026-10-019',
    date: 'Oct 01, 2026',
    billingPeriod: 'Oct 01 - Oct 31, 2026',
    amountUSD: 149.00,
    amountBDT: 16500,
    status: 'paid',
    paymentMethod: 'Mastercard ending in 4242',
    downloadUrl: '#',
  },
  {
    id: 'inv_02',
    invoiceNumber: 'INV-2026-09-014',
    date: 'Sep 01, 2026',
    billingPeriod: 'Sep 01 - Sep 30, 2026',
    amountUSD: 149.00,
    amountBDT: 16500,
    status: 'paid',
    paymentMethod: 'bKash Merchant Pay (01712-984210)',
    downloadUrl: '#',
  },
  {
    id: 'inv_03',
    invoiceNumber: 'INV-2026-08-012',
    date: 'Aug 01, 2026',
    billingPeriod: 'Aug 01 - Aug 31, 2026',
    amountUSD: 149.00,
    amountBDT: 16500,
    status: 'paid',
    paymentMethod: 'Mastercard ending in 4242',
    downloadUrl: '#',
  },
];
