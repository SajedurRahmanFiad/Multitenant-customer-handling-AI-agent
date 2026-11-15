import React, { useState } from 'react';
import { useUrlQueryState } from '../../hooks/useUrlQueryState';
import {
  KnowledgeSource,
  SourceType,
} from '../../types/knowledge';
import {
  Globe,
  FileText,
  HelpCircle,
  Package,
  FileSpreadsheet,
  Edit3,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Link,
  Upload,
} from 'lucide-react';

interface KnowledgeSourcesViewProps {
  sources: KnowledgeSource[];
  onAddSource: (newSource: Omit<KnowledgeSource, 'id'> & { sourceUrl?: string; content?: string }) => void;
  onRefreshSource: (id: string) => void;
  onDeleteSource: (id: string) => void;
}

export const KnowledgeSourcesView: React.FC<KnowledgeSourcesViewProps> = ({
  sources,
  onAddSource,
  onRefreshSource,
  onDeleteSource,
}) => {
  const [searchQuery, setSearchQuery] = useUrlQueryState<string>('q', '', undefined, true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingSource, setViewingSource] = useState<KnowledgeSource | null>(null);

  // New source form state
  const [name, setName] = useState('');
  const [type, setType] = useState<SourceType>('website');
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.originDetails.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let origin = '';
    if (type === 'website') {
      origin = `${url} (Single public page; linked pages are not crawled)`;
    } else if (type === 'document') {
      origin = selectedFile?.name || 'Uploaded Document (PDF/DOCX)';
    } else if (type === 'catalogue') {
      origin = selectedFile?.name || 'Uploaded Product CSV';
    } else if (type === 'manual') {
      origin = `Manual text entry (${manualText.length} characters)`;
    } else if (type === 'sheets') {
      origin = url || 'Google Sheets Live Sync';
    }

    let sourceUrl = type === 'website' || type === 'sheets' ? url : undefined;
    if (selectedFile) {
      try {
        const uploaded = await (await import('../../lib/api')).api.upload<{ url: string }>('/knowledge/upload', selectedFile);
        sourceUrl = uploaded.url;
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'File upload failed');
        return;
      }
    }
    onAddSource({
      name,
      type,
      status: 'queued',
      lastIndexed: '',
      lastContentUpdate: '',
      recordChunksCount: 0,
      originDetails: origin,
      isActive: true,
      sourceUrl,
      content: type === 'manual' ? manualText : undefined,
    });

    setIsAddModalOpen(false);
    setName('');
    setUrl('');
    setManualText('');
    setSelectedFile(null);
  };

  const getSourceIcon = (t: SourceType) => {
    switch (t) {
      case 'website':
        return <Globe className="w-4 h-4 text-blue-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case 'catalogue':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'sheets':
        return <FileSpreadsheet className="w-4 h-4 text-teal-600" />;
      default:
        return <Edit3 className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search training sources by name or origin..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700 shrink-0"
          >
            <option value="all">All Source Types</option>
            <option value="website">Websites</option>
            <option value="document">Documents (TXT/CSV)</option>
            <option value="faq">FAQ Entries</option>
            <option value="catalogue">Product Catalogue</option>
            <option value="sheets">Google Sheets</option>
            <option value="manual">Manual Text</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Knowledge Source</span>
        </button>
      </div>

      {/* Sources Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold">
                <th className="w-[340px] max-w-[340px] py-3 px-4">Source Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Indexed</th>
                <th className="py-3 px-4">Uploaded at</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No knowledge sources match your search.
                  </td>
                </tr>
              ) : (
                filteredSources.map((source) => (
                  <tr
                    key={source.id}
                    onClick={() => setViewingSource(source)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setViewingSource(source);
                      }
                    }}
                    tabIndex={0}
                    className="hover:bg-slate-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500 transition-colors group cursor-pointer"
                  >
                    <td className="w-[340px] max-w-[340px] py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                          {getSourceIcon(source.type)}
                        </div>
                        <div className="min-w-0">
                          <div title={source.name} className="font-semibold text-slate-900 truncate">
                            {source.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {source.originDetails}
                          </div>
                          {source.errorReason && (
                            <div className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span className="truncate">{source.errorReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 capitalize text-slate-600 font-medium">
                      {source.type}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          source.status === 'ready'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : source.status === 'processing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/80 animate-pulse'
                            : source.status === 'outdated'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            source.status === 'ready'
                              ? 'bg-emerald-600'
                              : source.status === 'processing'
                              ? 'bg-blue-600'
                              : source.status === 'outdated'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {source.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {source.lastIndexed}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {source.lastContentUpdate}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRefreshSource(source.id);
                          }}
                          title="Trigger re-index synchronization"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteSource(source.id);
                          }}
                          title="Delete source"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Knowledge Source Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Knowledge Source
                </h3>
                <p className="text-xs text-slate-500">
                  Import business material without modifying system prompts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 pt-4 overflow-y-auto flex-1">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Source Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'website', label: 'Website URL', icon: Globe },
                      { id: 'document', label: 'Text Document', icon: FileText },
                      { id: 'catalogue', label: 'Product CSV', icon: Package },
                      { id: 'manual', label: 'Manual Text', icon: Edit3 },
                      { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
                    ] as const
                  ).map((t) => {
                    const Icon = t.icon;
                    const isSelected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setType(t.id);
                          setSelectedFile(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Label / Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Courier Shipping Guidelines 2026"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {/* Website Configuration */}
              {type === 'website' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Public Website Page URL
                    </label>
                    <input
                      type="url"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://myshop.com.bd/shipping"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500">Only this public page is imported. Redirects, private networks, linked pages, and files above 2MB are not fetched.</p>
                  </div>
                </div>
              )}

              {/* Document Upload */}
              {type === 'document' && (
                <label className="relative block p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                  <input
                    type="file"
                    required
                    accept=".txt,.csv,text/plain,text/csv"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload TXT or CSV document"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {selectedFile?.name || 'Click to upload a text document'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">TXT or CSV, up to 20MB upload / 2MB indexed text</p>
                </label>
              )}

              {/* Manual Written Information */}
              {type === 'manual' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Direct Knowledge Text / Policy Rules
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Paste or write operational facts, courier exceptions, or customer guidelines..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-[11px]"
                  />
                </div>
              )}

              {/* Product CSV Upload */}
              {type === 'catalogue' && (
                <label className="relative block p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                  <input
                    type="file"
                    required
                    accept=".csv,text/csv"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload product CSV file"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {selectedFile?.name || 'Click to upload a product CSV'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">CSV file</p>
                </label>
              )}

              {/* Google Sheets */}
              {type === 'sheets' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Sheet Share Link (Viewer Access)
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-xs"
                >
                  Index & Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Source Detail Modal */}
      {viewingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  {getSourceIcon(viewingSource.type)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{viewingSource.name}</h3>
                  <span className="text-[11px] text-slate-400 capitalize">{viewingSource.type} source</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingSource(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Indexed Chunks</div>
                <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {viewingSource.recordChunksCount} chunks
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Current State</div>
                <div className="text-xs font-bold text-slate-900 mt-1 capitalize flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{viewingSource.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-slate-500 font-semibold">Origin Details & Path:</div>
              <div className="p-3 rounded-xl bg-slate-50 font-mono text-[11px] text-slate-700 break-all">
                {viewingSource.originDetails}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingSource(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
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
