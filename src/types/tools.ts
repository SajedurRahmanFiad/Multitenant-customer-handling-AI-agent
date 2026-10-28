export type ToolPermissionLevel =
  | 'Read'
  | 'Limited write'
  | 'Write'
  | 'Restricted write'
  | 'High-impact action';

export type ToolClassification =
  | 'read'
  | 'limited_write'
  | 'write'
  | 'restricted_write'
  | 'high_impact';

export type ApprovalRequirement =
  | 'autonomous'
  | 'user_confirmation'
  | 'human_staff_approval'
  | 'dual_approval';

export interface ToolFieldProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  validationRule?: string;
  exampleValue?: unknown;
}

export interface AgentTool {
  id: string;
  name: string;
  label: string;
  description: string;
  permissionLevel: ToolPermissionLevel;
  classification: ToolClassification;
  requiredPermissions: string[];
  applicableTenant: string;
  timeoutMs: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    retryableStatuses: number[];
  };
  rateLimit: {
    requestsPerMin: number;
    burstLimit: number;
  };
  approvalRequirement: ApprovalRequirement;
  auditLogging: boolean;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolFieldProperty>;
    required: string[];
  };
  hardcodedCodeGuardrails: string[];
  successResponseFormat: Record<string, unknown>;
  failureResponseFormat: Record<string, unknown>;
  isEnabled: boolean;
  stats: {
    callsToday: number;
    successRate: number;
    avgExecutionMs: number;
  };
}

export interface ToolExecutionAuditLog {
  id: string;
  timestamp: string;
  correlationId: string;
  toolName: string;
  caller: 'ai_model' | 'human_staff' | 'scheduled_job';
  customerMaskedId: string;
  inputPayload: Record<string, unknown>;
  authDecision: 'authorized' | 'blocked_by_guardrail' | 'pending_approval' | 'rejected_by_staff';
  guardrailReason?: string;
  executionStatus: 'success' | 'failed' | 'pending' | 'intercepted';
  executionTimeMs: number;
  resultSummary: string;
}
