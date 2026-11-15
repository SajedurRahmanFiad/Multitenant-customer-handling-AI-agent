<?php
declare(strict_types=1);

/**
 * InboxPage: conversations, thread, staff replies, notes, takeover/pause,
 * assignment, transfer-to-team, priority/tags, canned replies, customer
 * context sidebar, AI reply correction.
 */
final class InboxController
{
    // ------------------------------------------------------------------ list
    public static function conversations(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $status = (string) $req->q('status', 'all');
        $channel = (string) $req->q('channel', '');
        $q = trim((string) $req->q('q', ''));
        $priority = (string) $req->q('priority', '');
        $limit = min(200, Validator::int($req->q('limit'), 100));

        $where = ['c.tenant_id = :t'];
        $params = ['t' => $tenantId];
        if (in_array($status, ['unassigned', 'needs_human', 'ai_handling', 'waiting', 'resolved'], true)) {
            if ($status === 'unassigned') $where[] = 'c.assigned_staff_id IS NULL AND c.status != :rs';
            else $where[] = 'c.status = :st';
            $params['st'] = $status;
            $params['rs'] = 'resolved';
        }
        if (in_array($channel, ['whatsapp', 'messenger'], true)) {
            $where[] = 'c.channel = :ch';
            $params['ch'] = $channel;
        }
        if (in_array($priority, ['urgent', 'high', 'medium', 'low'], true)) {
            $where[] = 'c.priority = :pr';
            $params['pr'] = $priority;
        }
        if ($q !== '') {
            $where[] = '(cu.name LIKE :q OR cu.phone LIKE :q OR c.last_message_preview LIKE :q)';
            $params['q'] = '%' . $q . '%';
        }

        $rows = Database::fetchAll(
            'SELECT c.*, cu.name AS customer_name, cu.phone AS customer_phone, cu.external_id AS customer_external_id,
                    u.name AS staff_name
             FROM conversations c
             JOIN customers cu ON cu.id = c.customer_id
             LEFT JOIN users u ON u.id = c.assigned_staff_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY c.last_message_at DESC, c.created_at DESC LIMIT ' . $limit,
            $params
        );

        Response::json(['conversations' => array_map([self::class, 'shapeConversation'], $rows)]);
    }

    public static function conversation(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = self::findConversation($tenantId, $req->params['id']);
        $out = self::shapeConversation($row);
        $out['customer'] = self::customerProfile($tenantId, $row['customer_id']);
        $sources = Database::fetchAll(
            'SELECT ms.* FROM message_sources ms
             JOIN messages m ON m.id = ms.message_id
             WHERE m.conversation_id = :c ORDER BY ms.score DESC LIMIT 6',
            ['c' => $row['id']]
        );
        $out['retrievedSources'] = array_map(fn($s) => [
            'id' => $s['id'], 'title' => $s['title'], 'score' => (float) $s['score'],
            'snippet' => (string) $s['snippet'],
        ], $sources);
        Response::json(['conversation' => $out]);
    }

    public static function messages(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $rows = Database::fetchAll(
            'SELECT * FROM messages WHERE conversation_id = :c ORDER BY created_at ASC, id ASC',
            ['c' => $conv['id']]
        );
        $out = [];
        foreach ($rows as $m) {
            $item = self::shapeMessage($m);
            $atts = Database::fetchAll('SELECT * FROM message_attachments WHERE message_id = :m ORDER BY created_at', ['m' => $m['id']]);
            $item['attachments'] = array_map(fn($a) => [
                'type' => $a['type'], 'url' => $a['url'], 'name' => $a['name'],
                'size' => $a['size'], 'duration' => $a['duration'], 'thumbnail' => $a['thumbnail'],
            ], $atts);
            $srcs = Database::fetchAll('SELECT id, title, snippet, score FROM message_sources WHERE message_id = :m ORDER BY score DESC', ['m' => $m['id']]);
            if ($srcs) {
                $item['aiMetadata']['usedSources'] = array_map(fn($s) => [
                    'id' => $s['id'], 'title' => $s['title'], 'score' => (float) $s['score'], 'snippet' => (string) $s['snippet'],
                ], $srcs);
            }
            if ($m['ai_confidence'] !== null) {
                $item['aiMetadata']['confidence'] = (float) $m['ai_confidence'];
                $item['aiMetadata']['status'] = $m['ai_status_decision'] ?? 'send';
                $item['aiMetadata']['isLowConfidence'] = (float) $m['ai_confidence'] < 0.55;
                $item['aiMetadata']['preventedBecauseHumanControl'] = false;
                $item['aiMetadata']['correctionNote'] = $m['ai_correction_note'];
            }
            $out[] = $item;
        }
        Response::json(['messages' => $out]);
    }

