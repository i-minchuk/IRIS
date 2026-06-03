import { useState } from 'react';
import type { AuditLogEntry } from '@/types/audit';
import { Badge } from '@/components/ui';
import { ChevronLeft, ChevronRight, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: { variant: 'error' as const, icon: AlertCircle },
  warning: { variant: 'warning' as const, icon: AlertTriangle },
  info: { variant: 'info' as const, icon: Info },
};

const ACTION_LABELS: Record<string, string> = {
  user_login: 'Вход',
  user_logout: 'Выход',
  user_created: 'Создание пользователя',
  user_updated: 'Обновление пользователя',
  user_deleted: 'Удаление пользователя',
  role_assigned: 'Назначение роли',
  permission_changed: 'Изменение прав',
  document_created: 'Создание документа',
  document_updated: 'Обновление документа',
  document_deleted: 'Удаление документа',
  document_approved: 'Согласование документа',
  remark_added: 'Добавление замечания',
  remark_resolved: 'Решение замечания',
  release_created: 'Создание релиза',
  release_deployed: 'Развёртывание',
  release_rolled_back: 'Откат релиза',
  ticket_created: 'Создание тикета',
  ticket_updated: 'Обновление тикета',
  ticket_resolved: 'Решение тикета',
  incident_created: 'Инцидент',
  incident_resolved: 'Решение инцидента',
  mfa_enabled: 'Включение 2FA',
  mfa_disabled: 'Отключение 2FA',
  session_revoked: 'Отзыв сессии',
  settings_changed: 'Изменение настроек',
  backup_created: 'Бэкап',
};

interface AuditLogTableProps {
  entries: AuditLogEntry[];
}

export function AuditLogTable({ entries }: AuditLogTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(entries.length / pageSize);
  const paginated = entries.slice((page - 1) * pageSize, page * pageSize);

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-default)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface-2)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Время</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Пользователь</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Действие</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Ресурс</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Уровень</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Детали</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((entry) => {
              const sev = SEVERITY_CONFIG[entry.severity];
              const SevIcon = sev.icon;
              return (
                <tr
                  key={entry.id}
                  className="border-t transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
                >
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(entry.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <div style={{ color: 'var(--text-primary)' }}>{entry.user_name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{entry.user_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: 'var(--text-primary)' }}>
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                      {entry.resource_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={sev.variant} leftIcon={<SevIcon size={12} />}>
                      {entry.severity === 'critical' ? 'Критический' : entry.severity === 'warning' ? 'Предупреждение' : 'Информация'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }} title={entry.details}>
                    {entry.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Записей: {entries.length} | Страница {page} из {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border disabled:opacity-40 transition-colors"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
