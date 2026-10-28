import React from 'react';
import { TrainingJob } from '../../types/knowledge';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  Ban,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface TrainingJobsViewProps {
  jobs: TrainingJob[];
  onRetryJob: (id: string) => void;
  onCancelJob: (id: string) => void;
  onTriggerFullReindex: () => void;
}

export const TrainingJobsView: React.FC<TrainingJobsViewProps> = ({
  jobs,
  onRetryJob,
  onCancelJob,
  onTriggerFullReindex,
}) => {
  const runningJobs = jobs.filter((j) => j.status === 'running');
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  const totalProcessed = jobs.reduce((acc, j) => acc + j.documentsProcessed, 0);
  const totalSkipped = jobs.reduce((acc, j) => acc + j.recordsSkipped, 0);

  return (
    <div className="space-y-4">
      {/* Principle Note Banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-blue-950">Safe Asynchronous Indexing:</strong> A source is not marked "Ready" merely because it was uploaded. Documents first undergo OCR, structural semantic chunking, and embedding generation. Production queries remain routed to the last verified snapshot until indexing succeeds.
        </div>
      </div>

      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Pipeline Jobs</span>
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${runningJobs.length > 0 ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {runningJobs.length} running
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Background worker queue</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Documents Processed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalProcessed}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Chunked & embedded</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Records Skipped / Filtered</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalSkipped}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Duplicates & empty pages</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Full Re-index</span>
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <button
            type="button"
            onClick={onTriggerFullReindex}
            className="mt-2 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync All Sources</span>
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-900">
            Recent Indexing & Training Executions
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {jobs.length} jobs recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold">
                <th className="py-3 px-4">Source / Target</th>
                <th className="py-3 px-4">Job Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress / Output</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="truncate max-w-[280px]" title={job.sourceName}>
                      {job.sourceName}
                    </div>
                    {job.errorMessage && (
                      <div className="text-[10px] text-rose-600 font-normal mt-0.5 max-w-md break-words">
                        Error: {job.errorMessage}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {job.jobType}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        job.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : job.status === 'running'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/80 animate-pulse'
                          : job.status === 'failed'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          job.status === 'completed'
                            ? 'bg-emerald-600'
                            : job.status === 'running'
                            ? 'bg-blue-600'
                            : job.status === 'failed'
                            ? 'bg-rose-600'
                            : 'bg-slate-400'
                        }`}
                      />
                      {job.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                    {job.status === 'running' ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span>{job.documentsProcessed} of {job.totalDocuments}</span>
                          <span>{Math.round((job.documentsProcessed / job.totalDocuments) * 100)}%</span>
                        </div>
                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(job.documentsProcessed / job.totalDocuments) * 100}%` }}
                            className="bg-blue-600 h-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <span>{job.documentsProcessed} chunks ({job.recordsSkipped} skipped)</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {job.startedAt}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {job.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => onRetryJob(job.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                    {job.status === 'running' && (
                      <button
                        type="button"
                        onClick={() => onCancelJob(job.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3 text-rose-600" />
                        <span>Cancel</span>
                      </button>
                    )}
                    {job.status === 'completed' && (
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Synced
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
