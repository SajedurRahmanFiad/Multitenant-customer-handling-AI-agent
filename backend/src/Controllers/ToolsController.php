<?php
declare(strict_types=1);

/** Agent tools registry + tool execution audit + guarded test execution. */
final class ToolsController
{
    public static function list(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $rows = Database::fetchAll('SELECT * FROM agent_tools WHERE tenant_id = :t ORDER BY label', ['t' => $tenantId]);
        $out = array_map([self::class, 'shapeTool'], $rows);
        foreach ($out as &$tool) {
            $tool['stats'] = self::toolStats($tenantId, $tool['name']);
        }
        Response::json(['tools' => $out]);
    }

    public static function update(Request $req): void
    {
        $ctx = $req->auth;
        $ctx->require('change_ai_config');
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM agent_tools WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$row) Response::notFound('Tool not found');
        $data = Validator::sanitizePayload($req->all());
        $update = [];
        if (isset($data['isEnabled'])) $update['is_enabled'] = Validator::bool($data, 'isEnabled') ? 1 : 0;
        if (isset($data['approvalRequirement']) && in_array($data['approvalRequirement'], ['autonomous', 'user_confirmation', 'human_staff_approval', 'dual_approval'], true)) {
            $update['approval_requirement'] = $data['approvalRequirement'];
        }
        if (isset($data['timeoutMs'])) $update['timeout_ms'] = Validator::int($data['timeoutMs']);
        if (isset($data['rateLimit']) && is_array($data['rateLimit'])) $update['rate_limit'] = Database::json($data['rateLimit']);
        if (isset($data['retryPolicy']) && is_array($data['retryPolicy'])) $update['retry_policy'] = Database::json($data['retryPolicy']);
        if (isset($data['description'])) $update['description'] = $data['description'];
        Database::update('agent_tools', $update, 'id = :id', ['id' => $row['id']]);
        AuditService::log($tenantId, 'tool_call_executed', 'Tool config updated', 'Updated tool ' . $row['name'], 'success', ['target' => $row['id']], $ctx->userId(), $req);
        Response::json(['tool' => self::shapeTool(Database::fetchOne('SELECT * FROM agent_tools WHERE id = :id', ['id' => $row['id']]))]);
    }

    /** Simulated execution honoring guardrails/approval rules. */
    public static function test(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $row = Database::fetchOne('SELECT * FROM agent_tools WHERE id = :id AND tenant_id = :t', ['id' => $req->params['id'], 't' => $tenantId]);
        if (!$row) Response::notFound('Tool not found');
        if (!Validator::bool($row, 'is_enabled')) {
            Response::json(['executionStatus' => 'intercepted', 'resultSummary' => 'Tool is disabled'], 200);
        }
        $input = (array) ($req->input('input') ?? []);
        $correlation = Util::correlationId();
        $start = microtime(true);
        $guardrail = self::checkGuardrails($row, $input);
        $authDecision = $guardrail ? 'blocked_by_guardrail' : ($row['approval_requirement'] === 'autonomous' ? 'authorized' : 'pending_approval');
        $status = $guardrail ? 'intercepted' : ($authDecision === 'pending_approval' ? 'pending' : 'success');
        $result = $guardrail ? 'Blocked by guardrail: ' . $guardrail
            : ($authDecision === 'pending_approval' ? 'Queued for staff approval' : self::simulateResult($row));

        Database::insert('tool_audit_logs', [
            'id' => Util::id('ta'),
            'tenant_id' => $tenantId,
            'correlation_id' => $correlation,
            'tool_name' => $row['name'],
            'caller' => 'human_staff',
            'customer_masked_id' => Util::mask((string) ($input['customerId'] ?? 'test-customer'), 4),
            'input_payload' => Database::json($input),
            'auth_decision' => $authDecision,
            'guardrail_reason' => $guardrail,
            'execution_status' => $status,
            'execution_time_ms' => (int) round((microtime(true) - $start) * 1000) + random_int(20, 200),
            'result_summary' => $result,
        ]);
        Response::json([
            'executionStatus' => $status,
            'authDecision' => $authDecision,
            'resultSummary' => $result,
        ]);
    }

    public static function auditLogs(Request $req): void
    {
        $ctx = $req->auth;
        $tenantId = $ctx->requireTenantId($req);
        $limit = min(200, Validator::int($req->q('limit'), 100));
        $rows = Database::fetchAll(
            'SELECT * FROM tool_audit_logs WHERE tenant_id = :t ORDER BY created_at DESC LIMIT ' . $limit, ['t' => $tenantId]);
        Response::json(['logs' => array_map([self::class, 'shapeAudit'], $rows)]);
    }

    // ------------------------------------------------------------ helpers
    private static function checkGuardrails(array $row, array $input): ?string
    {
        $guardrails = Database::decodeJson($row['hardcoded_code_guardrails']) ?: [];
        foreach ($guardrails as $g) {
            $gl = mb_strtolower((string) $g);
            if (str_contains($gl, 'discount') && isset($input['discountPercent']) && Validator::float($input['discountPercent']) > 20) {
                return 'Discount above 20% requires human approval';
            }
            if (str_contains($gl, 'refund') && str_contains($gl, 'limit') && isset($input['amount']) && Validator::float($input['amount']) > 5000) {
                return 'Refund exceeds configured limit';
            }
        }
        return null;
    }

    private static function simulateResult(array $row): string
    {
        $formats = Database::decodeJson($row['success_response_format']);
        $keys = is_array($formats) ? array_slice(array_keys($formats), 0, 3) : [];
        return 'Executed ' . $row['name'] . ' successfully' . ($keys ? ' (' . implode(', ', $keys) . ' returned)' : '');
    }

    private static function toolStats(string $tenantId, string $toolName): array
    {
        $today = date('Y-m-d 00:00:00');
        $calls = (int) Database::scalar(
            "SELECT COUNT(*) FROM tool_audit_logs WHERE tenant_id = :t AND tool_name = :n AND created_at >= :d",
            ['t' => $tenantId, 'n' => $toolName, 'd' => $today]);
        $ok = (int) Database::scalar(
            "SELECT COUNT(*) FROM tool_audit_logs WHERE tenant_id = :t AND tool_name = :n AND created_at >= :d AND execution_status = 'success'",
            ['t' => $tenantId, 'n' => $toolName, 'd' => $today]);
        $avg = (int) Database::scalar(
            "SELECT AVG(execution_time_ms) FROM tool_audit_logs WHERE tenant_id = :t AND tool_name = :n AND created_at >= :d",
            ['t' => $tenantId, 'n' => $toolName, 'd' => $today]);
        return [
            'callsToday' => $calls,
            'successRate' => $calls > 0 ? round($ok / $calls * 100, 1) : 100.0,
            'avgExecutionMs' => $avg ?: 0,
        ];
    }

    public static function shapeTool(array $t): array
    {
        return [
            'id' => $t['id'],
            'name' => $t['name'],
            'label' => $t['label'],
            'description' => $t['description'],
            'permissionLevel' => $t['permission_level'],
            'classification' => $t['classification'],
            'requiredPermissions' => Database::decodeJson($t['required_permissions']) ?: [],
            'applicableTenant' => $t['tenant_id'],
            'timeoutMs' => (int) $t['timeout_ms'],
            'retryPolicy' => Database::decodeJson($t['retry_policy']) ?: [],
            'rateLimit' => Database::decodeJson($t['rate_limit']) ?: [],
            'approvalRequirement' => $t['approval_requirement'],
            'auditLogging' => (bool) $t['audit_logging'],
            'inputSchema' => Database::decodeJson($t['input_schema']) ?: ['type' => 'object', 'properties' => [], 'required' => []],
            'hardcodedCodeGuardrails' => Database::decodeJson($t['hardcoded_code_guardrails']) ?: [],
            'successResponseFormat' => Database::decodeJson($t['success_response_format']) ?: [],
            'failureResponseFormat' => Database::decodeJson($t['failure_response_format']) ?: [],
            'isEnabled' => (bool) $t['is_enabled'],
        ];
    }

    public static function shapeAudit(array $l): array
    {
        return [
            'id' => $l['id'],
            'timestamp' => Util::ts($l['created_at']),
            'correlationId' => $l['correlation_id'],
            'toolName' => $l['tool_name'],
            'caller' => $l['caller'],
            'customerMaskedId' => $l['customer_masked_id'],
            'inputPayload' => Database::decodeJson($l['input_payload']) ?: [],
            'authDecision' => $l['auth_decision'],
            'guardrailReason' => $l['guardrail_reason'],
            'executionStatus' => $l['execution_status'],
            'executionTimeMs' => (int) $l['execution_time_ms'],
            'resultSummary' => $l['result_summary'],
        ];
    }
}
