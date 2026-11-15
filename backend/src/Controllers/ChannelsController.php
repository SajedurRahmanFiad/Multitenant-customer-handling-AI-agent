<?php
declare(strict_types=1);

/**
 * ChannelsPage: Messenger + WhatsApp connections, WA templates, webhook
 * diagnostics, business systems integrations, integration health logs.
 */
final class ChannelsController
{
    /** Start Facebook Login for Business with tenant-bound, one-use state. */
    public static function metaLogin(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        $channel = (string) $req->input('channel', '');
        if (!in_array($channel, ['messenger', 'whatsapp'], true)) Response::error('Invalid Meta channel', 422);
        $appId = (string) Config::get('META_APP_ID', '');
        $configId = (string) Config::get($channel === 'messenger' ? 'META_MESSENGER_CONFIG_ID' : 'META_WHATSAPP_CONFIG_ID', '');
        if ($appId === '' || $configId === '' || Config::get('META_APP_SECRET', '') === '') Response::error('Meta Login for Business is not configured on the server', 503);
        $state = bin2hex(random_bytes(32));
        Database::insert('meta_oauth_sessions', [
            'state_hash' => hash('sha256', $state), 'tenant_id' => $tenantId,
            'user_id' => $ctx->userId(), 'channel' => $channel, 'expires_at' => date('Y-m-d H:i:s', time() + 600),
        ]);
        $callback = rtrim((string) Config::get('APP_URL', ''), '/') . '/channels/meta/callback';
        if ($callback === '/channels/meta/callback') Response::error('APP_URL must be the public backend URL', 503);
        $params = [
            'client_id' => $appId, 'redirect_uri' => $callback, 'config_id' => $configId,
            'response_type' => 'code', 'override_default_response_type' => 'true', 'state' => $state,
        ];
        Response::json(['authorizationUrl' => 'https://www.facebook.com/' . rawurlencode((string) Config::get('META_GRAPH_VERSION', 'v27.0')) . '/dialog/oauth?' . http_build_query($params)]);
    }

    /** OAuth callback: exchange the code server-side and retain it only for this tenant's asset selection. */
    public static function metaCallback(Request $req): void
    {
        $state = (string) $req->q('state', '');
        $stateHash = hash('sha256', $state);
        $session = $state !== '' ? Database::fetchOne('SELECT * FROM meta_oauth_sessions WHERE state_hash = :h AND callback_at IS NULL AND expires_at > :now', ['h' => $stateHash, 'now' => Database::now()]) : null;
        $frontend = rtrim((string) Config::get('FRONTEND_URL', ''), '/');
        if (!$session || $frontend === '') { http_response_code(400); echo 'Meta connection could not be completed. Please return to the app and try again.'; exit; }
        if ($req->q('error') || !$req->q('code')) {
            Database::delete('meta_oauth_sessions', 'state_hash = :h', ['h' => $stateHash]);
            header('Location: ' . $frontend . '/channels?tab=' . rawurlencode($session['channel']) . '&tenant=' . rawurlencode($session['tenant_id']) . '&meta=cancelled'); exit;
        }
        $version = (string) Config::get('META_GRAPH_VERSION', 'v27.0');
        $url = 'https://graph.facebook.com/' . rawurlencode($version) . '/oauth/access_token?' . http_build_query([
            'client_id' => Config::get('META_APP_ID'), 'client_secret' => Config::get('META_APP_SECRET'),
            'redirect_uri' => rtrim((string) Config::get('APP_URL'), '/') . '/channels/meta/callback', 'code' => $req->q('code'),
        ]);
        try {
            $tokenResult = Http::getJson($url);
            $token = $tokenResult['access_token'] ?? null;
            if (!is_string($token) || $token === '') throw new RuntimeException('Meta did not return an access token');
            $tokenExpires = isset($tokenResult['expires_in']) ? date('Y-m-d H:i:s', time() + max(0, (int)$tokenResult['expires_in'])) : null;
            Database::update('meta_oauth_sessions', ['access_token' => self::encryptMetaToken($token), 'token_expires_at'=>$tokenExpires, 'callback_at' => Database::now()], 'state_hash = :h', ['h' => $stateHash]);
            header('Location: ' . $frontend . '/channels?tab=' . rawurlencode($session['channel']) . '&tenant=' . rawurlencode($session['tenant_id']) . '&meta=authorized'); exit;
        } catch (Throwable $e) {
            error_log('[meta oauth] ' . $e->getMessage());
            Database::delete('meta_oauth_sessions', 'state_hash = :h', ['h' => $stateHash]);
            header('Location: ' . $frontend . '/channels?tab=' . rawurlencode($session['channel']) . '&tenant=' . rawurlencode($session['tenant_id']) . '&meta=error'); exit;
        }
    }

