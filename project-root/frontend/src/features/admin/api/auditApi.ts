import apiClient from '@/shared/api/client';
import type { AuditAction, AuditLogEntry, AuditSeverity } from '@/types/audit';

/** Ответ backend /audit/logs (AuditLogResponse). */
interface AuditLogApiItem {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export interface AuditLogsParams {
  user_id?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

function deriveSeverity(item: AuditLogApiItem): AuditSeverity {
  const action = item.action.toLowerCase();
  if (action.includes('delete') || action.includes('revoke') || action.includes('fail')) {
    return 'critical';
  }
  if (action.includes('update') || action.includes('disable') || action.includes('reject')) {
    return 'warning';
  }
  return 'info';
}

function mapToEntry(item: AuditLogApiItem): AuditLogEntry {
  const changes = Object.keys(item.new_value ?? item.old_value ?? {}).map((field) => ({
    field,
    old_value: item.old_value?.[field] != null ? String(item.old_value[field]) : null,
    new_value: item.new_value?.[field] != null ? String(item.new_value[field]) : null,
  }));
  return {
    id: item.id,
    timestamp: item.created_at ?? '',
    user_id: item.user_id ?? 0,
    user_name: item.user_email ?? '—',
    user_email: item.user_email ?? '',
    action: item.action as AuditAction,
    resource_type: item.entity_type,
    resource_id: item.entity_id ?? '',
    severity: deriveSeverity(item),
    details: changes.length
      ? changes.map((c) => `${c.field}: ${c.old_value ?? '—'} → ${c.new_value ?? '—'}`).join('; ')
      : '',
    changes,
    ip_address: item.ip_address ?? '',
    user_agent: item.user_agent ?? '',
  };
}

export async function getAuditLogs(params: AuditLogsParams = {}): Promise<AuditLogEntry[]> {
  const { data } = await apiClient.get<AuditLogApiItem[]>('/audit/logs', {
    params: { limit: 200, ...params },
  });
  return data.map(mapToEntry);
}
