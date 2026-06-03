export type AuditAction =
  | 'user_login' | 'user_logout' | 'user_created' | 'user_updated' | 'user_deleted'
  | 'role_assigned' | 'permission_changed'
  | 'document_created' | 'document_updated' | 'document_deleted' | 'document_approved'
  | 'remark_added' | 'remark_resolved'
  | 'release_created' | 'release_deployed' | 'release_rolled_back'
  | 'ticket_created' | 'ticket_updated' | 'ticket_resolved'
  | 'incident_created' | 'incident_resolved'
  | 'mfa_enabled' | 'mfa_disabled' | 'session_revoked'
  | 'settings_changed' | 'backup_created';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditChange {
  field: string;
  old_value: string | null;
  new_value: string | null;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  user_id: number;
  user_name: string;
  user_email: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  severity: AuditSeverity;
  details: string;
  changes: AuditChange[];
  ip_address: string;
  user_agent: string;
}

export interface AuditFilter {
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
  action?: AuditAction;
  severity?: AuditSeverity;
  search?: string;
}
