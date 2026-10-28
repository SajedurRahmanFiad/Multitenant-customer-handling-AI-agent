import React, { useState } from 'react';
import { FaqItem } from '../../types/knowledge';
import {
  HelpCircle,
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  MessageSquare,
  Globe,
  Tag,
  Calendar,
} from 'lucide-react';

interface FaqManagerViewProps {
  faqs: FaqItem[];
  onAddFaq: (newFaq: Omit<FaqItem, 'id'>) => void;
  onUpdateFaq: (updatedFaq: FaqItem) => void;
  onDeleteFaq: (id: string) => void;
}

const CATEGORIES = [
  'All',
  'Delivery and shipping',
  'Payments',
  'Returns and exchanges',
  'Warranty',
  'General',
];

export const FaqManagerView: React.FC<FaqManagerViewProps> = ({
  faqs,
  onAddFaq,
  onUpdateFaq,
  onDeleteFaq,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);

  // Form State
  const [question, setQuestion] = useState('');
  const [alternativesText, setAlternativesText] = useState('');
  const [approvedAnswer, setApprovedAnswer] = useState('');
  const [category, setCategory] = useState('Delivery and shipping');
  const [applicableChannel, setApplicableChannel] = useState<'All' | 'WhatsApp' | 'Messenger' | 'Website'>('All');
  const [language, setLanguage] = useState<'Bangla' | 'English' | 'Mixed'>('Bangla');
  const [priority, setPriority] = useState(90);
  const [reviewDate, setReviewDate] = useState('2026-12-31');
  const [internalNotes, setInternalNotes] = useState('');

  const openCreateModal = () => {
    setEditingFaq(null);
    setQuestion('');
    setAlternativesText('');
    setApprovedAnswer('');
    setCategory('Delivery and shipping');
    setApplicableChannel('All');
    setLanguage('Bangla');
    setPriority(90);
    setReviewDate('2026-12-31');
    setInternalNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FaqItem) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAlternativesText(faq.alternativeQuestions.join('\n'));
    setApprovedAnswer(faq.approvedAnswer);
    setCategory(faq.category);
    setApplicableChannel(faq.applicableChannel);
    setLanguage(faq.language);
    setPriority(faq.priority);
    setReviewDate(faq.reviewDate);
    setInternalNotes(faq.internalNotes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !approvedAnswer.trim()) return;

    const alts = alternativesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingFaq) {
      onUpdateFaq({
        ...editingFaq,
        question,
        alternativeQuestions: alts,
        approvedAnswer,
        category,
        applicableChannel,
        language,
        priority: Number(priority),
        reviewDate,
        internalNotes,
      });
    } else {
      onAddFaq({
        question,
        alternativeQuestions: alts,
        approvedAnswer,
        category,
        applicableChannel,
        language,
        status: 'Published',
        priority: Number(priority),
        reviewDate,
        internalNotes,
      });
    }

    setIsModalOpen(false);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.approvedAnswer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.alternativeQuestions.some((alt) => alt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs by question, trigger phrase or answer..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-700 shrink-0"
          >
            {CATEGORIES.map((cat) => (
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
          <span>Add Structured FAQ</span>
        </button>
      </div>

      {/* FAQ Grid Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No FAQs match your search or filter.
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-semibold text-slate-900 text-sm">
                      {faq.question}
                    </span>
                    <span className="text-slate-400 font-mono">· {faq.category}</span>
                    <span className="text-slate-400 font-mono">· {faq.language}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {faq.status}
                    </span>
                  </div>

                  {faq.alternativeQuestions.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-1.5 items-center">
                      <span className="font-medium text-slate-500">Triggers:</span>
                      {faq.alternativeQuestions.map((alt, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                          "{alt}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(faq)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit FAQ"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFaq(faq.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Approved Answer Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed font-sans">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Approved Answer</span>
                </div>
                {faq.approvedAnswer}
              </div>

              {/* Footer Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span>Channel: <strong className="text-slate-600">{faq.applicableChannel}</strong></span>
                  <span>·</span>
                  <span>Priority: <strong className="text-slate-600 font-mono">{faq.priority}</strong></span>
                  <span>·</span>
                  <span>Next Review: <strong className="text-slate-600 font-mono">{faq.reviewDate}</strong></span>
                </div>

                {faq.internalNotes && (
                  <span className="text-slate-400 italic">
                    Note: {faq.internalNotes}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit FAQ Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingFaq ? 'Edit Structured FAQ' : 'Add Structured FAQ'}
                </h3>
                <p className="text-xs text-slate-500">
                  Ensure predictable answers for high-frequency inquiries
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
                  Primary Customer Question
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How much is delivery inside Dhaka?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternative Question Phrasings / Triggers (1 per line)
                </label>
                <textarea
                  rows={2}
                  value={alternativesText}
                  onChange={(e) => setAlternativesText(e.target.value)}
                  placeholder="ঢাকার ভেতর ডেলিভারি চার্জ কত?&#10;Inside Dhaka delivery charge&#10;ডেলিভারি ফি কত?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved Answer
                </label>
                <textarea
                  rows={3}
                  required
                  value={approvedAnswer}
                  onChange={(e) => setApprovedAnswer(e.target.value)}
                  placeholder="ঢাকার ভেতরের ডেলিভারি চার্জ ৬০ টাকা। সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Applicable Channel</label>
                  <select
                    value={applicableChannel}
                    onChange={(e) => setApplicableChannel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="All">All Channels</option>
                    <option value="WhatsApp">WhatsApp Only</option>
                    <option value="Messenger">Messenger Only</option>
                    <option value="Website">Website Widget</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Bangla">Bangla</option>
                    <option value="English">English</option>
                    <option value="Mixed">Bangla-English Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Weight (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Verified with Pathao rate card"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                  {editingFaq ? 'Save Changes' : 'Publish FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
