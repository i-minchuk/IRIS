import { useState } from 'react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { useReleaseStore } from '@/stores/releaseStore';
import { ReleaseCard } from '@/components/admin/ReleaseCard';
import { ReleaseChecklist } from '@/components/admin/ReleaseChecklist';
import type { Release } from '@/types/release';
import { GitBranch, CheckCircle2 } from 'lucide-react';

const STATUS_TABS: { status: Release['status'] | 'all'; label: string }[] = [
  { status: 'all', label: 'Все' },
  { status: 'planning', label: 'Планирование' },
  { status: 'development', label: 'Разработка' },
  { status: 'testing', label: 'Тестирование' },
  { status: 'ready', label: 'Готовы' },
  { status: 'deployed', label: 'Развёрнуты' },
  { status: 'rolled_back', label: 'Откаты' },
];

export default function ReleasesPage() {
  const releases = useReleaseStore(s => s.releases);
  const selectedRelease = useReleaseStore(s => s.selectedRelease);
  const selectRelease = useReleaseStore(s => s.selectRelease);
  const toggleChecklistItem = useReleaseStore(s => s.toggleChecklistItem);
  const [activeTab, setActiveTab] = useState<Release['status'] | 'all'>('all');

  const filtered = activeTab === 'all'
    ? releases
    : releases.filter(r => r.status === activeTab);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>
            Управление релизами
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Чек-листы, утверждения и отслеживание релизов
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <GitBranch size={16} />
          <span>Всего релизов: {releases.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.status ? 'var(--brand-iris)' : 'var(--bg-surface-2)',
              color: activeTab === tab.status ? 'var(--text-inverse)' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Release List */}
        <div className="lg:col-span-1 space-y-3">
          {filtered.map(release => (
            <ReleaseCard
              key={release.id}
              release={release}
              onSelect={(r) => selectRelease(r.id === selectedRelease?.id ? null : r)}
              isSelected={selectedRelease?.id === release.id}
            />
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedRelease ? (
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedRelease.version} — {selectedRelease.name}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedRelease.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => selectRelease(null)}
                >
                  Закрыть
                </Button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Прогресс чек-листа</span>
                  <span>{selectedRelease.checklist_progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${selectedRelease.checklist_progress}%`,
                      backgroundColor: selectedRelease.checklist_progress === 100 ? 'var(--success)' : 'var(--brand-iris)',
                    }}
                  />
                </div>
              </div>

              <ReleaseChecklist
                items={selectedRelease.checklist}
                onToggle={(itemId) => toggleChecklistItem(selectedRelease.id, itemId)}
              />

              {selectedRelease.approved_by.length > 0 && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Утверждения
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelease.approved_by.map(name => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--success) 12%, var(--bg-surface-2))', color: 'var(--success)' }}
                      >
                        <CheckCircle2 size={12} />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card padding="lg" className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <GitBranch size={48} style={{ color: 'var(--text-tertiary)' }} className="mb-4 opacity-40" />
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Выберите релиз для просмотра чек-листа
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
