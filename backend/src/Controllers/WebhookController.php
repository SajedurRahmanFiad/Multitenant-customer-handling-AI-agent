<?php
declare(strict_types=1);

/**
 * Public webhook receivers (Messenger / WhatsApp / custom integrations).
 * Normalizes provider payloads into the same inbound pipeline.
 */
final class WebhookController
{
    public static function verifyMessenger(Request $req): void
    {
        $mode = (string) $req->q('hub_mode');
        $token = (string) $req->q('hub_verify_token');
        $challenge = (string) $req->q('hub_challenge');
        $expected = (string) Config::get('MESSENGER_VERIFY_TOKEN', 'changeme');
        if ($mode === 'subscribe' && hash_equals($expected, $token)) {
            header('Content-Type: text/plain');
            echo $challenge;
            exit;
        }
        Response::error('Verification failed', 403);
    }

    public static function receiveMessenger(Request $req): void
    {
        $body = $req->all();
        $entry = $body['entry'][0] ?? null;
        if (!$entry) { self::accept('messenger', 'ignored', null); }

        $pageId = (string) ($entry['id'] ?? '');
        $messaging = $entry['messaging'][0] ?? null;
        if (!$messaging) { self::accept('messenger', 'non_message_event', $body); }

        $senderId = (string) ($messaging['sender']['id'] ?? '');
        $text = (string) ($messaging['message']['text'] ?? '');
        $mid = (string) ($messaging['message']['mid'] ?? '');

        $conn = Database::fetchOne(
            "SELECT tenant_id, status FROM messenger_connections WHERE page_id = :p AND status = 'connected'",
            ['p' => $pageId]);
        if (!$conn) { self::accept('messenger', 'unknown_page', $body); }

        self::accept('messenger', 'message', [
            'tenant_id' => $conn['tenant_id'],
            'payload' => [
                'channel' => 'messenger',
                'text' => $text,
                'externalMessageId' => $mid ?: null,
                'customerExternalId' => 'fb_' . $senderId,
                'senderName' => 'Messenger Customer',
            ],
            'senderMasked' => 'fb_' . Util::mask($senderId, 3),
        ], $body);
    }

    public static function verifyWhatsapp(Request $req): void
    {
        self::verifyMessenger($req);
    }

    public static function receiveWhatsapp(Request $req): void
    {
        $body = $req->all();
        $entry = $body['entry'][0] ?? null;
        $change = $entry['changes'][0]['value'] ?? null;
        if (!$change) { self::accept('whatsapp', 'ignored', null); }

        $phoneId = (string) ($change['metadata']['phone_number_id'] ?? '');
        $messages = $change['messages'] ?? [];
        if ($messages === []) { self::accept('whatsapp', 'status_update', $body); }

        $conn = Database::fetchOne(
            "SELECT tenant_id FROM whatsapp_connections WHERE phone_number_id = :p AND status = 'connected'",
            ['p' => $phoneId]);
        if (!$conn) { self::accept('whatsapp', 'unknown_number', $body); }

        foreach (array_slice($messages, 0, 5) as $m) {
            $from = (string) ($m['from'] ?? '');
            $text = (string) ($m['text']['body'] ?? '');
            $type = (string) ($m['type'] ?? 'text');
            if ($text === '' && $type !== 'text') $text = "[Customer sent a $type message]";
            self::accept('whatsapp', $type, [
                'tenant_id' => $conn['tenant_id'],
                'payload' => [
                    'channel' => 'whatsapp',
                    'text' => $text,
                    'externalMessageId' => (string) ($m['id'] ?? ''),
                    'customerExternalId' => 'wa_' . preg_replace('/\D/', '', $from),
                    'customerPhone' => $from,
                    'senderName' => 'WhatsApp Customer',
                ],
                'senderMasked' => Util::mask($from, 3),
            ], $body);
        }
    }

