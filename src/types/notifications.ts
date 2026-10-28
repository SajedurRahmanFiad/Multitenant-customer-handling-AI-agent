export type EscalationTriggerType =
  | 'human_attention_requested'
  | 'customer_waiting_timeout'
  | 'channel_disconnected'
  | 'model_rate_limit_429'
  | 'knowledge_index_failure'
  | 'usage_threshold_reached'
  | 'negative_sentiment_complaint';

export interface EscalationRule {
  id: string;
  triggerType: EscalationTriggerType;
  name: string;
  description: string;
  isEnabled: boolean;
  thresholdValue?: string; // e.g. "5 minutes", "80% quota", "Critical"
  action: 'notify_staff' | 'reassign_queue' | 'escalate_supervisor' | 'page_engineer';
  notifyChannels: ('in_app' | 'email' | 'whatsapp' | 'webhook')[];
  assignedRole: string;
}

export interface UserNotificationPreference {
  category: string;
  description: string;
  inApp: boolean;
  email: boolean;
  smsWhatsapp: boolean;
}

export interface SystemNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  timestamp: string;
  isRead: boolean;
  sourceModule: string;
  actionUrl?: string;
}
