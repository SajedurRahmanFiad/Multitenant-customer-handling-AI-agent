import React, { useState } from 'react';
import { ModelRoutingRule } from '../../types/analytics';
import {
  GitFork,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Eye,
  Database,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  DollarSign,
  Clock,
  Play,
  Layers,
} from 'lucide-react';

interface ModelRoutingEngineViewProps {
  rules: ModelRoutingRule[];
  onToggleRule: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export const ModelRoutingEngineView: React.FC<ModelRoutingEngineViewProps> = ({
  rules,
  onToggleRule,
  onShowToast,
}) => {
  const [testQuery, setTestQuery] = useState('What are your delivery fees for Chittagong?');
  const [simulatedRoute, setSimulatedRoute] = useState<{
    matchedRule: string;
    model: string;
    cost: string;
    latency: string;
    reason: string;
  } | null>(null);

  const getConditionIcon = (condition: ModelRoutingRule['intentCondition']) => {
    switch (condition) {
      case 'faq_simple':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      case 'complex_reasoning':
        return <Brain className="w-4 h-4 text-purple-600" />;
      case 'vision_multimodal':
        return <Eye className="w-4 h-4 text-amber-600" />;
      case 'embedding_vector':
        return <Database className="w-4 h-4 text-blue-600" />;
      case 'outage_fallback':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    }
  };

  const handleSimulateRoute = () => {
    const q = testQuery.toLowerCase();
    if (q.includes('photo') || q.includes('image') || q.includes('picture') || q.includes('receipt') || q.includes('slip')) {
      setSimulatedRoute({
        matchedRule: 'Customer Media & Screenshot Analysis',
        model: 'gemini-2.5-flash (Vision)',
        cost: '$0.00015 / 1k',
        latency: '~310 ms',
        reason: 'Detected image/screenshot intent -> Routed to multimodal vision tokens.',
      });
    } else if (q.includes('compare') || q.includes('difference') || q.includes('better') || q.includes('which fabric') || q.includes('policy')) {
      setSimulatedRoute({
        matchedRule: 'Complex Comparisons & Size Advisory',
        model: 'gemini-2.5-pro',
        cost: '$0.00125 / 1k',
        latency: '~420 ms',
        reason: 'Detected multi-step comparative reasoning -> Routed to high-parameter model.',
      });
    } else {
      setSimulatedRoute({
        matchedRule: 'FAQ & Simple Inquiries',
        model: 'gemini-2.5-flash-lite',
        cost: '$0.000075 / 1k',
        latency: '~140 ms',
        reason: 'Direct FAQ lookup pattern -> Routed to ultra-cheap edge model for 90% savings.',
      });
    }
    onShowToast('Query intent analyzed and routed through policy engine');
  };

  return (
    <div className="space-y-6">
      {/* Header & Architectural Explainer */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Deterministic Model Routing Policy Engine
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Routing is controlled by explicit rules and capability checks, not by allowing the AI to pick arbitrary model names. Simple questions route to inexpensive models, while complex advisory routes to stronger language reasoning.
          </p>
        </div>

        {/* Visual Pipeline Flow */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[550px] gap-2 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Step 1</span>
              <strong className="text-slate-800 font-semibold">Inbound Message</strong>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Step 2</span>
              <strong className="text-slate-800 font-semibold">Intent Classifier</strong>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">Step 3</span>
              <strong className="text-blue-900 font-semibold">Explicit Rule Matrix</strong>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Step 4</span>
              <strong className="text-emerald-900 font-semibold">Specialized AI Output</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Live Query Simulator */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Live Intent Routing Simulator
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Test policy decisions in real-time</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Type a sample customer question..."
            className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={handleSimulateRoute}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Route</span>
          </button>
        </div>

        {simulatedRoute && (
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-900">
                  Matched Policy: {simulatedRoute.matchedRule}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white text-blue-800 border border-blue-200">
                  {simulatedRoute.model}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>Cost: <strong className="text-slate-900">{simulatedRoute.cost}</strong></span>
                <span>•</span>
                <span>Latency: <strong className="text-emerald-700">{simulatedRoute.latency}</strong></span>
              </div>
            </div>
            <p className="text-xs text-blue-800/90 leading-relaxed">
              {simulatedRoute.reason}
            </p>
          </div>
        )}
      </div>

      {/* Explicit Rules Matrix */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Routing Rules ({rules.filter((r) => r.isActive).length} Enabled)
          </h4>
          <span className="text-xs text-slate-400">Enforced at API gateway</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-5 rounded-3xl border transition bg-white ${
                rule.isActive ? 'border-slate-200/90 shadow-xs' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getConditionIcon(rule.intentCondition)}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{rule.name}</h5>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Condition: <strong className="font-mono text-slate-700">{rule.intentCondition}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800">
                    {rule.targetModel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleRule(rule.id)}
                    className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                      rule.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        rule.isActive ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <p className="text-slate-600 leading-relaxed max-w-xl">
                  {rule.explanation}
                </p>

                <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px] shrink-0">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    {rule.estCostPer1k}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {rule.avgLatency}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