    /** Custom integration webhooks (woocommerce, steadfast, ...). */
    public static function receiveCustom(Request $req): void
    {
        $channel = $req->params['channel'];
        $body = $req->all();
        $event = (string) ($body['event'] ?? $req->header('x-event', 'custom_event'));

        // HMAC validation when configured
        $secret = (string) Config::get("WEBHOOK_SECRET_{$channel}", '');
        if ($secret !== '') {
            $sig = $req->header('x-signature') ?? '';
            $raw = file_get_contents('php://input');
            if (!hash_equals(hash_hmac('sha256', $raw, $secret), $sig)) {
                self::accept($channel === 'woocommerce' || $channel === 'steadfast' ? $channel : 'woocommerce', 'invalid_signature', $body);
                return;
            }
        }

        // order updates can feed customer context
        if ($event === 'order.created' || $event === 'order.updated') {
            $order = $body['data'] ?? $body;
            $phone = (string) ($order['phone'] ?? $order['customer']['phone'] ?? '');
            if ($phone !== '') {
                $tenant = Database::fetchOne(
                    'SELECT t.id FROM tenants t WHERE t.status = :s LIMIT 1', ['s' => 'active']);
                if ($tenant) {
                    Database::insert('customer_orders', [
                        'id' => Util::id('ord'),
                        'tenant_id' => $tenant['id'],
                        'customer_id' => self::ensureCustomer($tenant['id'], $phone, (string) ($order['customer']['name'] ?? 'Customer')),
                        'external_order_id' => (string) ($order['id'] ?? $order['number'] ?? 'unknown'),
                        'items' => mb_substr((string) ($order['items_summary'] ?? 'Order items'), 0, 250),
                        'amount' => Validator::float($order['total'] ?? 0),
                        'status' => (string) ($order['status'] ?? 'processing'),
                        'ordered_at' => Database::now(),
                    ]);
                }
            }
        }

        self::accept(in_array($channel, ['woocommerce', 'steadfast'], true) ? $channel : 'woocommerce', $event, $body);
    }

    private static function ensureCustomer(string $tenantId, string $phone, string $name): string
    {
        $ext = 'wa_' . preg_replace('/\D/', '', $phone);
        $row = Database::fetchOne('SELECT id FROM customers WHERE tenant_id = :t AND external_id = :e', ['t' => $tenantId, 'e' => $ext]);
        if ($row) return $row['id'];
        $id = Util::id('cst');
        Database::insert('customers', [
            'id' => $id, 'tenant_id' => $tenantId, 'name' => $name, 'phone' => $phone,
            'external_id' => $ext, 'channel' => 'whatsapp',
        ]);
        return $id;
    }

    /** Log the event, then either process inline or queue. */
    private static function accept(string $channel, string $eventType, ?array $info, ?array $raw = null): void
    {
        $startedAt = microtime(true);
        $tenantId = $info['tenant_id'] ?? null;
        $payload = $info['payload'] ?? null;
        $correlation = Util::correlationId();

        $status = 'received';
        $errorMsg = null;
        $result = null;

        if ($tenantId && $payload) {
            // Dedup at events level is handled by messages.external_message_id; queue the job.
            $jobId = JobDispatcher::dispatch('process_message', $payload, $tenantId, 2);
            // Try inline processing first (fast path); worker.php picks up leftovers.
            try {
                $result = Orchestrator::processInbound($tenantId, $payload);
                $status = $result['duplicate'] ?? false ? 'duplicate_ignored' : 'processed';
                JobDispatcher::complete($jobId, ['inline' => true]);
            } catch (Throwable $e) {
                $status = 'failed';
                $errorMsg = $e->getMessage();
                // leave job for retry by worker
            }
        }

        Database::insert('webhook_events', [
            'id' => Util::id('we'),
            'tenant_id' => $tenantId,
            'correlation_id' => $correlation,
            'channel' => in_array($channel, ['messenger', 'whatsapp', 'woocommerce', 'steadfast'], true) ? $channel : 'messenger',
            'event_type' => $eventType,
            'sender_id_masked' => $info['senderMasked'] ?? null,
            'status' => $status,
            'retry_count' => $status === 'failed' ? 1 : 0,
            'latency_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            'error_message' => $errorMsg ? mb_substr($errorMsg, 0, 500) : null,
            'sanitized_summary' => self::summary($eventType, $payload),
            'raw_payload' => Database::json(self::redact($raw ?? $payload)),
        ]);
        if ($status === 'failed') Response::error('Webhook processing failed', 500);
        Response::json(['ok' => true, 'status' => $status, 'correlationId' => $correlation, 'result' => $result]);
    }

    private static function summary(string $eventType, ?array $payload): string
    {
        if (!$payload) return "Event $eventType received";
        return "Event $eventType from " . ($payload['channel'] ?? 'unknown') . ' — ' . mb_substr((string) ($payload['text'] ?? ''), 0, 80);
    }

    private static function redact(array $data): array
    {
        array_walk_recursive($data, function (&$v, $k) {
            if (is_string($k) && preg_match('/token|phone|email|secret|key/i', $k)) {
                $v = Util::mask($v, 3);
            }
        });
        return $data;
    }
}