    /** List only assets granted by the current tenant's pending Meta authorization. */
    public static function metaAssets(Request $req): void
    {
        $ctx = $req->auth; $tenantId = $ctx->requireTenantId($req);
        $channel = (string) $req->q('channel', '');
        if (!in_array($channel, ['messenger', 'whatsapp'], true)) Response::error('Invalid Meta channel', 422);
        $session = Database::fetchOne('SELECT * FROM meta_oauth_sessions WHERE tenant_id = :t AND user_id = :u AND channel = :c AND callback_at IS NOT NULL AND expires_at > :now ORDER BY created_at DESC LIMIT 1', ['t'=>$tenantId,'u'=>$ctx->userId(),'c'=>$channel,'now'=>Database::now()]);
        if (!$session || !$session['access_token']) Response::notFound('Complete Facebook Login for Business first');
        $token = self::decryptMetaToken($session['access_token']); $base = 'https://graph.facebook.com/' . rawurlencode((string) Config::get('META_GRAPH_VERSION', 'v27.0')) . '/';
        try {
            if ($channel === 'messenger') {
                $result = Http::getJson($base . 'me/accounts?' . http_build_query(['fields'=>'id,name,category,access_token,instagram_business_account','limit'=>100,'access_token'=>$token]));
                $assets = array_map(fn($p)=>['id'=>$p['id'],'name'=>$p['name'],'category'=>$p['category'] ?? '', 'instagramAccountName'=>$p['instagram_business_account']['username'] ?? null, '_token'=>$p['access_token'] ?? $token], $result['data'] ?? []);
            } else {
                $result = Http::getJson($base . 'me/businesses?' . http_build_query(['fields'=>'id,name,owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}','limit'=>100,'access_token'=>$token]));
                $assets=[]; foreach (($result['data'] ?? []) as $business) foreach (($business['owned_whatsapp_business_accounts']['data'] ?? []) as $waba) foreach (($waba['phone_numbers']['data'] ?? []) as $phone) $assets[]=['id'=>$waba['id'],'name'=>$waba['name'],'businessId'=>$business['id'],'phoneNumberId'=>$phone['id'],'phoneNumber'=>$phone['display_phone_number'] ?? '', 'displayName'=>$phone['verified_name'] ?? $waba['name'],'_token'=>$token];
            }
            foreach ($assets as &$asset) unset($asset['_token']); unset($asset);
            Response::json(['assets'=>$assets]);
        } catch (Throwable $e) { Response::error('Could not load granted Meta assets: ' . $e->getMessage(), 422); }
    }

