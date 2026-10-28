import React, { useState } from 'react';
import { PipelineLayerConfig, PipelineLayerType } from '../../types/agentConfig';
import { AIProviderModel } from '../../types/platformAdmin';
import {
  Layers,
  Cpu,
  ArrowRight,
  Sparkles,
  Eye,
  Mic,
  Database,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  Lock,
  Globe,
  Info,
  ChevronDown,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface MultiLayerPipelineViewProps {
  layers: PipelineLayerConfig[];
  availableModels: AIProviderModel[];
  onUpdateLayer: (updated: PipelineLayerConfig) => void;
  onShowToast: (msg: string) => void;
}

const LAYER_ICONS: Record<PipelineLayerType, React.ComponentType<{ className?: string }>> = {
  intent_classification: Sparkles,
  image_processing: Eye,
  voice_processing: Mic,
  knowledge_retrieval: Database,
  final_generation: Send,
};

export const MultiLayerPipelineView: React.FC<MultiLayerPipelineViewProps> = ({
  layers,
  availableModels,
  onUpdateLayer,
  onShowToast,
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(layers[0]?.id || 'layer_1_intent');
  const [simulationPrompt, setSimulationPrompt] = useState<string>(
    'এই জামদানি শাড়িটা কি হোম ডেলিভারিতে নেওয়া যাবে? ডেলিভারি চার্জ কত পড়বে?'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSteps, setSimulatedSteps] = useState<{
    step1Intent?: string;
    step2Multimodal?: string;
    step3Knowledge?: string;
    step4FinalReply?: string;
  } | null>(null);

  const activeLayer = layers.find((l) => l.id === selectedLayerId) || layers[0];

  const handlePrimaryModelChange = (layerId: string, newModelId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    const modelObj = availableModels.find((m) => m.modelId === newModelId);

    const updated: PipelineLayerConfig = {
      ...layer,
      selectedModelId: newModelId,
      selectedProvider: modelObj?.provider || layer.selectedProvider,
    };
    onUpdateLayer(updated);
    onShowToast(`Layer ${layer.layerOrder}: Primary model set to ${modelObj?.displayName || newModelId}`);
  };

  const handleFallbackModelChange = (layerId: string, fallbackId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    const modelObj = availableModels.find((m) => m.modelId === fallbackId);

    const updated: PipelineLayerConfig = {
      ...layer,
      fallbackModelId: fallbackId || undefined,
    };
    onUpdateLayer(updated);
    onShowToast(
      fallbackId
        ? `Layer ${layer.layerOrder}: Fallback model set to ${modelObj?.displayName || fallbackId}`
        : `Layer ${layer.layerOrder}: Fallback model removed`
    );
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setSimulatedSteps(null);

    const primaryIntentModel = availableModels.find((m) => m.modelId === layers[0]?.selectedModelId)?.displayName || 'Gemini 2.5 Flash';
    const primaryFinalModel = availableModels.find((m) => m.modelId === layers[4]?.selectedModelId)?.displayName || 'Claude 3.5 Sonnet';

    setTimeout(() => {
      setSimulatedSteps({
        step1Intent: `Executed via [${primaryIntentModel}]: Detected intent "Product & Delivery Inquiry" (Confidence: 99.4%) · Language: Bengali · Extracted entity: [Product: Jamdani Saree]`,
        step2Multimodal: 'No image attachment in message query · Layer 2 & 3 media modules bypassed cleanly',
        step3Knowledge: 'Grounding via Knowledge Base: Retrieved [1] Inside Dhaka delivery 24-48h (৳70 fee), [2] Cash on delivery accepted, [3] Brand Voice guidelines applied',
        step4FinalReply: `Synthesized via [${primaryFinalModel}]: "আসসালামু আলাইকুম! জী, আমাদের প্রতিটি ঐতিহ্যবাহী জামদানি শাড়ি ঢাকা সহ সারা বাংলাদেশে হোম ডেলিভারিতে পেয়ে যাবেন। ঢাকার মধ্যে ডেলিভারি চার্জ মাত্র ৭০ টাকা এবং ১-২ কার্যদিবসের মধ্যে ডেলিভারি সম্পন্ন হয়। ক্যাশ অন ডেলিভারিও এভেইলেবল আছে। আপনি কি পছন্দের কোনো কালার বা ডিজাইন অর্ডার করতে চাচ্ছেন?"`,
      });
      setIsSimulating(false);
      onShowToast('Pipeline execution test finished successfully');
    }, 850);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Multi-Layer Architecture & Global Prompts */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Multi-Layer AI Model Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              Select the primary and fallback AI models for each layer of your agent's processing pipeline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Layer prompts & guidance managed in Platform Admin
          </span>
        </div>
      </div>

      {/* Visual Pipeline Flow Architecture Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-700" />
            Active Pipeline Execution Flow
          </span>
          <span className="text-[11px] text-slate-400">
            Click any layer below to change its assigned models
          </span>
        </div>

        {/* 5 Layer Cards Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {layers.map((layer) => {
            const Icon = LAYER_ICONS[layer.layerType] || Cpu;
            const isSelected = selectedLayerId === layer.id;
            const primaryModelObj = availableModels.find((m) => m.modelId === layer.selectedModelId);
            const fallbackModelObj = availableModels.find((m) => m.modelId === layer.fallbackModelId);

            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50/80 shadow-xs ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Step {layer.layerOrder}
                    </span>
                    <div
                      className={`p-1.5 rounded-lg ${
                        layer.layerType === 'final_generation'
                          ? 'bg-purple-100 text-purple-700'
                          : layer.layerType === 'intent_classification'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {layer.layerType === 'intent_classification'
                        ? '1. Intent Analysis'
                        : layer.layerType === 'image_processing'
                        ? '2. Image & Vision'
                        : layer.layerType === 'voice_processing'
                        ? '3. Voice Audio STT'
                        : layer.layerType === 'knowledge_retrieval'
                        ? '4. RAG Retrieval'
                        : '5. Final Response'}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                      {layer.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-semibold text-slate-400">
                      Primary Model
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 truncate">
                      {primaryModelObj?.displayName || layer.selectedModelId}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-semibold text-slate-400">
                      Fallback Failover
                    </span>
                    <span className="text-[10px] text-slate-600 truncate">
                      {fallbackModelObj?.displayName || 'None (Fail direct)'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Layer Model Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Layer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl ${
                activeLayer.layerType === 'final_generation'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {React.createElement(LAYER_ICONS[activeLayer.layerType] || Cpu, {
                className: 'w-5 h-5',
              })}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step {activeLayer.layerOrder} of 5
                </span>
                <h3 className="text-base font-bold text-slate-900">{activeLayer.title}</h3>
                {activeLayer.layerType === 'final_generation' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Customer Facing Response
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeLayer.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Layer Active
            </span>
          </div>
        </div>

        {/* Informational Read-Only Banner: Platform Guidance */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3">
          <Globe className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Platform Admin Enforced Guidelines & Prompts
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.2 rounded">
                Global Policy
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              The system instructions, safety guardrails, extraction contracts, and formatting schemas for this layer are standardized globally in <strong>Platform Admin Settings</strong>. As a tenant, configure which AI models power this layer below.
            </p>
          </div>
        </div>

        {/* Primary and Fallback Model Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Model */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Primary Model
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                The primary AI model that will process this step for customer conversations.
              </p>
              <select
                value={activeLayer.selectedModelId}
                onChange={(e) => handlePrimaryModelChange(activeLayer.id, e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs font-semibold text-slate-900"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.modelId}>
                    {m.displayName} ({m.provider}) · ${m.costPerMillionInputUSD}/1M in
                  </option>
                ))}
              </select>
            </div>

            {/* Model Spec Summary */}
            {(() => {
              const model = availableModels.find((m) => m.modelId === activeLayer.selectedModelId);
              return model ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-semibold text-slate-900">{model.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>P95 Latency:</span>
                    <span className="font-mono text-slate-900">{model.latencyP95Ms} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capabilities:</span>
                    <span className="font-medium text-slate-800">{model.capabilities.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Input Cost:</span>
                    <span className="font-medium text-slate-900">${model.costPerMillionInputUSD} / 1M tokens</span>
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Fallback Failover Model */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-white">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                Fallback Model
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Automatic failover model if the primary model encounters rate limits (429) or timeouts.
              </p>
              <select
                value={activeLayer.fallbackModelId || ''}
                onChange={(e) => handleFallbackModelChange(activeLayer.id, e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs text-slate-800 font-medium"
              >
                <option value="">None (Fail immediately)</option>
                {availableModels
                  .filter((m) => m.modelId !== activeLayer.selectedModelId)
                  .map((m) => (
                    <option key={m.id} value={m.modelId}>
                      {m.displayName} ({m.provider})
                    </option>
                  ))}
              </select>
            </div>

            {/* Fallback Spec Summary */}
            {(() => {
              const fallbackModel = availableModels.find((m) => m.modelId === activeLayer.fallbackModelId);
              if (fallbackModel) {
                return (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Provider:</span>
                      <span className="font-semibold text-slate-900">{fallbackModel.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>P95 Latency:</span>
                      <span className="font-mono text-slate-900">{fallbackModel.latencyP95Ms} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failover Strategy:</span>
                      <span className="font-medium text-emerald-700">Instant hot-standby</span>
                    </div>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-500 italic">
                  No fallback model selected. If the primary model fails or times out, the step will immediately abort.
                </div>
              );
            })()}
          </div>
        </div>

        {/* Input & Output Contract Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-900 block mb-1">Input Contract:</span>
            <span className="text-slate-600 text-[11px]">{activeLayer.inputDescription}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-900 block mb-1">Output Contract:</span>
            <span className="text-slate-600 text-[11px]">{activeLayer.outputDescription}</span>
          </div>
        </div>
      </div>

      {/* Live Execution Simulator with Selected Tenant Models */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" />
              Live Pipeline Execution Simulator
            </h4>
            <p className="text-[11px] text-slate-500">
              Test how customer messages flow through your selected models using the platform-governed pipeline layers.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={simulationPrompt}
              onChange={(e) => setSimulationPrompt(e.target.value)}
              placeholder="Type customer message in Bangla, English or Banglish..."
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating || !simulationPrompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              {isSimulating ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Simulate Pipeline
                </>
              )}
            </button>
          </div>

          {/* Simulation Output Steps */}
          {simulatedSteps && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Multi-Layer Execution Trace
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Total Latency: 382ms · 0 errors
                </span>
              </div>

              {simulatedSteps.step1Intent && (
                <div className="space-y-1">
                  <span className="font-bold text-blue-700 text-[11px]">
                    Step 1 (Intent Analysis):
                  </span>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 font-mono text-[11px]">
                    {simulatedSteps.step1Intent}
                  </div>
                </div>
              )}

              {simulatedSteps.step2Multimodal && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-600 text-[11px]">
                    Steps 2 & 3 (Image & Voice Multimodal):
                  </span>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                    {simulatedSteps.step2Multimodal}
                  </div>
                </div>
              )}

              {simulatedSteps.step3Knowledge && (
                <div className="space-y-1">
                  <span className="font-bold text-emerald-700 text-[11px]">
                    Step 4 (Knowledge Base Grounding):
                  </span>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 text-[11px]">
                    {simulatedSteps.step3Knowledge}
                  </div>
                </div>
              )}

              {simulatedSteps.step4FinalReply && (
                <div className="space-y-1">
                  <span className="font-bold text-purple-700 text-[11px]">
                    Step 5 (Final Customer Response):
                  </span>
                  <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200 text-purple-950 text-xs leading-relaxed font-sans font-medium">
                    {simulatedSteps.step4FinalReply}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
