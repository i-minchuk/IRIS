import { useState } from 'react';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Search, RotateCcw, Filter } from 'lucide-react';
import type { DocumentStatus } from '@/lib/documentStatusMachine';
import { ALL_STATUSES, getStatusLabel } from '@/lib/documentStatusMachine';

export interface DocumentFilters {
  search?: string;
  status?: DocumentStatus;
  discipline?: string;
  projectId?: number;
}

interface DocumentFilterPanelProps {
  filters: DocumentFilters;
  onChange: (filters: DocumentFilters) => void;
  disciplines: string[];
}

export function DocumentFilterPanel({ filters, onChange, disciplines }: DocumentFilterPanelProps) {
  const [local, setLocal] = useState<DocumentFilters>(filters);

  const apply = () => onChange(local);
  const reset = () => {
    const empty: DocumentFilters = {};
    setLocal(empty);
    onChange(empty);
  };

  return (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Фильтры</span>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <Input
              value={local.search || ''}
              onChange={(e) => setLocal({ ...local, search: e.target.value })}
              placeholder="Поиск по шифру или названию..."
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <select
            value={local.status || ''}
            onChange={(e) => setLocal({ ...local, status: (e.target.value as DocumentStatus) || undefined })}
            className="h-10 px-3 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          >
            <option value="">Все статусы</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={local.discipline || ''}
            onChange={(e) => setLocal({ ...local, discipline: e.target.value || undefined })}
            className="h-10 px-3 rounded-lg text-sm border outline-none"
            style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          >
            <option value="">Все дисциплины</option>
            {disciplines.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={apply} size="sm">Применить</Button>
          <Button variant="ghost" size="sm" onClick={reset} leftIcon={<RotateCcw size={14} />}>
            Сброс
          </Button>
        </div>
      </div>
    </div>
  );
}