    // ----------------------------------------------------------------- reply
    public static function sendMessage(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('send_messages');
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $data = $req->all();
        $text = trim((string) ($data['text'] ?? ''));
        if ($text === '' && empty($data['attachments'])) Response::error('Message text is required', 422);

        $isNote = Validator::bool($data, 'isInternalNote');
        $msgId = Util::id('msg');
        Database::insert('messages', [
            'id' => $msgId,
            'tenant_id' => $tenantId,
            'conversation_id' => $conv['id'],
            'sender' => 'staff',
            'sender_name' => $ctx->user['name'],
            'sender_user_id' => $ctx->userId(),
            'text' => $text,
            'delivery_state' => 'sent',
            'is_internal_note' => $isNote ? 1 : 0,
        ]);

        foreach ((array) ($data['attachments'] ?? []) as $att) {
            if (!is_array($att)) continue;
            Database::insert('message_attachments', [
                'id' => Util::id('att'),
                'message_id' => $msgId,
                'tenant_id' => $tenantId,
                'type' => in_array(($typeVal = $att['type'] ?? ''), ['image', 'audio', 'file'], true) ? $typeVal : 'file',
                'url' => (string) ($att['url'] ?? ''),
                'name' => (string) ($att['name'] ?? 'attachment'),
                'size' => $att['size'] ?? null,
                'duration' => $att['duration'] ?? null,
            ]);
        }

        if (!$isNote) {
            // Sending a manual reply implies the agent is under human control now.
            Database::update('conversations', [
                'ai_status' => 'human_controlled',
                'last_message_preview' => mb_substr($text, 0, 250),
                'last_message_at' => Database::now(),
                'unread_count' => 0,
            ], 'id = :id', ['id' => $conv['id']]);
            if ($conv['assigned_staff_id'] === null) {
                Database::update('conversations', ['assigned_staff_id' => $ctx->userId()], 'id = :id', ['id' => $conv['id']]);
            }
        } else {
            Database::update('conversations', ['last_message_at' => Database::now()], 'id = :id', ['id' => $conv['id']]);
        }

        AuditService::log($tenantId, $isNote ? 'tool_call_executed' : 'agent_takeover',
            $isNote ? 'Internal note added' : 'Staff reply sent',
            ($isNote ? 'Added internal note in ' : 'Replied to ') . $conv['id'], 'success',
            ['target' => $conv['id']], $ctx->userId(), $req);

        $m = Database::fetchOne('SELECT * FROM messages WHERE id = :id', ['id' => $msgId]);
        Response::json(['message' => self::shapeMessage($m)], 201);
    }

