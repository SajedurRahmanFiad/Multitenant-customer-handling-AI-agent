import React, { useState } from 'react';
import { AuditLogEntry, AuditActionType, AuditOutcome } from '../../types/auditLogs';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode2,
  Download,
  Calendar,
  X,
  Eye,
  KeyRound,
  Bot,
  UserCheck,
  Wrench,
  Trash2,
  Share2,
} from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState<string>('all');
  const [inspectingEntry, setInspectingEntry] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (selectedActionFilter !== 'all' && log.actionType !== selectedActionFilter) {
      return false;
    }
    if (selectedOutcomeFilter !== 'all' && log.outcome !== selectedOutcomeFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchText = `${log.actionTitle} ${log.description} ${log.actor.name} ${log.actor.email} ${log.correlationId} ${log.targetResource}`.toLowerCase();
      return matchText.includes(q);
    }
    return true;
  });

  const getActionIcon = (action: AuditActionType) => {
    switch (action) {
      case 'agent_takeover':
        return <UserCheck className="w-3.5 h-3.5 text-blue-600" />;
      case 'tool_call_executed':
        return <Wrench className="w-3.5 h-3.5 text-purple-600" />;
      case 'policy_published':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'knowledge_reindexed':
        return <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />;
      case 'customer_data_erased':
        return <Trash2 className="w-3.5 h-3.5 text-red-600" />;
      case 'integration_changed':
        return <Share2 className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <KeyRound className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getOutcomeBadge = (outcome: AuditOutcome) => {
    switch (outcome) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Success
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Denied
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, actor, correlation ID or resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Action Types</option>
              <option value="agent_takeover">Agent Takeover</option>
              <option value="tool_call_executed">Tool Call Execution</option>
              <option value="policy_published">Policy Published</option>
              <option value="knowledge_reindexed">Knowledge Re-indexed</option>
              <option value="customer_data_exported">Data Exported</option>
              <option value="customer_data_erased">Customer Erasure (GDPR)</option>
              <option value="permission_changed">Permission / Access Denied</option>
              <option value="integration_changed">Integration Changed</option>
            </select>

            <select
              value={selectedOutcomeFilter}
              onChange={(e) => setSelectedOutcomeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="denied">Denied (Blocked)</option>
              <option value="failed">Failed</option>
            </select>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action & Resource</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Outcome</th>
                <th className="px-5 py-3">Correlation ID</th>
                <th className="px-5 py-3 text-right">Sanitized Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                        {getActionIcon(log.actionType)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">{log.actionTitle}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{log.description}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Target: {log.targetResource}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{log.actor.name}</span>
                      <span className="text-[11px] text-slate-500">{log.actor.email}</span>
                      <span className="text-[10px] text-slate-400 font-mono">IP: {log.actor.ipAddress}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">{getOutcomeBadge(log.outcome)}</td>
                  <td className="px-5 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {log.correlationId}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setInspectingEntry(log)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Sanitized Trace Modal */}
      {inspectingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Audit Event Inspection</p>
                  <p className="text-slate-500 text-[11px] font-mono">{inspectingEntry.correlationId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEntry(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Action:</span>
                  <span className="text-slate-900">{inspectingEntry.actionTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Timestamp:</span>
                  <span className="text-slate-900">{inspectingEntry.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Actor:</span>
                  <span className="text-slate-900">
                    {inspectingEntry.actor.name} ({inspectingEntry.actor.role})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">IP Address:</span>
                  <span className="text-slate-900 font-mono">{inspectingEntry.actor.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Target:</span>
                  <span className="text-slate-900">{inspectingEntry.targetResource}</span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Sanitized Event Metadata (Zero PII / Secrets):</p>
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(inspectingEntry.sanitizedMetadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingEntry(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