    public static function connectMetaAsset(Request $req): void
    {
        $ctx=$req->auth; $ctx->require('manage_integrations'); $tenantId=$ctx->requireTenantId($req); $data=$req->all();
        $channel=(string)($data['channel']??''); $assetId=(string)($data['assetId']??'');
        if (!in_array($channel,['messenger','whatsapp'],true) || $assetId==='') Response::error('Channel and asset are required',422);
        $session=Database::fetchOne('SELECT * FROM meta_oauth_sessions WHERE tenant_id=:t AND user_id=:u AND channel=:c AND callback_at IS NOT NULL AND expires_at>:now ORDER BY created_at DESC LIMIT 1',['t'=>$tenantId,'u'=>$ctx->userId(),'c'=>$channel,'now'=>Database::now()]);
        if (!$session || !$session['access_token']) Response::notFound('Complete Facebook Login for Business first');
        $token=self::decryptMetaToken($session['access_token']); $graph='https://graph.facebook.com/'.rawurlencode((string)Config::get('META_GRAPH_VERSION','v27.0')).'/';
        try {
            if ($channel==='messenger') {
                $pages=Http::getJson($graph.'me/accounts?'.http_build_query(['fields'=>'id,name,category,access_token,instagram_business_account','limit'=>100,'access_token'=>$token]))['data']??[];
                $page=null; foreach($pages as $p) if ((string)$p['id']===$assetId) {$page=$p;break;}
                if (!$page) Response::forbidden('That Page was not granted to this tenant connection');
                $permissions=Http::getJson($graph.'me/permissions?'.http_build_query(['access_token'=>$token]))['data']??[];
                $granted=array_values(array_map(fn($p)=>(string)$p['permission'],array_filter($permissions,fn($p)=>($p['status']??'')==='granted'&&!empty($p['permission']))));
                $vals=['page_name'=>$page['name'],'page_id'=>$page['id'],'category'=>$page['category']??null,'instagram_linked'=>isset($page['instagram_business_account'])?1:0,'instagram_account_name'=>$page['instagram_business_account']['username']??null,'access_token'=>self::encryptMetaToken((string)($page['access_token']??$token)),'token_status'=>'healthy','token_days_remaining'=>0,'token_type'=>'Meta Business Login','token_last_refreshed'=>Database::now(),'token_expires_at'=>null,'granted_permissions'=>Database::json($granted),'status'=>'connected'];
                self::upsertMetaConnection('messenger_connections',$tenantId,'msc',$vals);
            } else {
                $result=Http::getJson($graph.$assetId.'?'.http_build_query(['fields'=>'id,name,phone_numbers{id,display_phone_number,verified_name,quality_rating,code_verification_status}','access_token'=>$token]));
                $phoneId=(string)($data['phoneNumberId']??''); $phone=null; foreach(($result['phone_numbers']['data']??[]) as $p) if((string)$p['id']===$phoneId){$phone=$p;break;}
                if (!$phone) Response::forbidden('That phone number was not granted for this WhatsApp Business Account');
                $quality=in_array($phone['quality_rating']??'', ['GREEN','YELLOW','RED'], true)?$phone['quality_rating']:'UNKNOWN';
                $verification=strtoupper((string)($phone['code_verification_status']??''))==='VERIFIED'?'verified':'unverified';
                $vals=['waba_name'=>$result['name']??'WhatsApp Business','waba_id'=>$result['id'],'business_manager_id'=>$data['businessId']??null,'phone_number'=>$phone['display_phone_number']??'','phone_number_id'=>$phone['id'],'display_name'=>$phone['verified_name']??($result['name']??''),'access_token'=>self::encryptMetaToken($token),'token_type'=>'Meta Business Login','token_last_refreshed'=>Database::now(),'status'=>'connected','quality_rating'=>$quality,'verification_status'=>$verification,'has_green_tick'=>0];
                self::upsertMetaConnection('whatsapp_connections',$tenantId,'wac',$vals);
            }
            Database::delete('meta_oauth_sessions','state_hash=:h',['h'=>$session['state_hash']]);
            AuditService::log($tenantId,'integration_changed','Meta business asset connected','Connected '.$channel.' asset '.$assetId,'success',[], $ctx->userId(),$req);
            Response::json(['ok'=>true]);
        } catch (Throwable $e) { Response::error('Meta asset connection failed: '.$e->getMessage(),422); }
    }

