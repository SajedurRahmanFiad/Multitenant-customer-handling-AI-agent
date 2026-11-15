import React, { useState } from 'react';
import { useUrlQueryState } from '../../hooks/useUrlQueryState';
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
  'General operations',
  'Products and services',
  'Sales and pricing',
  'Human resources',
  'Workplace health and safety',
  'Finance and accounting',
  'Legal and compliance',
  'Information security',
  'Facilities and equipment',
  'Procurement and suppliers',
  'Quality assurance',
  'Marketing and communications',
  'Travel and expenses',
  'Environmental and sustainability',
];

const isPolicyActive = (policy: BusinessPolicy) => {
  if (policy.permanent || !policy.effectiveDate) return true;

  const effectiveDate = /^\d{4}-\d{2}-\d{2}$/.test(policy.effectiveDate)
    ? new Date(`${policy.effectiveDate}T00:00:00`)
    : new Date(policy.effectiveDate);
  if (Number.isNaN(effectiveDate.getTime())) return true;

  effectiveDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return effectiveDate > today;
};

export const BusinessPoliciesView: React.FC<BusinessPoliciesViewProps> = ({
  policies,
  onAddPolicy,
  onUpdatePolicy,
  onDeletePolicy,
}) => {
  const [searchQuery, setSearchQuery] = useUrlQueryState<string>('q', '', undefined, true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<BusinessPolicy | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PolicyCategory>('Returns and exchanges');
  const [fullText, setFullText] = useState('');
  const [mustRules, setMustRules] = useState<string[]>(['']);
  const [mustNotRules, setMustNotRules] = useState<string[]>(['']);
  const [exceptionRules, setExceptionRules] = useState<string[]>(['']);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [permanent, setPermanent] = useState(false);
  const [publicationStatus, setPublicationStatus] = useState<'Published' | 'Draft' | 'Under Review'>('Published');

  const openCreateModal = () => {
    setEditingPolicy(null);
    setName('');
    setCategory('Returns and exchanges');
    setFullText('');
    setMustRules(['']);
    setMustNotRules(['']);
    setExceptionRules(['']);
    setEffectiveDate('');
    setPermanent(false);
    setPublicationStatus('Published');
    setIsModalOpen(true);
  };

  const openEditModal = (pol: BusinessPolicy) => {
    setEditingPolicy(pol);
    setName(pol.name);
    setCategory(pol.category);
    setFullText(pol.fullText);
    setMustRules(pol.rulesAndExceptions
      .filter((rule) => rule.startsWith('MUST:'))
      .map((rule) => rule.replace(/^MUST:\s*/, '')));
    setMustNotRules(pol.rulesAndExceptions
      .filter((rule) => rule.startsWith('MUST NOT:'))
      .map((rule) => rule.replace(/^MUST NOT:\s*/, '')));
    setExceptionRules(pol.rulesAndExceptions
      .filter((rule) => rule.startsWith('EXCEPTION:'))
      .map((rule) => rule.replace(/^EXCEPTION:\s*/, '')));
    setEffectiveDate(pol.effectiveDate);
    setPermanent(Boolean(pol.permanent));
    setPublicationStatus(pol.publicationStatus);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fullText.trim()) return;

    const rules = [
      ...mustRules.map((rule) => rule.trim()).filter(Boolean).map((rule) => `MUST: ${rule}`),
      ...mustNotRules.map((rule) => rule.trim()).filter(Boolean).map((rule) => `MUST NOT: ${rule}`),
      ...exceptionRules.map((rule) => rule.trim()).filter(Boolean).map((rule) => `EXCEPTION: ${rule}`),
    ];

    if (editingPolicy) {
      onUpdatePolicy({
        ...editingPolicy,
        name,
        category,
        fullText,
        rulesAndExceptions: rules,
        effectiveDate,
        permanent,
        publicationStatus,
        approvalStatus: 'Approved',
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
        permanent,
        publicationStatus,
        approvalStatus: 'Approved',
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
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isPolicyActive(pol)
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isPolicyActive(pol) ? 'Active' : 'Inactive'}
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
                  <span>Effective: <strong className="text-slate-600">{pol.permanent ? 'Permanent' : (pol.effectiveDate || 'Not set')}</strong></span>
                </div>

                <div>
                  Updated <strong className="text-slate-600 font-sans">{pol.lastUpdated}</strong>
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

              {[
                { label: 'Must', values: mustRules, setValues: setMustRules, placeholder: 'What must the business or agent do?' },
                { label: 'Must not', values: mustNotRules, setValues: setMustNotRules, placeholder: 'What must the business or agent never do?' },
                { label: 'Exception', values: exceptionRules, setValues: setExceptionRules, placeholder: 'When does an exception apply?' },
              ].map(({ label, values, setValues, placeholder }) => (
                <section key={label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-700">{label}</h4>
                    <button
                      type="button"
                      onClick={() => setValues([...values, ''])}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-950"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  {values.map((rule, index) => (
                    <div key={`${label}-${index}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rule}
                        onChange={(event) => setValues(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setValues(values.filter((_, itemIndex) => itemIndex !== index))}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        aria-label={`Remove ${label.toLowerCase()} rule`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </section>
              ))}

              <div className="space-y-2">
                <label className={`block text-xs font-semibold mb-1 ${permanent ? 'text-slate-400' : 'text-slate-700'}`}>Effective Date</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    disabled={permanent}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={permanent}
                      onChange={(e) => setPermanent(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    Permanent
                  </label>
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
