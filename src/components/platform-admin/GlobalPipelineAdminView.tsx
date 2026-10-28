import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Eye,
  Mic,
  Database,
  Send,
  Cpu,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Sliders,
  FileCode2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { GlobalPipelineLayer, AIProviderModel } from '../../types/platformAdmin';

interface GlobalPipelineAdminViewProps {
  layers: GlobalPipelineLayer[];
  availableModels: AIProviderModel[];
  onSaveLayer: (updated: GlobalPipelineLayer) => void;
  onShowToast: (msg: string) => void;
}

const LAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  intent_classification: Sparkles,
  image_processing: Eye,
  voice_processing: Mic,
  knowledge_retrieval: Database,
  final_generation: Send,
};

export const GlobalPipelineAdminView: React.FC<GlobalPipelineAdminViewProps> = ({
  layers,
  availableModels,
  onSaveLayer,
  onShowToast,
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(layers[0]?.id || 'layer_1_intent');
  const [editingLayer, setEditingLayer] = useState<GlobalPipelineLayer>(
    layers.find((l) => l.id === selectedLayerId) || layers[0]
  );
  const [isDirty, setIsDirty] = useState(false);

  const handleSelectLayer = (id: string) => {
    const found = layers.find((l) => l.id === id);
    if (found) {
      setSelectedLayerId(id);
      setEditingLayer(found);
      setIsDirty(false);
    }
  };

  const handleChange = <K extends keyof GlobalPipelineLayer>(
    field: K,
    value: GlobalPipelineLayer[K]
  ) => {
    setEditingLayer((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    const updated: GlobalPipelineLayer = {
      ...editingLayer,
      lastUpdated: `Just now by Platform Super Admin`,
    };
    onSaveLayer(updated);
    setIsDirty(false);
    onShowToast(`Global pipeline configuration for "${updated.title}" saved successfully`);
  };

  const handleReset = () => {
    const original = layers.find((l) => l.id === selectedLayerId);
    if (original) {
      setEditingLayer(original);
      setIsDirty(false);
      onShowToast('Reverted changes to current deployed version');
    }
  };

  const Icon = LAYER_ICONS[editingLayer.layerType] || Cpu;

  return (
    <div className="space-y-6">
      {/* Global Notice Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Global Pipeline System Prompts & Execution Guidance
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Applied Globally
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              System prompts, reasoning guidance, temperature defaults, and input/output contracts defined here govern all tenant customer interactions across the platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Tenants only select models & fallback models
          </span>
        </div>
      </div>

      {/* Layer Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {layers.map((layer) => {
          const LayerIcon = LAYER_ICONS[layer.layerType] || Cpu;
          const isSelected = selectedLayerId === layer.id;

          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => handleSelectLayer(layer.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase ${
                      isSelected ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    Step {layer.layerOrder}
                  </span>
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <LayerIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <h4
                  className={`text-xs font-bold leading-tight ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {layer.title.replace(/^Layer \d+: /, '')}
                </h4>
                <p
                  className={`text-[10px] mt-1 line-clamp-2 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {layer.subtitle}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/20 flex items-center justify-between text-[10px]">
                <span
                  className={
                    isSelected
                      ? 'text-slate-300'
                      : layer.isActiveGlobally
                      ? 'text-emerald-600 font-semibold'
                      : 'text-amber-600 font-semibold'
                  }
                >
                  {layer.isActiveGlobally ? 'Active Globally' : 'Inactive'}
                </span>
                {layer.isMandatory && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Required
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Layer Configuration Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Top Header of Selected Layer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Step {editingLayer.layerOrder} of 5
                </span>
                <h3 className="text-base font-bold text-slate-900">{editingLayer.title}</h3>
                {editingLayer.isMandatory ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Mandatory Core Layer
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Conditional Execution
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{editingLayer.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={editingLayer.isActiveGlobally}
                onChange={(e) => handleChange('isActiveGlobally', e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="text-xs font-semibold text-slate-800">
                Active for All Tenants
              </span>
            </label>
          </div>
        </div>

        {/* Global System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-slate-600" />
              Global Layer System Prompt (Master Instructions)
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Injected into model runtime for all tenants
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Define the exact system role, extraction targets, structured output specifications, and reasoning boundaries for this pipeline stage.
          </p>
          <textarea
            rows={7}
            value={editingLayer.systemPrompt}
            onChange={(e) => handleChange('systemPrompt', e.target.value)}
            className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs text-slate-900 leading-relaxed"
          />
        </div>

        {/* Operational Guidance & Guardrails */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            Operational Guidance & Safety Guardrails
          </label>
          <p className="text-[11px] text-slate-500">
            Platform-level engineering instructions for latency, fallback routing, and tenant data isolation.
          </p>
          <textarea
            rows={2}
            value={editingLayer.guidanceNotes}
            onChange={(e) => handleChange('guidanceNotes', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs text-slate-800"
          />
        </div>

        {/* Default Parameters & Recommended Models */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Recommended Model
            </label>
            <select
              value={editingLayer.defaultModelId}
              onChange={(e) => handleChange('defaultModelId', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.modelId}>
                  {m.displayName}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default when tenant hasn't configured custom model
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Fallback Model
            </label>
            <select
              value={editingLayer.defaultFallbackModelId || ''}
              onChange={(e) => handleChange('defaultFallbackModelId', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            >
              <option value="">None (Fail immediately)</option>
              {availableModels.map((m) => (
                <option key={m.id} value={m.modelId}>
                  {m.displayName}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Global failover target on 429 / timeout
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Default Temperature: {editingLayer.defaultTemperature}
              </label>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={editingLayer.defaultTemperature}
              onChange={(e) => handleChange('defaultTemperature', parseFloat(e.target.value))}
              className="w-full accent-slate-900"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              {editingLayer.defaultTemperature < 0.2 ? 'Deterministic / Exact extraction' : 'Conversational creativity'}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Max Tokens: {editingLayer.defaultMaxTokens}
              </label>
            </div>
            <input
              type="range"
              min="256"
              max="4096"
              step="128"
              value={editingLayer.defaultMaxTokens}
              onChange={(e) => handleChange('defaultMaxTokens', parseInt(e.target.value, 10))}
              className="w-full accent-slate-900"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Hard limit on layer response size
            </span>
          </div>
        </div>

        {/* Input & Output Data Contracts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-900 block">
              Input Contract (Payload entering this layer):
            </span>
            <input
              type="text"
              value={editingLayer.inputDescription}
              onChange={(e) => handleChange('inputDescription', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5 p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-900 block">
              Output Contract (Payload passed to next layer):
            </span>
            <input
              type="text"
              value={editingLayer.outputDescription}
              onChange={(e) => handleChange('outputDescription', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Bottom Save & Reset Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Last modified: {editingLayer.lastUpdated}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Revert
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Deploy Global Layer Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
