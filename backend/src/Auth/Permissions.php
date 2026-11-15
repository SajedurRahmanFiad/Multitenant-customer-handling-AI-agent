<?php
declare(strict_types=1);

/** Role → default granular permissions, mirroring src/types/team.ts. */
final class Permissions
{
    public const DEFINITIONS = [
        ['id' => 'read_conversations',   'name' => 'Read Conversations',                'category' => 'Conversations',          'description' => 'View customer threads across Messenger and WhatsApp', 'isRestricted' => false],
        ['id' => 'send_messages',        'name' => 'Send Messages',                     'category' => 'Conversations',          'description' => 'Send manual replies and internal staff notes in conversation threads', 'isRestricted' => false],
        ['id' => 'takeover_ai',          'name' => 'Take Over AI',                      'category' => 'Conversations',          'description' => 'Pause automated AI responses and assume control of the live chat', 'isRestricted' => false],
        ['id' => 'edit_knowledge',       'name' => 'Edit Knowledge Base',               'category' => 'AI & Knowledge',         'description' => 'Upload documents, edit FAQs, catalog data and training sources', 'isRestricted' => false],
        ['id' => 'publish_policies',     'name' => 'Publish Policies & Prompts',        'category' => 'AI & Knowledge',         'description' => 'Publish live behavior, guardrails, and system prompt changes', 'isRestricted' => true],
        ['id' => 'change_ai_config',     'name' => 'Change AI Configuration',           'category' => 'AI & Knowledge',         'description' => 'Modify personality, temperature, tool assignments, and agent modes', 'isRestricted' => true],
        ['id' => 'manage_integrations',  'name' => 'Manage Channels & Integrations',    'category' => 'Integrations & Admin',   'description' => 'Connect or disconnect Facebook Pages, WhatsApp numbers, and webhooks', 'isRestricted' => true],
        ['id' => 'export_customer_data', 'name' => 'Export Customer Data',              'category' => 'Data & Billing',         'description' => 'Download customer conversation history, PII, and contacts in CSV/JSON', 'isRestricted' => true],
        ['id' => 'manage_team',          'name' => 'Manage Team & Permissions',         'category' => 'Data & Billing',         'description' => 'Invite members, modify roles, revoke sessions, and adjust access rights', 'isRestricted' => true],
        ['id' => 'view_billing',         'name' => 'View Billing & Platform Spend',     'category' => 'Data & Billing',         'description' => 'Access subscription invoices, provider costs, and upgrade plan tiers', 'isRestricted' => true],
    ];

    public const ROLE_DEFAULTS = [
        'super_admin' => ['read_conversations','send_messages','takeover_ai','edit_knowledge','publish_policies','manage_integrations','change_ai_config','export_customer_data','manage_team','view_billing'],
        'admin'       => ['read_conversations','send_messages','takeover_ai','edit_knowledge','publish_policies','manage_integrations','change_ai_config','manage_team'],
        'agent'       => ['read_conversations','send_messages','takeover_ai','edit_knowledge'],
        'analyst'     => ['read_conversations'],
    ];

    public static function defaultsFor(string $role): array
    {
        return self::ROLE_DEFAULTS[$role] ?? [];
    }

    public static function isValid(string $role): bool
    {
        return isset(self::ROLE_DEFAULTS[$role]);
    }
}
