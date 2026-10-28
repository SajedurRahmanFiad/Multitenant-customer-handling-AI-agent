import React, { useState } from 'react';
import {
  Server,
  Database,
  Layers,
  Cpu,
  Activity,
  RotateCw,
  AlertOctagon,
  CheckCircle2,
  Trash2,
  Eye,
  X
} from 'lucide-react';
import { QueueMetrics, DeadLetterJob } from '../../types/platformAdmin';

interface InfrastructureQueuesViewProps {
  metrics: QueueMetrics;
  dlqJobs: DeadLetterJob[];
  onRetryDlqJob: (jobId: string) => void;
  onDismissDlqJob: (jobId: string) => void;
}

export const InfrastructureQueuesView: React.FC<InfrastructureQueuesViewProps> = ({
  metrics,
  dlqJobs,
  onRetryDlqJob,
  onDismissDlqJob,
}) => {
  const [selectedJobPayload, setSelectedJobPayload] = useState<DeadLetterJob | null>(null);
  const [retriedJobId, setRetriedJobId] = useState<string | null>(null);

  const handleRetry = (jobId: string) => {
    setRetriedJobId(jobId);
    setTimeout(() => {
      onRetryDlqJob(jobId);
      setRetriedJobId(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Level Real-time Cluster Overview (Light Mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Webhook Ingestion */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Webhook Throughput
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.incomingWebhookRatePerSec}
            </span>
            <span className="text-xs text-slate-500">reqs / sec</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.completedJobs24h.toLocaleString()} processed in last 24h
          </p>
        </div>

        {/* BullMQ Job Status */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Queue Pipeline
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.activeProcessingJobs}
            </span>
            <span className="text-xs text-slate-500">active ({metrics.queuedJobs} queued)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Oldest queue wait: {metrics.oldestJobWaitTimeMs}ms (Well within SLA)
          </p>
        </div>

        {/* Worker Node Health */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Worker Node Fleet
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.workerCountActive} Nodes
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              CPU {metrics.workerCpuPercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cluster Memory: {metrics.workerMemoryPercent}% allocated
          </p>
        </div>

        {/* Database & Redis Pool */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Postgres & Redis Health
            </span>
            <div className="p-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.dbPoolActive} / {metrics.dbPoolMax}
            </span>
            <span className="text-xs text-slate-500">DB conns</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Redis hit rate {metrics.redisHitRatePercent}% ({metrics.redisMemoryUsedMB} MB)
          </p>
        </div>
      </div>

      {/* Dead-Letter Queue (DLQ) Inspector (Light Mode) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Dead-Letter Queue (DLQ) Inspector
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {dlqJobs.length} Unresolved Jobs
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Jobs that exhausted all retry attempts (e.g. downstream network timeouts, malformed third-party payloads)
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Auto-purges discarded items after 14 days
          </div>
        </div>

        {dlqJobs.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">
              Dead-Letter Queue is Clean
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Zero jobs failed or dropped in the queue pipeline.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Job ID & Channel</th>
                  <th className="px-4 py-3">Tenant ID</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Failed Reason</th>
                  <th className="px-4 py-3">Timestamp & Tries</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dlqJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-900">
                        {job.id}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            job.channel === 'whatsapp' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        />
                        <span className="text-[11px] text-slate-500 capitalize">
                          {job.channel}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      {job.tenantId}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700">
                        {job.eventType}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <span className="text-rose-700 font-medium text-[11px] block truncate" title={job.errorMessage}>
                        {job.errorMessage}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      <div>{job.failedAt}</div>
                      <div className="text-[10px] text-slate-400">{job.retryAttempts} attempts made</div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedJobPayload(job)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View sanitized payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRetry(job.id)}
                          disabled={retriedJobId === job.id}
                          className="flex items-center gap-1 px-2.5 py-1 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
                          title="Reprocess through queue"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${retriedJobId === job.id ? 'animate-spin' : ''}`} />
                          <span>{retriedJobId === job.id ? 'Retrying...' : 'Replay'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDismissDlqJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Discard from DLQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sanitized Payload Modal (Light Mode) */}
      {selectedJobPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Sanitized DLQ Event Payload
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedJobPayload.id} · {selectedJobPayload.channel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobPayload(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold block mb-0.5">Automated PII & Secret Redaction:</span>
              Auth tokens, phone numbers beyond country code, and payment card numbers are automatically sanitized before entering the DLQ viewer.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Raw JSON Object
              </label>
              <pre className="p-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(JSON.parse(selectedJobPayload.sanitizedPayload), null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedJobPayload(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRetry(selectedJobPayload.id);
                  setSelectedJobPayload(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                Replay Through Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
