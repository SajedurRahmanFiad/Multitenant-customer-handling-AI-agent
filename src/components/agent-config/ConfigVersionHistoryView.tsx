import React, { useState } from 'react';
import { AgentConfigVersion } from '../../types/agentConfig';
import {
  History,
  RotateCcw,
  CheckCircle2,
  Eye,
  Clock,
  User,
  Zap,
  Bot,
  AlertTriangle,
  X,
  Layers,
} from 'lucide-react';

interface ConfigVersionHistoryViewProps {
  versions: AgentConfigVersion[];
  onRollbackVersion: (version: AgentConfigVersion) => void;
}

export const ConfigVersionHistoryView: React.FC<ConfigVersionHistoryViewProps> = ({
  versions,
  onRollbackVersion,
}) => {
  const [selectedVersionToView, setSelectedVersionToView] = useState<AgentConfigVersion | null>(null);
  const [confirmRollbackVersion, setConfirmRollbackVersion] = useState<AgentConfigVersion | null>(null);

  const handleConfirmRollback = () => {
    if (confirmRollbackVersion) {
      onRollbackVersion(confirmRollbackVersion);
      setConfirmRollbackVersion(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Agent Configuration Version History</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Every published configuration update is versioned. Roll back instantly if a prompt or rule change produces regressions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Total Releases:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono">
            {versions.length} versions
          </span>
        </div>
      </div>

      {/* Version History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Operational Mode</th>
                <th className="py-3 px-4">Change Summary</th>
                <th className="py-3 px-4">Published</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {versions.map((ver) => (
                <tr key={ver.version} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {ver.version}
                  </td>
                  <td className="py-3.5 px-4">
                    {ver.isLive ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        Historical
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 capitalize font-semibold text-slate-700">
                    {ver.mode.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs font-sans">
                    <p className="line-clamp-2">{ver.summary}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <div>{ver.publishedAt}</div>
                    <div className="text-[10px] text-slate-400">by {ver.publishedBy}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedVersionToView(ver)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="View Snapshot"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {!ver.isLive && (
                        <button
                          type="button"
                          onClick={() => setConfirmRollbackVersion(ver)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Inspect Modal */}
      {selectedVersionToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedVersionToView(null)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                  {selectedVersionToView.version}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Configuration Snapshot Details
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVersionToView(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Release Notes
                </span>
                <p className="font-semibold text-slate-900">{selectedVersionToView.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Agent Persona
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedVersionToView.identity.agentName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Operational Mode
                  </span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {selectedVersionToView.mode.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tone of Voice
                  </span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {selectedVersionToView.identity.tone}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Handover Rules Count
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selectedVersionToView.handoverRules.length} rules
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Primary Objective
                </span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                  {selectedVersionToView.instructions.primaryObjective}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedVersionToView(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {confirmRollbackVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setConfirmRollbackVersion(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Restore Version {confirmRollbackVersion.version}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmRollbackVersion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to restore the entire agent configuration back to{' '}
              <strong className="text-slate-900 font-mono">{confirmRollbackVersion.version}</strong>?
              Your current working settings will be replaced with this snapshot.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Historical summary:</span>{' '}
              {confirmRollbackVersion.summary}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRollbackVersion(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRollback}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
