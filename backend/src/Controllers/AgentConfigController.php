<?php
declare(strict_types=1);

/**
 * AgentConfigPage: identity, instructions, behavior, handover rules,
 * response rules + quick templates, pipeline layers, config versions
 * (draft → publish → rollback).
 */
final class AgentConfigController
{
    public static function config(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $draft = AgentConfigService::ensureDraft($tenantId);
        $published = Database::fetchOne(
            "SELECT * FROM agent_config_versions WHERE tenant_id = :t AND status = 'published' ORDER BY published_at DESC LIMIT 1",
            ['t' => $tenantId]
        );
        $layers = Database::fetchAll(
            'SELECT * FROM tenant_pipeline_layers WHERE tenant_id = :t ORDER BY layer_order', ['t' => $tenantId]);
        $pipeCfg = Database::fetchOne('SELECT * FROM tenant_pipeline_config WHERE tenant_id = :t', ['t' => $tenantId]);

        $out = self::shapeVersion($draft);
        $out['liveVersion'] = $published ? self::shapeVersion($published) : null;
        $out['pipeline'] = [
            'layers' => array_map([self::class, 'shapeLayer'], $layers),
            'routingStrategy' => $pipeCfg['routing_strategy'] ?? 'sequential',
            'costControlMode' => (bool) ($pipeCfg['cost_control_mode'] ?? false),
            'lastUpdated' => Util::ts($pipeCfg['updated_at'] ?? null),
        ];
        $out['handoverRules'] = array_map([self::class, 'shapeHandoverRule'],
            Database::fetchAll('SELECT * FROM handover_rules WHERE tenant_id = :t ORDER BY created_at', ['t' => $tenantId]));
        $out['quickTemplates'] = array_map(fn($t) => [
            'id' => $t['id'], 'triggerKeyword' => $t['trigger_keyword'], 'templateText' => $t['template_text'],
        ], Database::fetchAll('SELECT * FROM quick_templates WHERE tenant_id = :t ORDER BY created_at', ['t' => $tenantId]));
        $out['versions'] = array_map([self::class, 'shapeVersion'], Database::fetchAll(
            'SELECT * FROM agent_config_versions WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 50',
            ['t' => $tenantId]));
        Response::json($out);
    }

    // --------------------------------------------------------- section saves
    public static function saveIdentity(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $draft = AgentConfigService::ensureDraft($tenantId);
        $data = Validator::sanitizePayload($req->all());
        $identity = Database::decodeJson($draft['identity']) ?: AgentConfigService::defaultIdentity();

        foreach (['agentName', 'primaryLanguage', 'tone', 'emojiUsage', 'messageLength'] as $f) {
            if (isset($data[$f])) $identity[$f] = $data[$f];
        }
        if (isset($data['supportedLanguages']) && is_array($data['supportedLanguages'])) {
            $identity['supportedLanguages'] = array_values(array_intersect($data['supportedLanguages'], ['Bangla', 'English', 'Banglish']));
        }
        Database::update('agent_config_versions', ['identity' => Database::json($identity)], 'id = :id', ['id' => $draft['id']]);
        Response::json(['identity' => $identity]);
    }

    public static function saveInstructions(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $draft = AgentConfigService::ensureDraft($tenantId);
        $data = Validator::sanitizePayload($req->all());
        $ins = Database::decodeJson($draft['instructions']) ?: AgentConfigService::defaultInstructions();

        $textFields = ['primaryObjective', 'businessDescription', 'communicationGuidelines', 'mandatoryDisclaimers', 'customSafetyRules', 'missingInfoStrategy', 'ambiguousQuestionsStrategy', 'whenToSearchKnowledge'];
        foreach ($textFields as $f) if (isset($data[$f])) $ins[$f] = $data[$f];
        if (isset($data['supportedTopics']) && is_array($data['supportedTopics'])) $ins['supportedTopics'] = $data['supportedTopics'];
        if (isset($data['prohibitedTopics']) && is_array($data['prohibitedTopics'])) $ins['prohibitedTopics'] = $data['prohibitedTopics'];
        if (isset($data['askClarifyingQuestions'])) $ins['askClarifyingQuestions'] = Validator::bool($data, 'askClarifyingQuestions');
        if (isset($data['maxClarificationAttempts'])) $ins['maxClarificationAttempts'] = Validator::int($data['maxClarificationAttempts']);
        if (isset($data['enableLiveTools'])) $ins['enableLiveTools'] = Validator::bool($data, 'enableLiveTools');
        if (isset($data['liveTools']) && is_array($data['liveTools'])) {
            foreach (['orderStatusLookup', 'inventoryCheck', 'promoCodeValidator', 'courierTrackingSync'] as $tool) {
                if (isset($data['liveTools'][$tool])) $ins['liveTools'][$tool] = Validator::bool($data['liveTools'], $tool);
            }
        }
        Database::update('agent_config_versions', ['instructions' => Database::json($ins)], 'id = :id', ['id' => $draft['id']]);
        Response::json(['instructions' => $ins]);
    }