    private static function upsertMetaConnection(string $table,string $tenantId,string $prefix,array $values): void
    {
        $row=Database::fetchOne('SELECT id FROM '.$table.' WHERE tenant_id=:t',['t'=>$tenantId]);
        if ($row) Database::update($table,$values,'tenant_id=:t',['t'=>$tenantId]);
        else Database::insert($table,array_merge(['id'=>Util::id($prefix),'tenant_id'=>$tenantId],$values));
    }
    private static function encryptMetaToken(string $token): string
    {
        $key=hash('sha256',(string)Config::get('META_APP_SECRET',''),true); $nonce=random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        return 'enc:v1:'.base64_encode($nonce.sodium_crypto_secretbox($token,$nonce,$key));
    }
    private static function decryptMetaToken(string $value): string
    {
        if (!str_starts_with($value,'enc:v1:')) return $value;
        $raw=base64_decode(substr($value,7),true); if ($raw===false || strlen($raw)<=SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) throw new RuntimeException('Stored Meta credential cannot be decrypted');
        $nonce=substr($raw,0,SODIUM_CRYPTO_SECRETBOX_NONCEBYTES); $plain=sodium_crypto_secretbox_open(substr($raw,SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),$nonce,hash('sha256',(string)Config::get('META_APP_SECRET',''),true));
        if ($plain===false) throw new RuntimeException('Meta app secret changed; reconnect this channel'); return $plain;
    }
    // ----------------------------------------------------------- messenger
    public static function messenger(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conn = Database::fetchOne('SELECT * FROM messenger_connections WHERE tenant_id = :t', ['t' => $tenantId]);
        if (!$conn || ($conn['token_type'] ?? '') !== 'Meta Business Login') Response::json(['connection' => null]);
        $errors = Database::fetchAll(
            'SELECT * FROM messenger_webhook_errors WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 50', ['t' => $tenantId]);
        Response::json([
            'connection' => self::shapeMessenger($conn),
            'webhookErrors' => array_map([self::class, 'shapeWebhookError'], $errors),
        ]);
    }

