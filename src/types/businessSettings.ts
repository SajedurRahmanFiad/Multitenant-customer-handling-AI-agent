export interface BusinessProfile {
  businessName: string;
  industry: string;
  businessDescription: string;
  website: string;
  contactPhone: string;
  supportEmail: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  timeZone: string;
  operatingLocations: string[];
}

export type OutOfHoursBehavior =
  | 'automated_faq_and_queue'
  | 'polite_closed_notice'
  | 'emergency_ai_only'
  | 'silent_queue';

export interface ServiceSettings {
  deliveryAreas: {
    zone: string;
    courierPartner: string;
    estimatedDelivery: string;
    standardFeeBDT: number;
    cashOnDeliveryAvailable: boolean;
  }[];
  customerSupportHours: string;
  escalationSupervisorName: string;
  escalationSupervisorEmail: string;
  escalationSupervisorPhone: string;
  supportPhone: string;
  supportEmail: string;
  outOfHoursBehavior: OutOfHoursBehavior;
  defaultGreetingMessage: string;
  outOfHoursMessage: string;
}

export type RetentionWindow = '30_days' | '90_days' | '365_days' | 'indefinite';

export interface DataRetentionSettings {
  retentionWindow: RetentionWindow;
  autoPurgeCustomerPII: boolean;
  autoPurgeVoiceNotes: boolean;
  privacyNoticeUrl: string;
  dataProcessingAgreementSigned: boolean;
  dpaSignedDate?: string;
  erasureRequestsCount: number;
  lastDataExportTimestamp?: string;
}

export interface CustomerErasureRequest {
  id: string;
  customerIdentifier: string;
  channel: 'messenger' | 'whatsapp';
  requestedAt: string;
  status: 'pending_verification' | 'completed' | 'rejected';
  recordsPurgedCount: number;
  requestedBy: string;
  verificationHash: string;
}
