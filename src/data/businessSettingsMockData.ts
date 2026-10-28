import {
  BusinessProfile,
  ServiceSettings,
  DataRetentionSettings,
  CustomerErasureRequest,
} from '../types/businessSettings';

export const INITIAL_BUSINESS_PROFILE: BusinessProfile = {
  businessName: 'Bengal Loom & Crafts',
  industry: 'Traditional Apparel & Handloom Fashion',
  businessDescription:
    'Authentic Jamdani sarees, handcrafted panjabis, and artisanal home decor woven by certified heritage weavers of Narayanganj and Tangail.',
  website: 'https://bengalloom.com.bd',
  contactPhone: '+880 1712-984210',
  supportEmail: 'care@bengalloom.com.bd',
  businessHoursStart: '09:00',
  businessHoursEnd: '22:00',
  timeZone: 'Asia/Dhaka (GMT+6)',
  operatingLocations: ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna'],
};

export const INITIAL_SERVICE_SETTINGS: ServiceSettings = {
  deliveryAreas: [
    {
      zone: 'Inside Dhaka Metropolitan',
      courierPartner: 'Pathao / Steadfast Express',
      estimatedDelivery: '24 - 48 Hours',
      standardFeeBDT: 70,
      cashOnDeliveryAvailable: true,
    },
    {
      zone: 'Chattogram & Sylhet Metro',
      courierPartner: 'Steadfast / RedX',
      estimatedDelivery: '48 - 72 Hours',
      standardFeeBDT: 130,
      cashOnDeliveryAvailable: true,
    },
    {
      zone: 'All Other Districts (Outstations)',
      courierPartner: 'Sundarban Courier / SA Paribahan',
      estimatedDelivery: '3 - 5 Business Days',
      standardFeeBDT: 150,
      cashOnDeliveryAvailable: true,
    },
  ],
  customerSupportHours: 'Daily 09:00 AM - 10:00 PM BST',
  escalationSupervisorName: 'Rafiq Islam (Operations Lead)',
  escalationSupervisorEmail: 'rafiq.supervisor@bengalloom.com',
  escalationSupervisorPhone: '+880 1712-984210',
  supportPhone: '+880 1712-984210',
  supportEmail: 'support@bengalloom.com.bd',
  outOfHoursBehavior: 'automated_faq_and_queue',
  defaultGreetingMessage:
    'আসসালামু আলাইকুম! Bengal Loom & Crafts-এ আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?',
  outOfHoursMessage:
    'আমাদের অফিস টাইম সকাল ৯টা থেকে রাত ১০টা পর্যন্ত। আপনার মেসেজটি আমরা পেয়েছি! আমাদের টিম সকাল ৯টায় এসেই সবার আগে আপনাকে রিপ্লাই দিবে। আপনি চাইলে আমাদের সাইট ও FAQ দেখতে পারেন।',
};

export const INITIAL_DATA_RETENTION: DataRetentionSettings = {
  retentionWindow: '90_days',
  autoPurgeCustomerPII: true,
  autoPurgeVoiceNotes: true,
  privacyNoticeUrl: 'https://bengalloom.com.bd/privacy-policy',
  dataProcessingAgreementSigned: true,
  dpaSignedDate: 'Jan 15, 2025',
  erasureRequestsCount: 14,
  lastDataExportTimestamp: 'Oct 20, 2026 14:32 BST',
};

export const INITIAL_ERASURE_REQUESTS: CustomerErasureRequest[] = [
  {
    id: 'era_01',
    customerIdentifier: '+880 1718-491029',
    channel: 'whatsapp',
    requestedAt: 'Oct 22, 2026',
    status: 'completed',
    recordsPurgedCount: 38,
    requestedBy: 'Sajedur Rahman',
    verificationHash: 'sha256-8a9d18b2...f9e1',
  },
  {
    id: 'era_02',
    customerIdentifier: 'FB_PSID_981240189',
    channel: 'messenger',
    requestedAt: 'Oct 24, 2026',
    status: 'completed',
    recordsPurgedCount: 19,
    requestedBy: 'Rafiq Islam',
    verificationHash: 'sha256-4b2190ae...33c9',
  },
];
