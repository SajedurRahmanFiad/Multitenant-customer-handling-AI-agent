import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import type { TeamMember } from '../../types/team';

interface InviteTeammateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (member: Omit<TeamMember, 'id' | 'joinedAt'>) => void | Promise<boolean>;
}

export const InviteTeammateModal: React.FC<InviteTeammateModalProps> = ({ isOpen, onClose, onInvite }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'agent' | 'analyst' | 'admin'>('agent');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const ok = await onInvite({ name: name.trim(), phone: phone.trim(), role, assignedChannels: ['messenger', 'whatsapp'], tenantId: '', tenantName: '', status: 'invited', twoFactorEnabled: false, lastActive: 'Invitation pending' });
    if (ok === false) return;
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setName('');
      setPhone('');
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
            <h4 className="text-base font-bold text-slate-900">Team member added</h4>
            <p className="text-xs text-slate-500 mt-1">
              Share the temporary password shown after saving with {name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Teammate name"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone number</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 17..." className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role & Permissions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([{ id: 'agent', label: 'Agent' }, { id: 'analyst', label: 'Analyst' }, { id: 'admin', label: 'Admin' }] as const).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-colors ${
                      role === r.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                {role === 'agent' && 'Can reply to assigned conversations.'}
                {role === 'analyst' && 'Can review workspace data and reports.'}
                {role === 'admin' && 'Can manage workspace settings and team.'}
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