    public static function saveMessenger(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        $exists = Database::fetchOne('SELECT id FROM messenger_connections WHERE tenant_id = :t', ['t' => $tenantId]);

        $vals = [];
        foreach (['pageName' => 'page_name', 'pageId' => 'page_id', 'category' => 'category', 'avatarUrl' => 'avatar_url', 'instagramAccountName' => 'instagram_account_name', 'tokenType' => 'token_type'] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['accessToken'])) {
            $token = (string) $data['accessToken'];
            if (strlen($token) > 0 && strlen($token) < 20) Response::error('Access token looks invalid', 422);
            $vals['access_token'] = self::encryptMetaToken($token);
            $vals['token_last_refreshed'] = Database::now();
            $vals['token_expires_at'] = date('Y-m-d H:i:s', time() + 60 * 86400);
            $vals['token_days_remaining'] = 60;
            $vals['token_status'] = 'healthy';
        }
        foreach (['grantedPermissions', 'missingPermissions', 'subscribedFields'] as $f) {
            if (isset($data[$f]) && is_array($data[$f])) {
                $vals[strtolower(preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', $f))] = Database::json($data[$f]);
            }
        }
        if (isset($data['instagramLinked'])) $vals['instagram_linked'] = Validator::bool($data, 'instagramLinked') ? 1 : 0;
        if (isset($data['status']) && in_array($data['status'], ['connected', 'degraded', 'disconnected', 'needs_reauth', 'pending'], true)) {
            $vals['status'] = $data['status'];
        }

        if ($exists) {
            Database::update('messenger_connections', $vals, 'tenant_id = :t', ['t' => $tenantId]);
        } else {
            Validator::validateOrFail($data, ['pageName' => 'required', 'pageId' => 'required']);
            Database::insert('messenger_connections', array_merge(['id' => Util::id('msc'), 'tenant_id' => $tenantId, 'status' => 'connected'], $vals));
        }
        AuditService::log($tenantId, 'integration_changed', 'Messenger connection updated', 'Saved Messenger connection settings', 'success', [], $ctx->userId(), $req);
        AuditService::activity($tenantId, 'connection_event', 'Messenger updated', 'Connection settings saved', $ctx->user['name']);
        $conn = Database::fetchOne('SELECT * FROM messenger_connections WHERE tenant_id = :t', ['t' => $tenantId]);
        Response::json(['connection' => self::shapeMessenger($conn)]);
    }

    public static function disconnectMessenger(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        Database::update('messenger_connections', [
            'status' => 'disconnected', 'access_token' => null, 'token_status' => 'expired',
        ], 'tenant_id = :t', ['t' => $tenantId]);
        AuditService::log($tenantId, 'integration_changed', 'Messenger disconnected', 'Disconnected Facebook Page', 'success', [], $ctx->userId(), $req);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------ whatsapp
    public static function whatsapp(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conn = Database::fetchOne('SELECT * FROM whatsapp_connections WHERE tenant_id = :t', ['t' => $tenantId]);
        if (!$conn || ($conn['token_type'] ?? '') !== 'Meta Business Login') Response::json(['connection' => null, 'templates' => []]);
        $templates = Database::fetchAll('SELECT * FROM whatsapp_templates WHERE tenant_id = :t ORDER BY last_updated DESC', ['t' => $tenantId]);
        Response::json([
            'connection' => self::shapeWhatsapp($conn),
            'templates' => array_map([self::class, 'shapeTemplate'], $templates),
        ]);
    }

    public static function saveWhatsapp(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        $exists = Database::fetchOne('SELECT id FROM whatsapp_connections WHERE tenant_id = :t', ['t' => $tenantId]);

        $vals = [];
        foreach (['wabaName' => 'waba_name', 'wabaId' => 'waba_id', 'businessManagerId' => 'business_manager_id', 'phoneNumber' => 'phone_number', 'phoneNumberId' => 'phone_number_id', 'displayName' => 'display_name', 'messagingTierLimit' => 'messaging_tier_limit', 'throughputLimit' => 'throughput_limit'] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['accessToken'])) {
            $token = (string) $data['accessToken'];
            if (strlen($token) > 0 && strlen($token) < 20) Response::error('Access token looks invalid', 422);
            $vals['access_token'] = self::encryptMetaToken($token);
            $vals['token_last_refreshed'] = Database::now();
        }
        if (isset($data['verificationStatus']) && in_array($data['verificationStatus'], ['verified', 'unverified', 'in_review'], true)) $vals['verification_status'] = $data['verificationStatus'];
        if (isset($data['hasGreenTick'])) $vals['has_green_tick'] = Validator::bool($data, 'hasGreenTick') ? 1 : 0;
        if (isset($data['qualityRating']) && in_array($data['qualityRating'], ['GREEN', 'YELLOW', 'RED'], true)) $vals['quality_rating'] = $data['qualityRating'];
        if (isset($data['status']) && in_array($data['status'], ['connected', 'degraded', 'disconnected', 'needs_reauth', 'pending'], true)) $vals['status'] = $data['status'];

        if ($exists) {
            Database::update('whatsapp_connections', $vals, 'tenant_id = :t', ['t' => $tenantId]);
        } else {
            Validator::validateOrFail($data, ['wabaName' => 'required', 'wabaId' => 'required', 'phoneNumber' => 'required', 'phoneNumberId' => 'required']);
            Database::insert('whatsapp_connections', array_merge(['id' => Util::id('wac'), 'tenant_id' => $tenantId, 'status' => 'connected'], $vals));
        }
        AuditService::log($tenantId, 'integration_changed', 'WhatsApp connection updated', 'Saved WhatsApp settings', 'success', [], $ctx->userId(), $req);
        AuditService::activity($tenantId, 'connection_event', 'WhatsApp updated', 'Connection settings saved', $ctx->user['name']);
        $conn = Database::fetchOne('SELECT * FROM whatsapp_connections WHERE tenant_id = :t', ['t' => $tenantId]);
        Response::json(['connection' => self::shapeWhatsapp($conn)]);
    }

    public static function disconnectWhatsapp(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        Database::update('whatsapp_connections', ['status' => 'disconnected', 'access_token' => null], 'tenant_id = :t', ['t' => $tenantId]);
        AuditService::log($tenantId, 'integration_changed', 'WhatsApp disconnected', 'Disconnected WhatsApp number', 'success', [], $ctx->userId(), $req);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------ templates
    public static function createTemplate(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['name' => 'required', 'bodySample' => 'required']);
        $id = Util::id('wat');
        Database::insert('whatsapp_templates', [
            'id' => $id, 'tenant_id' => $tenantId,
            'name' => $data['name'],
            'category' => in_array(($categoryVal = $data['category'] ?? 'UTILITY'), ['UTILITY', 'MARKETING', 'AUTHENTICATION'], true) ? $categoryVal : 'UTILITY',
            'language' => (string) ($data['language'] ?? 'en'),
            'status' => in_array(($statusVal = $data['status'] ?? 'IN_REVIEW'), ['APPROVED', 'IN_REVIEW', 'REJECTED'], true) ? $statusVal : 'IN_REVIEW',
            'body_sample' => $data['bodySample'],
        ]);
        Response::json(['template' => self::shapeTemplate(Database::fetchOne('SELECT * FROM whatsapp_templates WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function updateTemplate(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM whatsapp_templates WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$row) Response::notFound('Template not found');
        $data = Validator::sanitizePayload($req->all());
        $update = [];
        foreach (['name', 'language'] as $f) if (isset($data[$f])) $update[$f] = $data[$f];
        if (isset($data['bodySample'])) $update['body_sample'] = $data['bodySample'];
        if (isset($data['category']) && in_array($data['category'], ['UTILITY', 'MARKETING', 'AUTHENTICATION'], true)) $update['category'] = $data['category'];
        if (isset($data['status']) && in_array($data['status'], ['APPROVED', 'IN_REVIEW', 'REJECTED'], true)) $update['status'] = $data['status'];
        $update['last_updated'] = Database::now();
        Database::update('whatsapp_templates', $update, 'id = :id', ['id' => $row['id']]);
        Response::json(['template' => self::shapeTemplate(Database::fetchOne('SELECT * FROM whatsapp_templates WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function deleteTemplate(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        Database::delete('whatsapp_templates', 'id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------- webhooks
    public static function webhookEvents(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $limit = min(200, Validator::int($req->q('limit'), 100));
        $rows = Database::fetchAll(
            'SELECT * FROM webhook_events WHERE tenant_id = :t ORDER BY created_at DESC LIMIT ' . $limit, ['t' => $tenantId]);
        Response::json(['events' => array_map([self::class, 'shapeWebhookEvent'], $rows)]);
    }

    public static function resolveWebhookError(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        Database::update('messenger_webhook_errors', ['resolved' => 1], 'id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        Response::json(['ok' => true]);
    }

    // --------------------------------------------------------- integrations
    public static function integrations(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM business_integrations WHERE tenant_id = :t ORDER BY name', ['t' => $tenantId]);
        $logs = Database::fetchAll('SELECT * FROM integration_health_logs WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 50', ['t' => $tenantId]);
        Response::json([
            'integrations' => array_map([self::class, 'shapeIntegration'], $rows),
            'healthLogs' => array_map([self::class, 'shapeHealthLog'], $logs),
        ]);
    }

    public static function saveIntegration(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        $id = $req->params['id'];
        $row = Database::fetchOne('SELECT * FROM business_integrations WHERE id = :id AND tenant_id = :t', ['id' => $id, 't' => $tenantId]);
        if (!$row) Response::notFound('Integration not found');
        $data = Validator::sanitizePayload($req->all());

        $update = [];
        if (isset($data['endpointUrl'])) $update['endpoint_url'] = $data['endpointUrl'];
        if (isset($data['apiKey'])) $update['credentials'] = $data['apiKey'];
        if (isset($data['status']) && in_array($data['status'], ['connected', 'degraded', 'disconnected', 'needs_reauth', 'pending'], true)) {
            $update['status'] = $data['status'];
        }
        if (isset($data['fallbackPolicy']) && is_array($data['fallbackPolicy'])) {
            $update['fallback_policy'] = Database::json($data['fallbackPolicy']);
        }
        if (isset($data['scopes']) && is_array($data['scopes'])) {
            $update['scopes'] = Database::json($data['scopes']);
        }
        if (isset($data['lastSyncAt'])) $update['last_sync_at'] = Database::now();

        // Validations: connect requires endpoint + credentials
        if (($update['status'] ?? '') === 'connected') {
            $endpoint = $update['endpoint_url'] ?? $row['endpoint_url'];
            $creds = $update['credentials'] ?? $row['credentials'];
            if (!$endpoint || !$creds) Response::error('Endpoint URL and credentials are required to connect', 422);
        }

        Database::update('business_integrations', $update, 'id = :id', ['id' => $id]);
        AuditService::log($tenantId, 'integration_changed', 'Integration updated', 'Updated integration ' . $row['name'], 'success', ['target' => $id], $ctx->userId(), $req);
        Response::json(['integration' => self::shapeIntegration(Database::fetchOne('SELECT * FROM business_integrations WHERE id = :id', ['id' => $id]))]);
    }

    public static function createIntegration(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['name' => 'required', 'category' => 'required|in:ecommerce,courier,inventory,payment,crm,custom_api']);
        $id = Util::id('int');
        Database::insert('business_integrations', [
            'id' => $id, 'tenant_id' => $tenantId,
            'integ_key' => strtolower(preg_replace('/[^a-z0-9]+/i', '_', $data['name'])),
            'name' => $data['name'],
            'category' => $data['category'],
            'badge' => $data['badge'] ?? null,
            'description' => $data['description'] ?? null,
            'status' => 'pending',
            'endpoint_url' => $data['endpointUrl'] ?? null,
            'auth_method' => in_array(($authMethodVal = $data['authMethod'] ?? ''), ['OAuth 2.0', 'API Key & Secret', 'Webhook HMAC', 'Bearer Token'], true) ? $authMethodVal : 'API Key & Secret',
            'credentials' => $data['apiKey'] ?? null,
            'scopes' => Database::json($data['scopes'] ?? []),
            'fallback_policy' => Database::json($data['fallbackPolicy'] ?? [
                'onFailAction' => 'human_handover', 'fallbackMessage' => '', 'preventHallucination' => true,
            ]),
        ]);
        Response::json(['integration' => self::shapeIntegration(Database::fetchOne('SELECT * FROM business_integrations WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function deleteIntegration(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('manage_integrations');
        $tenantId = $ctx->requireTenantId($req);
        Database::delete('business_integrations', 'id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        Response::json(['ok' => true]);
    }

    // -------------------------------------------------------------- shapes
    public static function shapeMessenger(array $c): array
    {
        $daysRemaining = (int) $c['token_days_remaining'];
        return [
            'pageName' => $c['page_name'],
            'pageId' => $c['page_id'],
            'category' => $c['category'],
            'avatarUrl' => $c['avatar_url'],
            'instagramLinked' => (bool) $c['instagram_linked'],
            'instagramAccountName' => $c['instagram_account_name'],
            'status' => $c['status'],
            'grantedPermissions' => Database::decodeJson($c['granted_permissions']) ?: [],
            'missingPermissions' => Database::decodeJson($c['missing_permissions']) ?: [],
            'subscribedFields' => Database::decodeJson($c['subscribed_fields']) ?: [],
            'lastWebhookAt' => null,
            'lastReplyAt' => null,
            'tokenHealth' => [
                'status' => $c['token_status'],
                'daysRemaining' => $daysRemaining,
                'tokenType' => $c['token_type'],
                'lastRefreshed' => Util::ts($c['token_last_refreshed']),
                'expiresAt' => null,
                'maskedToken' => $c['access_token'] ? Util::mask(self::decryptMetaToken($c['access_token']), 6) : null,
            ],
            'webhookErrors' => array_map([self::class, 'shapeWebhookError'],
                Database::fetchAll('SELECT * FROM messenger_webhook_errors WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 20', ['t' => $c['tenant_id']])),
        ];
    }

    public static function shapeWhatsapp(array $c): array
    {
        return [
            'wabaName' => $c['waba_name'],
            'wabaId' => $c['waba_id'],
            'businessManagerId' => $c['business_manager_id'],
            'phoneNumber' => $c['phone_number'],
            'phoneNumberId' => $c['phone_number_id'],
            'displayName' => $c['display_name'],
            'verificationStatus' => $c['verification_status'],
            'hasGreenTick' => (bool) $c['has_green_tick'],
            'status' => $c['status'],
            'qualityRating' => in_array($c['quality_rating'], ['GREEN','YELLOW','RED'], true) ? $c['quality_rating'] : 'UNKNOWN',
            'messagingTierLimit' => null,
            'current24hWindowSent' => null,
            'lastInboundAt' => null,
            'lastOutboundAt' => null,
            'maskedToken' => $c['access_token'] ? Util::mask(self::decryptMetaToken($c['access_token']), 6) : null,
            'tokenHealth' => [
                'status' => $c['access_token'] ? 'healthy' : 'expired',
                'type' => $c['token_type'] ?: 'System User Permanent Token',
                'lastRefreshed' => Util::ts($c['token_last_refreshed']),
            ],
            'throughputLimit' => null,
            'templates' => [],
        ];
    }

    public static function shapeTemplate(array $t): array
    {
        return [
            'id' => $t['id'],
            'name' => $t['name'],
            'category' => $t['category'],
            'language' => $t['language'],
            'status' => $t['status'],
            'bodySample' => $t['body_sample'],
            'lastUpdated' => Util::ts($t['last_updated']),
        ];
    }

    public static function shapeIntegration(array $i): array
    {
        return [
            'id' => $i['id'],
            'name' => $i['name'],
            'category' => $i['category'],
            'badge' => $i['badge'],
            'description' => $i['description'],
            'status' => $i['status'],
            'endpointUrl' => $i['endpoint_url'],
            'authMethod' => $i['auth_method'],
            'lastSyncAt' => Util::ts($i['last_sync_at']),
            'rateLimit' => [
                'used' => (int) $i['rate_limit_used'],
                'max' => (int) $i['rate_limit_max'],
                'resetWindow' => $i['rate_limit_reset'] ?: 'hourly',
            ],
            'scopes' => Database::decodeJson($i['scopes']) ?: [],
            'fallbackPolicy' => Database::decodeJson($i['fallback_policy']) ?: [
                'onFailAction' => 'human_handover', 'fallbackMessage' => '', 'preventHallucination' => true,
            ],
            'stats' => [
                'callsToday' => (int) $i['calls_today'],
                'successRate' => (float) $i['success_rate'],
                'avgLatencyMs' => (int) $i['avg_latency_ms'],
            ],
        ];
    }

    public static function shapeWebhookEvent(array $e): array
    {
        return [
            'id' => $e['id'],
            'correlationId' => $e['correlation_id'],
            'channel' => $e['channel'],
            'eventType' => $e['event_type'],
            'senderIdMasked' => $e['sender_id_masked'],
            'status' => $e['status'],
            'retryCount' => (int) $e['retry_count'],
            'latencyMs' => (int) $e['latency_ms'],
            'timestamp' => Util::ts($e['created_at']),
            'errorMessage' => $e['error_message'],
            'sanitizedSummary' => $e['sanitized_summary'],
            'rawPayloadRedacted' => Database::decodeJson($e['raw_payload']) ?: [],
        ];
    }

    public static function shapeWebhookError(array $e): array
    {
        return [
            'id' => $e['id'],
            'timestamp' => Util::ts($e['created_at']),
            'code' => (int) $e['code'],
            'title' => $e['title'],
            'details' => $e['details'],
            'impact' => $e['impact'],
            'resolved' => (bool) $e['resolved'],
        ];
    }

    public static function shapeHealthLog(array $l): array
    {
        return [
            'id' => $l['id'],
            'service' => $l['service'],
            'timestamp' => Util::ts($l['created_at']),
            'type' => $l['type'],
            'message' => $l['message'],
            'status' => $l['status'],
        ];
    }
}
