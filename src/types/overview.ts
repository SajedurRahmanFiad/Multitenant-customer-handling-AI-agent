export type TimePeriod = '24h' | '7d' | '30d';

export type AgentStatusType = 'Active' | 'Paused' | 'Degraded' | 'Disconnected';
export type ConnectionStatusType = 'Connected' | 'Reconnecting' | 'Disconnected' | 'Degraded';
export type KnowledgeStatusType = 'Ready' | 'Indexing' | 'Failed';

export interface TopStatusData {
  agentStatus: AgentStatusType;
  messengerStatus: ConnectionStatusType;
  whatsAppStatus: ConnectionStatusType;
  knowledgeStatus: KnowledgeStatusType;
  indexedDocsCount: number;
  aiProvider: string;
  aiProviderStatus: 'Normal' | 'Rate Limited' | 'Approaching Quota';
  quotaUsedPercent: number;
  unansweredCount: number;
}

export interface MetricCardData {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  unit?: string;
  changePercent?: number; // e.g. +12%
  changeType?: 'positive' | 'negative' | 'neutral';
  explanation: string;
  urgent?: boolean;
}

export interface ChartDataPoint {
  timeLabel: string;
  totalConversations: number;
  aiHandled: number;
  humanHandled: number;
  messengerMsgs: number;
  whatsAppMsgs: number;
}

export interface CustomerQuestionStat {
  id: string;
  question: string;
  count: number;
  category: string;
  resolvedByAiPercent: number;
  channel: 'Messenger' | 'WhatsApp' | 'Both';
}

export interface HandoverReasonStat {
  id: string;
  reason: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'steady';
}

export interface FailedOrUnresolvedItem {
  id: string;
  customerName: string;
  channel: 'Messenger' | 'WhatsApp';
  snippet: string;
  reason: string;
  timestamp: string;
  confidence: number;
  status: 'Needs Attention' | 'Unresolved' | 'Failed Audio';
}

export interface ActivityLogItem {
  id: string;
  type: 'staff_takeover' | 'knowledge_update' | 'connection_event' | 'rule_triggered' | 'system_notice';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}
