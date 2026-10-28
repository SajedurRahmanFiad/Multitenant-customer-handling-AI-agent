import React, { useState } from 'react';
import { X, ArrowRightLeft, Users } from 'lucide-react';

interface TransferTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeam?: string;
  onTransfer: (team: string, staff: string | null, note: string) => void;
}

const TEAMS = [
  'Returns & Claims',
  'Finance & Payments',
  'Logistics & Courier',
  'Sales Escalation',
  'General Support',
];

const STAFF_MEMBERS: Record<string, string[]> = {
  'Returns & Claims': ['Rafiq Islam', 'Tanvir Ahmed'],
  'Finance & Payments': ['Sajedur Rahman', 'Nusrat Jahan'],
  'Logistics & Courier': ['Kamal Hossain', 'Rafiq Islam'],
  'Sales Escalation': ['Nusrat Jahan', 'Farzana Akter'],
  'General Support': ['Rafiq Islam', 'Nusrat Jahan', 'Sajedur Rahman'],
};

export const TransferTeamModal: React.FC<TransferTeamModalProps> = ({
  isOpen,
  onClose,
  currentTeam = 'Returns & Claims',
  onTransfer,
}) => {
  const [selectedTeam, setSelectedTeam] = useState(currentTeam);
  const [selectedStaff, setSelectedStaff] = useState<string>('Unassigned');
  const [transferNote, setTransferNote] = useState('');

  if (!isOpen) return null;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    onTransfer(
      selectedTeam,
      selectedStaff === 'Unassigned' ? null : selectedStaff,
      transferNote
    );
    onClose();
  };

  const availableStaff = STAFF_MEMBERS[selectedTeam] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Transfer Conversation</h3>
              <p className="text-xs text-slate-500">Route to specialized departmental queue</p>
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

        <form onSubmit={handleTransfer} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Department / Team
            </label>
            <div className="space-y-1.5">
              {TEAMS.map((team) => (
                <button
                  key={team}
                  type="button"
                  onClick={() => {
                    setSelectedTeam(team);
                    setSelectedStaff('Unassigned');
                  }}
                  className={`w-full p-2.5 text-xs font-medium rounded-xl border text-left flex items-center justify-between transition-colors ${
                    selectedTeam === team
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{team}</span>
                  {selectedTeam === team && (
                    <span className="text-[10px] text-slate-300 font-mono">Active Target</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assign to Staff Member (Optional)
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
            >
              <option value="Unassigned">Leave unassigned in team queue</option>
              {availableStaff.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transfer Reason / Note for Team
            </label>
            <textarea
              rows={2}
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="e.g. Verified customer photo, needs replacement airway bill from courier..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-900"
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
              Confirm Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
