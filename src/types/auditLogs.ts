export type AuditActionType =
  | 'agent_toggle'
  | 'policy_published'
  | 'knowledge_reindexed'
  | 'agent_takeover'
  | 'integration_changed'
  | 'tool_call_executed'
  | 'refund_issued'
  | 'order_action'
  | 'credentials_changed'
  | 'permission_changed'
  | 'customer_data_exported'
  | 'customer_data_erased';

export type AuditOutcome = 'success' | 'denied' | 'failed';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    email: string;
    role: string;
    ipAddress: string;
  };
  actionType: AuditActionType;
  actionTitle: string;
  description: string;
  outcome: AuditOutcome;
  correlationId: string;
  sanitizedMetadata: Record<string, string | number | boolean>;
  targetResource: string;
}
