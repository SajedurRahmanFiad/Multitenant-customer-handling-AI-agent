import React from 'react';
import { AgentIdentityConfig } from '../../types/agentConfig';
import {
  User,
  Languages,
  Smile,
  Sparkles,
  ShieldCheck,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface IdentityPersonalityViewProps {
  config: AgentIdentityConfig;
  onChange: (updated: AgentIdentityConfig) => void;
}

const TONES: { id: AgentIdentityConfig['tone']; label: string; desc: string }[] = [
  {
    id: 'friendly',
    label: 'Friendly & Helpful',
    desc: 'Warm, approachable, and respectful',
  },
  {
    id: 'professional',
    label: 'Professional & Polished',
    desc: 'Clean corporate standard with polite clarity',
  },
  {
    id: 'formal',
    label: 'Formal & Traditional',
    desc: 'Structured, respectful honorifics',
  },
  {
    id: 'casual',
    label: 'Casual & Modern',
    desc: 'Direct, modern, conversational vibe',
  },
  {
    id: 'enthusiastic',
    label: 'Enthusiastic & High-Energy',
    desc: 'Dynamic, promotional, customer-delight oriented',
  },
];

const EMOJI_OPTIONS: { id: AgentIdentityConfig['emojiUsage']; label: string; desc: string; preview: string }[] = [
  { id: 'none', label: 'No Emojis', desc: 'Strict text only without any icons', preview: 'Text only' },
  { id: 'minimal', label: 'Minimal (Recommended)', desc: '1-2 emojis per conversation for warmth', preview: '✨ 👍' },
  { id: 'moderate', label: 'Moderate', desc: 'Friendly touch with bullet accents', preview: '📦 🚀 ✅' },
  { id: 'expressive', label: 'Expressive', desc: 'Vibrant and expressive engagement', preview: '🎉 🛍️ 🔥 ✨' },
];

export const IdentityPersonalityView: React.FC<IdentityPersonalityViewProps> = ({
  config,
  onChange,
}) => {
  const handleTextChange = (field: keyof AgentIdentityConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleLanguageToggle = (lang: 'Bangla' | 'English' | 'Banglish') => {
    let updated = [...config.supportedLanguages];
    if (updated.includes(lang)) {
      if (updated.length > 1) {
        updated = updated.filter((l) => l !== lang);
      }
    } else {
      updated.push(lang);
    }
    onChange({
      ...config,
      supportedLanguages: updated,
      primaryLanguage: updated.includes(config.primaryLanguage) ? config.primaryLanguage : updated[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Agent Profile */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Agent Identity & Brand Baseline</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Define how your agent introduces itself and identifies your business across WhatsApp and Messenger.
          </p>
        </div>

        <div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Agent Persona / Display Name *
            </label>
            <input
              type="text"
              value={config.agentName}
              onChange={(e) => handleTextChange('agentName', e.target.value)}
              placeholder="e.g. Aria, Zara, Nexura Assistant"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Language Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Multi-Language & Dialect Configuration</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select the languages your AI supports for South Asian and global customers.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Supported Customer Languages (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Bangla', 'English', 'Banglish'] as const).map((lang) => {
                const isChecked = config.supportedLanguages.includes(lang);
                return (
                  <label
                    key={lang}
                    onClick={() => handleLanguageToggle(lang)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-slate-900 focus:ring-0"
                    />
                    <div>
                      <div className="text-xs font-bold">{lang}</div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          isChecked ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {lang === 'Bangla' && 'বাংলা লিপি ও প্রাতিষ্ঠানিক বার্তা'}
                        {lang === 'English' && 'Global English customer queries'}
                        {lang === 'Banglish' && 'Romanized Bangla (e.g. koto taka?)'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Default Primary Language Fallback
            </label>
            <select
              value={config.primaryLanguage}
              onChange={(e) => handleTextChange('primaryLanguage', e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
            >
              {config.supportedLanguages.map((l) => (
                <option key={l} value={l}>
                  {l} (Default fallback)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tone of Voice */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Smile className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tone of Voice & Conversational Style</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrate the personality of your AI to match your retail brand identity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TONES.map((t) => {
            const isSelected = config.tone === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleTextChange('tone', t.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{t.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{t.desc}</p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Emoji and Length Preference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Emoji Usage Calibration
            </label>
            <div className="space-y-2">
              {EMOJI_OPTIONS.map((eOpt) => (
                <label
                  key={eOpt.id}
                  onClick={() => handleTextChange('emojiUsage', eOpt.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    config.emojiUsage === eOpt.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="emojiUsage"
                      checked={config.emojiUsage === eOpt.id}
                      onChange={() => {}}
                      className="text-slate-900 focus:ring-0"
                    />
                    <span className="text-xs font-semibold">{eOpt.label}</span>
                  </div>
                  <span className="text-xs">{eOpt.preview}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Message Length Preference
            </label>
            <div className="space-y-2">
              {[
                { id: 'concise', label: 'Concise & Direct', desc: '1-2 brief sentences, ideal for quick WhatsApp inquiries' },
                { id: 'balanced', label: 'Balanced (Standard)', desc: 'Clear answer with necessary context and polite closing' },
                { id: 'detailed', label: 'Detailed & Thorough', desc: 'Step-by-step instructions, terms, and thorough specs' },
              ].map((mOpt) => (
                <label
                  key={mOpt.id}
                  onClick={() => handleTextChange('messageLength', mOpt.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    config.messageLength === mOpt.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="messageLength"
                      checked={config.messageLength === mOpt.id}
                      onChange={() => {}}
                      className="text-slate-900 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold block">{mOpt.label}</span>
                      <span
                        className={`text-[10px] ${
                          config.messageLength === mOpt.id
                            ? 'text-slate-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {mOpt.desc}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
