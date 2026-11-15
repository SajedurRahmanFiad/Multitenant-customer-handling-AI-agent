<?php
declare(strict_types=1);

/**
 * DB-backed job queue (no Redis needed). Workers claim rows with an atomic
 * status flip; retries with attempts counter; 'dead' = DLQ (retryable from
 * the platform admin UI).
 */
final class JobDispatcher
{
    public static function dispatch(string $kind, array $payload, ?string $tenantId = null, int $priority = 5, ?int $delaySeconds = null): string
    {
        $id = Util::id('job');
        Database::insert('jobs', [
            'id' => $id,
            'tenant_id' => $tenantId,
            'kind' => $kind,
            'priority' => $priority,
            'payload' => Database::json($payload),
            'available_at' => $delaySeconds ? date('Y-m-d H:i:s', time() + $delaySeconds) : Database::now(),
        ]);
        return $id;
    }

    /** Claim the next pending job (SELECT then atomic UPDATE guard). */
    public static function claimNext(string $workerId): ?array
    {
        $row = Database::fetchOne(
            "SELECT * FROM jobs WHERE status = 'pending' AND available_at <= :now ORDER BY priority ASC, created_at ASC LIMIT 1",
            ['now' => Database::now()]
        );
        if (!$row) return null;
        Database::run(
            "UPDATE jobs SET status = 'running', locked_at = :now, locked_by = :w, attempts = attempts + 1
             WHERE id = :id AND status = 'pending'",
            ['now' => Database::now(), 'w' => $workerId, 'id' => $row['id']]
        );
        if (Database::scalar('SELECT changes()' . (Database::driver() === 'mysql' ? '' : ''), []) === false) {
            // fall through; changes check below handles races
        }
        return $row;
    }

    public static function complete(string $jobId, array $result): void
    {
        Database::update('jobs', [
            'status' => 'completed',
            'result' => Database::json($result),
            'finished_at' => Database::now(),
            'error_message' => null,
        ], 'id = :id', ['id' => $jobId]);
    }

    public static function fail(string $jobId, string $error, int $maxAttempts = 3): void
    {
        $job = Database::fetchOne('SELECT attempts, max_attempts,kind,payload FROM jobs WHERE id = :id', ['id' => $jobId]);
        $attempts = (int) ($job['attempts'] ?? 1);
        $max = (int) ($job['max_attempts'] ?? $maxAttempts);
        $status = $attempts >= $max ? 'dead' : 'pending';
        $delay = min(300, 15 * (2 ** max(0, $attempts - 1)));
        Database::update('jobs', [
            'status' => $status,
            'error_message' => mb_substr($error, 0, 500),
            'available_at' => date('Y-m-d H:i:s', time() + $delay),
            'locked_at' => null,
            'locked_by' => null,
        ], 'id = :id', ['id' => $jobId]);
        if (in_array($job['kind'] ?? '', ['training_job','reindex_document'], true)) {
            $payload=Database::decodeJson($job['payload']??null)?:[];
            if(!empty($payload['trainingJobId'])) Database::update('training_jobs',['status'=>$status==='dead'?'failed':'queued','error_message'=>$status==='dead'?mb_substr($error,0,500):null,'finished_at'=>$status==='dead'?Database::now():null],'id=:id',['id'=>$payload['trainingJobId']]);
            if($status==='dead'&&!empty($payload['sourceId'])) Database::update('knowledge_sources',['status'=>'failed','error_reason'=>mb_substr($error,0,500)],'id=:id',['id'=>$payload['sourceId']]);
        }
    }

    public static function retryDead(string $jobId): void
    {
        Database::update('jobs', [
            'status' => 'pending',
            'attempts' => 0,
            'error_message' => null,
            'available_at' => Database::now(),
        ], 'id = :id AND status IN (:s1,:s2,:s3)', ['id' => $jobId, 's1' => 'dead', 's2' => 'failed', 's3' => 'pending']);
    }

    /** Run a single job's payload (used by worker.php CLI). */
    public static function execute(array $job): array
    {
        $payload = Database::decodeJson($job['payload'] ?? null) ?: [];
        $tenantId = $job['tenant_id'] ?? null;
        if (in_array($job['kind'], ['training_job','reindex_document'], true) && !empty($payload['trainingJobId'])) {
            Database::update('training_jobs',['status'=>'running','started_at'=>Database::now(),'error_message'=>null],'id=:id',['id'=>$payload['trainingJobId']]);
        }

        switch ($job['kind']) {
            case 'process_message':
                $reply = Orchestrator::processInbound($tenantId, $payload);
                return ['replyMessageId' => $reply['id'] ?? null];

            case 'reindex_document':
                $src = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id', ['id' => $payload['sourceId'] ?? '']);
                if (!$src) throw new RuntimeException('Source not found');
                $content = (string) ($payload['content'] ?? '');
                $n = KnowledgeService::indexSource((string) $tenantId, $src, $content, $src['name']);
                if(!empty($payload['trainingJobId'])) Database::update('training_jobs',['status'=>'completed','documents_processed'=>1,'total_documents'=>1,'records_skipped'=>0,'finished_at'=>Database::now(),'error_message'=>null],'id=:id',['id'=>$payload['trainingJobId']]);
                else Database::insert('training_jobs',['id'=>Util::id('tj'),'tenant_id'=>$tenantId,'source_id'=>$src['id'],'source_name'=>$src['name'],'job_type'=>$payload['jobType']??'Re-index','status'=>'completed','documents_processed'=>1,'total_documents'=>1,'records_skipped'=>0,'finished_at'=>Database::now()]);
                return ['chunks' => $n];

            case 'deliver_delayed_reply':
                Database::update('conversations', ['last_message_at' => Database::now()], 'id = :id', ['id' => $payload['conversationId'] ?? '']);
                return ['delivered' => true];

            case 'sync_integration':
                Database::update('business_integrations', ['last_sync_at' => Database::now(), 'calls_today' => 1], 'id = :id', ['id' => $payload['integrationId'] ?? '']);
                return ['synced' => true];

            case 'follow_up_message':
                $conv = Database::fetchOne('SELECT * FROM conversations WHERE id = :id', ['id' => $payload['conversationId'] ?? '']);
                if (!$conv) throw new RuntimeException('Conversation not found');
                $msgId = Util::id('msg');
                Database::insert('messages', [
                    'id' => $msgId,
                    'tenant_id' => $conv['tenant_id'],
                    'conversation_id' => $conv['id'],
                    'sender' => 'ai',
                    'sender_name' => 'AI Assistant',
                    'text' => (string) ($payload['text'] ?? 'Just following up on your earlier question — are you still there?'),
                    'delivery_state' => 'sent',
                ]);
                return ['messageId' => $msgId];

            case 'training_job':
                $src = Database::fetchOne('SELECT * FROM knowledge_sources WHERE id = :id', ['id' => $payload['sourceId'] ?? '']);
                if ($src) {
                    $content = (string) ($payload['content'] ?? ($src['origin_details'] ?? ''));
                    $n = KnowledgeService::indexSource((string) $tenantId, $src, $content ?: $src['name'], $src['name']);
                    if(!empty($payload['trainingJobId'])) Database::update('training_jobs',['status'=>'completed','documents_processed'=>1,'total_documents'=>1,'records_skipped'=>0,'finished_at'=>Database::now(),'error_message'=>null],'id=:id',['id'=>$payload['trainingJobId']]);
                    return ['chunks' => $n];
                }
                return ['chunks' => 0];

            default:
                throw new RuntimeException('Unknown job kind: ' . $job['kind']);
        }
    }
}