    public static function saveBehavior(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $draft = AgentConfigService::ensureDraft($tenantId);
        $data = Validator::sanitizePayload($req->all());
        $b = Database::decodeJson($draft['behavior']) ?: AgentConfigService::defaultBehavior();

        $bools = ['immediateGreeting', 'proactivelySuggestProducts', 'collectContactDetails', 'summarizeBeforeHandover', 'autoFollowUpAfterUnanswered', 'detectComplaints'];
        $texts = ['welcomeMessage', 'productSuggestionTrigger', 'followUpMessage', 'inactivityAction'];
        $nums = ['greetingDelaySeconds', 'followUpDelayMinutes', 'inactivityTimeoutMinutes'];
        foreach ($bools as $f) if (isset($data[$f])) $b[$f] = Validator::bool($data, $f);
        foreach ($texts as $f) if (isset($data[$f])) $b[$f] = $data[$f];
        foreach ($nums as $f) if (isset($data[$f])) $b[$f] = Validator::int($data[$f]);
        if (isset($data['requiredContactFields']) && is_array($data['requiredContactFields'])) {
            $b['requiredContactFields'] = array_values(array_intersect($data['requiredContactFields'], ['phone', 'email', 'delivery_address', 'order_id']));
        }
        Database::update('agent_config_versions', ['behavior' => Database::json($b)], 'id = :id', ['id' => $draft['id']]);
        Response::json(['behavior' => $b]);
    }

    // -------------------------------------------------------- handover rules
    public static function handoverRules(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM handover_rules WHERE tenant_id = :t ORDER BY created_at', ['t' => $tenantId]);
        Response::json(['rules' => array_map([self::class, 'shapeHandoverRule'], $rows)]);
    }

