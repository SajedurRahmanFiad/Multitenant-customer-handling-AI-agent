import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

interface InviteTeammateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteTeammateModal: React.FC<InviteTeammateModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Agent' | 'Manager' | 'Admin'>('Agent');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setEmail('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Invite Teammate</h3>
              <p className="text-xs text-slate-500">Add staff for live chat handover & review</p>
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
            <h4 className="text-base font-bold text-slate-900">Invitation Sent</h4>
            <p className="text-xs text-slate-500 mt-1">
              Instructions sent to <span className="font-semibold text-slate-700">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@yourcompany.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role & Permissions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Agent', 'Manager', 'Admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-colors ${
                      role === r
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {role === 'Agent' && 'Can reply to handovers in WhatsApp & Messenger inbox.'}
                {role === 'Manager' && 'Can view analytics, QA logs, and resolve escalations.'}
                {role === 'Admin' && 'Full access to API keys, channels, and billing.'}
              </p>
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
                Send Invite
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
