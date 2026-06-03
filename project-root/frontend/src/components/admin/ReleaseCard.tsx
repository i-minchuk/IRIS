import type { Release } from '@/types/release';
import { Badge } from '@/components/ui';
import { Card } from '@/components/ui';
import { GitBranch, Calendar, CheckCircle2, AlertCircle, RotateCcw, User } from 'lucide-react';

const STATUS_CONFIG: Record<Release['status'], { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  planning: { label: 'Планирование', variant: 'neutral' },
  development: { label: 'Разработка', variant: 'info' },
  testing: { label: 'Тестирование', variant: 'warning' },
  staging: { label: 'Staging', variant: 'warning' },
  ready: { label: 'Готов к деплою', variant: 'success' },
  deployed: { label: 'Развёрнут', variant: 'success' },
  rolled_back: { label: 'Откат', variant: 'error' },
};

interface ReleaseCardProps {
  release: Release;
  onSelect?: (release: Release) => void;
  isSelected?: boolean;
}

export function ReleaseCard({ release, onSelect, isSelected }: ReleaseCardProps) {
  const status = STATUS_CONFIG[release.status];

  return (
    <Card
      padding="md"
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2' : 'hover:opacity-90'}`}
      style={isSelected ? { outline: '2px solid var(--brand-iris)' } : {}}
      onClick={() => onSelect?.(release)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {release.version}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <h3 className="font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{release.name}</h3>
        </div>
        {release.rollback_info && (
          <Badge variant="error" leftIcon={<RotateCcw size={12} />}>Откат</Badge>
        )}
      </div>

      <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
        {release.description}
      </p>

      <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
        <span className="flex items-center gap-1">
          <GitBranch size={12} /> {release.branch}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {release.planned_date}
        </span>
        {release.deployed_by && (
          <span className="flex items-center gap-1">
            <User size={12} /> {release.deployed_by}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>Чек-лист</span>
          <span>{release.checklist_progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${release.checklist_progress}%`,
              backgroundColor: release.checklist_progress === 100 ? 'var(--success)' : 'var(--brand-iris)',
            }}
          />
        </div>
      </div>

      {release.approved_by.length > 0 && (
        <div className="flex items-center gap-1 mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <CheckCircle2 size={12} />
          <span>Утвердили: {release.approved_by.join(', ')}</span>
        </div>
      )}

      {release.rollback_info && (
        <div className="mt-3 p-2 rounded-lg text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 8%, var(--bg-surface))', color: 'var(--error)' }}>
          <div className="flex items-center gap-1 font-medium">
            <AlertCircle size={12} />
            Откат: {release.rollback_info.reason}
          </div>
          <div className="mt-1 opacity-80">
            {release.rollback_info.rolled_back_by} • {new Date(release.rollback_info.rolled_back_at).toLocaleDateString('ru-RU')}
          </div>
        </div>
      )}
    </Card>
  );
}
