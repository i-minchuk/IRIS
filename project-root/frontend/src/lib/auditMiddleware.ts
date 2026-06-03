import type { AuditAction, AuditSeverity } from '@/types/audit';
import { useAuditStore } from '@/stores/auditStore';

let nextId = 1000;

export function logAudit(
  action: AuditAction,
  details: string,
  options: {
    severity?: AuditSeverity;
    resourceType?: string;
    resourceId?: string;
    changes?: { field: string; old_value: string | null; new_value: string | null }[];
    userId?: number;
    userName?: string;
    userEmail?: string;
  } = {}
) {
  const entry = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    user_id: options.userId ?? 1,
    user_name: options.userName ?? 'System',
    user_email: options.userEmail ?? 'system@dokpotok.ru',
    action,
    resource_type: options.resourceType ?? 'system',
    resource_id: options.resourceId ?? String(nextId),
    severity: options.severity ?? 'info',
    details,
    changes: options.changes ?? [],
    ip_address: '127.0.0.1',
    user_agent: 'DokPotok IRIS',
  };

  const store = useAuditStore.getState();
  store.setEntries([entry, ...store.entries]);
}
