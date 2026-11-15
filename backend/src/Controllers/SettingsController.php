<?php
declare(strict_types=1);

/**
 * SettingsPage: business profile, service settings (+delivery zones),
 * data retention (+erasure requests), notifications & escalations,
 * audit logs viewer.
 */
final class SettingsController
{
    // ------------------------------------------------------ business profile
    public static function businessProfile(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM business_profiles WHERE tenant_id = :t', ['t' => $tenantId]);
        if (!$row) {
            $tenant = Database::fetchOne('SELECT * FROM tenants WHERE id = :id', ['id' => $tenantId]);
            $row = [
                'business_name' => $tenant['business_name'] ?? '', 'industry' => '', 'business_description' => '',
                'website' => '', 'contact_phone' => '', 'support_email' => '', 'business_hours_start' => '09:00',
                'business_hours_end' => '18:00', 'time_zone' => $tenant['timezone'] ?? 'Asia/Dhaka',
                'operating_locations' => null, 'updated_at' => null,
            ];
        }
        Response::json(['profile' => self::shapeProfile($row)]);
    }

    public static function saveBusinessProfile(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['businessName' => 'required']);
        $vals = [
            'business_name' => $data['businessName'],
            'industry' => $data['industry'] ?? null,
            'business_description' => $data['businessDescription'] ?? null,
            'website' => $data['website'] ?? null,
            'contact_phone' => $data['contactPhone'] ?? null,
            'support_email' => $data['supportEmail'] ?? null,
            'business_hours_start' => $data['businessHoursStart'] ?? '09:00',
            'business_hours_end' => $data['businessHoursEnd'] ?? '18:00',
            'time_zone' => $data['timeZone'] ?? 'Asia/Dhaka',
            'operating_locations' => Database::json($data['operatingLocations'] ?? []),
        ];
        $exists = Database::fetchOne('SELECT tenant_id FROM business_profiles WHERE tenant_id = :t', ['t' => $tenantId]);
        if ($exists) Database::update('business_profiles', $vals, 'tenant_id = :t', ['t' => $tenantId]);
        else Database::insert('business_profiles', array_merge(['tenant_id' => $tenantId], $vals));
        Database::update('tenants', ['business_name' => $data['businessName']], 'id = :id', ['id' => $tenantId]);
        Response::json(['profile' => self::shapeProfile(Database::fetchOne('SELECT * FROM business_profiles WHERE tenant_id = :t', ['t' => $tenantId]))]);
    }

    // ------------------------------------------------------ service settings
    public static function serviceSettings(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM service_settings WHERE tenant_id = :t', ['t' => $tenantId]);
        $zones = Database::fetchAll('SELECT * FROM delivery_zones WHERE tenant_id = :t ORDER BY zone', ['t' => $tenantId]);
        Response::json([
            'service' => $row ? self::shapeService($row) : null,
            'deliveryAreas' => array_map([self::class, 'shapeZone'], $zones),
        ]);
    }

    public static function saveServiceSettings(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        $vals = [];
        foreach ([
            'customerSupportHours' => 'customer_support_hours',
            'escalationSupervisorName' => 'escalation_supervisor_name',
            'escalationSupervisorEmail' => 'escalation_supervisor_email',
            'escalationSupervisorPhone' => 'escalation_supervisor_phone',
            'supportPhone' => 'support_phone',
            'supportEmail' => 'support_email',
            'defaultGreetingMessage' => 'default_greeting_message',
            'outOfHoursMessage' => 'out_of_hours_message',
        ] as $in => $col) {
            if (isset($data[$in])) $vals[$col] = $data[$in];
        }
        if (isset($data['outOfHoursBehavior']) && in_array($data['outOfHoursBehavior'], ['automated_faq_and_queue', 'polite_closed_notice', 'emergency_ai_only', 'silent_queue'], true)) {
            $vals['out_of_hours_behavior'] = $data['outOfHoursBehavior'];
        }
        $exists = Database::fetchOne('SELECT tenant_id FROM service_settings WHERE tenant_id = :t', ['t' => $tenantId]);
        if ($exists) Database::update('service_settings', $vals, 'tenant_id = :t', ['t' => $tenantId]);
        else Database::insert('service_settings', array_merge(['tenant_id' => $tenantId], $vals));

        // delivery zones replace-all
        if (isset($data['deliveryAreas']) && is_array($data['deliveryAreas'])) {
            Database::delete('delivery_zones', 'tenant_id = :t', ['t' => $tenantId]);
            foreach ($data['deliveryAreas'] as $z) {
                if (!is_array($z) || empty($z['zone'])) continue;
                Database::insert('delivery_zones', [
                    'id' => Util::id('dz'),
                    'tenant_id' => $tenantId,
                    'zone' => $z['zone'],
                    'courier_partner' => $z['courierPartner'] ?? '',
                    'estimated_delivery' => $z['estimatedDelivery'] ?? '',
                    'standard_fee' => Validator::float($z['standardFee'] ?? 0),
                    'cash_on_delivery_available' => Validator::bool($z, 'cashOnDeliveryAvailable', true) ? 1 : 0,
                ]);
            }
        }
        $row = Database::fetchOne('SELECT * FROM service_settings WHERE tenant_id = :t', ['t' => $tenantId]);
        $zones = Database::fetchAll('SELECT * FROM delivery_zones WHERE tenant_id = :t ORDER BY zone', ['t' => $tenantId]);
        Response::json([
            'service' => $row ? self::shapeService($row) : null,
            'deliveryAreas' => array_map([self::class, 'shapeZone'], $zones),
        ]);
    }

    // ---------------------------------------------------------- retention
    public static function retention(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM retention_settings WHERE tenant_id = :t', ['t' => $tenantId]);
        $erasures = Database::fetchAll('SELECT * FROM erasure_requests WHERE tenant_id = :t ORDER BY created_at DESC', ['t' => $tenantId]);
        Response::json([
            'retention' => $row ? self::shapeRetention($row) : null,
            'erasureRequests' => array_map([self::class, 'shapeErasure'], $erasures),
        ]);
    }

    public static function saveRetention(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        $vals = [];
        if (isset($data['retentionWindow']) && in_array($data['retentionWindow'], ['30_days', '90_days', '365_days', 'indefinite'], true)) {
            $vals['retention_window'] = $data['retentionWindow'];
        }
        if (isset($data['autoPurgeCustomerPII'])) $vals['auto_purge_customer_pii'] = Validator::bool($data, 'autoPurgeCustomerPII') ? 1 : 0;
        if (isset($data['autoPurgeVoiceNotes'])) $vals['auto_purge_voice_notes'] = Validator::bool($data, 'autoPurgeVoiceNotes') ? 1 : 0;
        if (isset($data['privacyNoticeUrl'])) $vals['privacy_notice_url'] = $data['privacyNoticeUrl'];
        if (isset($data['dataProcessingAgreementSigned'])) {
            $vals['dpa_signed'] = Validator::bool($data, 'dataProcessingAgreementSigned') ? 1 : 0;
            $vals['dpa_signed_date'] = $vals['dpa_signed'] ? date('Y-m-d') : null;
        }
        $exists = Database::fetchOne('SELECT tenant_id FROM retention_settings WHERE tenant_id = :t', ['t' => $tenantId]);
        if ($exists) Database::update('retention_settings', $vals, 'tenant_id = :t', ['t' => $tenantId]);
        else Database::insert('retention_settings', array_merge(['tenant_id' => $tenantId], $vals));
        $row = Database::fetchOne('SELECT * FROM retention_settings WHERE tenant_id = :t', ['t' => $tenantId]);
        Response::json(['retention' => self::shapeRetention($row)]);
    }

    public static function createErasure(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['customerIdentifier' => 'required']);
        $id = Util::id('era');
        Database::insert('erasure_requests', [
            'id' => $id, 'tenant_id' => $tenantId,
            'customer_identifier' => $data['customerIdentifier'],
            'channel' => in_array(($channelVal = $data['channel'] ?? ''), ['messenger', 'whatsapp'], true) ? $channelVal : 'whatsapp',
            'requested_by' => $ctx->user['name'],
            'verification_hash' => hash('sha256', $data['customerIdentifier'] . microtime()),
        ]);
        Database::run('UPDATE retention_settings SET erasure_requests_count = erasure_requests_count + 1 WHERE tenant_id = :t', ['t' => $tenantId]);
        AuditService::log($tenantId, 'customer_data_erased', 'Erasure request filed', 'Filed erasure request for ' . $data['customerIdentifier'], 'success', ['target' => $id], $ctx->userId(), $req);
        Response::json(['request' => self::shapeErasure(Database::fetchOne('SELECT * FROM erasure_requests WHERE id = :id', ['id' => $id]))], 201);
    }

    public static function completeErasure(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM erasure_requests WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$row) Response::notFound('Request not found');
        $action = (string) $req->input('action', 'complete'); // complete | reject
        $status = $action === 'reject' ? 'rejected' : 'completed';
        $purged = 0;
        if ($status === 'completed') {
            $ident = $row['customer_identifier'];
            // purge matching customer + conversations + messages (PII erasure)
            $custs = Database::fetchAll('SELECT id FROM customers WHERE tenant_id = :t AND (phone LIKE :i OR external_id = :i OR name = :i)', ['t' => $tenantId, 'i' => $ident]);
            foreach ($custs as $c) {
                $purged++;
                Database::delete('customers', 'id = :id', ['id' => $c['id']]);
            }
            Database::run('UPDATE retention_settings SET erasure_requests_count = erasure_requests_count + 1, last_data_export_at = last_data_export_at WHERE tenant_id = :t', ['t' => $tenantId]);
        }
        Database::update('erasure_requests', ['status' => $status, 'records_purged_count' => $purged], 'id = :id', ['id' => $row['id']]);
        AuditService::log($tenantId, 'customer_data_erased', $status === 'completed' ? 'Customer data erased' : 'Erasure rejected', "$status for " . $row['customer_identifier'] . " ($purged records)", 'success', ['target' => $row['id']], $ctx->userId(), $req);
        Response::json(['request' => self::shapeErasure(Database::fetchOne('SELECT * FROM erasure_requests WHERE id = :id', ['id' => $row['id']]))]);
    }

    // ----------------------------------------------- notifications/escalations
    public static function escalationRules(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM escalation_rules WHERE tenant_id = :t ORDER BY created_at', ['t' => $tenantId]);
        Response::json(['rules' => array_map([self::class, 'shapeEscalationRule'], $rows)]);
    }

    public static function saveEscalationRule(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $data = Validator::sanitizePayload($req->all());
        $validTriggers = ['human_attention_requested', 'customer_waiting_timeout', 'channel_disconnected', 'model_rate_limit_429', 'knowledge_index_failure', 'usage_threshold_reached', 'negative_sentiment_complaint'];
        $id = (string) ($data['id'] ?? '');

        $vals = [];
        if (isset($data['name'])) $vals['name'] = $data['name'];
        if (isset($data['description'])) $vals['description'] = $data['description'];
        if (isset($data['triggerType']) && in_array($data['triggerType'], $validTriggers, true)) $vals['trigger_type'] = $data['triggerType'];
        if (isset($data['isEnabled'])) $vals['is_enabled'] = Validator::bool($data, 'isEnabled') ? 1 : 0;
        if (isset($data['thresholdValue'])) $vals['threshold_value'] = $data['thresholdValue'];
        if (isset($data['action']) && in_array($data['action'], ['notify_staff', 'reassign_queue', 'escalate_supervisor', 'page_engineer'], true)) $vals['action'] = $data['action'];
        if (isset($data['assignedRole'])) $vals['assigned_role'] = $data['assignedRole'];
        if (isset($data['notifyChannels']) && is_array($data['notifyChannels'])) {
            $vals['notify_channels'] = Database::json(array_values(array_intersect($data['notifyChannels'], ['in_app', 'email', 'whatsapp', 'webhook'])));
        }

        if ($id !== '' && Database::fetchOne('SELECT id FROM escalation_rules WHERE id = :id AND tenant_id = :t', ['id' => $id, 't' => $tenantId])) {
            Database::update('escalation_rules', $vals, 'id = :id', ['id' => $id]);
        } else {
            $id = Util::id('esc');
            Database::insert('escalation_rules', array_merge(['id' => $id, 'tenant_id' => $tenantId], $vals));
        }
        Response::json(['rule' => self::shapeEscalationRule(Database::fetchOne('SELECT * FROM escalation_rules WHERE id = :id', ['id' => $id]))]);
    }

    public static function notificationPreferences(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM notification_preferences WHERE user_id = :u ORDER BY category', ['u' => $ctx->userId()]);
        if (!$rows) {
            $defaults = [
                ['Conversations', 'New messages, handovers and takeover requests', 1, 0, 1],
                ['System alerts', 'Channel disconnections and integration failures', 1, 1, 0],
                ['Billing & usage', 'Wallet balance, plan limits and invoices', 1, 1, 0],
                ['Knowledge updates', 'Training jobs and indexing results', 0, 0, 0],
            ];
            foreach ($defaults as $d) {
                Database::insert('notification_preferences', [
                    'id' => Util::id('npf'), 'tenant_id' => $tenantId, 'user_id' => $ctx->userId(),
                    'category' => $d[0], 'description' => $d[1], 'in_app' => $d[2], 'email' => $d[3], 'sms_whatsapp' => $d[4],
                ]);
            }
            $rows = Database::fetchAll('SELECT * FROM notification_preferences WHERE user_id = :u ORDER BY category', ['u' => $ctx->userId()]);
        }
        $user=Database::fetchOne('SELECT quiet_hours_enabled,quiet_hours_start,quiet_hours_end FROM users WHERE id=:u',['u'=>$ctx->userId()]);
        Response::json(['preferences' => array_map([self::class, 'shapePreference'], $rows), 'quietHours'=>['enabled'=>(bool)($user['quiet_hours_enabled']??true),'start'=>substr((string)($user['quiet_hours_start']??'23:00'),0,5),'end'=>substr((string)($user['quiet_hours_end']??'07:00'),0,5)]]);
    }

    public static function saveNotificationPreference(Request $req): void
    {
        $ctx = $req->auth;
        $id = (string) $req->input('id', '');
        if ($id === '' && (isset($req->all()['quietHoursEnabled']) || isset($req->all()['quietHoursStart']) || isset($req->all()['quietHoursEnd']))) {
            $input=$req->all(); $update=[];
            if(isset($input['quietHoursEnabled'])) $update['quiet_hours_enabled']=Validator::bool($input,'quietHoursEnabled')?1:0;
            foreach(['quietHoursStart'=>'quiet_hours_start','quietHoursEnd'=>'quiet_hours_end'] as $field=>$column) {
                if(isset($input[$field])) { $time=(string)$input[$field]; if(!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/',$time)) Response::error('Quiet hours must use HH:MM (24 hour time)',422); $update[$column]=$time; }
            }
            Database::update('users',$update,'id=:u',['u'=>$ctx->userId()]);
            Response::json(['ok'=>true]);
        }
        $row = Database::fetchOne('SELECT * FROM notification_preferences WHERE id = :id AND user_id = :u', ['id' => $id, 'u' => $ctx->userId()]);
        if (!$row) Response::notFound('Preference not found');
        $update = [];
        if (isset($req->all()['inApp'])) $update['in_app'] = Validator::bool($req->all(), 'inApp') ? 1 : 0;
        if (isset($req->all()['email'])) $update['email'] = Validator::bool($req->all(), 'email') ? 1 : 0;
        if (isset($req->all()['smsWhatsapp'])) $update['sms_whatsapp'] = Validator::bool($req->all(), 'smsWhatsapp') ? 1 : 0;
        Database::update('notification_preferences', $update, 'id = :id', ['id' => $id]);
        Response::json(['preference' => self::shapePreference(Database::fetchOne('SELECT * FROM notification_preferences WHERE id = :id', ['id' => $id]))]);
    }

    public static function notifications(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $limit = min(200, Validator::int($req->q('limit'), 100));
        $rows = Database::fetchAll(
            'SELECT * FROM notifications WHERE tenant_id = :t AND (user_id IS NULL OR user_id = :u) ORDER BY created_at DESC LIMIT ' . $limit,
            ['t' => $tenantId, 'u' => $ctx->userId()]
        );
        Response::json([
            'notifications' => array_map([self::class, 'shapeNotification'], $rows),
            'unreadCount' => count(array_filter($rows, fn($r) => !(int) $r['is_read'])),
        ]);
    }

    public static function markNotificationRead(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        Database::update('notifications', ['is_read' => 1], 'id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        Response::json(['ok' => true]);
    }

    public static function markAllRead(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        Database::update('notifications', ['is_read' => 1], 'tenant_id = :t', ['t' => $tenantId]);
        Response::json(['ok' => true]);
    }

    // ----------------------------------------------------------- audit logs
    public static function auditLogs(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $limit = min(500, Validator::int($req->q('limit'), 150));
        $actionType = (string) $req->q('actionType', '');
        $outcome = (string) $req->q('outcome', '');

        $where = ['tenant_id = :t'];
        $params = ['t' => $tenantId];
        if ($actionType !== '') { $where[] = 'action_type = :at'; $params['at'] = $actionType; }
        if ($outcome !== '') { $where[] = 'outcome = :oc'; $params['oc'] = $outcome; }

        $rows = Database::fetchAll(
            'SELECT * FROM audit_logs WHERE ' . implode(' AND ', $where) . ' ORDER BY created_at DESC LIMIT ' . $limit, $params);
        Response::json(['logs' => array_map([self::class, 'shapeAuditLog'], $rows)]);
    }

    // --------------------------------------------------------------- shapes
    public static function shapeProfile(array $r): array
    {
        return [
            'businessName' => $r['business_name'],
            'industry' => $r['industry'],
            'businessDescription' => $r['business_description'],
            'website' => $r['website'],
            'contactPhone' => $r['contact_phone'],
            'supportEmail' => $r['support_email'],
            'businessHoursStart' => $r['business_hours_start'],
            'businessHoursEnd' => $r['business_hours_end'],
            'timeZone' => $r['time_zone'],
            'operatingLocations' => Database::decodeJson($r['operating_locations']) ?: [],
        ];
    }

    public static function shapeService(array $r): array
    {
        return [
            'customerSupportHours' => $r['customer_support_hours'],
            'escalationSupervisorName' => $r['escalation_supervisor_name'],
            'escalationSupervisorEmail' => $r['escalation_supervisor_email'],
            'escalationSupervisorPhone' => $r['escalation_supervisor_phone'],
            'supportPhone' => $r['support_phone'],
            'supportEmail' => $r['support_email'],
            'outOfHoursBehavior' => $r['out_of_hours_behavior'],
            'defaultGreetingMessage' => $r['default_greeting_message'],
            'outOfHoursMessage' => $r['out_of_hours_message'],
        ];
    }

    public static function shapeZone(array $z): array
    {
        return [
            'id' => $z['id'],
            'zone' => $z['zone'],
            'courierPartner' => $z['courier_partner'],
            'estimatedDelivery' => $z['estimated_delivery'],
            'standardFee' => (float) $z['standard_fee'],
            'cashOnDeliveryAvailable' => (bool) $z['cash_on_delivery_available'],
        ];
    }

    public static function shapeRetention(array $r): array
    {
        return [
            'retentionWindow' => $r['retention_window'],
            'autoPurgeCustomerPII' => (bool) $r['auto_purge_customer_pii'],
            'autoPurgeVoiceNotes' => (bool) $r['auto_purge_voice_notes'],
            'privacyNoticeUrl' => $r['privacy_notice_url'],
            'dataProcessingAgreementSigned' => (bool) $r['dpa_signed'],
            'dpaSignedDate' => $r['dpa_signed_date'],
            'erasureRequestsCount' => (int) $r['erasure_requests_count'],
            'lastDataExportTimestamp' => Util::ts($r['last_data_export_at']),
        ];
    }

    public static function shapeErasure(array $e): array
    {
        return [
            'id' => $e['id'],
            'customerIdentifier' => $e['customer_identifier'],
            'channel' => $e['channel'],
            'requestedAt' => Util::ts($e['created_at']),
            'status' => $e['status'],
            'recordsPurgedCount' => (int) $e['records_purged_count'],
            'requestedBy' => $e['requested_by'],
            'verificationHash' => $e['verification_hash'],
        ];
    }

    public static function shapeEscalationRule(array $r): array
    {
        return [
            'id' => $r['id'],
            'triggerType' => $r['trigger_type'],
            'name' => $r['name'],
            'description' => $r['description'],
            'isEnabled' => (bool) $r['is_enabled'],
            'thresholdValue' => $r['threshold_value'],
            'action' => $r['action'],
            'notifyChannels' => Database::decodeJson($r['notify_channels']) ?: [],
            'assignedRole' => $r['assigned_role'],
        ];
    }

    public static function shapePreference(array $p): array
    {
        return [
            'id' => $p['id'],
            'category' => $p['category'],
            'description' => $p['description'],
            'inApp' => (bool) $p['in_app'],
            'email' => (bool) $p['email'],
            'smsWhatsapp' => (bool) $p['sms_whatsapp'],
        ];
    }

    public static function shapeNotification(array $n): array
    {
        return [
            'id' => $n['id'],
            'title' => $n['title'],
            'message' => $n['message'],
            'type' => $n['type'],
            'timestamp' => Util::ts($n['created_at']),
            'isRead' => (bool) $n['is_read'],
            'sourceModule' => $n['source_module'],
            'actionUrl' => $n['action_url'],
        ];
    }

    public static function shapeAuditLog(array $a): array
    {
        return [
            'id' => $a['id'],
            'timestamp' => Util::ts($a['created_at']),
            'actor' => [
                'name' => $a['actor_name'],
                'email' => $a['actor_email'],
                'role' => $a['actor_role'],
                'ipAddress' => $a['ip_address'],
            ],
            'actionType' => $a['action_type'],
            'actionTitle' => $a['action_title'],
            'description' => $a['description'],
            'outcome' => $a['outcome'],
            'correlationId' => $a['correlation_id'],
            'sanitizedMetadata' => Database::decodeJson($a['sanitized_metadata']) ?: [],
            'targetResource' => $a['target_resource'],
        ];
    }
}
