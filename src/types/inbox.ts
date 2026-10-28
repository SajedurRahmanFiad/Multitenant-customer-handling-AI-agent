export type ChannelType = 'whatsapp' | 'messenger';

export type ConversationStatus =
  | 'needs_human'
  | 'ai_handling'
  | 'waiting'
  | 'resolved';

export type ConversationFilter =
  | 'all'
  | 'unassigned'
  | 'needs_human'
  | 'ai_handling'
  | 'waiting'
  | 'resolved';

export type PriorityType = 'urgent' | 'high' | 'medium' | 'low';

export type AiControlStatus = 'active' | 'paused' | 'human_controlled';

export interface RetrievedSource {
  id: string;
  title: string;
  score: number;
  snippet: string;
}

export interface Attachment {
  type: 'image' | 'audio' | 'file';
  url: string;
  name: string;
  size?: string;
  duration?: string;
  thumbnail?: string;
}

export interface MessageAiMetadata {
  confidence: number;
  status: 'send' | 'clarify' | 'handoff';
  usedSources: RetrievedSource[];
  preventedBecauseHumanControl?: boolean;
  isLowConfidence?: boolean;
  correctionNote?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'ai' | 'staff' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  deliveryState?: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Attachment[];
  isInternalNote?: boolean;
  aiMetadata?: MessageAiMetadata;
  systemEventType?: 'takeover' | 'release' | 'pause' | 'assigned' | 'priority_change' | 'tag_added';
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  externalId: string;
  language: string;
  memoryNotes: string;
  totalOrders: number;
  totalSpent: string;
  lastOrder?: {
    id: string;
    items: string;
    amount: string;
    status: string;
    date: string;
  };
  previousConversationsCount: number;
}

export interface Conversation {
  id: string;
  customer: CustomerProfile;
  channel: ChannelType;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: ConversationStatus;
  assignedStaff: string | null;
  assignedTeam?: string;
  priority: PriorityType;
  tags: string[];
  aiStatus: AiControlStatus;
  handoverReason: string | null;
  retrievedSources: RetrievedSource[];
  isAiProcessing?: boolean;
}
