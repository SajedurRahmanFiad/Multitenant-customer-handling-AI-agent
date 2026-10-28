import React, { useState } from 'react';
import { BrandIdentityKnowledge } from '../../types/knowledge';
import {
  Sparkles,
  Save,
  CheckCircle2,
  Quote,
  MessageSquare,
  Shield,
  Plus,
  Trash2,
  BookOpen,
  Info,
} from 'lucide-react';

interface BrandIdentityViewProps {
  brandIdentity: BrandIdentityKnowledge;
  onSave: (updated: BrandIdentityKnowledge) => void;
  onShowToast: (msg: string) => void;
}

export const BrandIdentityView: React.FC<BrandIdentityViewProps> = ({
  brandIdentity,
  onSave,
  onShowToast,
}) => {
  const [localData, setLocalData] = useState<BrandIdentityKnowledge>(brandIdentity);
  const [newPreferredTerm, setNewPreferredTerm] = useState('');
  const [newForbiddenTerm, setNewForbiddenTerm] = useState('');

  const handleSave = () => {
    const updated = {
      ...localData,
      lastUpdated: 'Just now',
    };
    onSave(updated);
    onShowToast('Brand voice and tagline saved to Knowledge Base');
  };

  const handleAddPreferred = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreferredTerm.trim()) return;
    setLocalData({
      ...localData,
      vocabularyGuidelines: {
        ...localData.vocabularyGuidelines,
        preferredTerms: [...localData.vocabularyGuidelines.preferredTerms, newPreferredTerm.trim()],
      },
    });
    setNewPreferredTerm('');
  };

  const handleRemovePreferred = (index: number) => {
    setLocalData({
      ...localData,
      vocabularyGuidelines: {
        ...localData.vocabularyGuidelines,
        preferredTerms: localData.vocabularyGuidelines.preferredTerms.filter((_, i) => i !== index),
      },
    });
  };

  const handleAddForbidden = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForbiddenTerm.trim()) return;
    setLocalData({
      ...localData,
      vocabularyGuidelines: {
        ...localData.vocabularyGuidelines,
        forbiddenTerms: [...localData.vocabularyGuidelines.forbiddenTerms, newForbiddenTerm.trim()],
      },
    });
    setNewForbiddenTerm('');
  };

  const handleRemoveForbidden = (index: number) => {
    setLocalData({
      ...localData,
      vocabularyGuidelines: {
        ...localData.vocabularyGuidelines,
        forbiddenTerms: localData.vocabularyGuidelines.forbiddenTerms.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Brand Voice & Tagline Knowledge</h3>
            <p className="text-xs text-slate-500">
              Core brand identity indexed into the knowledge base and supplied to the response generation layer.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          Save Brand Knowledge
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Editors */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Tagline Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Quote className="w-4 h-4 text-purple-600" />
                Brand Tagline
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {localData.tagline.length} chars
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              The memorable motto or defining slogan of your business, referenced in welcome messages and social bio replies.
            </p>
            <input
              type="text"
              value={localData.tagline}
              onChange={(e) => setLocalData({ ...localData, tagline: e.target.value })}
              placeholder="e.g. Weaving heritage, delivering elegance to your doorstep."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
            />
          </div>

          {/* 2. Brand Voice & Persona Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="pb-2 border-b border-slate-100">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Brand Voice & Tone Philosophy
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Detailed description of how your business speaks to customers, including empathy, warmth, and phrasing conventions.
              </p>
            </div>
            <textarea
              rows={4}
              value={localData.brandVoice}
              onChange={(e) => setLocalData({ ...localData, brandVoice: e.target.value })}
              placeholder="e.g. Warm, polite, respectful Bengali hospitality. Prompt and informative. Uses 'আপনি' and treats customers like valued guests..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 leading-relaxed font-sans"
            />

            {/* Tone Pillars */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-800 mb-2">Core Tone Pillars</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {localData.tonePillars.map((pillar, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-bold text-slate-900 block">{pillar.name}</span>
                    <span className="text-[11px] text-slate-500 leading-snug">{pillar.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Vocabulary & Lexicon Guidelines */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Brand Vocabulary & Lexicon Guidelines
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Guide the final generation model on authentic vocabulary to favor and prohibited terms to strictly avoid.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preferred terms */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Preferred Brand Terms
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {localData.vocabularyGuidelines.preferredTerms.length} terms
                  </span>
                </div>

                <form onSubmit={handleAddPreferred} className="flex gap-2">
                  <input
                    type="text"
                    value={newPreferredTerm}
                    onChange={(e) => setNewPreferredTerm(e.target.value)}
                    placeholder="Add term (e.g. অরিজিনাল জামদানি)"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                  {localData.vocabularyGuidelines.preferredTerms.map((term, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl"
                    >
                      {term}
                      <button
                        type="button"
                        onClick={() => handleRemovePreferred(i)}
                        className="text-emerald-500 hover:text-emerald-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Forbidden terms */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Forbidden / Banned Terms
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {localData.vocabularyGuidelines.forbiddenTerms.length} terms
                  </span>
                </div>

                <form onSubmit={handleAddForbidden} className="flex gap-2">
                  <input
                    type="text"
                    value={newForbiddenTerm}
                    onChange={(e) => setNewForbiddenTerm(e.target.value)}
                    placeholder="Add term (e.g. সস্তা / ডুপ্লিকেট)"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                  {localData.vocabularyGuidelines.forbiddenTerms.map((term, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 text-xs rounded-xl"
                    >
                      {term}
                      <button
                        type="button"
                        onClick={() => handleRemoveForbidden(i)}
                        className="text-red-500 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Cultural Nuances & RAG Retrieval Preview */}
        <div className="space-y-6">
          {/* Greeting Conventions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <label className="text-xs font-bold text-slate-900 block">
              Standard Greeting Convention
            </label>
            <p className="text-[11px] text-slate-500">
              Default opening line when customer starts a new conversation.
            </p>
            <textarea
              rows={3}
              value={localData.greetingConvention}
              onChange={(e) => setLocalData({ ...localData, greetingConvention: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
          </div>

          {/* Cultural & Linguistic Nuance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <label className="text-xs font-bold text-slate-900 block">
              Cultural & Linguistic Nuances
            </label>
            <p className="text-[11px] text-slate-500">
              Context for Bangladeshi market (code-switching, honorifics, seasonal greetings for Eid/Puja).
            </p>
            <textarea
              rows={4}
              value={localData.culturalNuances}
              onChange={(e) => setLocalData({ ...localData, culturalNuances: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
          </div>

          {/* RAG Context Injection Preview */}
          <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
              <Info className="w-4 h-4 text-purple-700" />
              <span>RAG Knowledge Injection Preview</span>
            </div>
            <p className="text-[11px] text-purple-900 leading-relaxed">
              When a customer sends a message, this brand knowledge is aggregated alongside retrieved FAQs and catalogue data and provided to the <strong>Final Generation Layer Model</strong>:
            </p>
            <div className="p-3 bg-white/90 border border-purple-200 rounded-xl font-mono text-[10px] text-slate-700 space-y-1 overflow-x-auto">
              <div className="text-purple-700 font-bold">[BRAND_IDENTITY_CONTEXT]</div>
              <div>Tagline: "{localData.tagline}"</div>
              <div>Voice: "{localData.brandVoice.slice(0, 80)}..."</div>
              <div>Preferred: [{localData.vocabularyGuidelines.preferredTerms.slice(0, 3).join(', ')}]</div>
              <div>Prohibited: [{localData.vocabularyGuidelines.forbiddenTerms.slice(0, 3).join(', ')}]</div>
              <div className="text-slate-400 mt-1">→ Passed to Final Generation Layer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
