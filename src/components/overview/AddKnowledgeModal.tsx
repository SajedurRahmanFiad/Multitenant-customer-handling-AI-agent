import React, { useState } from 'react';
import { X, BookPlus, Check } from 'lucide-react';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (title: string) => void;
}

export const AddKnowledgeModal: React.FC<AddKnowledgeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<'policy' | 'faq' | 'manual'>('policy');
  const [rawText, setRawText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawText) return;
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSuccess?.(title);
      setTitle('');
      setRawText('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <BookPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Knowledge Source</h3>
              <p className="text-xs text-slate-500">Add policies, FAQs, or delivery rules to train agent</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Knowledge Indexed</h4>
            <p className="text-xs text-slate-500 mt-1">
              Document chunks and embeddings generated successfully.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Eid Delivery Hours & Courier Charges"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
              />
            </div>

            <div className="flex gap-2">
              {(['policy', 'faq', 'manual'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSourceType(type)}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border capitalize ${
                    sourceType === type
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Content & Guidelines (Bangla or English)
              </label>
              <textarea
                required
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Enter facts, return terms, delivery duration, or product specifications..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900 font-mono text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Index & Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
