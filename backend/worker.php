<?php
declare(strict_types=1);

/**
 * Background worker. Run via cron every minute:
 *   * * * * * php /path/to/backend/worker.php >> /path/to/backend/storage/worker.log 2>&1
 * Processes up to JOBS_PER_TICK pending jobs (process_message leftovers,
 * reindexing, delayed replies, integration syncs, training jobs).
 */

require_once __DIR__ . '/bootstrap.php';

const JOBS_PER_TICK = 20;

$workerId = 'w' . gethostname() . '-' . getmypid();
$claimed = 0;

while ($claimed < JOBS_PER_TICK) {
    $job = JobDispatcher::claimNext($workerId);
    if (!$job) break;
    $claimed++;
    echo '[' . date('c') . "] job {$job['id']} ({$job['kind']}) claimed by $workerId\n";
    try {
        $result = JobDispatcher::execute($job);
        JobDispatcher::complete($job['id'], $result);
        echo '[' . date('c') . "] job {$job['id']} completed\n";
    } catch (Throwable $e) {
        JobDispatcher::fail($job['id'], $e->getMessage(), (int) $job['max_attempts']);
        echo '[' . date('c') . "] job {$job['id']} failed: {$e->getMessage()}\n";
    }
}

// Sweep stale running jobs (worker died mid-run) back to pending.
Database::run(
    "UPDATE jobs SET status = 'pending', locked_at = NULL, locked_by = NULL
     WHERE status = 'running' AND locked_at < :stale",
    ['stale' => date('Y-m-d H:i:s', time() - 600)]
);

echo '[' . date('c') . "] worker tick done ($claimed jobs)\n";
