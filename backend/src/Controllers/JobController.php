<?php
declare(strict_types=1);

/** Job introspection endpoints (platform admin) — worker does the heavy lifting. */
final class JobController
{
    public static function listJobs(Request $req): void
    {
        $status = (string) $req->q('status', '');
        $limit = min(200, Validator::int($req->q('limit'), 50));
        $where = $status !== '' && in_array($status, ['pending', 'running', 'completed', 'failed', 'dead'], true)
            ? "WHERE status = '$status'" : '';
        $rows = Database::fetchAll("SELECT * FROM jobs $where ORDER BY created_at DESC LIMIT $limit");
        Response::json(['jobs' => array_map(fn($j) => [
            'id' => $j['id'],
            'tenantId' => $j['tenant_id'],
            'kind' => $j['kind'],
            'status' => $j['status'],
            'attempts' => (int) $j['attempts'],
            'error' => $j['error_message'],
            'createdAt' => Util::ts($j['created_at']),
            'finishedAt' => Util::ts($j['finished_at']),
        ], $rows)]);
    }

    public static function getJob(Request $req): void
    {
        $row = Database::fetchOne('SELECT * FROM jobs WHERE id = :id', ['id' => $req->params['id']]);
        if (!$row) Response::notFound('Job not found');
        Response::json(['job' => [
            'id' => $row['id'],
            'tenantId' => $row['tenant_id'],
            'kind' => $row['kind'],
            'status' => $row['status'],
            'payload' => Database::decodeJson($row['payload']),
            'result' => Database::decodeJson($row['result']),
            'attempts' => (int) $row['attempts'],
            'error' => $row['error_message'],
            'createdAt' => Util::ts($row['created_at']),
        ]]);
    }

    public static function enqueue(Request $req): void
    {
        $data = $req->all();
        Validator::validateOrFail($data, ['kind' => 'required']);
        $kinds = ['process_message', 'reindex_document', 'deliver_delayed_reply', 'sync_integration', 'follow_up_message', 'training_job'];
        if (!in_array((string) $data['kind'], $kinds, true)) Response::error('Unknown job kind', 422);
        $id = JobDispatcher::dispatch(
            (string) $data['kind'],
            (array) ($data['payload'] ?? []),
            isset($data['tenantId']) ? (string) $data['tenantId'] : null,
            3
        );
        Response::json(['jobId' => $id], 201);
    }
}
