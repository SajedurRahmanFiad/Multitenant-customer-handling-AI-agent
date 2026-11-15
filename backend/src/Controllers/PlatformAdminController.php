<?php
declare(strict_types=1);

/**
 * PlatformAdminPage: tenants/clients, currencies, global pipeline, provider
 * registry, usage & cost control, infrastructure/queues, system health,
 * security & compliance. Super-admin only.
 */
final class PlatformAdminController
{
    public static function supportSession(Request $req): void
    {
        $userId=$req->auth->userId();
        $row=Database::fetchOne('SELECT s.*,t.business_name,u.name AS admin_name FROM platform_support_sessions s JOIN tenants t ON t.id=s.tenant_id JOIN users u ON u.id=s.started_by WHERE s.started_by=:u AND s.ended_at IS NULL AND s.expires_at>:n ORDER BY s.created_at DESC LIMIT 1',['u'=>$userId,'n'=>Database::now()]);
        Response::json(['session'=>$row?self::shapeSupportSession($row):null]);
    }

    public static function startSupportSession(Request $req): void
    {
        $data=Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data,['tenantId'=>'required','reason'=>'required']);
        $duration=max(5,min(240,Validator::int($data['durationMinutes']??30)));
        $tenant=Database::fetchOne('SELECT id,business_name FROM tenants WHERE id=:id',['id'=>$data['tenantId']]);
        if(!$tenant) Response::notFound('Tenant not found');
        Database::update('platform_support_sessions',['ended_at'=>Database::now()],'started_by=:u AND ended_at IS NULL',['u'=>$req->auth->userId()]);
        $id=Util::id('sup');
        Database::insert('platform_support_sessions',['id'=>$id,'tenant_id'=>$tenant['id'],'started_by'=>$req->auth->userId(),'reason'=>trim($data['reason']),'expires_at'=>date('Y-m-d H:i:s',time()+$duration*60)]);
        AuditService::log(null,'permission_changed','Support session started','Started support session for '.$tenant['business_name'],'success',['target'=>$tenant['id'],'sessionId'=>$id],$req->auth->userId(),$req);
        $row=Database::fetchOne('SELECT s.*,t.business_name,u.name AS admin_name FROM platform_support_sessions s JOIN tenants t ON t.id=s.tenant_id JOIN users u ON u.id=s.started_by WHERE s.id=:id',['id'=>$id]);
        Response::json(['session'=>self::shapeSupportSession($row)],201);
    }

    public static function endSupportSession(Request $req): void
    {
        $id=(string)$req->input('id','');
        $row=Database::fetchOne('SELECT * FROM platform_support_sessions WHERE id=:id AND started_by=:u AND ended_at IS NULL',['id'=>$id,'u'=>$req->auth->userId()]);
        if(!$row) Response::notFound('Active support session not found');
        Database::update('platform_support_sessions',['ended_at'=>Database::now()],'id=:id',['id'=>$id]);
        AuditService::log(null,'permission_changed','Support session ended','Ended support session for tenant '.$row['tenant_id'],'success',['target'=>$row['tenant_id'],'sessionId'=>$id],$req->auth->userId(),$req);
        Response::json(['ok'=>true]);
    }

    private static function shapeSupportSession(array $row): array
    {
        return ['isActive'=>true,'tenantId'=>$row['tenant_id'],'tenantName'=>$row['business_name'],'adminName'=>$row['admin_name'],'reason'=>$row['reason'],'startedAt'=>Util::ts($row['created_at']),'expiresAt'=>Util::ts($row['expires_at']),'auditSessionId'=>$row['id']];
    }
    // -------------------------------------------------------------- tenants
    public static function tenants(Request $req): void
    {
        $q = trim((string) $req->q('q', ''));
        $status = (string) $req->q('status', '');
        $where = ['1=1'];
        $params = [];
        if ($q !== '') {
            $where[] = '(business_name LIKE :q OR owner_name LIKE :q OR owner_email LIKE :q)';
            $params['q'] = "%$q%";
        }
        if (in_array($status, ['active', 'suspended'], true)) {
            $where[] = 'status = :st';
            $params['st'] = $status;
        }
        $rows = Database::fetchAll(
            'SELECT * FROM tenants WHERE ' . implode(' AND ', $where) . ' ORDER BY created_at DESC', $params);
        Response::json(['tenants' => array_map([self::class, 'shapeTenant'], $rows)]);
    }

    public static function tenant(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Tenant not found');
        $out = self::shapeTenant($row);
        $out['users'] = array_map(fn($u) => TeamController::shape($u, $row['business_name']),
            Database::fetchAll('SELECT * FROM users WHERE tenant_id = :t', ['t' => $row['id']]));
        $out['channels'] = [
            'messengerPages' => (int) Database::scalar("SELECT COUNT(*) FROM messenger_connections WHERE tenant_id = :t AND status = 'connected'", ['t' => $row['id']]),
            'whatsappNumbers' => (int) Database::scalar("SELECT COUNT(*) FROM whatsapp_connections WHERE tenant_id = :t AND status = 'connected'", ['t' => $row['id']]),
        ];
        Response::json(['tenant' => $out]);
    }

    public static function createTenant(Request $req): void
    {
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, [
            'tenantId' => 'required|string|maxlen:36',
            'businessName' => 'required', 'ownerName' => 'required',
            'ownerEmail' => 'required|email', 'ownerPhone' => 'required',
            'initialPassword' => 'required|min:8',
        ]);
        $id = strtolower((string) $data['tenantId']);
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $id)) {
            Response::error('Tenant ID must use lowercase letters, numbers, and single hyphens', 422);
        }
        if (Database::fetchOne('SELECT id FROM tenants WHERE id = :id OR slug = :slug LIMIT 1', ['id' => $id, 'slug' => $id])) {
            Response::error('Tenant ID is already in use', 409);
        }
        $slug = $id;

        Database::transaction(function () use ($data, $id, $slug) {
            Database::insert('tenants', [
                'id' => $id,
                'slug' => $slug,
                'business_name' => $data['businessName'],
                'owner_name' => $data['ownerName'],
                'owner_email' => $data['ownerEmail'],
                'owner_phone' => $data['ownerPhone'],
                'currency_code' => strtoupper((string) ($data['currencyCode'] ?? 'BDT')),
                'price_per_message' => Validator::float($data['pricePerMessage'] ?? 0),
                'wallet_balance' => Validator::float($data['walletBalance'] ?? 0),
                'primary_model' => $data['primaryModel'] ?? null,
                'support_notes' => $data['supportNotes'] ?? null,
                'assigned_support_owner' => $data['assignedSupportOwner'] ?? null,
                'status' => in_array(($statusVal = $data['status'] ?? ''), ['active', 'suspended'], true) ? $statusVal : 'active',
            ]);
            Database::insert('tenant_plans', ['tenant_id' => $id, 'tier' => $data['planTier'] ?? 'starter']);
            Database::insert('tenant_api_keys', [
                'id' => Util::id('ak'),
                'tenant_id' => $id,
                'name' => 'Default ingest key',
                'key_hash' => hash('sha256', $rawKey = 'ak_' . bin2hex(random_bytes(20))),
                'key_preview' => Util::mask($rawKey, 6),
            ]);
            $ownerId = Util::id('usr');
            Database::insert('users', [
                'id' => $ownerId,
                'tenant_id' => $id,
                'name' => $data['ownerName'],
                'phone' => $data['ownerPhone'],
                'email' => $data['ownerEmail'],
                'password_hash' => password_hash((string) $data['initialPassword'], PASSWORD_DEFAULT),
                'role' => 'admin',
                'status' => 'active',
            ]);
            // provision defaults
            self::provisionDefaults($id);
        });
        AuditService::log(null, 'permission_changed', 'Tenant created', 'Created tenant ' . $data['businessName'], 'success', ['target' => $id], null, $req);
        Response::json(['tenant' => self::shapeTenant(Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $id]))], 201);
    }

    /** Seed per-tenant default rows (agent config, integrations, tools, settings). */
    public static function provisionDefaults(string $tenantId): void
    {
        $draftId = Util::id('acv');
        $defaults = AgentConfigService::defaults();
        Database::insert('agent_config_versions', [
            'id' => $draftId, 'tenant_id' => $tenantId, 'version' => 'v1.0', 'status' => 'published',
            'mode' => 'automatic', 'summary' => 'Initial setup',
            'identity' => Database::json($defaults['identity']),
            'instructions' => Database::json($defaults['instructions']),
            'behavior' => Database::json($defaults['behavior']),
            'response_rules' => Database::json($defaults['responseRules']),
            'published_at' => Database::now(),
        ]);
        Database::insert('tenant_pipeline_config', ['tenant_id' => $tenantId]);

        $globalLayers = Database::fetchAll('SELECT * FROM global_pipeline_layers ORDER BY layer_order');
        foreach ($globalLayers as $gl) {
            Database::insert('tenant_pipeline_layers', [
                'id' => Util::id('ly'),
                'tenant_id' => $tenantId,
                'layer_type' => $gl['layer_type'],
                'layer_order' => (int) $gl['layer_order'],
                'title' => $gl['title'],
                'subtitle' => $gl['subtitle'],
                'description' => $gl['description'],
                'selected_model_id' => $gl['default_model_id'],
                'fallback_model_id' => $gl['default_fallback_model_id'],
                'temperature' => (float) $gl['default_temperature'],
                'max_tokens' => (int) $gl['default_max_tokens'],
                'system_prompt' => $gl['system_prompt'],
                'is_enabled' => (int) $gl['is_active_globally'],
                'input_description' => $gl['input_description'],
                'output_description' => $gl['output_description'],
            ]);
        }
        // business settings defaults
        Database::insert('service_settings', ['tenant_id' => $tenantId]);
        Database::insert('retention_settings', ['tenant_id' => $tenantId]);
        Database::insert('brand_identity', ['tenant_id' => $tenantId]);

        // standard handover rules
        foreach ([
            ['Customer asks for human agent', 'customer_request', 'high'],
            ['Frustrated customer detected', 'sentiment_frustration', 'urgent'],
            ['Missing knowledge for the question', 'missing_knowledge', 'medium'],
        ] as $i => $hr) {
            Database::insert('handover_rules', [
                'id' => Util::id('hr'), 'tenant_id' => $tenantId,
                'name' => $hr[0], 'trigger_type' => $hr[1], 'priority' => $hr[2],
                'destination_team' => 'General Support',
                'handover_message' => 'Connecting you with our team — one moment please.',
                'notification_channels' => Database::json(['in_app']),
            ]);
        }
        // escalation rules
        foreach ([
            ['customer_waiting_timeout', 'Customer waiting too long', 'Customer waited beyond threshold without staff reply'],
            ['model_rate_limit_429', 'Model rate limited', 'LLM provider returned 429 rate limit'],
            ['usage_threshold_reached', 'Usage threshold', 'Tenant crossed usage threshold'],
        ] as $er) {
            Database::insert('escalation_rules', [
                'id' => Util::id('esc'), 'tenant_id' => $tenantId,
                'trigger_type' => $er[0], 'name' => $er[1], 'description' => $er[2],
                'threshold_value' => '5 minutes', 'action' => 'notify_staff',
                'notify_channels' => Database::json(['in_app', 'email']), 'assigned_role' => 'admin',
            ]);
        }
        // integrations
        foreach ([
            ['woocommerce', 'WooCommerce Store', 'ecommerce', 'Orders & products'],
            ['steadfast', 'Steadfast Courier', 'courier', 'Delivery status sync'],
            ['bkash', 'bKash Payments', 'payment', 'Payment verification'],
        ] as $int) {
            Database::insert('business_integrations', [
                'id' => Util::id('int'), 'tenant_id' => $tenantId,
                'integ_key' => $int[0], 'name' => $int[1], 'category' => $int[2],
                'description' => $int[3], 'status' => 'disconnected',
                'fallback_policy' => Database::json(['onFailAction' => 'human_handover', 'fallbackMessage' => '', 'preventHallucination' => true]),
            ]);
        }
    }

    public static function updateTenant(Request $req): void
    {
        $id = $req->params['id'];
        $row = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $id]);
        if (!$row) Response::notFound('Tenant not found');
        $data = Validator::sanitizePayload($req->all());
        $vals = [];
        foreach (['businessName' => 'business_name', 'ownerName' => 'owner_name', 'ownerEmail' => 'owner_email', 'ownerPhone' => 'owner_phone', 'currencyCode' => 'currency_code', 'primaryModel' => 'primary_model', 'supportNotes' => 'support_notes', 'assignedSupportOwner' => 'assigned_support_owner'] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['pricePerMessage'])) $vals['price_per_message'] = Validator::float($data['pricePerMessage']);
        if (isset($data['walletBalance'])) $vals['wallet_balance'] = Validator::float($data['walletBalance']);
        if (isset($data['status']) && in_array($data['status'], ['active', 'suspended'], true)) $vals['status'] = $data['status'];
        Database::update('tenants', $vals, 'id = :id', ['id' => $id]);
        if (($vals['status'] ?? null) === 'suspended' && $row['status'] !== 'suspended') {
            Database::run(
                'UPDATE user_sessions SET revoked_at = :now, is_current = 0 WHERE revoked_at IS NULL AND user_id IN (SELECT id FROM users WHERE tenant_id = :tenantId)',
                ['now' => Database::now(), 'tenantId' => $id]
            );
        }
        if (isset($data['planTier']) && in_array($data['planTier'], ['starter', 'growth', 'pro', 'enterprise'], true)) {
            Database::run('UPDATE tenant_plans SET tier = :t2 WHERE tenant_id = :t', ['t2' => $data['planTier'], 't' => $id]);
        }
        AuditService::log(null, 'permission_changed', 'Tenant updated', 'Updated tenant ' . $row['business_name'], 'success', ['target' => $id], null, $req);
        Response::json(['tenant' => self::shapeTenant(Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $id]))]);
    }

    public static function deleteTenant(Request $req): void
    {
        $id = $req->params['id'];
        $row = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $id]);
        if (!$row) Response::notFound('Tenant not found');
        Database::delete('tenants', 'id = :id', ['id' => $id]);
        AuditService::log(null, 'permission_changed', 'Tenant deleted', 'Deleted tenant ' . $row['business_name'], 'success', ['target' => $id], null, $req);
        Response::json(['ok' => true]);
    }

    public static function adjustWallet(Request $req): void
    {
        $id = $req->params['id'];
        $data = $req->all();
        $amount = Validator::float($data['amount'] ?? 0);
        if ($amount === 0.0) Response::error('amount required', 422);
        $type = $amount > 0 ? 'topup' : 'adjustment';
        $tenant = Database::fetchOne('SELECT currency_code FROM tenants WHERE id = :id', ['id' => $id]);
        if (!$tenant) Response::notFound();
        $tx = WalletService::topup($id, $amount, $tenant['currency_code'], 'Platform Admin', null, (string) ($data['description'] ?? 'Manual balance adjustment'));
        Database::update('wallet_transactions', ['type' => $type], 'id = :id', ['id' => $tx['id']]);
        AuditService::log(null, 'order_action', 'Wallet adjusted', 'Adjusted balance for tenant ' . $id, 'success', ['target' => $id], null, $req);
        Response::json(['balance' => WalletService::balance($id)]);
    }

    /** Regenerate the tenant ingest API key. */
    public static function rotateApiKey(Request $req): void
    {
        $id = $req->params['id'];
        $rawKey = 'ak_' . bin2hex(random_bytes(20));
        Database::run('UPDATE tenant_api_keys SET is_active = 0 WHERE tenant_id = :t', ['t' => $id]);
        Database::insert('tenant_api_keys', [
            'id' => Util::id('ak'), 'tenant_id' => $id, 'name' => 'Rotated key',
            'key_hash' => hash('sha256', $rawKey), 'key_preview' => Util::mask($rawKey, 6),
        ]);
        Response::json(['apiKey' => $rawKey]);
    }

    // ----------------------------------------------------------- currencies
    public static function currencies(Request $req): void
    {
        Response::json(['currencies' => CurrencyService::all()]);
    }

    public static function createCurrency(Request $req): void
    {
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['code' => 'required', 'name' => 'required', 'symbol' => 'required', 'exchangeRateFromUSD' => 'required|numeric']);
        if (Database::fetchOne('SELECT id FROM currencies WHERE code = :c', ['c' => strtoupper((string) $data['code'])])) {
            Response::error('Currency code already exists', 422);
        }
        $id = Util::id('curr');
        Database::insert('currencies', [
            'id' => $id,
            'code' => strtoupper((string) $data['code']),
            'name' => $data['name'],
            'symbol' => $data['symbol'],
            'symbol_position' => in_array(($symbolPositionVal = $data['symbolPosition'] ?? ''), ['before', 'after'], true) ? $symbolPositionVal : 'before',
            'symbol_spacing' => Validator::bool($data, 'symbolSpacing', true) ? 1 : 0,
            'exchange_rate_from_usd' => Validator::float($data['exchangeRateFromUSD']),
            'decimal_places' => Validator::int($data['decimalPlaces'] ?? 2, 2),
            'thousands_separator' => (string) ($data['thousandsSeparator'] ?? ','),
            'decimal_separator' => (string) ($data['decimalSeparator'] ?? '.'),
            'is_platform_default' => Validator::bool($data, 'isPlatformDefault') ? 1 : 0,
            'is_active' => Validator::bool($data, 'isActive', true) ? 1 : 0,
            'description' => $data['description'] ?? null,
        ]);
        if (Validator::bool($data, 'isPlatformDefault')) {
            Database::run('UPDATE currencies SET is_platform_default = 0 WHERE id != :id', ['id' => $id]);
        }
        Response::json(['currency' => CurrencyService::byCode(strtoupper((string) $data['code']))], 201);
    }

    public static function updateCurrency(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM currencies WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Currency not found');
        $data = Validator::sanitizePayload($req->all());
        $vals = [];
        foreach (['name', 'symbol', 'description', 'thousandsSeparator' => 'thousands_separator', 'decimalSeparator' => 'decimal_separator'] as $in => $col) {
            $in = is_int($in) ? $col : $in;
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['symbolPosition']) && in_array($data['symbolPosition'], ['before', 'after'], true)) $vals['symbol_position'] = $data['symbolPosition'];
        if (isset($data['symbolSpacing'])) $vals['symbol_spacing'] = Validator::bool($data, 'symbolSpacing') ? 1 : 0;
        if (isset($data['exchangeRateFromUSD'])) $vals['exchange_rate_from_usd'] = Validator::float($data['exchangeRateFromUSD']);
        if (isset($data['decimalPlaces'])) $vals['decimal_places'] = Validator::int($data['decimalPlaces'], 2);
        if (isset($data['isActive'])) $vals['is_active'] = Validator::bool($data, 'isActive') ? 1 : 0;
        if (isset($data['isPlatformDefault'])) {
            $vals['is_platform_default'] = Validator::bool($data, 'isPlatformDefault') ? 1 : 0;
            if ($vals['is_platform_default']) {
                Database::run('UPDATE currencies SET is_platform_default = 0 WHERE id != :id', ['id' => $row['id']]);
            }
        }
        Database::update('currencies', $vals, 'id = :id', ['id' => $row['id']]);
        Response::json(['currency' => CurrencyService::byCode($row['code'])]);
    }

    public static function deleteCurrency(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM currencies WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Currency not found');
        if ((int) $row['is_platform_default']) Response::error('Cannot delete the platform default currency', 422);
        Database::delete('currencies', 'id = :id', ['id' => $row['id']]);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------- providers
    public static function providers(Request $req): void
    {
        $rows = Database::fetchAll('SELECT * FROM ai_provider_models ORDER BY provider, display_name');
        Response::json(['models' => array_map([self::class, 'shapeProvider'], $rows)]);
    }

    public static function createProvider(Request $req): void
    {
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['modelId' => 'required', 'displayName' => 'required', 'provider' => 'required|in:Google Gemini,OpenAI,Anthropic,Groq / Llama,Ollama Dedicated']);
        $id = Util::id('apm');
        Database::insert('ai_provider_models', [
            'id' => $id,
            'model_id' => $data['modelId'],
            'display_name' => $data['displayName'],
            'provider' => $data['provider'],
            'api_key' => $data['apiKey'] ?? null,
            'endpoint_url' => $data['endpointUrl'] ?? null,
            'capabilities' => Database::json($data['capabilities'] ?? ['text']),
            'cost_per_million_input_usd' => Validator::float($data['costPerMillionInputUSD'] ?? 0),
            'cost_per_million_output_usd' => Validator::float($data['costPerMillionOutputUSD'] ?? 0),
            'context_window_tokens' => Validator::int($data['contextWindowTokens'] ?? 0),
            'max_output_tokens' => Validator::int($data['maxOutputTokens'] ?? 0),
            'status' => in_array(($statusVal = $data['status'] ?? ''), ['active', 'degraded', 'disabled'], true) ? $statusVal : 'active',
            'is_default' => Validator::bool($data, 'isDefault') ? 1 : 0,
            'is_fallback' => Validator::bool($data, 'isFallback') ? 1 : 0,
        ]);
        self::enforceSingleDefault($id, Validator::bool($data, 'isDefault'));
        Response::json(['model' => self::shapeProvider(Database::fetchOne('SELECT * FROM ai_provider_models WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function updateProvider(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM ai_provider_models WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Model not found');
        $data = Validator::sanitizePayload($req->all());
        $vals = [];
        foreach (['displayName' => 'display_name', 'endpointUrl' => 'endpoint_url', 'status' => 'status'] as $in => $col) {
            if (isset($data[$in]) && in_array($data[$in], ['active', 'degraded', 'disabled'], true)) $vals[$col] = $data[$in];
            elseif (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['apiKey'])) $vals['api_key'] = $data['apiKey'];
        if (isset($data['capabilities']) && is_array($data['capabilities'])) $vals['capabilities'] = Database::json($data['capabilities']);
        foreach (['costPerMillionInputUSD' => 'cost_per_million_input_usd', 'costPerMillionOutputUSD' => 'cost_per_million_output_usd', 'latencyP95Ms' => 'latency_p95_ms', 'errorRate24hPercent' => 'error_rate_24h_percent', 'contextWindowTokens' => 'context_window_tokens', 'maxOutputTokens' => 'max_output_tokens'] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = Validator::float($data[$in]);
        }
        if (isset($data['isDefault'])) {
            $vals['is_default'] = Validator::bool($data, 'isDefault') ? 1 : 0;
            if ($vals['is_default']) Database::run('UPDATE ai_provider_models SET is_default = 0 WHERE id != :id', ['id' => $row['id']]);
        }
        if (isset($data['isFallback'])) {
            $vals['is_fallback'] = Validator::bool($data, 'isFallback') ? 1 : 0;
            if ($vals['is_fallback']) Database::run('UPDATE ai_provider_models SET is_fallback = 0 WHERE id != :id', ['id' => $row['id']]);
        }
        Database::update('ai_provider_models', $vals, 'id = :id', ['id' => $row['id']]);
        Response::json(['model' => self::shapeProvider(Database::fetchOne('SELECT * FROM ai_provider_models WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function deleteProvider(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM ai_provider_models WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound();
        if ((int) $row['is_default']) Response::error('Unset the default model before deleting', 422);
        Database::delete('ai_provider_models', 'id = :id', ['id' => $row['id']]);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------ global pipeline
    public static function globalPipeline(Request $req): void
    {
        $rows = Database::fetchAll('SELECT * FROM global_pipeline_layers ORDER BY layer_order');
        Response::json(['layers' => array_map([self::class, 'shapeGlobalLayer'], $rows)]);
    }

    public static function updateGlobalLayer(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM global_pipeline_layers WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Layer not found');
        $data = Validator::sanitizePayload($req->all());
        $vals = [];
        foreach (['title', 'subtitle', 'description', 'defaultModelId' => 'default_model_id', 'defaultFallbackModelId' => 'default_fallback_model_id', 'systemPrompt' => 'system_prompt', 'guidanceNotes' => 'guidance_notes', 'inputDescription' => 'input_description', 'outputDescription' => 'output_description'] as $in => $col) {
            $in = is_int($in) ? $col : $in;
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['defaultTemperature'])) $vals['default_temperature'] = Validator::float($data['defaultTemperature']);
        if (isset($data['defaultMaxTokens'])) $vals['default_max_tokens'] = Validator::int($data['defaultMaxTokens']);
        if (isset($data['isMandatory'])) $vals['is_mandatory'] = Validator::bool($data, 'isMandatory') ? 1 : 0;
        if (isset($data['isActiveGlobally'])) {
            if ((bool) $row['is_mandatory'] && !Validator::bool($data, 'isActiveGlobally')) {
                Response::error('Mandatory layers cannot be deactivated', 422);
            }
            $vals['is_active_globally'] = Validator::bool($data, 'isActiveGlobally') ? 1 : 0;
        }
        Database::update('global_pipeline_layers', $vals, 'id = :id', ['id' => $row['id']]);
        Response::json(['layer' => self::shapeGlobalLayer(Database::fetchOne('SELECT * FROM global_pipeline_layers WHERE id = :id', ['id' => $row['id']]))]);
    }

    // -------------------------------------------------------- cost & queues
    public static function costControl(Request $req): void
    {
        $month = date('Y-m-01 00:00:00');
        $rev = (float) Database::scalar("SELECT COALESCE(SUM(amount_usd),0) FROM wallet_transactions WHERE type = 'topup' AND created_at >= :m", ['m' => $month]);
        $provCost = (float) Database::scalar('SELECT COALESCE(SUM(cost_usd),0) FROM usage_logs WHERE created_at >= :m', ['m' => $month]);
        $tokens24h = (float) Database::scalar('SELECT COALESCE(SUM(input_tokens + output_tokens),0) FROM usage_logs WHERE created_at >= :d', ['d' => date('Y-m-d 00:00:00')]);
        $convCount = (int) Database::scalar('SELECT COUNT(*) FROM conversations WHERE created_at >= :m', ['m' => $month]);

        $top = Database::fetchAll(
            'SELECT u.tenant_id, t.business_name, t.primary_model,
                    SUM(u.cost_usd) AS spend, SUM(u.input_tokens + u.output_tokens) AS tokens,
                    COUNT(DISTINCT u.conversation_id) AS convs
             FROM usage_logs u JOIN tenants t ON t.id = u.tenant_id
             WHERE u.created_at >= :m GROUP BY u.tenant_id ORDER BY spend DESC LIMIT 5',
            ['m' => $month]);
        $compliance = Database::fetchOne('SELECT * FROM compliance_settings LIMIT 1');
        $policy = $compliance['anomaly_policy'] ?? null;

        Response::json([
            'metrics' => [
                'totalMonthlyRevenueUSD' => round($rev, 2),
                'totalMonthlyProviderCostUSD' => round($provCost, 4),
                'grossMarginPercent' => $rev > 0 ? round(($rev - $provCost) / $rev * 100, 1) : 0,
                'totalTokensConsumed24h' => (int) $tokens24h,
                'currentBurnRateTokensPerSec' => round($tokens24h / 86400, 1),
                'averageCostPerConversationUSD' => $convCount > 0 ? round($provCost / $convCount, 4) : 0,
                'anomalyProtectionPolicy' => $policy ?: 'switch_to_fallback',
            ],
            'topSpendingTenants' => array_map(fn($t) => [
                'tenantId' => $t['tenant_id'],
                'businessName' => $t['business_name'],
                'primaryModel' => $t['primary_model'],
                'spendUSD' => round((float) $t['spend'], 4),
                'tokenCount' => (int) $t['tokens'],
                'conversationsCount' => (int) $t['convs'],
            ], $top),
        ]);
    }

    public static function setAnomalyPolicy(Request $req): void
    {
        $data = $req->all();
        $policy = (string) ($data['anomalyProtectionPolicy'] ?? '');
        if (!in_array($policy, ['switch_to_fallback', 'safe_non_ai_message', 'pause_automation'], true)) {
            Response::error('Invalid policy', 422);
        }
        $row = Database::fetchOne('SELECT id FROM compliance_settings LIMIT 1');
        if ($row) Database::run('UPDATE compliance_settings SET anomaly_policy = :p', ['p' => $policy]);
        else Database::insert('compliance_settings', ['id' => Util::id('cmp'), 'anomaly_policy' => $policy]);
        Response::json(['anomalyProtectionPolicy' => $policy]);
    }

    public static function queues(Request $req): void
    {
        $jobsPending = (int) Database::scalar("SELECT COUNT(*) FROM jobs WHERE status = 'pending'");
        $jobsRunning = (int) Database::scalar("SELECT COUNT(*) FROM jobs WHERE status = 'running'");
        $jobsDone = (int) Database::scalar("SELECT COUNT(*) FROM jobs WHERE status = 'completed' AND finished_at >= :d", ['d' => date('Y-m-d 00:00:00')]);
        $jobsDead = (int) Database::scalar("SELECT COUNT(*) FROM jobs WHERE status = 'dead'");
        $oldest = Database::fetchOne("SELECT created_at FROM jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1");
        $oldestWait = $oldest ? max(0, time() - strtotime($oldest['created_at'])) * 1000 : 0;

        $dlq = Database::fetchAll("SELECT * FROM jobs WHERE status = 'dead' ORDER BY created_at DESC LIMIT 50");
        $webhookRate = (int) Database::scalar('SELECT COUNT(*) FROM webhook_events WHERE created_at >= :d', ['d' => date('Y-m-d H:i:s', time() - 86400)]);

        Response::json([
            'metrics' => [
                'incomingWebhookRatePerSec' => round($webhookRate / 86400, 2),
                'queuedJobs' => $jobsPending,
                'activeProcessingJobs' => $jobsRunning,
                'completedJobs24h' => $jobsDone,
                'failedDlqJobs' => $jobsDead,
                'oldestJobWaitTimeMs' => $oldestWait,
                'workerCountActive' => null,
                'workerCpuPercent' => null,
                'workerMemoryPercent' => null,
                'dbPoolActive' => null,
                'dbPoolMax' => null,
                'dbPoolWaitTimeMs' => null,
                'redisMemoryUsedMB' => null,
                'redisHitRatePercent' => null,
            ],
            'deadLetterJobs' => array_map(fn($j) => [
                'id' => $j['id'],
                'tenantId' => $j['tenant_id'],
                'channel' => (Database::decodeJson($j['payload'])['channel'] ?? 'whatsapp') === 'messenger' ? 'messenger' : 'whatsapp',
                'eventType' => $j['kind'],
                'failedAt' => Util::ts($j['finished_at'] ?? $j['created_at']),
                'retryAttempts' => (int) $j['attempts'],
                'sanitizedPayload' => Database::json(['eventType' => $j['kind'], 'payload' => '[redacted]']),
                'errorMessage' => $j['error_message'],
            ], $dlq),
        ]);
    }

    public static function retryDlqJob(Request $req): void
    {
        JobDispatcher::retryDead($req->params['id']);
        Response::json(['ok' => true]);
    }

    public static function dismissDlqJob(Request $req): void
    {
        $row=Database::fetchOne("SELECT id FROM jobs WHERE id=:id AND status='dead'",['id'=>$req->params['id']]);
        if(!$row) Response::notFound('Dead-letter job not found');
        Database::update('jobs',['status'=>'dismissed','finished_at'=>Database::now()],'id=:id',['id'=>$row['id']]);
        Response::json(['ok'=>true]);
    }

    // ---------------------------------------------------------- health & incidents
    public static function systemHealth(Request $req): void
    {
        $components = Database::fetchAll('SELECT * FROM system_components ORDER BY type, name');
        $incidents = Database::fetchAll('SELECT * FROM incidents ORDER BY started_at DESC LIMIT 50');
        Response::json([
            'components' => array_map(fn($c) => [
                'name' => $c['name'],
                'type' => $c['type'],
                'status' => $c['status'],
                'uptime90dPercent' => (float) $c['uptime_90d_percent'],
                'latencyMs' => (int) $c['latency_ms'],
                'lastIncident' => $c['last_incident'],
            ], $components),
            'incidents' => array_map([self::class, 'shapeIncident'], $incidents),
        ]);
    }

    public static function updateComponent(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM system_components WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Component not found');
        $data = $req->all();
        $vals = [];
        if (isset($data['status']) && in_array($data['status'], ['operational', 'degraded', 'down'], true)) $vals['status'] = $data['status'];
        if (isset($data['latencyMs'])) $vals['latency_ms'] = Validator::int($data['latencyMs']);
        if (isset($data['lastIncident'])) $vals['last_incident'] = $data['lastIncident'];
        Database::update('system_components', $vals, 'id = :id', ['id' => $row['id']]);
        Response::json(['ok' => true]);
    }

    public static function createIncident(Request $req): void
    {
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['title' => 'required', 'severity' => 'required|in:p1_critical,p2_major,p3_minor']);
        $id = Util::id('inc');
        Database::insert('incidents', [
            'id' => $id,
            'title' => $data['title'],
            'severity' => $data['severity'],
            'status' => in_array(($statusVal = $data['status'] ?? ''), ['investigating', 'identified', 'monitoring', 'resolved'], true) ? $statusVal : 'investigating',
            'affected_components' => Database::json($data['affectedComponents'] ?? []),
            'summary' => $data['summary'] ?? null,
        ]);
        Response::json(['incident' => self::shapeIncident(Database::fetchOne('SELECT * FROM incidents WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function updateIncident(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM incidents WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Incident not found');
        $data = Validator::sanitizePayload($req->all());
        $vals = [];
        if (isset($data['status']) && in_array($data['status'], ['investigating', 'identified', 'monitoring', 'resolved'], true)) {
            $vals['status'] = $data['status'];
            if ($data['status'] === 'resolved') $vals['resolved_at'] = Database::now();
        }
        if (isset($data['summary'])) $vals['summary'] = $data['summary'];
        if (isset($data['affectedComponents']) && is_array($data['affectedComponents'])) $vals['affected_components'] = Database::json($data['affectedComponents']);
        Database::update('incidents', $vals, 'id = :id', ['id' => $row['id']]);
        Response::json(['incident' => self::shapeIncident(Database::fetchOne('SELECT * FROM incidents WHERE id = :id', ['id' => $row['id']]))]);
    }

    // ---------------------------------------------------------- compliance
    public static function compliance(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM compliance_settings LIMIT 1');
        if (!$row) {
            Database::insert('compliance_settings', ['id'=>Util::id('cmp'),'isolation_status'=>'warning','backup_status'=>'warning']);
            $row = Database::fetchOne('SELECT * FROM compliance_settings LIMIT 1');
        }
        Response::json(['compliance' => self::shapeCompliance($row)]);
    }

    public static function updateCompliance(Request $req): void
    {
        $data = Validator::sanitizePayload($req->all());
        $row = Database::fetchOne('SELECT * FROM compliance_settings LIMIT 1');
        $vals = [];
        foreach ([
            'isolationStatus' => 'isolation_status', 'backupStatus' => 'backup_status',
            'disasterRecoveryTestOutcome' => 'disaster_recovery_test_outcome',
        ] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        foreach (['kmsKeyRotationAgeDays' => 'kms_key_rotation_age_days', 'rpoMinutes' => 'rpo_minutes', 'rtoMinutes' => 'rto_minutes'] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = Validator::int($data[$in]);
        }
        foreach (['lastIsolationAudit' => 'last_isolation_audit', 'nextRotationScheduled' => 'next_rotation_scheduled', 'lastDisasterRecoveryTest' => 'last_disaster_recovery_test'] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['soc2AuditExportReady'])) $vals['soc2_audit_export_ready'] = Validator::bool($data, 'soc2AuditExportReady') ? 1 : 0;
        if ($row) Database::update('compliance_settings', $vals, 'id = :id', ['id' => $row['id']]);
        else Database::insert('compliance_settings', array_merge(['id' => Util::id('cmp')], $vals));
        Response::json(['compliance' => self::shapeCompliance(Database::fetchOne('SELECT * FROM compliance_settings LIMIT 1'))]);
    }

    // -------------------------------------------------------------- shapes
    public static function shapeTenant(array $t): array
    {
        $month = date('Y-m-01 00:00:00');
        $spend = (float) Database::scalar('SELECT COALESCE(SUM(cost_usd),0) FROM usage_logs WHERE tenant_id = :t AND created_at >= :m', ['t' => $t['id'], 'm' => $month]);
        $convs = (int) Database::scalar('SELECT COUNT(*) FROM conversations WHERE tenant_id = :t AND created_at >= :m', ['t' => $t['id'], 'm' => $month]);
        $msgs = (int) Database::scalar('SELECT COUNT(*) FROM messages WHERE tenant_id = :t AND created_at >= :m AND sender != :s', ['t' => $t['id'], 'm' => $month, 's' => 'system']);
        return [
            'id' => $t['id'],
            'businessName' => $t['business_name'],
            'ownerName' => $t['owner_name'],
            'ownerEmail' => $t['owner_email'],
            'ownerPhone' => $t['owner_phone'],
            'currencyCode' => $t['currency_code'],
            'pricePerMessage' => (float) $t['price_per_message'],
            'walletBalance' => (float) $t['wallet_balance'],
            'status' => $t['status'],
            'connectedChannels' => [
                'messengerPages' => (int) Database::scalar("SELECT COUNT(*) FROM messenger_connections WHERE tenant_id = :t AND status = 'connected'", ['t' => $t['id']]),
                'whatsappNumbers' => (int) Database::scalar("SELECT COUNT(*) FROM whatsapp_connections WHERE tenant_id = :t AND status = 'connected'", ['t' => $t['id']]),
            ],
            'primaryModel' => $t['primary_model'],
            'monthlySpendUSD' => round($spend, 4),
            'monthlySpendBDT' => CurrencyService::fromUsd($spend, 'BDT'),
            'conversationsThisMonth' => $convs,
            'messagesProcessedThisMonth' => $msgs,
            'healthScorePercent' => (int) $t['health_score_percent'],
            'createdAt' => Util::ts($t['created_at']),
            'lastActiveDate' => Util::ts($t['last_active_at']),
            'supportNotes' => $t['support_notes'],
            'assignedSupportOwner' => $t['assigned_support_owner'],
            'slug' => $t['slug'],
        ];
    }

    private static function enforceSingleDefault(string $id, bool $isDefault): void
    {
        if ($isDefault) Database::run('UPDATE ai_provider_models SET is_default = 0 WHERE id != :id', ['id' => $id]);
    }

    public static function shapeProvider(array $m): array
    {
        return [
            'id' => $m['id'],
            'modelId' => $m['model_id'],
            'displayName' => $m['display_name'],
            'provider' => $m['provider'],
            'apiKey' => $m['api_key'] ? Util::mask($m['api_key'], 6) : '',
            'endpointUrl' => $m['endpoint_url'],
            'capabilities' => Database::decodeJson($m['capabilities']) ?: [],
            'costPerMillionInputUSD' => (float) $m['cost_per_million_input_usd'],
            'costPerMillionOutputUSD' => (float) $m['cost_per_million_output_usd'],
            'contextWindowTokens' => (int) $m['context_window_tokens'],
            'maxOutputTokens' => (int) $m['max_output_tokens'],
            'latencyP95Ms' => (int) $m['latency_p95_ms'],
            'errorRate24hPercent' => (float) $m['error_rate_24h_percent'],
            'status' => $m['status'],
            'isDefault' => (bool) $m['is_default'],
            'isFallback' => (bool) $m['is_fallback'],
        ];
    }

    public static function shapeGlobalLayer(array $l): array
    {
        return [
            'id' => $l['id'],
            'layerType' => $l['layer_type'],
            'layerOrder' => (int) $l['layer_order'],
            'title' => $l['title'],
            'subtitle' => $l['subtitle'],
            'description' => $l['description'],
            'defaultModelId' => $l['default_model_id'],
            'defaultFallbackModelId' => $l['default_fallback_model_id'],
            'defaultTemperature' => (float) $l['default_temperature'],
            'defaultMaxTokens' => (int) $l['default_max_tokens'],
            'systemPrompt' => $l['system_prompt'],
            'guidanceNotes' => $l['guidance_notes'],
            'inputDescription' => $l['input_description'],
            'outputDescription' => $l['output_description'],
            'isMandatory' => (bool) $l['is_mandatory'],
            'isActiveGlobally' => (bool) $l['is_active_globally'],
            'lastUpdated' => Util::ts($l['updated_at']),
        ];
    }

    public static function shapeIncident(array $i): array
    {
        return [
            'id' => $i['id'],
            'title' => $i['title'],
            'severity' => $i['severity'],
            'status' => $i['status'],
            'affectedComponents' => Database::decodeJson($i['affected_components']) ?: [],
            'startedAt' => Util::ts($i['started_at']),
            'resolvedAt' => Util::ts($i['resolved_at']),
            'summary' => $i['summary'],
        ];
    }

    public static function shapeCompliance(array $c): array
    {
        return [
            'lastIsolationAudit' => Util::ts($c['last_isolation_audit']),
            'isolationStatus' => $c['isolation_status'],
            'kmsKeyRotationAgeDays' => (int) $c['kms_key_rotation_age_days'],
            'nextRotationScheduled' => Util::ts($c['next_rotation_scheduled']),
            'gdprPendingErasuresCount' => (int) $c['gdpr_pending_erasures_count'],
            'gdprCompletedErasuresCount' => (int) $c['gdpr_completed_erasures_count'],
            'soc2AuditExportReady' => (bool) $c['soc2_audit_export_ready'],
            'backupStatus' => $c['backup_status'],
            'lastDisasterRecoveryTest' => Util::ts($c['last_disaster_recovery_test']),
            'disasterRecoveryTestOutcome' => $c['disaster_recovery_test_outcome'],
            'rpoMinutes' => (int) $c['rpo_minutes'],
            'rtoMinutes' => (int) $c['rto_minutes'],
        ];
    }
}
