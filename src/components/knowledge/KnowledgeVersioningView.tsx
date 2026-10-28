import React, { useState } from 'react';
import { KnowledgeSnapshot } from '../../types/knowledge';
import {
  History,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RotateCcw,
  ShieldCheck,
  GitBranch,
  Layers,
  FileCheck2,
  AlertCircle,
  Eye,
  Plus,
  Send,
  X,
} from 'lucide-react';

interface KnowledgeVersioningViewProps {
  snapshots: KnowledgeSnapshot[];
  onPublishStaging: (summary: string) => void;
  onRollback: (version: string) => void;
}

export const KnowledgeVersioningView: React.FC<KnowledgeVersioningViewProps> = ({
  snapshots,
  onPublishStaging,
  onRollback,
}) => {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [selectedRollbackVersion, setSelectedRollbackVersion] = useState<KnowledgeSnapshot | null>(null);
  const [newSummary, setNewSummary] = useState('');
  const [viewingSnapshot, setViewingSnapshot] = useState<KnowledgeSnapshot | null>(null);

  const activeProduction = snapshots.find((s) => s.state === 'production');
  const activeStaging = snapshots.find((s) => s.state === 'staging');

  const handleOpenRollback = (snap: KnowledgeSnapshot) => {
    setSelectedRollbackVersion(snap);
    setIsRollbackModalOpen(true);
  };

  const handleConfirmPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSummary.trim()) return;
    onPublishStaging(newSummary.trim());
    setNewSummary('');
    setIsPublishModalOpen(false);
  };

  const handleConfirmRollback = () => {
    if (selectedRollbackVersion) {
      onRollback(selectedRollbackVersion.version);
      setIsRollbackModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards: Production vs Staging */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Production Card */}
        <div className="bg-white rounded-3xl border-2 border-emerald-500/20 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Production State
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {activeProduction?.version || 'v2.4'}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-base font-bold text-slate-900">
              {activeProduction?.label || 'Production - Live'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeProduction?.changeSummary}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              <span className="text-slate-400">Published:</span>{' '}
              <span className="font-medium text-slate-700">{activeProduction?.publishedAt}</span>
            </div>
            <div>
              <span className="text-slate-400">By:</span>{' '}
              <span className="font-medium text-slate-700">{activeProduction?.publishedBy}</span>
            </div>
          </div>
        </div>

        {/* Staging / Evaluation Card */}
        <div className="bg-white rounded-3xl border border-indigo-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              Staging & QA Evaluation
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
              {activeStaging?.version || 'v2.5-draft'}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-base font-bold text-slate-900">
              {activeStaging?.label || 'Draft Changes in Staging'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeStaging?.changeSummary}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-900">{activeStaging?.totalChunks}</span> chunks ready
            </div>
            <button
              type="button"
              onClick={() => setIsPublishModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Send className="w-3 h-3" />
              <span>Promote to Production</span>
            </button>
          </div>
        </div>
      </div>

      {/* Release Safety Lifecycle Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">
              Safe Atomic Deployment Pipeline
            </span>
            <span className="text-slate-500">
              Documents are processed in isolated staging sandbox. Production queries will never encounter partial or failed chunks.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 shrink-0">
          <span className="px-2 py-1 bg-white rounded-md border border-slate-200">1. Draft</span>
          <span>→</span>
          <span className="px-2 py-1 bg-white rounded-md border border-slate-200">2. Index</span>
          <span>→</span>
          <span className="px-2 py-1 bg-white rounded-md border border-slate-200">3. Test</span>
          <span>→</span>
          <span className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 font-bold">
            4. Live Deploy
          </span>
        </div>
      </div>

      {/* Snapshots History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Version Snapshot History ({snapshots.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every publication creates an immutable snapshot. You can roll back instantly if an updated policy produces regressions.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Release State</th>
                <th className="py-3 px-4">Summary of Changes</th>
                <th className="py-3 px-4">Sources / Chunks</th>
                <th className="py-3 px-4">Published At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshots.map((snap) => (
                <tr key={snap.version} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {snap.version}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize ${
                        snap.state === 'production'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : snap.state === 'staging'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {snap.state}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs font-sans">
                    <p className="line-clamp-2">{snap.changeSummary}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {snap.sourcesCount} sources / {snap.totalChunks} chunks
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <div>{snap.publishedAt}</div>
                    <div className="text-[10px] text-slate-400">{snap.publishedBy}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingSnapshot(snap)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {snap.state === 'archived' && (
                        <button
                          type="button"
                          onClick={() => handleOpenRollback(snap)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1"
                          title="Rollback to this version"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rollback</span>
                        </button>
                      )}

                      {snap.state === 'staging' && (
                        <button
                          type="button"
                          onClick={() => setIsPublishModalOpen(true)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                        >
                          <span>Deploy</span>
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

      {/* Modal: Publish Staging to Production */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsPublishModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Publish Snapshot to Live Production
              </h3>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Promoting this release will replace the current active knowledge base in production with the verified Staging snapshot. All Messenger and WhatsApp bot replies will immediately ground against these changes.
            </p>

            <form onSubmit={handleConfirmPublish} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Change Log / Release Notes *
                </label>
                <textarea
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Describe key adjustments made (e.g. Updated Eid delivery hours, revised bKash merchant rules)..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Please ensure you have validated high-priority policy questions in the <strong>Knowledge Testing</strong> tab prior to publishing.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Deploy to Production
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rollback Confirmation */}
      {isRollbackModalOpen && selectedRollbackVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsRollbackModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Confirm Rollback to {selectedRollbackVersion.version}
              </h3>
              <button
                type="button"
                onClick={() => setIsRollbackModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to rollback live production to{' '}
              <strong className="text-slate-900 font-mono">{selectedRollbackVersion.version}</strong> (
              {selectedRollbackVersion.label})? Any newly indexed staging chunks will be unlinked from production customer responses.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Historical summary:</span>{' '}
              {selectedRollbackVersion.changeSummary}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRollbackModalOpen(false)}
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
                Rollback Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Details Modal */}
      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setViewingSnapshot(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                  {viewingSnapshot.version}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {viewingSnapshot.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingSnapshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">Release Summary:</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {viewingSnapshot.changeSummary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Active Sources
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingSnapshot.sourcesCount}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Searchable Chunks
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {viewingSnapshot.totalChunks}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                <div>Published by: {viewingSnapshot.publishedBy}</div>
                <div>Timestamp: {viewingSnapshot.publishedAt}</div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingSnapshot(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
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
