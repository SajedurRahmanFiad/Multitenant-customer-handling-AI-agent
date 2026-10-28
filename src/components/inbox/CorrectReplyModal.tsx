import React, { useState } from 'react';
import { X, Check, BookPlus, Sparkles } from 'lucide-react';
import { Message } from '../../types/inbox';

interface CorrectReplyModalProps {
  isOpen: boolean;
  message: Message | null;
  onClose: () => void;
  onSubmitCorrection: (messageId: string, correctedText: string, addToKnowledge: boolean, notes: string) => void;
}

export const CorrectReplyModal: React.FC<CorrectReplyModalProps> = ({
  isOpen,
  message,
  onClose,
  onSubmitCorrection,
}) => {
  const [correctedText, setCorrectedText] = useState(message?.text || '');
  const [notes, setNotes] = useState('');
  const [addToKnowledge, setAddToKnowledge] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !message) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctedText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitCorrection(message.id, correctedText, addToKnowledge, notes);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Correct AI Reply</h3>
              <p className="text-xs text-slate-500">
                Log feedback and teach the model the ideal phrasing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Original AI Output */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Original AI Response
            </label>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans italic">
              "{message.text}"
            </div>
          </div>

          {/* Corrected Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corrected / Ideal Response
            </label>
            <textarea
              required
              rows={4}
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
              placeholder="Write the exact phrasing the agent should have used..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 leading-relaxed"
            />
          </div>

          {/* QA Review Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Correction Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tone too stiff, use polite colloquial Bangla, clarify Sundarban policy"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
            />
          </div>

          {/* Checkbox: Turn into reviewed knowledge item */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="addToKnowledge"
              checked={addToKnowledge}
              onChange={(e) => setAddToKnowledge(e.target.checked)}
              className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="addToKnowledge" className="text-xs text-emerald-900 leading-snug cursor-pointer">
              <span className="font-semibold">Turn into reviewed knowledge item</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Automatically saves this pair to style examples so the AI mirrors this ideal response pattern in future conversations.
              </p>
            </label>
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
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Correction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
