import React, { useState } from 'react';
import { ResponseRulesConfig } from '../../types/agentConfig';
import {
  FileCheck,
  ShieldAlert,
  BookOpen,
  Plus,
  Trash2,
  X,
  Layers,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ResponseRulesViewProps {
  config: ResponseRulesConfig;
  onChange: (updated: ResponseRulesConfig) => void;
}

export const ResponseRulesView: React.FC<ResponseRulesViewProps> = ({
  config,
  onChange,
}) => {
  const [newTemplateKeyword, setNewTemplateKeyword] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newRestrictedClaim, setNewRestrictedClaim] = useState('');

  const handleFieldChange = (field: keyof ResponseRulesConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateKeyword.trim() || !newTemplateText.trim()) return;

    const newTpl = {
      id: `tpl_${Date.now()}`,
      triggerKeyword: newTemplateKeyword.startsWith('!')
        ? newTemplateKeyword.trim()
        : `!${newTemplateKeyword.trim()}`,
      templateText: newTemplateText.trim(),
    };

    onChange({
      ...config,
      quickTemplates: [...config.quickTemplates, newTpl],
    });

    setNewTemplateKeyword('');
    setNewTemplateText('');
  };

  const handleRemoveTemplate = (id: string) => {
    onChange({
      ...config,
      quickTemplates: config.quickTemplates.filter((t) => t.id !== id),
    });
  };

  const handleAddRestrictedClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestrictedClaim.trim()) return;

    onChange({
      ...config,
      restrictedClaims: Array.from(
        new Set([...config.restrictedClaims, newRestrictedClaim.trim()])
      ),
    });
    setNewRestrictedClaim('');
  };

  const handleRemoveRestrictedClaim = (claim: string) => {
    onChange({
      ...config,
      restrictedClaims: config.restrictedClaims.filter((c) => c !== claim),
    });
  };

  return (
    <div className="space-y-6">
      {/* Response Length & Structuring */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Response Length & Formatting Constraints</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep answers readable on mobile screens and prevent wall-of-text responses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Maximum Response Length (Characters)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={150}
                max={1500}
                value={config.maxResponseCharacters}
                onChange={(e) =>
                  handleFieldChange('maxResponseCharacters', Number(e.target.value))
                }
                className="w-32 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
              <span className="text-xs text-slate-500">
                Recommended: 350-500 chars for WhatsApp readability
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Maximum Sentences Per Message
            </label>
            <select
              value={config.maxSentencesPerMessage}
              onChange={(e) =>
                handleFieldChange('maxSentencesPerMessage', Number(e.target.value))
              }
              className="w-full sm:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            >
              <option value={2}>2 Sentences (Fast & punchy)</option>
              <option value={3}>3 Sentences (Standard)</option>
              <option value={4}>4 Sentences (Thorough)</option>
              <option value={6}>6 Sentences (Detailed)</option>
            </select>
          </div>
        </div>

        {/* Combine Multiple Customer Inquiries */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Synthesize Multiple Questions into One Cohesive Reply
            </span>
            <span className="text-[11px] text-slate-500">
              If a customer sends 3 questions at once, answer them in an orderly single message instead of 3 rapid messages
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              handleFieldChange(
                'combineMultipleQuestions',
                !config.combineMultipleQuestions
              )
            }
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              config.combineMultipleQuestions ? 'bg-slate-900' : 'bg-slate-300'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                config.combineMultipleQuestions ? 'left-6.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Grounding & Source Citation Rules */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Citation, Source Conflicts & Grounding Protocols</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct the agent on citing policies, handling discrepancies, and admitting knowledge gaps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Source Citation Requirement
            </label>
            <select
              value={config.sourceCitationBehavior}
              onChange={(e) =>
                handleFieldChange('sourceCitationBehavior', e.target.value)
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            >
              <option value="for_policy_pricing">
                Cite when quoting Policy / Pricing
              </option>
              <option value="always">Always Cite Knowledge Chunk</option>
              <option value="never_in_chat">Never Cite Directly in Chat</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              When Sources Conflict
            </label>
            <select
              value={config.conflictingSourcesBehavior}
              onChange={(e) =>
                handleFieldChange('conflictingSourcesBehavior', e.target.value)
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            >
              <option value="yield_to_newest">
                Yield to Newest Effective Policy
              </option>
              <option value="escalate_to_human">
                Escalate Conflict to Human Agent
              </option>
              <option value="state_ambiguity">
                Politely State Discrepancy & Verify
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              When No Verified Answer Exists
            </label>
            <select
              value={config.noAnswerBehavior}
              onChange={(e) =>
                handleFieldChange('noAnswerBehavior', e.target.value)
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
            >
              <option value="admit_and_escalate">
                Say "I don't have enough info" & Escalate
              </option>
              <option value="admit_and_collect_lead">
                Admit Gap & Collect Phone for Callback
              </option>
              <option value="fallback_faq">
                Provide General FAQ Directory Link
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Approved Quick Templates & Snippets */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Approved Quick Templates & Reusable Snippets
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact approved phrasing triggered whenever specific shortcuts or topics are matched.
          </p>
        </div>

        {/* Add Template Form */}
        <form onSubmit={handleAddTemplate} className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-3">
            <input
              type="text"
              value={newTemplateKeyword}
              onChange={(e) => setNewTemplateKeyword(e.target.value)}
              placeholder="Keyword (e.g. !delivery)"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-mono"
            />
          </div>
          <div className="md:col-span-7">
            <input
              type="text"
              value={newTemplateText}
              onChange={(e) => setNewTemplateText(e.target.value)}
              placeholder="Approved response template text..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Add Template
            </button>
          </div>
        </form>

        <div className="space-y-2 pt-1">
          {config.quickTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                  {tpl.triggerKeyword}
                </span>
                <p className="text-slate-800 font-sans mt-1">{tpl.templateText}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTemplate(tpl.id)}
                className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Restricted Claims & Unapproved Promises */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Restricted Commercial Claims & Unauthorized Promises</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict negative constraints preventing the model from promising impossible SLAs or unauthorized discounts.
          </p>
        </div>

        <form onSubmit={handleAddRestrictedClaim} className="flex gap-2">
          <input
            type="text"
            value={newRestrictedClaim}
            onChange={(e) => setNewRestrictedClaim(e.target.value)}
            placeholder="Add forbidden claim (e.g. ১০০% ক্যাশব্যাক কোনো শর্ত ছাড়াই)..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Add Constraint
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {config.restrictedClaims.map((claim) => (
            <div
              key={claim}
              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs flex items-center gap-2"
            >
              <span>{claim}</span>
              <button
                type="button"
                onClick={() => handleRemoveRestrictedClaim(claim)}
                className="text-rose-400 hover:text-rose-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