    /** CorrectReplyModal: regenerate the AI reply using a correction note. */
    public static function correctReply(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $msgId = $req->params['messageId'];
        $msg = Database::fetchOne(
            'SELECT * FROM messages WHERE id = :id AND tenant_id = :t',
            ['id' => $msgId, 't' => $tenantId]
        );
        if (!$msg) Response::notFound('Message not found');
        if ($msg['sender'] !== 'ai') Response::error('Only AI messages can be corrected', 422);

        $note = trim((string) $req->input('correctionNote', ''));
        if ($note === '') Response::error('Correction note is required', 422);

        $conv = self::findConversation($tenantId, $msg['conversation_id']);
        $customer = Database::fetchOne('SELECT * FROM customers WHERE id = :id', ['id' => $conv['customer_id']]);
        $prevInbound = Database::fetchOne(
            "SELECT * FROM messages WHERE conversation_id = :c AND sender = 'customer' AND created_at <= :t ORDER BY created_at DESC LIMIT 1",
            ['c' => $conv['id'], 't' => $msg['created_at']]
        );
        $sources = KnowledgeService::retrieve($tenantId, (string) ($prevInbound['text'] ?? ''), 4);
        $agentCfg = AgentConfigService::liveConfig($tenantId);

        $prompt = PromptBuilder::build(
            Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $tenantId]),
            $customer, $conv,
            $agentCfg['identity'] ?? [], $agentCfg['instructions'] ?? [], $agentCfg['behavior'] ?? [], $agentCfg['responseRules'] ?? [],
            Database::fetchOne('SELECT * FROM brand_identity WHERE tenant_id = :t', ['t' => $tenantId]),
            $sources, [], (string) ($prevInbound['text'] ?? ''), false, null
        );
        $prompt['messages'][] = ['role' => 'assistant', 'content' => $msg['text']];
        $prompt['messages'][] = ['role' => 'user', 'content' => 'A supervisor reviewed your reply and asked: ' . $note . "\nRewrite the reply accordingly."];

        $provider = LLMFactory::forModel($conv['channel'] === 'messenger' ? null : ($agentCfg['identity']['agentName'] ?? null));
        $completion = LLMFactory::defaultProvider()->complete($prompt['messages'], ['temperature' => 0.2]);

        Database::update('messages', [
            'text' => $completion['text'],
            'ai_correction_note' => $note,
            'ai_confidence' => min(1.0, (float) $msg['ai_confidence'] + 0.1),
        ], 'id = :id', ['id' => $msgId]);

        AuditService::log($tenantId, 'tool_call_executed', 'AI reply corrected', 'Reply corrected per staff instruction', 'success', ['target' => $msgId], $ctx->userId(), $req);
        $m = Database::fetchOne('SELECT * FROM messages WHERE id = :id', ['id' => $msgId]);
        Response::json(['message' => self::shapeMessage($m), 'text' => $completion['text']]);
    }

    /** Regenerate an AI reply (front-end "generate" while processing). */
    public static function generateReply(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $lastInbound = Database::fetchOne(
            "SELECT * FROM messages WHERE conversation_id = :c AND sender = 'customer' ORDER BY created_at DESC LIMIT 1",
            ['c' => $conv['id']]
        );
        if (!$lastInbound) Response::error('No customer message to reply to', 422);
        $result = Orchestrator::processInbound($tenantId, [
            'channel' => $conv['channel'],
            'text' => $lastInbound['text'],
            'externalMessageId' => 'regen_' . Util::correlationId(),
            'customerExternalId' => Database::scalar('SELECT external_id FROM customers WHERE id = :id', ['id' => $conv['customer_id']]),
            'customerName' => Database::scalar('SELECT name FROM customers WHERE id = :id', ['id' => $conv['customer_id']]),
        ]);
        Response::json($result);
    }

    // ------------------------------------------------------------ ai control
    public static function aiControl(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('takeover_ai');
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $action = (string) $req->input('action', '');   // takeover | pause | resume | release
        $valid = ['takeover' => 'human_controlled', 'pause' => 'paused', 'resume' => 'active', 'release' => 'active'];
        if (!isset($valid[$action])) Response::error('action must be one of takeover|pause|resume|release', 422);

        $sysEvent = $action === 'takeover' ? 'takeover' : ($action === 'release' ? 'release' : 'pause');
        $noteText = match ($action) {
            'takeover' => $ctx->user['name'] . ' took over the conversation from AI.',
            'pause' => $ctx->user['name'] . ' paused AI responses.',
            'resume' => 'AI responses resumed.',
            'release' => $ctx->user['name'] . ' handed the conversation back to AI.',
        };
        $msgId = Util::id('msg');
        Database::insert('messages', [
            'id' => $msgId, 'tenant_id' => $tenantId, 'conversation_id' => $conv['id'],
            'sender' => 'system', 'sender_name' => 'System', 'text' => $noteText,
            'system_event_type' => $sysEvent,
        ]);
        Database::update('conversations', [
            'ai_status' => $valid[$action],
            'status' => $action === 'takeover' ? 'needs_human' : ($action === 'release' ? 'ai_handling' : $conv['status']),
            'assigned_staff_id' => $action === 'takeover' ? $ctx->userId() : ($action === 'release' ? null : $conv['assigned_staff_id']),
            'handover_reason' => $action === 'takeover' ? 'Staff takeover' : $conv['handover_reason'],
            'last_message_at' => Database::now(),
        ], 'id = :id', ['id' => $conv['id']]);

        AuditService::log($tenantId, 'agent_takeover', ucfirst($action) . ' AI', $noteText, 'success', ['target' => $conv['id']], $ctx->userId(), $req);
        AuditService::activity($tenantId, 'staff_takeover', ucfirst($action) . ' AI', $noteText, $ctx->user['name']);
        $m = Database::fetchOne('SELECT * FROM messages WHERE id = :id', ['id' => $msgId]);
        Response::json(['ok' => true, 'message' => self::shapeMessage($m)]);
    }

    public static function assign(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $staffId = (string) $req->input('staffId', '');
        if ($staffId === '') {
            Database::update('conversations', ['assigned_staff_id' => null], 'id = :id', ['id' => $conv['id']]);
        } else {
            $staff = Database::fetchOne('SELECT * FROM users WHERE id = :id AND tenant_id = :t', ['id' => $staffId, 't' => $tenantId]);
            if (!$staff) Response::notFound('Staff member not found');
            Database::update('conversations', ['assigned_staff_id' => $staffId], 'id = :id', ['id' => $conv['id']]);
            self::systemEvent($tenantId, $conv['id'], 'assigned', 'Assigned to ' . $staff['name']);
        }
        $row = self::findConversation($tenantId, $conv['id']);
        Response::json(['conversation' => self::shapeConversation($row)]);
    }

    public static function transferTeam(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('send_messages');
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $teamId = (string) $req->input('teamId', '');
        $team = Database::fetchOne('SELECT * FROM teams WHERE id = :id AND tenant_id = :t', ['id' => $teamId, 't' => $tenantId]);
        if (!$team) Response::notFound('Team not found');
        $note = trim((string) $req->input('note', ''));
        Database::update('conversations', ['assigned_team_id' => $teamId, 'status' => 'waiting'], 'id = :id', ['id' => $conv['id']]);
        self::systemEvent($tenantId, $conv['id'], 'assigned', 'Transferred to team ' . $team['name'] . ($note !== '' ? ' — ' . $note : ''));
        AuditService::log($tenantId, 'agent_takeover', 'Conversation transferred', 'Transferred to ' . $team['name'], 'success', ['target' => $conv['id']], $ctx->userId(), $req);
        Response::json(['ok' => true, 'team' => ['id' => $team['id'], 'name' => $team['name']]]);
    }

    public static function status(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $status = (string) $req->input('status', '');
        if (!in_array($status, ['needs_human', 'ai_handling', 'waiting', 'resolved'], true)) {
            Response::error('Invalid status', 422);
        }
        Database::update('conversations', [
            'status' => $status,
            'resolved_at' => $status === 'resolved' ? Database::now() : null,
            'ai_status' => $status === 'resolved' ? 'active' : $conv['ai_status'],
        ], 'id = :id', ['id' => $conv['id']]);
        AuditService::log($tenantId, 'agent_takeover', 'Status changed', "Status set to $status", 'success', ['target' => $conv['id']], $ctx->userId(), $req);
        $row = self::findConversation($tenantId, $conv['id']);
        Response::json(['conversation' => self::shapeConversation($row)]);
    }

    public static function priority(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $p = (string) $req->input('priority', '');
        if (!in_array($p, ['urgent', 'high', 'medium', 'low'], true)) Response::error('Invalid priority', 422);
        Database::update('conversations', ['priority' => $p], 'id = :id', ['id' => $conv['id']]);
        self::systemEvent($tenantId, $conv['id'], 'priority_change', "Priority changed to $p");
        $row = self::findConversation($tenantId, $conv['id']);
        Response::json(['conversation' => self::shapeConversation($row)]);
    }

    public static function tags(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        $tags = (array) $req->input('tags', []);
        $tags = array_values(array_filter(array_map('strval', $tags)));
        Database::update('conversations', ['tags' => Database::json($tags)], 'id = :id', ['id' => $conv['id']]);
        self::systemEvent($tenantId, $conv['id'], 'tag_added', 'Tags updated: ' . implode(', ', $tags));
        $row = self::findConversation($tenantId, $conv['id']);
        Response::json(['conversation' => self::shapeConversation($row)]);
    }

    public static function markRead(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $conv = self::findConversation($tenantId, $req->params['id']);
        Database::update('conversations', ['unread_count' => 0], 'id = :id', ['id' => $conv['id']]);
        Response::json(['ok' => true]);
    }

    // -------------------------------------------------------- canned replies
    public static function cannedReplies(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll(
            'SELECT * FROM canned_replies WHERE tenant_id = :t AND is_approved = 1 ORDER BY title',
            ['t' => $tenantId]
        );
        Response::json(['replies' => array_map(fn($r) => [
            'id' => $r['id'], 'title' => $r['title'], 'text' => $r['text'], 'channel' => $r['channel'],
        ], $rows)]);
    }

    public static function createCannedReply(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $data = $req->all();
        Validator::validateOrFail($data, ['title' => 'required', 'text' => 'required']);
        $id = Util::id('cnd');
        Database::insert('canned_replies', [
            'id' => $id, 'tenant_id' => $tenantId,
            'title' => $data['title'], 'text' => $data['text'],
            'is_approved' => 1,
            'channel' => (string) ($data['channel'] ?? 'all'),
        ]);
        Response::json(['reply' => ['id' => $id] + Validator::sanitizePayload($data)], 201);
    }

    // ----------------------------------------------------------- customer UI
    public static function customer(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $customer = Database::fetchOne('SELECT * FROM customers WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$customer) Response::notFound('Customer not found');
        Response::json(['customer' => self::customerProfile($tenantId, $customer['id'])]);
    }

    public static function updateCustomer(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $customer = Database::fetchOne('SELECT * FROM customers WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$customer) Response::notFound('Customer not found');
        $data = Validator::sanitizePayload($req->all());
        $update = [];
        foreach (['name', 'phone', 'email', 'city', 'language'] as $f) {
            if (isset($data[$f])) $update[$f] = $data[$f];
        }
        if (isset($data['memoryNotes'])) $update['memory_notes'] = $data['memoryNotes'];
        Database::update('customers', $update, 'id = :id', ['id' => $customer['id']]);
        Response::json(['customer' => self::customerProfile($tenantId, $customer['id'])]);
    }

    public static function exportCustomer(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('export_customer_data');
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll(
            'SELECT cu.*, c.id AS conv_id, c.status FROM customers cu
             LEFT JOIN conversations c ON c.customer_id = cu.id
             WHERE cu.tenant_id = :t', ['t' => $tenantId]);
        $csv = "customer_id,name,phone,email,city,external_id,language,total_orders,conversation_id\n";
        foreach ($rows as $r) {
            $csv .= implode(',', [$r['id'], $r['name'], $r['phone'], $r['email'], $r['city'], $r['external_id'], $r['language'], $r['total_orders'], $r['conv_id']]) . "\n";
        }
        AuditService::log($tenantId, 'customer_data_exported', 'Customer data exported', 'Exported customer list to CSV', 'success', [], $ctx->userId(), $req);
        Response::download('customers-' . $tenantId . '.csv', $csv);
    }

    // ------------------------------------------------------------- helpers
    private static function findConversation(string $tenantId, string $id): array
    {
        $row = Database::fetchOne(
            'SELECT c.*, cu.name AS customer_name FROM conversations c JOIN customers cu ON cu.id = c.customer_id
             WHERE c.id = :id AND c.tenant_id = :t', ['id' => $id, 't' => $tenantId]);
        if (!$row) Response::notFound('Conversation not found');
        return $row;
    }

    private static function systemEvent(string $tenantId, string $conversationId, string $eventType, string $text): void
    {
        Database::insert('messages', [
            'id' => Util::id('msg'), 'tenant_id' => $tenantId, 'conversation_id' => $conversationId,
            'sender' => 'system', 'sender_name' => 'System', 'text' => $text, 'system_event_type' => $eventType,
        ]);
    }

    public static function shapeConversation(array $c): array
    {
        return [
            'id' => $c['id'],
            'channel' => $c['channel'],
            'status' => $c['status'],
            'priority' => $c['priority'],
            'aiStatus' => $c['ai_status'],
            'handoverReason' => $c['handover_reason'],
            'unreadCount' => (int) $c['unread_count'],
            'assignedStaff' => $c['staff_name'] ?? ($c['assigned_staff_id'] ? Database::scalar('SELECT name FROM users WHERE id = :id', ['id' => $c['assigned_staff_id']]) : null),
            'assignedStaffId' => $c['assigned_staff_id'],
            'assignedTeam' => $c['assigned_team_id'] ? Database::scalar('SELECT name FROM teams WHERE id = :id', ['id' => $c['assigned_team_id']]) : null,
            'assignedTeamId' => $c['assigned_team_id'],
            'tags' => Database::decodeJson($c['tags'] ?? null) ?: [],
            'lastMessage' => (string) ($c['last_message_preview'] ?? ''),
            'lastMessageTime' => Util::ts($c['last_message_at'] ?? $c['created_at']),
            'createdAt' => Util::ts($c['created_at']),
            'customerId' => $c['customer_id'],
            'customer' => ['id' => $c['customer_id'], 'name' => $c['customer_name'] ?? '', 'phone' => $c['customer_phone'] ?? '', 'externalId' => $c['customer_external_id'] ?? ''],
        ];
    }

    public static function shapeMessage(array $m): array
    {
        return [
            'id' => $m['id'],
            'conversationId' => $m['conversation_id'],
            'sender' => $m['sender'],
            'senderName' => $m['sender_name'],
            'text' => $m['text'],
            'timestamp' => Util::ts($m['created_at']),
            'deliveryState' => $m['delivery_state'],
            'isInternalNote' => (bool) $m['is_internal_note'],
            'systemEventType' => $m['system_event_type'],
        ];
    }

    public static function customerProfile(string $tenantId, string $customerId): array
    {
        $cu = Database::fetchOne('SELECT * FROM customers WHERE id = :id', ['id' => $customerId]);
        $lastOrder = Database::fetchOne(
            'SELECT * FROM customer_orders WHERE customer_id = :c ORDER BY ordered_at DESC LIMIT 1', ['c' => $customerId]);
        $prevCount = (int) Database::scalar(
            'SELECT COUNT(*) FROM conversations WHERE customer_id = :c', ['c' => $customerId]);
        return [
            'id' => $cu['id'],
            'name' => $cu['name'],
            'phone' => (string) $cu['phone'],
            'email' => (string) $cu['email'],
            'city' => (string) $cu['city'],
            'externalId' => $cu['external_id'],
            'language' => $cu['language'],
            'memoryNotes' => (string) ($cu['memory_notes'] ?? ''),
            'totalOrders' => (int) $cu['total_orders'],
            'totalSpent' => (string) ($cu['total_spent'] + 0),
            'lastOrder' => $lastOrder ? [
                'id' => $lastOrder['external_order_id'],
                'items' => $lastOrder['items'],
                'amount' => (string) ($lastOrder['amount'] + 0),
                'status' => $lastOrder['status'],
                'date' => Util::ts($lastOrder['ordered_at']),
            ] : null,
            'previousConversationsCount' => max(0, $prevCount - 1),
            'tags' => Database::decodeJson($cu['tags'] ?? null) ?: [],
            'lastActive' => Util::relativeTime($cu['last_active_at']),
        ];
    }
}
