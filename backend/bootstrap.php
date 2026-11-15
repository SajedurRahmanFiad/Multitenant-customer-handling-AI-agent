<?php
declare(strict_types=1);

/**
 * Shared bootstrap for CLI scripts (worker/seed) — loads config + all classes
 * without running the HTTP router.
 */

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/src/Core/Util.php';
require_once __DIR__ . '/src/Core/Http.php';
require_once __DIR__ . '/src/Core/Database.php';
require_once __DIR__ . '/src/Core/Request.php';
require_once __DIR__ . '/src/Core/Response.php';
require_once __DIR__ . '/src/Core/Router.php';
require_once __DIR__ . '/src/Core/Validator.php';
require_once __DIR__ . '/src/Core/Uploads.php';
require_once __DIR__ . '/src/Core/SchemaHealer.php';
require_once __DIR__ . '/src/Auth/Permissions.php';
require_once __DIR__ . '/src/Auth/AuthContext.php';
require_once __DIR__ . '/src/Auth/AuthService.php';
require_once __DIR__ . '/src/Services/AuditService.php';
require_once __DIR__ . '/src/Services/NotificationsService.php';
require_once __DIR__ . '/src/Services/CurrencyService.php';
require_once __DIR__ . '/src/Services/WalletService.php';
require_once __DIR__ . '/src/Services/UsageService.php';
require_once __DIR__ . '/src/Services/JobDispatcher.php';
require_once __DIR__ . '/src/Services/LLM/LLMProvider.php';
require_once __DIR__ . '/src/Services/LLM/MockProvider.php';
require_once __DIR__ . '/src/Services/LLM/GeminiProvider.php';
require_once __DIR__ . '/src/Services/LLM/OpenAICompatibleProvider.php';
require_once __DIR__ . '/src/Services/LLM/LLMFactory.php';
require_once __DIR__ . '/src/Services/KnowledgeService.php';
require_once __DIR__ . '/src/Services/MemoryService.php';
require_once __DIR__ . '/src/Services/PromptBuilder.php';
require_once __DIR__ . '/src/Services/ModerationService.php';
require_once __DIR__ . '/src/Services/AgentConfigService.php';
require_once __DIR__ . '/src/Services/Orchestrator.php';
require_once __DIR__ . '/src/Controllers/AuthController.php';
require_once __DIR__ . '/src/Controllers/TeamController.php';
require_once __DIR__ . '/src/Controllers/InboxController.php';
require_once __DIR__ . '/src/Controllers/KnowledgeController.php';
require_once __DIR__ . '/src/Controllers/AgentConfigController.php';
require_once __DIR__ . '/src/Controllers/ToolsController.php';
require_once __DIR__ . '/src/Controllers/ChannelsController.php';
require_once __DIR__ . '/src/Controllers/SettingsController.php';
require_once __DIR__ . '/src/Controllers/BillingController.php';
require_once __DIR__ . '/src/Controllers/PlatformAdminController.php';
require_once __DIR__ . '/src/Controllers/OverviewController.php';
require_once __DIR__ . '/src/Controllers/IngestController.php';
require_once __DIR__ . '/src/Controllers/WebhookController.php';
require_once __DIR__ . '/src/Controllers/JobController.php';

Config::load(__DIR__);
SchemaHealer::ensure();
