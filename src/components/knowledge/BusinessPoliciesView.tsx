import React, { useState } from 'react';
import {
  BusinessPolicy,
  PolicyCategory,
} from '../../types/knowledge';
import {
  ShieldAlert,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  FileCheck2,
  User,
  History,
  Info,
} from 'lucide-react';

interface BusinessPoliciesViewProps {
  policies: BusinessPolicy[];
  onAddPolicy: (newPolicy: Omit<BusinessPolicy, 'id'>) => void;
  onUpdatePolicy: (updatedPolicy: BusinessPolicy) => void;
  onDeletePolicy: (id: string) => void;
}

const POLICY_CATEGORIES: PolicyCategory[] = [
  'Delivery and shipping',
  'Returns and exchanges',
  'Refunds',
  'Warranty',
  'Cancellations',
  'Payments',
  'Discounts and promotional offers',
  'Customer eligibility',
  'Complaints and escalation',
  'Privacy and customer data',
];

export const BusinessPoliciesView: React.FC<BusinessPoliciesViewProps> = ({
  policies,
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<BusinessPolicy | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PolicyCategory>('Returns and exchanges');
  const [fullText, setFullText] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-10-01');
  const [reviewDate, setReviewDate] = useState('2027-01-01');
  const [publicationStatus, setPublicationStatus] = useState<'Published' | 'Draft' | 'Under Review'>('Published');
  const [approvalStatus, setApprovalStatus] = useState<'Approved' | 'Pending Approval'>('Approved');

  const openCreateModal = () => {
    setEditingPolicy(null);
    setName('');
    setCategory('Returns and exchanges');
    setFullText('');
    setRulesText('');
    setEffectiveDate('2026-10-01');
    setReviewDate('2027-01-01');
    setPublicationStatus('Published');
    setApprovalStatus('Approved');
    setIsModalOpen(true);
  };

  const openEditModal = (pol: BusinessPolicy) => {
    setEditingPolicy(pol);
    setName(pol.name);
    setCategory(pol.category);
    setFullText(pol.fullText);
    setRulesText(pol.rulesAndExceptions.join('\n'));
    setEffectiveDate(pol.effectiveDate);
    setReviewDate(pol.reviewDate || '');
    setPublicationStatus(pol.publicationStatus);
    setApprovalStatus(pol.approvalStatus);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fullText.trim()) return;

    const rules = rulesText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    if (editingPolicy) {
      onUpdatePolicy({
        ...editingPolicy,
        name,
        category,
        fullText,
        rulesAndExceptions: rules,
        effectiveDate,
        reviewDate,
        publicationStatus,
        approvalStatus,
        version: editingPolicy.version.replace(/v(\d+)\.(\d+)/, (_, major, minor) => `v${major}.${Number(minor) + 1}`),
        lastApprovedBy: 'Sajedur Rahman',
        lastUpdated: 'Just now',
      });
    } else {
      onAddPolicy({
        name,
        category,
        fullText,
        rulesAndExceptions: rules,
        effectiveDate,
        reviewDate,
        publicationStatus,
        approvalStatus,
        version: 'v1.0',
        lastApprovedBy: 'Sajedur Rahman',
        lastUpdated: 'Just now',
      });
    }

    setIsModalOpen(false);
  };

  const filteredPolicies = policies.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fullText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.rulesAndExceptions.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Context Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-amber-950">Policies Are Hard Operational Rules:</strong> Unlike standard knowledge documents, policies define non-negotiable boundaries, discount ceilings, and escalation thresholds that the agent must obey rather than treat as optional suggestions.
        </div>
      </div>

      {/* Top Filter & Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policies by name, rule or category..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700 shrink-0 max-w-[180px] truncate"
          >
            <option value="All">All Categories</option>
            {POLICY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Policy Rule</span>
        </button>
      </div>

      {/* Policies List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPolicies.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No policies found.
          </div>
        ) : (
          filteredPolicies.map((pol) => (
            <div
              key={pol.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{pol.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {pol.category}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      {pol.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        pol.approvalStatus === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {pol.approvalStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans pt-1">
                    {pol.fullText}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(pol)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit policy"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePolicy(pol.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete policy"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Explicit Rules & Exceptions Box */}
              {pol.rulesAndExceptions.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                    <span>Agent Decision Rules & Exception Thresholds</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {pol.rulesAndExceptions.map((rule, idx) => {
                      const isMust = rule.startsWith('MUST:');
                      const isMustNot = rule.startsWith('MUST NOT:');
                      const isException = rule.startsWith('EXCEPTION:');

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-[11px] leading-snug font-mono ${
                            isMustNot
                              ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                              : isException
                              ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          {rule}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meta Audit Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                <div className="flex items-center gap-3">
                  <span>Effective: <strong className="text-slate-600">{pol.effectiveDate}</strong></span>
                  {pol.reviewDate && (
                    <>
                      <span>·</span>
                      <span>Next Review: <strong className="text-slate-600">{pol.reviewDate}</strong></span>
                    </>
                  )}
                </div>

                <div>
                  Approved by <strong className="text-slate-600 font-sans">{pol.lastApprovedBy}</strong> ({pol.lastUpdated})
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Policy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingPolicy ? 'Edit Business Policy' : 'Create Business Policy'}
                </h3>
                <p className="text-xs text-slate-500">
                  Enforce strict operational constraints and escalation boundaries
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Defective Item Replacement & Transit Damage"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {POLICY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Policy Prose Text
                </label>
                <textarea
                  rows={3}
                  required
                  value={fullText}
                  onChange={(e) => setFullText(e.target.value)}
                  placeholder="Write the comprehensive policy terms and operational scope..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enforceable Rules & Exceptions (1 per line, prefix with MUST / MUST NOT / EXCEPTION)
                </label>
                <textarea
                  rows={4}
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  placeholder="MUST: Accept return if reported within 72 hours&#10;MUST NOT: Promise cash refund without manager approval&#10;EXCEPTION: Escalate to staff if customer threatens legal action"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Review Date</label>
                  <input
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shadow-xs"
                >
                  {editingPolicy ? 'Update Policy' : 'Publish Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
