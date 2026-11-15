<?php
declare(strict_types=1);

/**
 * Front controller. Serve with:
 *   php -S localhost:8000 -t public     (dev)
 * or point the webserver docroot at backend/public (Apache/Nginx/LiteSpeed).
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/Core/Util.php';
require_once __DIR__ . '/../src/Core/Http.php';
require_once __DIR__ . '/../src/Core/Database.php';
require_once __DIR__ . '/../src/Core/Request.php';
require_once __DIR__ . '/../src/Core/Response.php';
require_once __DIR__ . '/../src/Core/Router.php';
require_once __DIR__ . '/../src/Core/Validator.php';
require_once __DIR__ . '/../src/Core/Uploads.php';
require_once __DIR__ . '/../src/Core/SchemaHealer.php';
require_once __DIR__ . '/../src/Auth/Permissions.php';
require_once __DIR__ . '/../src/Auth/AuthContext.php';
require_once __DIR__ . '/../src/Auth/AuthService.php';
require_once __DIR__ . '/../src/Services/AuditService.php';
require_once __DIR__ . '/../src/Services/NotificationsService.php';
require_once __DIR__ . '/../src/Services/CurrencyService.php';
require_once __DIR__ . '/../src/Services/WalletService.php';
require_once __DIR__ . '/../src/Services/UsageService.php';
require_once __DIR__ . '/../src/Services/JobDispatcher.php';
require_once __DIR__ . '/../src/Services/LLM/LLMProvider.php';
require_once __DIR__ . '/../src/Services/LLM/MockProvider.php';
require_once __DIR__ . '/../src/Services/LLM/GeminiProvider.php';
require_once __DIR__ . '/../src/Services/LLM/OpenAICompatibleProvider.php';
require_once __DIR__ . '/../src/Services/LLM/LLMFactory.php';
require_once __DIR__ . '/../src/Services/KnowledgeService.php';
require_once __DIR__ . '/../src/Services/MemoryService.php';
require_once __DIR__ . '/../src/Services/PromptBuilder.php';
require_once __DIR__ . '/../src/Services/ModerationService.php';
require_once __DIR__ . '/../src/Services/AgentConfigService.php';
require_once __DIR__ . '/../src/Services/Orchestrator.php';
require_once __DIR__ . '/../src/Controllers/AuthController.php';
require_once __DIR__ . '/../src/Controllers/TeamController.php';
require_once __DIR__ . '/../src/Controllers/InboxController.php';
require_once __DIR__ . '/../src/Controllers/KnowledgeController.php';
require_once __DIR__ . '/../src/Controllers/AgentConfigController.php';
require_once __DIR__ . '/../src/Controllers/ToolsController.php';
require_once __DIR__ . '/../src/Controllers/ChannelsController.php';
require_once __DIR__ . '/../src/Controllers/SettingsController.php';
require_once __DIR__ . '/../src/Controllers/BillingController.php';
require_once __DIR__ . '/../src/Controllers/PlatformAdminController.php';
require_once __DIR__ . '/../src/Controllers/OverviewController.php';
require_once __DIR__ . '/../src/Controllers/IngestController.php';
require_once __DIR__ . '/../src/Controllers/WebhookController.php';
require_once __DIR__ . '/../src/Controllers/JobController.php';

Config::load(dirname(__DIR__));
SchemaHealer::ensure();

// CORS (configurable)
$allowedOrigins = (string) Config::get('CORS_ORIGINS', '*');
header('Access-Control-Allow-Origin: ' . $allowedOrigins);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key, X-Tenant-ID');
header('Access-Control-Max-Age: 86400');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// JSON error handling (never leak stack traces)
set_exception_handler(function (Throwable $e) {
    error_log('[api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Response::error('Internal server error', 500);
});
set_error_handler(function (int $severity, string $message, string $file, int $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

$request = new Request();
$router = new Router();

// Auth middleware: resolves AuthContext, enforces super_admin-only namespaces.
$router->middleware(function (Request $req, array $route) {
    $public = ['/auth/login', '/health', '/channels/meta/callback'];
    $apiKey = str_starts_with($req->path, '/ingest');
    $webhook = str_starts_with($req->path, '/webhooks');

    if (in_array($req->path, $public, true) || $apiKey || $webhook) return;

    $ctx = AuthService::resolve($req);
    if (!$ctx) Response::unauthorized();

    $req->auth = $ctx;

    // Currency reference data (symbols/rates) is needed by every tenant's UI.
    $isCurrencyRead = $req->path === '/platform/currencies' && $req->method === 'GET';

    if (str_starts_with($req->path, '/platform') && !$isCurrencyRead && !$ctx->isSuperAdmin()) {
        Response::forbidden('Platform admin area is restricted to super admins');
    }
});

(require __DIR__ . '/../routes/api.php')($router);

// Serve uploaded files directly from storage (no rewrite needed on dev servers)
if (str_starts_with($request->path, '/storage/uploads/')) {
    $file = Config::get('APP_BASE_PATH') . $request->path;
    if (is_file($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $mimes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp', 'pdf' => 'application/pdf', 'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg', 'mp4' => 'video/mp4', 'webm' => 'video/webm', 'txt' => 'text/plain', 'csv' => 'text/csv'];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        readfile($file);
        exit;
    }
    Response::notFound('File not found');
}

$router->dispatch($request);
