import React, { useEffect, useState } from 'react';
import {
  AgentConfigTab,
  AgentIdentityConfig,
  SystemInstructionsConfig,
  ConversationBehaviorConfig,
  AgentModeType,
  AgentConfigVersion,
  PipelineLayerConfig,
  HandoverRule,
  ResponseRulesConfig,
} from '../types/agentConfig';
import {
  INITIAL_IDENTITY,
  INITIAL_INSTRUCTIONS,
  INITIAL_BEHAVIOR,
  INITIAL_HANDOVER_RULES,
  INITIAL_RESPONSE_RULES,
  INITIAL_CONFIG_VERSIONS,
  INITIAL_PIPELINE_LAYERS,
} from '../data/agentConfigMockData';
import { INITIAL_PROVIDER_MODELS } from '../data/platformAdminMockData';
import { IdentityPersonalityView } from '../components/agent-config/IdentityPersonalityView';
import { MultiLayerPipelineView } from '../components/agent-config/MultiLayerPipelineView';
import { SystemInstructionsView } from '../components/agent-config/SystemInstructionsView';
import { ConversationBehaviorView } from '../components/agent-config/ConversationBehaviorView';
import { AgentModesView } from '../components/agent-config/AgentModesView';
import { ToolsActionsView } from '../components/agent-config/ToolsActionsView';
import { AgentTool, ToolExecutionAuditLog } from '../types/tools';
import { INITIAL_AGENT_TOOLS, INITIAL_TOOL_AUDIT_LOGS } from '../data/toolsMockData';
import { api } from '../lib/api';
import {
  User,
  Layers,
  FileCode,
  SlidersHorizontal,
  Wrench,
  Zap,
  CheckCircle2,
  Save,
  Send,
} from 'lucide-react';
import { SubPageNav } from '../components/navigation/SubPageNav';
import { useUrlQueryState } from '../hooks/useUrlQueryState';

interface AgentConfigApiResponse {
  mode: AgentModeType;
  identity: AgentIdentityConfig;
  instructions: SystemInstructionsConfig;
  behavior: ConversationBehaviorConfig;
  responseRules: ResponseRulesConfig;
  handoverRules: HandoverRule[];
  pipeline: { layers: PipelineLayerConfig[] };
  versions: Array<AgentConfigVersion & { handoverRules?: HandoverRule[] }>;
}

