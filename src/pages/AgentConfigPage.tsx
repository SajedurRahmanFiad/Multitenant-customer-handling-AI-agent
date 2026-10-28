import React, { useState } from 'react';
import {
  AgentConfigTab,
  AgentIdentityConfig,
  SystemInstructionsConfig,
  ConversationBehaviorConfig,
  HandoverRule,
  ResponseRulesConfig,
  AgentModeType,
  AgentConfigVersion,
  PipelineLayerConfig,
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
import { HumanHandoverRulesView } from '../components/agent-config/HumanHandoverRulesView';
import { ResponseRulesView } from '../components/agent-config/ResponseRulesView';
import { AgentModesView } from '../components/agent-config/AgentModesView';
import { ConfigVersionHistoryView } from '../components/agent-config/ConfigVersionHistoryView';
import { ToolsActionsView } from '../components/agent-config/ToolsActionsView';
import { AgentTool, ToolExecutionAuditLog } from '../types/tools';
import { INITIAL_AGENT_TOOLS, INITIAL_TOOL_AUDIT_LOGS } from '../data/toolsMockData';
import {
  User,
  Layers,
  FileCode,
  SlidersHorizontal,
  Wrench,
  ArrowRightLeft,
  FileCheck2,
  Zap,
  History,
  CheckCircle2,
  Save,
  Send,
  X,
  ShieldCheck,
} from 'lucide-react';
import { SubPageNav } from '../components/navigation/SubPageNav';

export const AgentConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AgentConfigTab>('identity');

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

  // Modals & Toast State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishSummary, setPublishSummary] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateTool = (updated: AgentTool) => {
    setAgentTools((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleUpdateLayer = (updated: PipelineLayerConfig) => {
    setPipelineLayers((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  // 1. Handover Rules CRUD
  const handleAddHandoverRule = (newRule: Omit<HandoverRule, 'id'>) => {
    const rule: HandoverRule = {
      ...newRule,
      id: `rule_${Date.now()}`,
    };
    setHandoverRules((prev) => [rule, ...prev]);
    showToast(`Handover trigger "${rule.name}" created`);
  };

  const handleUpdateHandoverRule = (updatedRule: HandoverRule) => {
    setHandoverRules((prev) =>
      prev.map((r) => (r.id === updatedRule.id ? updatedRule : r))
    );
    showToast(`Handover rule "${updatedRule.name}" updated`);
  };

  const handleDeleteHandoverRule = (id: string) => {
    const rule = handoverRules.find((r) => r.id === id);
    setHandoverRules((prev) => prev.filter((r) => r.id !== id));
    showToast(`Handover rule "${rule?.name || 'Item'}" removed`);
  };

  // 2. Mode Change
  const handleChangeMode = (newMode: AgentModeType) => {
    setMode(newMode);
    showToast(`Operational mode switched to ${newMode.replace('_', ' ').toUpperCase()}`);
  };

  // 3. Save Draft
  const handleSaveDraft = () => {
    showToast('Agent configuration draft saved to local workspace');
  };

  // 4. Publish Version
  const handleConfirmPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishSummary.trim()) return;

    const nextVer = `v2.4.${versions.length + 1}`;
    const newVersion: AgentConfigVersion = {
      version: nextVer,
      publishedAt: 'Just now',
      publishedBy: 'Sajedur Rahman',
      summary: publishSummary.trim(),
      mode,
      identity,
      instructions,
      behavior,
      handoverRules,
      responseRules,
      isLive: true,
    };

    setVersions((prev) => [
      newVersion,
      ...prev.map((v) => ({ ...v, isLive: false })),
    ]);

    setPublishSummary('');
    setIsPublishModalOpen(false);
    showToast(`Configuration ${nextVer} published live across Messenger & WhatsApp!`);
  };

  // 5. Restore Version
  const handleRollbackVersion = (ver: AgentConfigVersion) => {
    setIdentity(ver.identity);
    setInstructions(ver.instructions);
    setBehavior(ver.behavior);
    setHandoverRules(ver.handoverRules);
    setResponseRules(ver.responseRules);
    setMode(ver.mode);

    setVersions((prev) =>
      prev.map((v) => ({
        ...v,
        isLive: v.version === ver.version,
      }))
    );

    showToast(`Agent configuration restored to ${ver.version}`);
  };

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
      id: 'handover' as AgentConfigTab,
      label: 'Human Handover',
      icon: ArrowRightLeft,
      count: handoverRules.filter((r) => r.isActive).length,
      group: 'SAFETY & CONTROL',
    },
    {
      id: 'response_rules' as AgentConfigTab,
      label: 'Response Rules',
      icon: FileCheck2,
      group: 'SAFETY & CONTROL',
    },
    {
      id: 'modes' as AgentConfigTab,
      label: 'Agent Modes',
      icon: Zap,
      badge: mode === 'automatic' ? 'Auto' : mode === 'suggestion' ? 'Suggest' : 'Restricted',
      group: 'SAFETY & CONTROL',
    },
    {
      id: 'history' as AgentConfigTab,
      label: 'Version History',
      icon: History,
      count: versions.length,
      group: 'VERSION CONTROL',
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
                onClick={() => setIsPublishModalOpen(true)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Changes</span>
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
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
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Draft</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(true)}
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

        {activeTab === 'handover' && (
          <HumanHandoverRulesView
            rules={handoverRules}
            onAddRule={handleAddHandoverRule}
            onUpdateRule={handleUpdateHandoverRule}
            onDeleteRule={handleDeleteHandoverRule}
          />
        )}

        {activeTab === 'response_rules' && (
          <ResponseRulesView
            config={responseRules}
            onChange={setResponseRules}
          />
        )}

        {activeTab === 'modes' && (
          <AgentModesView
            currentMode={mode}
            onChangeMode={handleChangeMode}
          />
        )}

        {activeTab === 'history' && (
          <ConfigVersionHistoryView
            versions={versions}
            onRollbackVersion={handleRollbackVersion}
          />
        )}
        </div>
      </div>

      {/* Publish Configuration Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsPublishModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Publish Configuration to Live Agent
              </h3>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will create a new immutable configuration release and deploy the instructions, tone, handover thresholds, and operational mode immediately across your active Messenger and WhatsApp channels.
            </p>

            <form onSubmit={handleConfirmPublish} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Change Summary / Release Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={publishSummary}
                  onChange={(e) => setPublishSummary(e.target.value)}
                  placeholder="e.g. Updated tone to Friendly, added 45-min follow-up rule, configured bKash payment handover trigger..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 resize-none font-sans"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Target Mode:</span>
                  <span className="capitalize font-bold text-slate-900">{mode.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Active Handover Rules:</span>
                  <span className="font-mono text-slate-900">
                    {handoverRules.filter((r) => r.isActive).length} active
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Publish Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
