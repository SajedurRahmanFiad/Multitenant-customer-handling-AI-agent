export type TeamRole =
  | 'super_admin'
  | 'admin'
  | 'agent'
  | 'analyst';

export type AccountStatus = 'active' | 'invited' | 'suspended';

export type GranularPermission =
  | 'read_conversations'
  | 'send_messages'
  | 'takeover_ai'
  | 'edit_knowledge'
  | 'publish_policies'
  | 'manage_integrations'
  | 'change_ai_config'
  | 'access_analytics'
  | 'export_customer_data'
  | 'manage_team'
  | 'view_billing';

export interface PermissionDefinition {
  id: GranularPermission;
  name: string;
  category: 'Conversations' | 'AI & Knowledge' | 'Integrations & Admin' | 'Data & Billing';
  description: string;
  isRestricted: boolean; // Flag to indicate high-privilege permissions
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    id: 'read_conversations',
    name: 'Read Conversations',
    category: 'Conversations',
    description: 'View customer threads across Messenger and WhatsApp',
    isRestricted: false,
  },
  {
    id: 'send_messages',
    name: 'Send Messages',
    category: 'Conversations',
    description: 'Send manual replies and internal staff notes in conversation threads',
    isRestricted: false,
  },
  {
    id: 'takeover_ai',
    name: 'Take Over AI',
    category: 'Conversations',
    description: 'Pause automated AI responses and assume control of the live chat',
    isRestricted: false,
  },
  {
    id: 'edit_knowledge',
    name: 'Edit Knowledge Base',
    category: 'AI & Knowledge',
    description: 'Upload documents, edit FAQs, catalog data and training sources',
    isRestricted: false,
  },
  {
    id: 'publish_policies',
    name: 'Publish Policies & Prompts',
    category: 'AI & Knowledge',
    description: 'Publish live behavior, guardrails, and system prompt changes',
    isRestricted: true,
  },
  {
    id: 'change_ai_config',
    name: 'Change AI Configuration',
    category: 'AI & Knowledge',
    description: 'Modify personality, temperature, tool assignments, and agent modes',
    isRestricted: true,
  },
  {
    id: 'manage_integrations',
    name: 'Manage Channels & Integrations',
    category: 'Integrations & Admin',
    description: 'Connect or disconnect Facebook Pages, WhatsApp numbers, and webhooks',
    isRestricted: true,
  },
  {
    id: 'access_analytics',
    name: 'Access Analytics',
    category: 'Integrations & Admin',
    description: 'View resolution rates, conversation volume, and agent performance reports',
    isRestricted: false,
  },
  {
    id: 'export_customer_data',
    name: 'Export Customer Data',
    category: 'Data & Billing',
    description: 'Download customer conversation history, PII, and contacts in CSV/JSON',
    isRestricted: true,
  },
  {
    id: 'manage_team',
    name: 'Manage Team & Permissions',
    category: 'Data & Billing',
    description: 'Invite members, modify roles, revoke sessions, and adjust access rights',
    isRestricted: true,
  },
  {
    id: 'view_billing',
    name: 'View Billing & Platform Spend',
    category: 'Data & Billing',
    description: 'Access subscription invoices, provider costs, and upgrade plan tiers',
    isRestricted: true,
  },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<TeamRole, GranularPermission[]> = {
  super_admin: [
    'read_conversations',
    'send_messages',
    'takeover_ai',
    'edit_knowledge',
    'publish_policies',
    'manage_integrations',
    'change_ai_config',
    'access_analytics',
    'export_customer_data',
    'manage_team',
    'view_billing',
  ],
  admin: [
    'read_conversations',
    'send_messages',
    'takeover_ai',
    'edit_knowledge',
    'publish_policies',
    'manage_integrations',
    'change_ai_config',
    'access_analytics',
    'manage_team',
  ],
  agent: ['read_conversations', 'send_messages', 'takeover_ai', 'edit_knowledge'],
  analyst: ['read_conversations', 'access_analytics'],
};

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  tenantId: string;
  tenantName: string;
  avatarUrl?: string;
  role: TeamRole;
  department: string;
  assignedChannels: ('messenger' | 'whatsapp')[];
  status: AccountStatus;
  twoFactorEnabled: boolean;
  lastActive: string;
  joinedAt: string;
  customPermissions?: GranularPermission[];
}

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  tenantId?: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  isCurrentSession: boolean;
  lastActive: string;
}

export interface AdminActionRecord {
  id: string;
  actorName: string;
  actorPhone: string;
  tenantId?: string;
  action: string;
  targetUser?: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}
