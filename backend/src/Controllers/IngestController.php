<?php
declare(strict_types=1);

/**
 * Public ingest API for tenant systems (brand API key auth):
 * POST /ingest/message  — runs the full AI pipeline
 * POST /ingest/batch    — up to 25 messages
 */
final class IngestController
{
    private static function tenantFromKey(Request $req): array
    {
        $key = $req->apiKey();
        if (!$key) Response::unauthorized('Missing X-Api-Key');
        $hash = AuthService::hashToken($key);
        $row = Database::fetchOne(
            'SELECT k.*, t.id AS tid, t.status AS tenant_status FROM tenant_api_keys k
             JOIN tenants t ON t.id = k.tenant_id
             WHERE k.key_hash = :h AND k.is_active = 1 LIMIT 1', ['h' => $hash]);
        if (!$row) Response::unauthorized('Invalid API key');
        if ($row['tenant_status'] !== 'active') Response::forbidden('Tenant is suspended');
        Database::update('tenant_api_keys', ['last_used_at' => Database::now()], 'id = :id', ['id' => $row['id']]);
        return ['tenantId' => $row['tid']];
    }

    public static function message(Request $req): void
    {
        $t = self::tenantFromKey($req);
        $data = Validator::sanitizePayload($req->all());
        Validator::validateOrFail($data, ['text' => 'required']);

        $payload = [
            'channel' => ($data['channel'] ?? 'whatsapp') === 'messenger' ? 'messenger' : 'whatsapp',
            'text' => (string) $data['text'],
            'externalMessageId' => $data['externalMessageId'] ?? null,
            'customerExternalId' => $data['customerExternalId'] ?? null,
            'customerPhone' => $data['customerPhone'] ?? null,
            'customerName' => $data['customerName'] ?? null,
            'customerEmail' => $data['customerEmail'] ?? null,
            'customerCity' => $data['customerCity'] ?? null,
            'senderName' => $data['senderName'] ?? ($data['customerName'] ?? 'Customer'),
            'language' => $data['language'] ?? null,
            'attachments' => $data['attachments'] ?? [],
        ];
        try {
            $result = Orchestrator::processInbound($t['tenantId'], $payload);
            Response::json($result, 200);
        } catch (Throwable $e) {
            // Record the failure for diagnostics
            Database::insert('webhook_events', [
                'id' => Util::id('we'),
                'tenant_id' => $t['tenantId'],
                'correlation_id' => Util::correlationId(),
                'channel' => ($payload['channel'] ?? 'whatsapp') === 'messenger' ? 'messenger' : 'whatsapp',
                'event_type' => 'ingest_message',
                'status' => 'failed',
                'error_message' => mb_substr($e->getMessage(), 0, 500),
                'sanitized_summary' => 'Ingest failed: ' . mb_substr($e->getMessage(), 0, 200),
            ]);
            Response::error('Processing failed: ' . $e->getMessage(), 500);
        }
    }

    public static function batch(Request $req): void
    {
        $t = self::tenantFromKey($req);
        $items = (array) $req->input('messages', []);
        if (count($items) > 25) Response::error('Batch limited to 25 messages', 422);
        $out = [];
        foreach ($items as $item) {
            if (!is_array($item) || empty($item['text'])) {
                $out[] = ['error' => 'Missing text'];
                continue;
            }
            $out[] = Orchestrator::processInbound($t['tenantId'], array_merge([
                'channel' => 'whatsapp', 'senderName' => 'Customer',
            ], $item));
        }
        Response::json(['results' => $out]);
    }

    /** GET /ingest/health?key= — verify key validity. */
    public static function health(Request $req): void
    {
        $t = self::tenantFromKey($req);
        $tenant = Database::fetchOne('SELECT business_name FROM tenants WHERE id = :id', ['id' => $t['tenantId']]);
        Response::json(['ok' => true, 'tenant' => $tenant['business_name']]);
    }
}
