<?php
declare(strict_types=1);

/**
 * Route table. Public routes (login, ingest, webhooks, health) skip the auth
 * middleware; everything else requires a Bearer token resolved to AuthContext.
 */
return function (Router $r): void {

    // ---------------- public ----------------
    $r->post('/auth/login', [AuthController::class, 'login']);
    $r->get('/health', fn() => Response::json(['ok' => true, 'service' => 'ai-support-backend', 'time' => date('c')]));

    $r->post('/ingest/message', [IngestController::class, 'message']);
    $r->post('/ingest/batch', [IngestController::class, 'batch']);
    $r->get('/ingest/health', [IngestController::class, 'health']);

    $r->get('/webhooks/messenger', [WebhookController::class, 'verifyMessenger']);
    $r->post('/webhooks/messenger', [WebhookController::class, 'receiveMessenger']);
    $r->get('/webhooks/whatsapp', [WebhookController::class, 'verifyWhatsapp']);
    $r->post('/webhooks/whatsapp', [WebhookController::class, 'receiveWhatsapp']);
    $r->post('/webhooks/{channel}', [WebhookController::class, 'receiveCustom']);

    // ---------------- authenticated ----------------
    $r->get('/auth/me', [AuthController::class, 'me']);
    $r->post('/auth/logout', [AuthController::class, 'logout']);
    $r->post('/auth/2fa', [AuthController::class, 'toggle2fa']);
    $r->post('/auth/password', [AuthController::class, 'changePassword']);

    // Team
    $r->get('/team/members', [TeamController::class, 'listMembers']);
    $r->get('/team/teams', [TeamController::class, 'listTeams']);
    $r->post('/team/members', [TeamController::class, 'inviteMember']);
    $r->patch('/team/members/{id}', [TeamController::class, 'updateMember']);
    $r->delete('/team/members/{id}', [TeamController::class, 'deleteMember']);
        $r->patch('/team/super-admin/profile', [TeamController::class, 'updateSuperAdminProfile']);
    $r->post('/team/members/{id}/2fa', [TeamController::class, 'toggle2fa']);
    $r->get('/team/permissions', [TeamController::class, 'permissions']);
    $r->get('/team/sessions', [TeamController::class, 'sessions']);
    $r->delete('/team/sessions/{id}', [TeamController::class, 'revokeSession']);
    $r->post('/team/sessions/revoke-others', [TeamController::class, 'revokeOthers']);
    $r->get('/team/admin-actions', [TeamController::class, 'adminActions']);

    // Overview
    $r->get('/overview', [OverviewController::class, 'dashboard']);
    $r->post('/overview/test-agent', [OverviewController::class, 'testAgent']);
    $r->get('/overview/quick-actions', [OverviewController::class, 'quickActions']);

    // Inbox
    $r->get('/inbox/conversations', [InboxController::class, 'conversations']);
    $r->get('/inbox/conversations/{id}', [InboxController::class, 'conversation']);
    $r->get('/inbox/conversations/{id}/messages', [InboxController::class, 'messages']);
    $r->post('/inbox/conversations/{id}/messages', [InboxController::class, 'sendMessage']);
    $r->post('/inbox/conversations/{id}/ai-control', [InboxController::class, 'aiControl']);
    $r->post('/inbox/conversations/{id}/assign', [InboxController::class, 'assign']);
    $r->post('/inbox/conversations/{id}/transfer-team', [InboxController::class, 'transferTeam']);
    $r->post('/inbox/conversations/{id}/status', [InboxController::class, 'status']);
    $r->post('/inbox/conversations/{id}/priority', [InboxController::class, 'priority']);
    $r->post('/inbox/conversations/{id}/tags', [InboxController::class, 'tags']);
    $r->post('/inbox/conversations/{id}/read', [InboxController::class, 'markRead']);
    $r->post('/inbox/conversations/{id}/generate-reply', [InboxController::class, 'generateReply']);
    $r->post('/inbox/messages/{messageId}/correct-reply', [InboxController::class, 'correctReply']);
    $r->get('/inbox/canned-replies', [InboxController::class, 'cannedReplies']);
    $r->post('/inbox/canned-replies', [InboxController::class, 'createCannedReply']);
    $r->get('/inbox/customers/{id}', [InboxController::class, 'customer']);
    $r->patch('/inbox/customers/{id}', [InboxController::class, 'updateCustomer']);
    $r->get('/inbox/export-customers', [InboxController::class, 'exportCustomer']);
    $r->post('/inbox/upload', fn(Request $req) => Response::json(['url' => Uploads::store($req->file('file') ?? [], 'attachments')], 201));

    // Knowledge
    $r->get('/knowledge/sources', [KnowledgeController::class, 'sources']);
    $r->post('/knowledge/upload', fn(Request $req) => Response::json(['url' => Uploads::store($req->file('file') ?? [], 'knowledge')], 201));
    $r->post('/knowledge/sources', [KnowledgeController::class, 'createSource']);
    $r->patch('/knowledge/sources/{id}', [KnowledgeController::class, 'updateSource']);
    $r->delete('/knowledge/sources/{id}', [KnowledgeController::class, 'deleteSource']);
    $r->post('/knowledge/sources/{id}/reindex', [KnowledgeController::class, 'reindexSource']);
    $r->get('/knowledge/faqs', [KnowledgeController::class, 'faqs']);
    $r->post('/knowledge/faqs', [KnowledgeController::class, 'createFaq']);
    $r->patch('/knowledge/faqs/{id}', [KnowledgeController::class, 'updateFaq']);
    $r->delete('/knowledge/faqs/{id}', [KnowledgeController::class, 'deleteFaq']);
    $r->get('/knowledge/policies', [KnowledgeController::class, 'policies']);
    $r->post('/knowledge/policies', [KnowledgeController::class, 'createPolicy']);
    $r->patch('/knowledge/policies/{id}', [KnowledgeController::class, 'updatePolicy']);
    $r->delete('/knowledge/policies/{id}', [KnowledgeController::class, 'deletePolicy']);
    $r->post('/knowledge/policies/{id}/approve', [KnowledgeController::class, 'approvePolicy']);
    $r->get('/knowledge/products', [KnowledgeController::class, 'products']);
    $r->post('/knowledge/products', [KnowledgeController::class, 'createProduct']);
    $r->patch('/knowledge/products/{id}', [KnowledgeController::class, 'updateProduct']);
    $r->delete('/knowledge/products/{id}', [KnowledgeController::class, 'deleteProduct']);
    $r->post('/knowledge/products/upload-image', [KnowledgeController::class, 'uploadProductImage']);
    $r->get('/knowledge/brand', [KnowledgeController::class, 'brand']);
    $r->put('/knowledge/brand', [KnowledgeController::class, 'updateBrand']);
    $r->get('/knowledge/jobs', [KnowledgeController::class, 'jobs']);
    $r->post('/knowledge/jobs', [KnowledgeController::class, 'triggerJob']);
    $r->post('/knowledge/jobs/{id}/retry', [KnowledgeController::class, 'retryJob']);
    $r->post('/knowledge/jobs/{id}/cancel', [KnowledgeController::class, 'cancelJob']);
    $r->get('/knowledge/testing', [KnowledgeController::class, 'testCases']);
    $r->post('/knowledge/testing', [KnowledgeController::class, 'createTestCase']);
    $r->post('/knowledge/testing/{id}/run', [KnowledgeController::class, 'runTestCase']);
    $r->delete('/knowledge/testing/{id}', [KnowledgeController::class, 'deleteTestCase']);

    // Agent config
    $r->get('/agent/config', [AgentConfigController::class, 'config']);
    $r->put('/agent/identity', [AgentConfigController::class, 'saveIdentity']);
    $r->put('/agent/instructions', [AgentConfigController::class, 'saveInstructions']);
    $r->put('/agent/behavior', [AgentConfigController::class, 'saveBehavior']);
    $r->put('/agent/response-rules', [AgentConfigController::class, 'saveResponseRules']);
    $r->put('/agent/mode', [AgentConfigController::class, 'saveMode']);
    $r->get('/agent/handover-rules', [AgentConfigController::class, 'handoverRules']);
    $r->post('/agent/handover-rules', [AgentConfigController::class, 'createHandoverRule']);
    $r->patch('/agent/handover-rules/{id}', [AgentConfigController::class, 'updateHandoverRule']);
    $r->delete('/agent/handover-rules/{id}', [AgentConfigController::class, 'deleteHandoverRule']);
    $r->post('/agent/quick-templates', [AgentConfigController::class, 'createQuickTemplate']);
    $r->delete('/agent/quick-templates/{id}', [AgentConfigController::class, 'deleteQuickTemplate']);
    $r->get('/agent/pipeline', [AgentConfigController::class, 'pipeline']);
    $r->patch('/agent/pipeline/config', [AgentConfigController::class, 'updatePipelineConfig']);
    $r->patch('/agent/pipeline/{id}', [AgentConfigController::class, 'updatePipelineLayer']);
    $r->get('/agent/versions', [AgentConfigController::class, 'listVersions']);
    $r->post('/agent/publish', [AgentConfigController::class, 'publish']);
    $r->post('/agent/versions/{id}/rollback', [AgentConfigController::class, 'rollback']);
    $r->post('/agent/discard-draft', [AgentConfigController::class, 'discardDraft']);

    // Tools
    $r->get('/tools', [ToolsController::class, 'list']);
    $r->patch('/tools/{id}', [ToolsController::class, 'update']);
    $r->post('/tools/{id}/test', [ToolsController::class, 'test']);
    $r->get('/tools/audit-logs', [ToolsController::class, 'auditLogs']);

    // Channels
    $r->post('/channels/meta/login', [ChannelsController::class, 'metaLogin']);
    $r->get('/channels/meta/callback', [ChannelsController::class, 'metaCallback']);
    $r->get('/channels/meta/assets', [ChannelsController::class, 'metaAssets']);
    $r->post('/channels/meta/connect', [ChannelsController::class, 'connectMetaAsset']);
    $r->get('/channels/messenger', [ChannelsController::class, 'messenger']);
    $r->put('/channels/messenger', [ChannelsController::class, 'saveMessenger']);
    $r->post('/channels/messenger/disconnect', [ChannelsController::class, 'disconnectMessenger']);
    $r->get('/channels/whatsapp', [ChannelsController::class, 'whatsapp']);
    $r->put('/channels/whatsapp', [ChannelsController::class, 'saveWhatsapp']);
    $r->post('/channels/whatsapp/disconnect', [ChannelsController::class, 'disconnectWhatsapp']);
    $r->post('/channels/whatsapp/templates', [ChannelsController::class, 'createTemplate']);
    $r->patch('/channels/whatsapp/templates/{id}', [ChannelsController::class, 'updateTemplate']);
    $r->delete('/channels/whatsapp/templates/{id}', [ChannelsController::class, 'deleteTemplate']);
    $r->get('/channels/webhooks/events', [ChannelsController::class, 'webhookEvents']);
    $r->post('/channels/webhooks/errors/{id}/resolve', [ChannelsController::class, 'resolveWebhookError']);
    $r->get('/channels/integrations', [ChannelsController::class, 'integrations']);
    $r->post('/channels/integrations', [ChannelsController::class, 'createIntegration']);
    $r->put('/channels/integrations/{id}', [ChannelsController::class, 'saveIntegration']);
    $r->delete('/channels/integrations/{id}', [ChannelsController::class, 'deleteIntegration']);

    // Settings
    $r->get('/settings/business-profile', [SettingsController::class, 'businessProfile']);
    $r->put('/settings/business-profile', [SettingsController::class, 'saveBusinessProfile']);
    $r->get('/settings/service', [SettingsController::class, 'serviceSettings']);
    $r->put('/settings/service', [SettingsController::class, 'saveServiceSettings']);
    $r->get('/settings/retention', [SettingsController::class, 'retention']);
    $r->put('/settings/retention', [SettingsController::class, 'saveRetention']);
    $r->post('/settings/erasures', [SettingsController::class, 'createErasure']);
    $r->post('/settings/erasures/{id}/complete', [SettingsController::class, 'completeErasure']);
    $r->get('/settings/escalation-rules', [SettingsController::class, 'escalationRules']);
    $r->post('/settings/escalation-rules', [SettingsController::class, 'saveEscalationRule']);
    $r->get('/settings/notification-preferences', [SettingsController::class, 'notificationPreferences']);
    $r->post('/settings/notification-preferences', [SettingsController::class, 'saveNotificationPreference']);
    $r->get('/settings/notifications', [SettingsController::class, 'notifications']);
    $r->post('/settings/notifications/{id}/read', [SettingsController::class, 'markNotificationRead']);
    $r->post('/settings/notifications/read-all', [SettingsController::class, 'markAllRead']);
    $r->get('/settings/audit-logs', [SettingsController::class, 'auditLogs']);

    // Billing
    $r->get('/billing/overview', [BillingController::class, 'overview']);
    $r->get('/billing/plans', [BillingController::class, 'plans']);
    $r->post('/billing/change-plan', [BillingController::class, 'changePlan']);
    $r->get('/billing/invoices', [BillingController::class, 'invoices']);
    $r->get('/billing/invoices/export', [BillingController::class, 'exportInvoiceCsv']);
    $r->get('/billing/wallet', [BillingController::class, 'wallet']);
    $r->post('/billing/topup', [BillingController::class, 'topup']);

    // Platform admin (super_admin only — enforced by middleware)
    $r->get('/platform/tenants', [PlatformAdminController::class, 'tenants']);
    $r->get('/platform/support-session', [PlatformAdminController::class, 'supportSession']);
    $r->post('/platform/support-session', [PlatformAdminController::class, 'startSupportSession']);
    $r->post('/platform/support-session/end', [PlatformAdminController::class, 'endSupportSession']);
    $r->post('/platform/tenants', [PlatformAdminController::class, 'createTenant']);
    $r->get('/platform/tenants/{id}', [PlatformAdminController::class, 'tenant']);
    $r->patch('/platform/tenants/{id}', [PlatformAdminController::class, 'updateTenant']);
    $r->delete('/platform/tenants/{id}', [PlatformAdminController::class, 'deleteTenant']);
    $r->post('/platform/tenants/{id}/wallet', [PlatformAdminController::class, 'adjustWallet']);
    $r->post('/platform/tenants/{id}/rotate-key', [PlatformAdminController::class, 'rotateApiKey']);
    $r->get('/platform/currencies', [PlatformAdminController::class, 'currencies']);
    $r->post('/platform/currencies', [PlatformAdminController::class, 'createCurrency']);
    $r->patch('/platform/currencies/{id}', [PlatformAdminController::class, 'updateCurrency']);
    $r->delete('/platform/currencies/{id}', [PlatformAdminController::class, 'deleteCurrency']);
    $r->get('/platform/providers', [PlatformAdminController::class, 'providers']);
    $r->post('/platform/providers', [PlatformAdminController::class, 'createProvider']);
    $r->patch('/platform/providers/{id}', [PlatformAdminController::class, 'updateProvider']);
    $r->delete('/platform/providers/{id}', [PlatformAdminController::class, 'deleteProvider']);
    $r->get('/platform/global-pipeline', [PlatformAdminController::class, 'globalPipeline']);
    $r->patch('/platform/global-pipeline/{id}', [PlatformAdminController::class, 'updateGlobalLayer']);
    $r->get('/platform/cost-control', [PlatformAdminController::class, 'costControl']);
    $r->post('/platform/cost-control/policy', [PlatformAdminController::class, 'setAnomalyPolicy']);
    $r->get('/platform/queues', [PlatformAdminController::class, 'queues']);
    $r->post('/platform/queues/dlq/{id}/retry', [PlatformAdminController::class, 'retryDlqJob']);
    $r->post('/platform/queues/dlq/{id}/dismiss', [PlatformAdminController::class, 'dismissDlqJob']);
    $r->get('/platform/health', [PlatformAdminController::class, 'systemHealth']);
    $r->patch('/platform/health/components/{id}', [PlatformAdminController::class, 'updateComponent']);
    $r->post('/platform/incidents', [PlatformAdminController::class, 'createIncident']);
    $r->patch('/platform/incidents/{id}', [PlatformAdminController::class, 'updateIncident']);
    $r->get('/platform/compliance', [PlatformAdminController::class, 'compliance']);
    $r->put('/platform/compliance', [PlatformAdminController::class, 'updateCompliance']);

    // Jobs
    $r->get('/jobs', [JobController::class, 'listJobs']);
    $r->get('/jobs/{id}', [JobController::class, 'getJob']);
    $r->post('/jobs', [JobController::class, 'enqueue']);
};