    public static function createHandoverRule(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['name' => 'required', 'triggerType' => 'required|in:customer_request,sentiment_frustration,missing_knowledge,refund_exception,payment_conflict,legal_privacy,low_confidence']);
        $id = Util::id('hr');
        Database::insert('handover_rules', [
            'id' => $id, 'tenant_id' => $tenantId,
            'name' => $data['name'], 'description' => $data['description'] ?? null,
            'trigger_type' => $data['triggerType'],
            'priority' => in_array(($priorityVal = $data['priority'] ?? 'medium'), ['urgent', 'high', 'medium', 'low'], true) ? $priorityVal : 'medium',
            'destination_team' => $data['destinationTeam'] ?? 'General Support',
            'handover_message' => $data['handoverMessage'] ?? null,
            'notification_channels' => Database::json($data['notificationChannels'] ?? ['in_app']),
            'pause_ai_immediately' => Validator::bool($data, 'pauseAiImmediately', true) ? 1 : 0,
            'require_explicit_resume' => Validator::bool($data, 'requireExplicitResume') ? 1 : 0,
            'confidence_threshold_percent' => isset($data['confidenceThresholdPercent']) ? Validator::int($data['confidenceThresholdPercent']) : null,
            'is_active' => Validator::bool($data, 'isActive', true) ? 1 : 0,
        ]);
        Response::json(['rule' => self::shapeHandoverRule(Database::fetchOne('SELECT * FROM handover_rules WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function updateHandoverRule(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM handover_rules WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$row) Response::notFound('Rule not found');
        $data = Validator::sanitizePayload($req->all());
        $map = ['name', 'description' => 'description', 'triggerType' => 'trigger_type', 'priority' => 'priority', 'destinationTeam' => 'destination_team', 'handoverMessage' => 'handover_message'];
        $update = [];
        foreach ($map as $k => $col) {
            $k = is_int($k) ? $col : $k;
            if (isset($data[$k])) $update[$col] = $data[$k];
        }
        if (isset($data['notificationChannels']) && is_array($data['notificationChannels'])) {
            $update['notification_channels'] = Database::json($data['notificationChannels']);
        }
        foreach (['pauseAiImmediately' => 'pause_ai_immediately', 'requireExplicitResume' => 'require_explicit_resume', 'isActive' => 'is_active'] as $in => $col) {
            if (isset($data[$in])) $update[$col] = Validator::bool($data, $in) ? 1 : 0;
        }
        if (isset($data['confidenceThresholdPercent'])) $update['confidence_threshold_percent'] = Validator::int($data['confidenceThresholdPercent']);
        Database::update('handover_rules', $update, 'id = :id', ['id' => $row['id']]);
        Response::json(['rule' => self::shapeHandoverRule(Database::fetchOne('SELECT * FROM handover_rules WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function deleteHandoverRule(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        Database::delete('handover_rules', 'id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        Response::json(['ok' => true]);
    }

    // -------------------------------------------------------- response rules
    public static function saveResponseRules(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $draft = AgentConfigService::ensureDraft($tenantId);
        $data = Validator::sanitizePayload($req->all());
        $rr = Database::decodeJson($draft['response_rules']) ?: AgentConfigService::defaultResponseRules();

        foreach (['sourceCitationBehavior', 'conflictingSourcesBehavior', 'noAnswerBehavior'] as $f) {
            if (isset($data[$f])) $rr[$f] = $data[$f];
        }
        if (isset($data['maxResponseCharacters'])) $rr['maxResponseCharacters'] = Validator::int($data['maxResponseCharacters']);
        if (isset($data['maxSentencesPerMessage'])) $rr['maxSentencesPerMessage'] = Validator::int($data['maxSentencesPerMessage']);
        if (isset($data['combineMultipleQuestions'])) $rr['combineMultipleQuestions'] = Validator::bool($data, 'combineMultipleQuestions');
        if (isset($data['supportedLocales']) && is_array($data['supportedLocales'])) $rr['supportedLocales'] = $data['supportedLocales'];
        if (isset($data['restrictedClaims']) && is_array($data['restrictedClaims'])) $rr['restrictedClaims'] = $data['restrictedClaims'];
        Database::update('agent_config_versions', ['response_rules' => Database::json($rr)], 'id = :id', ['id' => $draft['id']]);
        Response::json(['responseRules' => $rr]);
    }

    public static function createQuickTemplate(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['triggerKeyword' => 'required', 'templateText' => 'required']);
        $id = Util::id('qt');
        Database::insert('quick_templates', [
            'id' => $id, 'tenant_id' => $tenantId,
            'trigger_keyword' => $data['triggerKeyword'], 'template_text' => $data['templateText'],
        ]);
        Response::json(['template' => ['id' => $id, 'triggerKeyword' => $data['triggerKeyword'], 'templateText' => $data['templateText']]], 201);
    }

    public static function deleteQuickTemplate(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        Database::delete('quick_templates', 'id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        Response::json(['ok' => true]);
    }

    // --------------------------------------------------------------- modes
    public static function saveMode(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $data = $req->all();
        $mode = (string) ($data['mode'] ?? '');
        if (!in_array($mode, ['disabled', 'suggestion', 'automatic', 'restricted_automatic'], true)) {
            Response::error('Invalid agent mode', 422);
        }
        $draft = AgentConfigService::ensureDraft($tenantId);
        Database::update('agent_config_versions', ['mode' => $mode], 'id = :id', ['id' => $draft['id']]);
        // If published, update published mode immediately so live agent obeys.
        Database::run(
            "UPDATE agent_config_versions SET mode = :m WHERE tenant_id = :t AND status = 'published'",
            ['m' => $mode, 't' => $tenantId]
        );
        AuditService::log($tenantId, 'agent_toggle', 'Agent mode changed', "Agent mode set to $mode", 'success', ['target' => $tenantId], $ctx->userId(), $req);
        AuditService::activity($tenantId, 'rule_triggered', 'Agent mode changed', "Mode set to $mode", $ctx->user['name']);
        Response::json(['mode' => $mode]);
    }

    // ------------------------------------------------------------ pipeline
    public static function pipeline(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $layers = Database::fetchAll('SELECT * FROM tenant_pipeline_layers WHERE tenant_id = :t ORDER BY layer_order', ['t' => $tenantId]);
        $cfg = Database::fetchOne('SELECT * FROM tenant_pipeline_config WHERE tenant_id = :t', ['t' => $tenantId]);
        Response::json([
            'layers' => array_map([self::class, 'shapeLayer'], $layers),
            'routingStrategy' => $cfg['routing_strategy'] ?? 'sequential',
            'costControlMode' => (bool) ($cfg['cost_control_mode'] ?? false),
        ]);
    }

    public static function updatePipelineLayer(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM tenant_pipeline_layers WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$row) Response::notFound('Layer not found');
        $data = Validator::sanitizePayload($req->all());
        $update = [];
        if (isset($data['title'])) $update['title'] = $data['title'];
        if (isset($data['description'])) $update['description'] = $data['description'];
        if (isset($data['selectedModelId'])) $update['selected_model_id'] = $data['selectedModelId'];
        if (isset($data['fallbackModelId'])) $update['fallback_model_id'] = $data['fallbackModelId'];
        if (isset($data['temperature'])) $update['temperature'] = Validator::float($data['temperature']);
        if (isset($data['maxTokens'])) $update['max_tokens'] = Validator::int($data['maxTokens']);
        if (isset($data['systemPrompt'])) $update['system_prompt'] = $data['systemPrompt'];
        if (isset($data['isEnabled'])) $update['is_enabled'] = Validator::bool($data, 'isEnabled') ? 1 : 0;
        Database::update('tenant_pipeline_layers', $update, 'id = :id', ['id' => $row['id']]);
        Response::json(['layer' => self::shapeLayer(Database::fetchOne('SELECT * FROM tenant_pipeline_layers WHERE id = :id', ['id' => $row['id']]))]);
    }

    public static function updatePipelineConfig(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $data = $req->all();
        $exists = Database::fetchOne('SELECT tenant_id FROM tenant_pipeline_config WHERE tenant_id = :t', ['t' => $tenantId]);
        $vals = [];
        if (isset($data['routingStrategy']) && in_array($data['routingStrategy'], ['sequential', 'conditional_branch', 'adaptive'], true)) {
            $vals['routing_strategy'] = $data['routingStrategy'];
        }
        if (isset($data['costControlMode'])) $vals['cost_control_mode'] = Validator::bool($data, 'costControlMode') ? 1 : 0;
        if ($exists) Database::update('tenant_pipeline_config', $vals, 'tenant_id = :t', ['t' => $tenantId]);
        else Database::insert('tenant_pipeline_config', array_merge(['tenant_id' => $tenantId], $vals));
        Response::json(['ok' => true]);
    }

    // ------------------------------------------------------------ versions
    public static function listVersions(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll(
            'SELECT * FROM agent_config_versions WHERE tenant_id = :t ORDER BY created_at DESC LIMIT 50', ['t' => $tenantId]);
        Response::json(['versions' => array_map(fn($v) => self::shapeVersion($v), $rows)]);
    }

    public static function publish(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('publish_policies');
        $tenantId = $ctx->requireTenantId($req);
        $summary = trim((string) $req->input('summary', 'Published changes'));
        Database::transaction(function () use ($tenantId, $ctx, $summary) {
            // archive previously published
            Database::run(
                "UPDATE agent_config_versions SET status = 'archived' WHERE tenant_id = :t AND status = 'published'",
                ['t' => $tenantId]
            );
            $draft = AgentConfigService::ensureDraft($tenantId);
            Database::update('agent_config_versions', [
                'status' => 'published',
                'summary' => $summary,
                'published_at' => Database::now(),
                'published_by' => $ctx->user['name'],
            ], 'id = :id', ['id' => $draft['id']]);
        });
        AuditService::log($tenantId, 'policy_published', 'Agent config published', $summary, 'success', [], $ctx->userId(), $req);
        AuditService::activity($tenantId, 'rule_triggered', 'Agent config published', $summary, $ctx->user['name']);
        Response::json(['ok' => true]);
    }

    public static function rollback(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('publish_policies');
        $tenantId = $ctx->requireTenantId($req);
        $versionId = $req->params['id'];
        $target = Database::fetchOne('SELECT * FROM agent_config_versions WHERE id = :id AND tenant_id = :t', ['id' => $versionId, 't' => $tenantId]);
        if (!$target) Response::notFound('Version not found');

        Database::transaction(function () use ($tenantId, $ctx, $target) {
            Database::run(
                "UPDATE agent_config_versions SET status = 'archived' WHERE tenant_id = :t AND status = 'published'",
                ['t' => $tenantId]
            );
            Database::update('agent_config_versions', [
                'status' => 'published',
                'summary' => 'Rolled back to ' . $target['version'],
                'published_at' => Database::now(),
                'published_by' => $ctx->user['name'],
            ], 'id = :id', ['id' => $target['id']]);
        });
        AuditService::log($tenantId, 'policy_published', 'Agent config rollback', 'Rolled back to ' . $target['version'], 'success', [], $ctx->userId(), $req);
        Response::json(['ok' => true]);
    }

    public static function discardDraft(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        Database::run(
            "DELETE FROM agent_config_versions WHERE tenant_id = :t AND status = 'draft'",
            ['t' => $tenantId]
        );
        Response::json(['ok' => true]);
    }

    // -------------------------------------------------------------- shapes
    public static function shapeVersion(array $v): array
    {
        return [
            'id' => $v['id'],
            'version' => $v['version'],
            'status' => $v['status'],
            'mode' => $v['mode'],
            'summary' => $v['summary'],
            'identity' => Database::decodeJson($v['identity']) ?: AgentConfigService::defaultIdentity(),
            'instructions' => Database::decodeJson($v['instructions']) ?: AgentConfigService::defaultInstructions(),
            'behavior' => Database::decodeJson($v['behavior']) ?: AgentConfigService::defaultBehavior(),
            'responseRules' => Database::decodeJson($v['response_rules']) ?: AgentConfigService::defaultResponseRules(),
            'publishedAt' => Util::ts($v['published_at'] ?? null),
            'publishedBy' => $v['published_by'],
            'isLive' => $v['status'] === 'published',
            'createdAt' => Util::ts($v['created_at']),
        ];
    }

    public static function shapeLayer(array $l): array
    {
        return [
            'id' => $l['id'],
            'layerType' => $l['layer_type'],
            'layerOrder' => (int) $l['layer_order'],
            'title' => $l['title'],
            'subtitle' => $l['subtitle'],
            'description' => $l['description'],
            'selectedModelId' => $l['selected_model_id'],
            'fallbackModelId' => $l['fallback_model_id'],
            'temperature' => (float) $l['temperature'],
            'maxTokens' => (int) $l['max_tokens'],
            'systemPrompt' => $l['system_prompt'],
            'isEnabled' => (bool) $l['is_enabled'],
            'inputDescription' => $l['input_description'],
            'outputDescription' => $l['output_description'],
        ];
    }

    public static function shapeHandoverRule(array $r): array
    {
        return [
            'id' => $r['id'],
            'name' => $r['name'],
            'description' => $r['description'],
            'triggerType' => $r['trigger_type'],
            'priority' => $r['priority'],
            'destinationTeam' => $r['destination_team'],
            'handoverMessage' => $r['handover_message'],
            'notificationChannels' => Database::decodeJson($r['notification_channels']) ?: [],
            'pauseAiImmediately' => (bool) $r['pause_ai_immediately'],
            'requireExplicitResume' => (bool) $r['require_explicit_resume'],
            'confidenceThresholdPercent' => $r['confidence_threshold_percent'] !== null ? (int) $r['confidence_threshold_percent'] : null,
            'isActive' => (bool) $r['is_active'],
        ];
    }
}
