import { useState } from 'react';
import type { AuditFilter, AuditAction, AuditSeverity } from '@/types/audit';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Search, RotateCcw } from 'lucide-react';

const ACTIONS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: 'Все действия' },
  { value: 'user_login', label: 'Вход' },
  { value: 'user_created', label: 'Создание пользователя' },
  { value: 'user_updated', label: 'Обновление пользователя' },
  { value: 'document_approved', label: 'Согласование документа' },
  { value: 'document_created', label: 'Создание документа' },
  { value: 'release_deployed', label: 'Развёртывание' },
  { value: 'release_rolled_back', label: 'Откат' },
  { value: 'ticket_created', label: 'Создание тикета' },
  { value: 'ticket_resolved', label: 'Решение тикета' },
  { value: 'incident_created', label: 'Инцидент' },
  { value: 'mfa_enabled', label: 'Включение 2FA' },
  { value: 'settings_changed', label: 'Изменение настроек' },
];

const SEVERITIES: { value: AuditSeverity | ''; label: string }[] = [
  { value: '', label: 'Все уровни' },
  { value: 'info', label: 'Информация' },
  { value: 'warning', label: 'Предупреждение' },
  { value: 'critical', label: 'Критический' },
];

interface AuditLogFiltersProps {
  filter: AuditFilter;
  onChange: (filter: AuditFilter) => void;
}

export function AuditLogFilters({ filter, onChange }: AuditLogFiltersProps) {
  const [localFilter, setLocalFilter] = useState<AuditFilter>(filter);

  const handleApply = () => {
    onChange(localFilter);
  };

  const handleReset = () => {
    const empty: AuditFilter = {};
    setLocalFilter(empty);
    onChange(empty);
  };

  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Поиск
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <Input
              value={localFilter.search || ''}
              onChange={(e) => setLocalFilter({ ...localFilter, search: e.target.value })}
              placeholder="Пользователь, действие, детали..."
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            С даты
          </label>
          <Input
            type="date"
            value={localFilter.dateFrom || ''}
            onChange={(e) => setLocalFilter({ ...localFilter, dateFrom: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            По дату
          </label>
          <Input
            type="date"
            value={localFilter.dateTo || ''}
            onChange={(e) => setLocalFilter({ ...localFilter, dateTo: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Действие
          </label>
          <select
            value={localFilter.action || ''}
            onChange={(e) => setLocalFilter({ ...localFilter, action: (e.target.value as AuditAction) || undefined })}
            className="h-10 px-3 rounded-lg text-sm border outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {ACTIONS.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Уровень
          </label>
          <select
            value={localFilter.severity || ''}
            onChange={(e) => setLocalFilter({ ...localFilter, severity: (e.target.value as AuditSeverity) || undefined })}
            className="h-10 px-3 rounded-lg text-sm border outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {SEVERITIES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApply} leftIcon={<Search size={14} />}>
            Применить
          </Button>
          <Button variant="ghost" onClick={handleReset} leftIcon={<RotateCcw size={14} />}>
            Сброс
          </Button>
        </div>
      </div>
    </div>
  );
}
