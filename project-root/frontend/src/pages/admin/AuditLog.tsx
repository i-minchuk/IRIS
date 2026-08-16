import { useEffect, useMemo } from 'react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useAuditStore } from '@/stores/auditStore';
import { AuditLogFilters } from '@/components/admin/AuditLogFilters';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function AuditLogPage() {
  const entries = useAuditStore(s => s.entries);
  const filter = useAuditStore(s => s.filter);
  const setFilter = useAuditStore(s => s.setFilter);
  const fetchEntries = useAuditStore(s => s.fetchEntries);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const stats = useMemo(() => ({
    total: entries.length,
    critical: entries.filter(e => e.severity === 'critical').length,
    warning: entries.filter(e => e.severity === 'warning').length,
    info: entries.filter(e => e.severity === 'info').length,
  }), [entries]);

  const filteredEntries = useMemo(() => entries.filter(entry => {
    if (filter.dateFrom && entry.timestamp < filter.dateFrom) return false;
    if (filter.dateTo && entry.timestamp > filter.dateTo) return false;
    if (filter.userId && entry.user_id !== filter.userId) return false;
    if (filter.action && entry.action !== filter.action) return false;
    if (filter.severity && entry.severity !== filter.severity) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      const text = `${entry.user_name} ${entry.details} ${entry.action}`.toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  }), [entries, filter]);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div>
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
          Журнал аудита
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          История действий пользователей и системы
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
            <Info size={18} style={{ color: 'var(--accent-docs)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stats.total}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Всего записей</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, var(--bg-surface))' }}>
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--error)' }}>{stats.critical}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Критических</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--bg-surface))' }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--warning)' }}>{stats.warning}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Предупреждений</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, var(--bg-surface))' }}>
            <Info size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>{stats.info}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Информационных</div>
          </div>
        </Card>
      </div>

      <AuditLogFilters filter={filter} onChange={setFilter} />

      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Результаты
          </h2>
          <Badge variant="neutral">
            {filteredEntries.length} записей
          </Badge>
        </div>
        <AuditLogTable entries={filteredEntries} />
      </Card>
    </div>
  );
}
