<?php
declare(strict_types=1);

/**
 * MessageProcessor — the end-to-end inbound pipeline (mirrors the original
 * orchestrator):
 *  1 validate tenant  2 dedupe  3 resolve customer  4 resolve conversation
 *  5 save inbound     6 attachments  7 context (memory+history)
 *  8 knowledge retrieval  9 build prompt  10 LLM  11 moderation/rules
 *  12 save reply  13 usage/audit  14 memory update  15 follow-up jobs
 */
final class Orchestrator
{
    /** Entry: ingest payload (API or webhook-normalized). */
    public static function processInbound(string $tenantId, array $payload): array
    {
        $startedAt = microtime(true);

        $tenant = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $tenantId]);
        if (!$tenant) throw new RuntimeException('Tenant not found');
        if ($tenant['status'] !== 'active') throw new RuntimeException('Tenant suspended');

        $channel = ($payload['channel'] ?? 'whatsapp') === 'messenger' ? 'messenger' : 'whatsapp';
        $text = trim((string) ($payload['text'] ?? $payload['message'] ?? ''));
        $externalId = (string) ($payload['externalMessageId'] ?? '');
        $senderName = trim((string) ($payload['senderName'] ?? 'Customer'));

        // Step 2: duplicate detection
        if ($externalId !== '') {
            $dup = Database::fetchOne(
                "SELECT m.id, c.id AS conv_id FROM messages m JOIN conversations c ON c.id = m.conversation_id
                 WHERE m.external_message_id = :e LIMIT 1", ['e' => $externalId]);
            if ($dup) {
                $last = Database::fetchOne(
                    "SELECT * FROM messages WHERE conversation_id = :c AND sender != 'customer' ORDER BY created_at DESC LIMIT 1",
                    ['c' => $dup['conv_id']]);
                return ['duplicate' => true, 'conversationId' => $dup['conv_id'], 'previousReply' => $last['text'] ?? null];
            }
        }

        // Step 3: resolve/create customer
        $customer = self::resolveCustomer($tenantId, $channel, $payload);
        if ($senderName !== '' && $customer['name'] === 'Unknown Customer' && $senderName !== 'Customer') {
            Database::update('customers', ['name' => $senderName], 'id = :id', ['id' => $customer['id']]);
        }

        // Step 4: resolve/create conversation
        $conversation = self::resolveConversation($tenantId, $customer, $channel);

        // Out-of-hours behaviour check (service settings)
        $svc = Database::fetchOne('SELECT * FROM service_settings WHERE tenant_id = :t', ['t' => $tenantId]);
        $outOfHours = self::isOutOfHours($svc, $tenant);

        // Step 5: save inbound message
        $inboundId = Util::id('msg');
        Database::insert('messages', [
            'id' => $inboundId,
            'tenant_id' => $tenantId,
            'conversation_id' => $conversation['id'],
            'sender' => 'customer',
            'sender_name' => $customer['name'] !== 'Unknown Customer' ? $customer['name'] : ($senderName ?: 'Customer'),
            'text' => $text,
            'delivery_state' => 'delivered',
            'external_message_id' => $externalId ?: null,
        ]);

        // Step 6: attachments
        foreach (($payload['attachments'] ?? []) as $att) {
            if (!is_array($att)) continue;
            Database::insert('message_attachments', [
                'id' => Util::id('att'),
                'message_id' => $inboundId,
                'tenant_id' => $tenantId,
                'type' => in_array(($typeVal = $att['type'] ?? ''), ['image', 'audio', 'file'], true) ? $typeVal : 'file',
                'url' => (string) ($att['url'] ?? ''),
                'name' => (string) ($att['name'] ?? 'attachment'),
                'size' => $att['size'] ?? null,
                'duration' => $att['duration'] ?? null,
                'insights' => Database::json($att['insights'] ?? null),
            ]);
        }

        // Human-controlled? AI must not reply (preventedBecauseHumanControl)
        if ($conversation['ai_status'] !== 'active') {
            Database::update('conversations', [
                'unread_count' => (int) $conversation['unread_count'] + 1,
                'last_message_preview' => mb_substr($text, 0, 250),
                'last_message_at' => Database::now(),
            ], 'id = :id', ['id' => $conversation['id']]);
            if ((int) $conversation['unread_count'] + 1 > 0 && $conversation['status'] === 'resolved') {
                Database::update('conversations', ['status' => 'waiting'], 'id = :id', ['id' => $conversation['id']]);
            }
            return [
                'conversationId' => $conversation['id'],
                'inboundMessageId' => $inboundId,
                'reply' => null,
                'preventedBecauseHumanControl' => true,
            ];
        }

        // Wallet guard: if balance is below price, fall back to safe non-AI message.
        $agentCfg = AgentConfigService::liveConfig($tenantId);
        $mode = $agentCfg['mode'] ?? 'automatic';
        if ($mode === 'disabled') {
            return ['conversationId' => $conversation['id'], 'inboundMessageId' => $inboundId, 'reply' => null, 'agentDisabled' => true];
        }

        // Step 7-10: context + retrieval + prompt + LLM
        $result = self::generate($tenantId, $tenant, $customer, $conversation, $text, $inboundId, $agentCfg, $outOfHours, $svc);
        $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

        // Step 13: usage
        UsageService::logTurn($tenantId, $conversation['id'], $result['replyMessageId'], $result['modelId'], $result['provider'], $result['inputTokens'], $result['outputTokens'], $latencyMs);

        // Step 14: memory extraction (cheap heuristics)
        MemoryService::updateFromExchange($tenantId, $customer['id'], $text, $result['replyText']);

        // Update conversation rollups
        $firstResponse = $conversation['first_response_at'] ?: Database::now();
        Database::update('conversations', [
            'last_message_preview' => mb_substr($result['replyText'], 0, 250),
            'last_message_at' => Database::now(),
            'first_response_at' => $firstResponse,
            'status' => $result['handoff'] ? 'needs_human' : $conversation['status'],
            'handover_reason' => $result['handoff'] ? ($result['handoffReason'] ?? 'Low confidence') : $conversation['handover_reason'],
            'ai_status' => $result['handoff'] ? 'paused' : $conversation['ai_status'],
        ], 'id = :id', ['id' => $conversation['id']]);

        if ($result['handoff']) {
            UsageService::bumpHandoff($tenantId);
            NotificationsService::notifyHandoff($tenantId, $conversation['id'], $customer['name'], $result['handoffReason'] ?? 'Escalated');
            $escaped = null;
            JobDispatcher::dispatch('deliver_delayed_reply', ['conversationId' => $conversation['id']], $tenantId, 8, 5);
        } else {
            // charge wallet per AI message
            if (!WalletService::chargeMessage($tenantId)) {
                Database::insert('notifications', [
                    'id' => Util::id('ntf'),
                    'tenant_id' => $tenantId,
                    'title' => 'Wallet balance too low',
                    'message' => 'Wallet balance is below the per-message price. Top up to keep AI automation running.',
                    'type' => 'urgent',
                    'source_module' => 'Billing',
                ]);
            }
        }

        AuditService::log($tenantId, 'tool_call_executed', 'AI reply generated', 'Generated AI reply with confidence ' . $result['confidence'], 'success', [
            'target' => $conversation['id'],
            'confidence' => $result['confidence'],
            'model' => $result['modelId'],
        ], null);

        return [
            'conversationId' => $conversation['id'],
            'inboundMessageId' => $inboundId,
            'replyMessageId' => $result['replyMessageId'],
            'reply' => $result['replyText'],
            'confidence' => $result['confidence'],
            'handoff' => $result['handoff'],
            'status' => $result['handoff'] ? 'send' : ($result['clarify'] ? 'clarify' : 'send'),
            'sources' => $result['sources'],
        ];
    }

    private static function resolveCustomer(string $tenantId, string $channel, array $payload): array
    {
        $external = trim((string) ($payload['customerExternalId'] ?? $payload['externalId'] ?? ''));
        $phone = trim((string) ($payload['customerPhone'] ?? $payload['phone'] ?? ''));

        if ($phone !== '' && $channel === 'whatsapp' && $external === '') {
            $external = 'wa_' . preg_replace('/\D/', '', $phone);
        }
        if ($external === '' && ($payload['messengerSenderId'] ?? null)) {
            $external = 'fb_' . $payload['messengerSenderId'];
        }
        if ($external === '') {
            $external = 'anon_' . bin2hex(random_bytes(5));
        }

        $customer = Database::fetchOne(
            'SELECT * FROM customers WHERE tenant_id = :t AND external_id = :e LIMIT 1',
            ['t' => $tenantId, 'e' => $external]
        );
        if ($customer) {
            Database::update('customers', ['last_active_at' => Database::now()], 'id = :id', ['id' => $customer['id']]);
            return $customer;
        }

        $id = Util::id('cst');
        Database::insert('customers', [
            'id' => $id,
            'tenant_id' => $tenantId,
            'name' => trim((string) ($payload['customerName'] ?? '')) ?: 'Unknown Customer',
            'phone' => $phone ?: null,
            'email' => $payload['customerEmail'] ?? null,
            'city' => $payload['customerCity'] ?? null,
            'external_id' => $external,
            'channel' => $channel,
            'language' => $payload['language'] ?? 'Bangla',
        ]);
        return Database::fetchOne('SELECT * FROM customers WHERE id = :id', ['id' => $id]);
    }

    private static function resolveConversation(string $tenantId, array $customer, string $channel): array
    {
        $conv = Database::fetchOne(
            "SELECT * FROM conversations WHERE tenant_id = :t AND customer_id = :c
             AND status != 'resolved' ORDER BY last_message_at DESC LIMIT 1",
            ['t' => $tenantId, 'c' => $customer['id']]
        );
        if ($conv) return $conv;

        $id = Util::id('cnv');
        Database::insert('conversations', [
            'id' => $id,
            'tenant_id' => $tenantId,
            'customer_id' => $customer['id'],
            'channel' => $channel,
            'status' => 'ai_handling',
            'ai_status' => 'active',
            'tags' => Database::json([]),
        ]);
        UsageService::bumpConversationCounter($tenantId);
        return Database::fetchOne('SELECT * FROM conversations WHERE id = :id', ['id' => $id]);
    }

    private static function isOutOfHours(?array $svc, array $tenant): bool
    {
        $tz = new DateTimeZone($tenant['timezone'] ?: 'UTC');
        $now = new DateTime('now', $tz);
        $start = (string) ($svc['business_hours_start'] ?? '09:00');
        $end = (string) ($svc['business_hours_end'] ?? '18:00');
        $cur = (int) $now->format('Hi');
        [$sh, $sm] = array_map('intval', explode(':', $start));
        [$eh, $em] = array_map('intval', explode(':', $end));
        return $cur < ($sh * 100 + $sm) || $cur > ($eh * 100 + $em);
    }

    private static function generate(string $tenantId, array $tenant, array $customer, array $conversation, string $text, string $inboundId, array $agentCfg, bool $outOfHours, ?array $svc): array
    {
        // Knowledge retrieval (step 9)
        $sources = KnowledgeService::retrieve($tenantId, $text, 4);

        // History + memory (step 7)
        $history = Database::fetchAll(
            "SELECT sender, text FROM messages WHERE conversation_id = :c AND is_internal_note = 0 ORDER BY created_at DESC LIMIT 10",
            ['c' => $conversation['id']]
        );
        $history = array_reverse($history);

        $identity = $agentCfg['identity'] ?? [];
        $instructions = $agentCfg['instructions'] ?? [];
        $behavior = $agentCfg['behavior'] ?? [];
        $responseRules = $agentCfg['responseRules'] ?? [];
        $brand = Database::fetchOne('SELECT * FROM brand_identity WHERE tenant_id = :t', ['t' => $tenantId]);

        $prompt = PromptBuilder::build($tenant, $customer, $conversation, $identity, $instructions, $behavior, $responseRules, $brand, $sources, $history, $text, $outOfHours, $svc);

        // Pipeline layers (step 10a): route through enabled tenant layers
        $layers = Database::fetchAll(
            'SELECT * FROM tenant_pipeline_layers WHERE tenant_id = :t AND is_enabled = 1 ORDER BY layer_order ASC',
            ['t' => $tenantId]
        );
        $finalLayer = null;
        foreach ($layers as $l) {
            if ($l['layer_type'] === 'final_generation') { $finalLayer = $l; break; }
        }

        $modelId = $finalLayer['selected_model_id'] ?? ($tenant['primary_model'] ?? null);
        $provider = LLMFactory::forModel($modelId);
        $temperature = (float) ($finalLayer['temperature'] ?? 0.3);
        $maxTokens = (int) ($finalLayer['max_tokens'] ?? 1024);

        $completion = $provider->complete($prompt['messages'], [
            'model' => $modelId,
            'temperature' => $temperature,
            'maxTokens' => $maxTokens,
        ]);
        $replyText = $completion['text'];

        // Step 11: moderation + rules + handover
        $mod = ModerationService::evaluate($tenantId, $text, $replyText, $sources, $agentCfg);
        if ($mod['rewriteTo']) {
            $replyText = $mod['rewriteTo'];
        }

        $confidence = $mod['confidence'];
        $decision = $mod['decision'];   // send | clarify | handoff

        // Response rules: max chars / sentences
        $maxChars = (int) ($responseRules['maxResponseCharacters'] ?? 0);
        if ($maxChars > 0 && mb_strlen($replyText) > $maxChars) {
            $replyText = mb_substr($replyText, 0, $maxChars - 3) . '...';
        }

        // Step 12: save AI reply
        $replyId = Util::id('msg');
        Database::insert('messages', [
            'id' => $replyId,
            'tenant_id' => $tenantId,
            'conversation_id' => $conversation['id'],
            'sender' => 'ai',
            'sender_name' => (string) ($identity['agentName'] ?? 'AI Assistant'),
            'text' => $replyText,
            'delivery_state' => 'sent',
            'ai_confidence' => $confidence,
            'ai_status_decision' => $decision === 'handoff' ? 'handoff' : ($decision === 'clarify' ? 'clarify' : 'send'),
        ]);

        // Persist retrieved sources for the UI
        foreach ($sources as $s) {
            Database::insert('message_sources', [
                'id' => Util::id('msc'),
                'message_id' => $replyId,
                'title' => $s['title'],
                'snippet' => mb_substr($s['text'], 0, 300),
                'score' => $s['score'],
            ]);
        }

        if ($mod['failedCase']) {
            Database::insert('failed_cases', [
                'id' => Util::id('fc'),
                'tenant_id' => $tenantId,
                'conversation_id' => $conversation['id'],
                'customer_name' => $customer['name'],
                'channel' => $conversation['channel'],
                'snippet' => mb_substr($text, 0, 200),
                'reason' => $mod['failedReason'],
                'confidence' => $confidence,
                'status' => $mod['failedCaseStatus'],
            ]);
        }

        return [
            'replyMessageId' => $replyId,
            'replyText' => $replyText,
            'confidence' => $confidence,
            'handoff' => $decision === 'handoff',
            'clarify' => $decision === 'clarify',
            'handoffReason' => $mod['handoffReason'],
            'sources' => $sources,
            'inputTokens' => $completion['inputTokens'],
            'outputTokens' => $completion['outputTokens'],
            'modelId' => $completion['model'],
            'provider' => $completion['provider'],
        ];
    }

    /**
     * Test Agent (Overview) — run a one-off simulated exchange without persisting.
     */
    public static function dryRun(string $tenantId, string $question, ?string $channel = 'whatsapp'): array
    {
        $tenant = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $tenantId]);
        $agentCfg = AgentConfigService::liveConfig($tenantId);
        $sources = KnowledgeService::retrieve($tenantId, $question, 4);
        $fakeCustomer = [
            'id' => 'dry', 'name' => 'Test Customer', 'phone' => '', 'city' => '', 'language' => 'English',
            'memory_notes' => null, 'total_orders' => 0, 'total_spent' => 0, 'external_id' => 'test',
        ];
        $fakeConv = ['id' => 'dry', 'channel' => $channel === 'messenger' ? 'messenger' : 'whatsapp'];
        $prompt = PromptBuilder::build(
            $tenant, $fakeCustomer, $fakeConv,
            $agentCfg['identity'] ?? [], $agentCfg['instructions'] ?? [], $agentCfg['behavior'] ?? [],
            $agentCfg['responseRules'] ?? [],
            Database::fetchOne('SELECT * FROM brand_identity WHERE tenant_id = :t', ['t' => $tenantId]),
            $sources, [], $question, false, null
        );
        $layer = Database::fetchOne(
            "SELECT * FROM tenant_pipeline_layers WHERE tenant_id = :t AND layer_type = 'final_generation'",
            ['t' => $tenantId]
        );
        $modelId = $layer['selected_model_id'] ?? ($tenant['primary_model'] ?? null);
        $provider = LLMFactory::forModel($modelId);
        $completion = $provider->complete($prompt['messages'], ['model' => $modelId, 'temperature' => (float) ($layer['temperature'] ?? 0.3), 'maxTokens' => (int) ($layer['max_tokens'] ?? 1024)]);
        $mod = ModerationService::evaluate($tenantId, $question, $completion['text'], $sources, $agentCfg);

        return [
            'reply' => $mod['rewriteTo'] ?? $completion['text'],
            'confidence' => $mod['confidence'],
            'decision' => $mod['decision'],
            'sources' => $sources,
            'model' => $completion['model'],
            'provider' => $completion['provider'],
            'promptPreview' => mb_substr($prompt['preview'], 0, 800),
        ];
    }
}