export const AgentConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useUrlQueryState<AgentConfigTab>('tab', 'identity', [
    'identity', 'pipeline', 'instructions', 'behavior', 'tools', 'modes',
  ]);

  // Working Configuration State
  const [identity, setIdentity] = useState<AgentIdentityConfig>(INITIAL_IDENTITY);
  const [pipelineLayers, setPipelineLayers] = useState<PipelineLayerConfig[]>(INITIAL_PIPELINE_LAYERS);
  const [instructions, setInstructions] = useState<SystemInstructionsConfig>(INITIAL_INSTRUCTIONS);
  const [behavior, setBehavior] = useState<ConversationBehaviorConfig>(INITIAL_BEHAVIOR);
  const [handoverRules, setHandoverRules] = useState<HandoverRule[]>(INITIAL_HANDOVER_RULES);
  const [responseRules, setResponseRules] = useState<ResponseRulesConfig>(INITIAL_RESPONSE_RULES);
  const [mode, setMode] = useState<AgentModeType>('automatic');
  const [versions, setVersions] = useState<AgentConfigVersion[]>(INITIAL_CONFIG_VERSIONS);
  const [agentTools, setAgentTools] = useState<AgentTool[]>(INITIAL_AGENT_TOOLS);
  const [toolAuditLogs, setToolAuditLogs] = useState<ToolExecutionAuditLog[]>(INITIAL_TOOL_AUDIT_LOGS);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configLoadError, setConfigLoadError] = useState<string | null>(null);
  const [configReloadKey, setConfigReloadKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingConfig(true);

    Promise.all([
      api.get<AgentConfigApiResponse>('/agent/config'),
      api.get<{ tools: AgentTool[] }>('/tools'),
      api.get<{ logs: ToolExecutionAuditLog[] }>('/tools/audit-logs'),
    ])
      .then(([config, tools, audit]) => {
        if (cancelled) return;
        setIdentity(config.identity);
        setInstructions(config.instructions);
        setBehavior(config.behavior);
        setMode(config.mode);
        setResponseRules(config.responseRules);
        setHandoverRules(config.handoverRules);
        setPipelineLayers(config.pipeline.layers.map((layer) => ({
          ...layer,
          selectedProvider: layer.selectedProvider || INITIAL_PROVIDER_MODELS.find((model) => model.modelId === layer.selectedModelId)?.provider || '',
        })));
        setVersions(config.versions.map((version) => ({
          ...version,
          handoverRules: version.handoverRules ?? config.handoverRules,
        })));
        setAgentTools(tools.tools);
        setToolAuditLogs(audit.logs);
        setConfigLoadError(null);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setConfigLoadError(error instanceof Error ? error.message : 'Could not load agent configuration');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingConfig(false);
      });

    return () => { cancelled = true; };
  }, [configReloadKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateTool = async (updated: AgentTool) => {
    try {
      const result = await api.patch<{ tool: Partial<AgentTool> }>(`/tools/${updated.id}`, {
        isEnabled: updated.isEnabled,
        approvalRequirement: updated.approvalRequirement,
        timeoutMs: updated.timeoutMs,
        rateLimit: updated.rateLimit,
        retryPolicy: updated.retryPolicy,
        description: updated.description,
      });
      setAgentTools((prev) => prev.map((tool) => (
        tool.id === updated.id ? { ...tool, ...result.tool } : tool
      )));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save tool settings');
    }
  };

  const handleUpdateLayer = (updated: PipelineLayerConfig) => {
    setPipelineLayers((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  // 1. Mode Change
  const handleChangeMode = (newMode: AgentModeType) => {
    setMode(newMode);
    showToast(`Operational mode switched to ${newMode.replace('_', ' ').toUpperCase()}`);
  };

  const persistDraft = async () => {
    await api.put('/agent/identity', identity);
    await api.put('/agent/instructions', instructions);
    await api.put('/agent/behavior', behavior);
    await api.put('/agent/mode', { mode });
    await Promise.all(pipelineLayers.map((layer) => api.patch(`/agent/pipeline/${layer.id}`, {
      title: layer.title,
      description: layer.description,
      selectedModelId: layer.selectedModelId,
      fallbackModelId: layer.fallbackModelId,
      temperature: layer.temperature,
      maxTokens: layer.maxTokens,
      systemPrompt: layer.systemPrompt,
      isEnabled: layer.isEnabled,
    })));
  };

  // 2. Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await persistDraft();
      showToast('Agent configuration draft saved');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save agent configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Publish Version
  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await persistDraft();
      await api.post('/agent/publish', { summary: 'Published changes' });
      setConfigReloadKey((key) => key + 1);
      showToast('Agent configuration published successfully');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not publish agent configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingConfig) {
    return <div className="p-6 text-sm text-slate-600">Loading agent configuration...</div>;
  }

  if (configLoadError) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-red-700">{configLoadError}</p>
        <button
          type="button"
          onClick={() => setConfigReloadKey((key) => key + 1)}
          className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white"
        >
          Retry loading
        </button>
      </div>
    );
  }

  const SUBPAGES = [
    {
      id: 'identity' as AgentConfigTab,
      label: 'Identity & Personality',
      icon: User,
      group: 'CONFIGURATION',
    },
    {
      id: 'pipeline' as AgentConfigTab,
      label: 'Model Pipeline Layers',
      icon: Layers,
      badge: `${pipelineLayers.filter((l) => l.isEnabled).length} Active`,
      badgeVariant: 'purple' as const,
      group: 'CONFIGURATION',
    },
    {
      id: 'instructions' as AgentConfigTab,
      label: 'System Instructions',
      icon: FileCode,
      group: 'CONFIGURATION',
    },
    {
      id: 'behavior' as AgentConfigTab,
      label: 'Conversation Behavior',
      icon: SlidersHorizontal,
      group: 'CONFIGURATION',
    },
    {
      id: 'tools' as AgentConfigTab,
      label: 'Tools & Actions',
      icon: Wrench,
      count: agentTools.filter((t) => t.isEnabled).length,
      group: 'CONFIGURATION',
    },
    {
      id: 'modes' as AgentConfigTab,
      label: 'Agent Modes',
      icon: Zap,
      badge: mode === 'automatic' ? 'Auto' : mode === 'suggestion' ? 'Suggest' : 'Restricted',
      group: 'SAFETY & CONTROL',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Tabs (Vertical Sidebar on Desktop, Horizontal Scroll on Mobile) */}
        <SubPageNav
          tabs={SUBPAGES}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          extraSidebarContent={
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Changes</span>
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Save Draft</span>
              </button>
            </div>
          }
        />

        {/* Content Panel */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Mobile Action Controls */}
          <div className="flex lg:hidden items-center justify-between p-2.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-xs font-semibold text-slate-600">Quick Actions</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Draft</span>
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            </div>
          </div>
        {activeTab === 'identity' && (
          <IdentityPersonalityView config={identity} onChange={setIdentity} />
        )}

        {activeTab === 'pipeline' && (
          <MultiLayerPipelineView
            layers={pipelineLayers}
            availableModels={INITIAL_PROVIDER_MODELS}
            onUpdateLayer={handleUpdateLayer}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'instructions' && (
          <SystemInstructionsView
            config={instructions}
            onChange={setInstructions}
          />
        )}

        {activeTab === 'behavior' && (
          <ConversationBehaviorView config={behavior} onChange={setBehavior} />
        )}

        {activeTab === 'tools' && (
          <ToolsActionsView
            tools={agentTools}
            auditLogs={toolAuditLogs}
            onUpdateTool={handleUpdateTool}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'modes' && (
          <AgentModesView
            currentMode={mode}
            onChangeMode={handleChangeMode}
          />
        )}

        </div>
      </div>

    </div>
  );
};
