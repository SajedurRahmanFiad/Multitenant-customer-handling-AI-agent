export type PageId =
  | 'overview'
  | 'inbox'
  | 'knowledge'
  | 'agent'
  | 'channels'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'platform_admin';

export interface NavItem {
  id: PageId;
  label: string;
  subtitle: string;
  description: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    subtitle: 'Performance & agent status',
    description: 'Business performance and agent status',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    subtitle: 'Live chats & handover',
    description: 'Live conversations and human handover · Messenger and WhatsApp unified',
  },
  {
    id: 'knowledge',
    label: 'AI Knowledge',
    subtitle: 'Sources, FAQs & catalog',
    description: 'Training sources, policies, FAQs and products',
  },
  {
    id: 'agent',
    label: 'Agent Configuration',
    subtitle: 'Personality, prompts & tools',
    description: 'Personality, instructions, tools and behavior',
  },
  {
    id: 'channels',
    label: 'Channels & Integrations',
    subtitle: 'Messenger, WhatsApp & systems',
    description: 'Messenger, WhatsApp and business systems',
  },
  {
    id: 'analytics',
    label: 'Analytics & Usage',
    subtitle: 'Resolution, costs & volume',
    description: 'Resolution, costs, volume and quality',
  },
  {
    id: 'team',
    label: 'Team & Permissions',
    subtitle: 'Members, roles & access',
    description: 'Team members, granular permissions, session control & audit log',
  },
  {
    id: 'settings',
    label: 'Settings',
    subtitle: 'Business, limits & preferences',
    description: 'Business profile, notifications, billing and audit logs',
  },
  {
    id: 'platform_admin',
    label: 'Platform Admin',
    subtitle: 'Multi-tenancy & ops',
    description: 'Platform infrastructure, tenants, model registry & compliance',
    badge: 'Super Admin',
  },
];
