import React, { useState } from 'react';
import {
  AgentTool,
  ToolExecutionAuditLog,
  ToolPermissionLevel,
} from '../../types/tools';
import {
  Wrench,
  ShieldCheck,
  ShieldAlert,
  Code2,
  Lock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Eye,
  FileCode,
  SlidersHorizontal,
  Clock,
  Layers,
  ArrowRight,
  UserCheck,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface ToolsActionsViewProps {
  tools: AgentTool[];
  auditLogs: ToolExecutionAuditLog[];
  onUpdateTool: (updated: AgentTool) => void;
  onShowToast: (msg: string) => void;
}

export const ToolsActionsView: React.FC<ToolsActionsViewProps> = ({
  tools,
  auditLogs,
  onUpdateTool,
  onShowToast,
}) => {
  const [selectedTool, setSelectedTool] = useState<AgentTool | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | ToolPermissionLevel>('all');
  const [activeSubView, setActiveSubView] = useState<'tools_list' | 'execution_sandbox' | 'audit_log'>('tools_list');

  // Interactive Sandbox State
  const [sandboxToolId, setSandboxToolId] = useState<string>('tool_issue_refund');
  const [refundAmountInput, setRefundAmountInput] = useState<number>(850);
  const [refundPhoneInput, setRefundPhoneInput] = useState<string>('01712984210');
  const [orderPhoneMatch, setOrderPhoneMatch] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<{
    step1Proposal: Record<string, unknown>;
    step2Validation: { passed: boolean; reason: string; rule: string };
    step3AuthStatus: 'EXECUTED' | 'BLOCKED_BY_CODE' | 'REQUIRES_DUAL_APPROVAL';
    finalMessage: string;
  } | null>(null);

  const filteredTools = tools.filter((t) => {
    if (filterLevel !== 'all' && t.permissionLevel !== filterLevel) return false;
    return true;
  });

  const getPermissionBadge = (level: ToolPermissionLevel) => {
    switch (level) {
      case 'Read':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Read Only
          </span>
        );
      case 'Limited write':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Limited Write
          </span>
        );
      case 'Write':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Standard Write
          </span>
        );
      case 'Restricted write':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
            Restricted Write
          </span>
        );
      case 'High-impact action':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            High-Impact Action
          </span>
        );
    }
  };

  const getApprovalBadge = (req: AgentTool['approvalRequirement']) => {
    switch (req) {
      case 'autonomous':
        return <span className="text-[11px] font-semibold text-emerald-700">Autonomous Execution</span>;
      case 'user_confirmation':
        return <span className="text-[11px] font-semibold text-blue-700">Customer Confirmation</span>;
      case 'human_staff_approval':
        return <span className="text-[11px] font-semibold text-amber-700">Staff Sign-Off Required</span>;
      case 'dual_approval':
        return <span className="text-[11px] font-semibold text-rose-700 font-bold">Dual Admin Approval</span>;
    }
  };

  const handleToggleTool = (tool: AgentTool) => {
    const updated = { ...tool, isEnabled: !tool.isEnabled };
    onUpdateTool(updated);
    onShowToast(
      updated.isEnabled
        ? `Enabled tool: ${tool.name}`
        : `Disabled tool: ${tool.name} (AI blocked from calling)`
    );
  };

  const handleRunSandboxSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);

      if (sandboxToolId === 'tool_issue_refund') {
        const proposed = {
          tool: 'issue_refund',
          order_id: '49312',
          amount_bdt: refundAmountInput,
          recipient_mfs: refundPhoneInput,
        };

        // Enforce actual code ceiling
        if (refundAmountInput > 1000) {
          setSimulationResult({
            step1Proposal: proposed,
            step2Validation: {
              passed: false,
              rule: 'Hardcoded Backend Ceiling: `amount <= 1000`',
              reason: `Amount ৳${refundAmountInput.toLocaleString()} strictly exceeds the ৳1,000 autonomous maximum limit enforced in server code. Prompts alone cannot override this.`,
            },
            step3AuthStatus: 'BLOCKED_BY_CODE',
            finalMessage: 'Action Intercepted: Request blocked by server validator. Handover ticket generated for manual finance review.',
          });
          onShowToast('Action intercepted by code guardrail! Amount exceeds limit.');
        } else {
          setSimulationResult({
            step1Proposal: proposed,
            step2Validation: {
              passed: true,
              rule: 'Hardcoded Backend Ceiling: `amount <= 1000`',
              reason: `Amount ৳${refundAmountInput} is within acceptable limit (<= ৳1,000) and returned parcel status confirmed.`,
            },
            step3AuthStatus: 'REQUIRES_DUAL_APPROVAL',
            finalMessage: 'Validation Passed: Proposed refund queued. Approval card sent to Manager & Finance inbox before bKash API executes.',
          });
          onShowToast('Validated successfully: Action queued for staff dual-approval.');
        }
      } else if (sandboxToolId === 'tool_lookup_order') {
        const proposed = {
          tool: 'lookup_order',
          order_number: '49312',
          customer_phone: orderPhoneMatch ? '+8801712984210' : '+8801999999999',
        };

        if (!orderPhoneMatch) {
          setSimulationResult({
            step1Proposal: proposed,
            step2Validation: {
              passed: false,
              rule: 'Mandatory Phone Match Identity Check',
              reason: 'Customer phone does not match order record billing phone. Prevented unauthorized delivery address exposure.',
            },
            step3AuthStatus: 'BLOCKED_BY_CODE',
            finalMessage: 'Security Exception: Lookup blocked. Prompted customer for identity verification.',
          });
          onShowToast('Security Guardrail: Identity mismatch blocked.');
        } else {
          setSimulationResult({
            step1Proposal: proposed,
            step2Validation: {
              passed: true,
              rule: 'Mandatory Phone Match Identity Check',
              reason: 'Identity confirmed against incoming WhatsApp session ID.',
            },
            step3AuthStatus: 'EXECUTED',
            finalMessage: 'Order details and Steadfast tracking returned cleanly to conversation thread.',
          });
          onShowToast('Authorized: Order lookup executed.');
        }
      }
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wrench className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Autonomous Agent Tools & Actions
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {tools.filter((t) => t.isEnabled).length} of {tools.length} Tools Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Define what the agent can actually do beyond sending text. Model tool call proposals are strictly separated from backend execution. Each invocation is independently validated against code-enforced guardrails and approval rules before hitting live APIs.
              </p>
            </div>
          </div>

          {/* Subview Nav Toggles */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl text-xs shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubView('tools_list')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                activeSubView === 'tools_list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tool Registry
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('execution_sandbox')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'execution_sandbox'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Play className="w-3 h-3 text-blue-600" />
              <span>Guardrail Simulator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('audit_log')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'audit_log'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Audit Ledger</span>
            </button>
          </div>
        </div>

        {/* Fundamental Security Architecture Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <Code2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold">Enforced in Code, Not Prompts</strong>
              <p className="text-[11px] text-slate-500">Limits (e.g. max ৳1,000 refund) are hardcoded in backend validators. LLM prompts cannot bypass them.</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold">Independent Authorization</strong>
              <p className="text-[11px] text-slate-500">The model only proposes a tool call. The backend server authenticates customer identity and validates parameters before executing.</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold">Dual Approval Gates</strong>
              <p className="text-[11px] text-slate-500">High-impact actions (cancellations, refunds) require human staff sign-off before hitting payment or logistics gateways.</p>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Tool Registry & Cards */}
      {activeSubView === 'tools_list' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs">
              {(
                [
                  'all',
                  'Read',
                  'Limited write',
                  'Write',
                  'Restricted write',
                  'High-impact action',
                ] as const
              ).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFilterLevel(lvl as any)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer capitalize ${
                    filterLevel === lvl
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {lvl === 'all' ? 'All Tools' : lvl}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-mono shrink-0">
              {filteredTools.length} tools displayed
            </span>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className={`bg-white rounded-3xl border transition p-6 shadow-xs flex flex-col justify-between space-y-5 ${
                  tool.isEnabled
                    ? 'border-slate-200/90 hover:border-slate-300'
                    : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {tool.name}
                        </span>
                        {getPermissionBadge(tool.permissionLevel)}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                        {tool.label}
                      </h4>
                    </div>

                    {/* Enable / Disable Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleTool(tool)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer shrink-0 ${
                        tool.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          tool.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                    {tool.description}
                  </p>

                  {/* Operational Telemetry & Constraints */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Approval Requirement:</span>
                      {getApprovalBadge(tool.approvalRequirement)}
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Execution Timeout:</span>
                      <span className="font-mono text-slate-800 font-semibold">{tool.timeoutMs}ms</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Rate Limit:</span>
                      <span className="font-mono text-slate-800">
                        {tool.rateLimit.requestsPerMin} req/min (Burst: {tool.rateLimit.burstLimit})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Required Scope:</span>
                      <span className="font-mono text-blue-700 font-medium">
                        {tool.requiredPermissions.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Code Guardrails Box */}
                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Code-Enforced Guardrails</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-amber-900/90 list-disc list-inside leading-relaxed">
                      {tool.hardcodedCodeGuardrails.map((gr, idx) => (
                        <li key={idx} className="truncate" title={gr}>
                          {gr}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {tool.stats.callsToday.toLocaleString()} calls today ({tool.stats.successRate}%)
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedTool(tool)}
                    className="px-3.5 py-1.5 rounded-xl font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                    <span>Inspect Schema & I/O</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: Interactive Guardrail Sandbox */}
      {activeSubView === 'execution_sandbox' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-sm font-bold text-slate-900">
              Interactive Tool Call & Backend Validation Sandbox
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Experience the multi-stage authorization pipeline. Test how the backend server independently validates model tool call requests and blocks unauthorized proposals before reaching downstream APIs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input Sandbox Form */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Select Action to Test
                </label>
                <select
                  value={sandboxToolId}
                  onChange={(e) => {
                    setSandboxToolId(e.target.value);
                    setSimulationResult(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                >
                  <option value="tool_issue_refund">issue_refund (High-Impact Action)</option>
                  <option value="tool_lookup_order">lookup_order (Identity Verification Check)</option>
                </select>
              </div>

              {sandboxToolId === 'tool_issue_refund' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="font-semibold text-slate-700">
                        Proposed Refund Amount (BDT)
                      </label>
                      <span className="font-mono text-rose-600 font-bold">Hard Limit: ৳1,000</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={refundAmountInput}
                        onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setRefundAmountInput(850)}
                        className="px-2.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold"
                      >
                        Try ৳850 (Valid)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRefundAmountInput(1500)}
                        className="px-2.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold"
                      >
                        Try ৳1,500 (Blocked)
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      A prompt saying "never refund more than ৳1,000" is easily jailbroken. Backend validator enforces this limit in code.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Recipient bKash Wallet Number</label>
                    <input
                      type="text"
                      value={refundPhoneInput}
                      onChange={(e) => setRefundPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {sandboxToolId === 'tool_lookup_order' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-semibold text-slate-800 block">Identity Check Simulation</span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={orderPhoneMatch}
                        onChange={(e) => setOrderPhoneMatch(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Customer WhatsApp phone matches order billing record (+8801712984210)</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Unchecking the box simulates an attacker trying to query another customer's order ID.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleRunSandboxSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 text-emerald-400 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Validating Pipeline...' : 'Simulate Model Proposal & Backend Execution'}</span>
              </button>
            </div>

            {/* Right: Pipeline Inspection Execution Output */}
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                Backend Pipeline Execution State
              </span>

              {!simulationResult ? (
                <div className="h-64 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                  <Wrench className="w-8 h-8 text-slate-300" />
                  <p>Click "Simulate Model Proposal & Backend Execution" to view the 3-stage validation results.</p>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  {/* Stage 1: Model Proposal */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Stage 1: AI Model Proposes Tool Call
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Received payload</span>
                    </div>
                    <pre className="p-2 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto">
                      {JSON.stringify(simulationResult.step1Proposal, null, 2)}
                    </pre>
                  </div>

                  {/* Stage 2: Backend Code Validation */}
                  <div
                    className={`p-3.5 rounded-2xl border space-y-1 ${
                      simulationResult.step2Validation.passed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        {simulationResult.step2Validation.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        )}
                        Stage 2: Backend Independent Code Validator
                      </span>
                      <span className="text-[10px] font-bold uppercase">
                        {simulationResult.step2Validation.passed ? 'PASSED' : 'INTERCEPTED'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed pt-1">
                      {simulationResult.step2Validation.reason}
                    </p>
                  </div>

                  {/* Stage 3: Authorization & Execution Decision */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-slate-200">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Stage 3: Downstream Gateway Dispatch
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          simulationResult.step3AuthStatus === 'EXECUTED'
                            ? 'bg-emerald-500 text-slate-950'
                            : simulationResult.step3AuthStatus === 'BLOCKED_BY_CODE'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {simulationResult.step3AuthStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      {simulationResult.finalMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Audit Ledger */}
      {activeSubView === 'audit_log' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Tool Execution & Authorization Audit Ledger
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Immutable Server Audit Trail
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 font-semibold">Correlation ID</th>
                  <th className="py-3 px-4 font-semibold">Tool Name</th>
                  <th className="py-3 px-4 font-semibold">Customer ID</th>
                  <th className="py-3 px-4 font-semibold">Auth Decision</th>
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Result Summary / Guardrail</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {log.correlationId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800 font-bold">
                      {log.toolName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {log.customerMaskedId}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.authDecision === 'authorized' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Authorized
                        </span>
                      ) : log.authDecision === 'blocked_by_guardrail' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Blocked by Guardrail
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Pending Staff Sign-Off
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {log.executionTimeMs}ms
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={log.guardrailReason || log.resultSummary}>
                      {log.guardrailReason ? (
                        <span className="text-rose-600 font-medium">{log.guardrailReason}</span>
                      ) : (
                        log.resultSummary
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {log.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schema & I/O Inspector Modal */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedTool.name}
                  </span>
                  {getPermissionBadge(selectedTool.permissionLevel)}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedTool.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Schema Parameters */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Input Schema & Validation Rules
              </span>

              <div className="space-y-2">
                {Object.entries(selectedTool.inputSchema.properties).map(([fieldKey, prop]) => (
                  <div key={fieldKey} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono font-semibold text-slate-900">{fieldKey}</strong>
                        <span className="text-[10px] font-mono text-slate-400">({prop.type})</span>
                        {prop.required ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                            REQUIRED
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">optional</span>
                        )}
                      </div>
                      {prop.validationRule && (
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {prop.validationRule}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">{prop.description}</p>
                    {prop.exampleValue !== undefined && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        Example: <span className="text-slate-700">{JSON.stringify(prop.exampleValue)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Guardrails */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2 text-amber-900">
              <span className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Backend Hardcoded Security Guardrails
              </span>
              <ul className="space-y-1 text-[11px] list-disc list-inside leading-relaxed text-amber-950">
                {selectedTool.hardcodedCodeGuardrails.map((gr, idx) => (
                  <li key={idx}>{gr}</li>
                ))}
              </ul>
            </div>

            {/* Success & Failure Responses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block text-[11px]">Success Response Contract</span>
                <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-36">
                  {JSON.stringify(selectedTool.successResponseFormat, null, 2)}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 block text-[11px]">Failure Response Contract</span>
                <pre className="p-3 bg-slate-950 text-rose-400 font-mono text-[10px] rounded-xl overflow-x-auto max-h-36">
                  {JSON.stringify(selectedTool.failureResponseFormat, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
