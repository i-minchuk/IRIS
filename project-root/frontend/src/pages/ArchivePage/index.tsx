// src/pages/ArchivePage/index.tsx
import React, { useEffect } from 'react';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageTabs } from '@/shared/components/PageTabs';
import { Timeline } from './components/Timeline';
import { ArchiveSearch } from './components/ArchiveSearch';
import { MaterialsList } from './components/MaterialsList';
import { ConstructionsList } from './components/ConstructionsList';
import { ArchiveStatistics } from './components/ArchiveStatistics';
import { useArchiveStore } from './store/archiveStore';
import { TimelineEvent } from './types/archive';

import {
  CalendarDays, Search, BrickWall, Construction, BarChart3
} from 'lucide-react';

type ViewMode = 'timeline' | 'search' | 'materials' | 'constructions' | 'statistics';

const TAB_COLOR = '#6B7280';

const TABS = [
  { key: 'timeline' as ViewMode, label: 'Таймлайн', icon: <CalendarDays size={16} />, color: TAB_COLOR },
  { key: 'search' as ViewMode, label: 'Поиск', icon: <Search size={16} />, color: TAB_COLOR },
  { key: 'materials' as ViewMode, label: 'Материалы', icon: <BrickWall size={16} />, color: TAB_COLOR },
  { key: 'constructions' as ViewMode, label: 'Конструкции', icon: <Construction size={16} />, color: TAB_COLOR },
  { key: 'statistics' as ViewMode, label: 'Статистика', icon: <BarChart3 size={16} />, color: TAB_COLOR },
];

const ArchivePage: React.FC = () => {
  const [viewMode, setViewMode] = useTabState<ViewMode>('iris_archive_tab', 'timeline');
  const { 
    timeline, 
    statistics,
    selectedEntry, 
    selectedMaterial, 
    selectedConstruction,
    selectEntry, 
    selectMaterial, 
    selectConstruction,
    setProjectId,
    isLoading 
  } = useArchiveStore();

  // При загрузке страницы - запросить projectId из URL или использовать дефолтный
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project_id');
    if (projectId) {
      setProjectId(projectId);
    }
  }, []);

  const handleSelectEvent = (event: TimelineEvent) => {
    // Преобразуем TimelineEvent в ArchiveEntry для совместимости
    const entry: any = {
      id: event.id,
      title: event.title,
      occurred_at: event.occurred_at,
      entry_type: event.type,
      content_snapshot: event.data,
    };
    selectEntry(entry);
  };

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--iris-bg-app)', color: 'var(--iris-text-primary)' }}>
      {/* Шапка + табы */}
      <div className="px-4 sm:px-6 py-3 border-b" style={{ background: 'var(--iris-bg-surface-elevated)', borderColor: 'var(--iris-border-default)' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="sr-only" style={{ color: 'var(--iris-text-primary)' }}>📁 АРХИВ</h1>
            <p className="text-sm" style={{ color: 'var(--iris-text-muted)' }}>
              Хронология и материалы проекта
            </p>
          </div>
          {statistics && (
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--iris-text-muted)' }}>
              <span>Событий: <strong className="text-sm" style={{ color: 'var(--iris-text-primary)' }}>{statistics.total_entries}</strong></span>
              <span>Материалов: <strong className="text-sm" style={{ color: 'var(--iris-text-primary)' }}>{statistics.materials_count}</strong></span>
              <span>Конструкций: <strong className="text-sm" style={{ color: 'var(--iris-text-primary)' }}>{statistics.constructions_count}</strong></span>
            </div>
          )}
        </div>
        <PageTabs tabs={TABS} active={viewMode} onChange={setViewMode} color={TAB_COLOR} />
      </div>

      {/* Контент */}
      <div className="flex flex-1 overflow-hidden">
        {/* Центральная колонка - контент */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--iris-bg-app)' }}>
          {viewMode === 'timeline' && (
            <Timeline 
              events={timeline} 
              onSelectEvent={handleSelectEvent}
              isLoading={isLoading}
            />
          )}

          {viewMode === 'search' && (
            <ArchiveSearch />
          )}

          {viewMode === 'materials' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--iris-text-primary)' }}>Материалы</h2>
                <button 
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                  style={{ background: 'var(--iris-accent-green)' }}
                >
                  + Добавить материал
                </button>
              </div>
              <MaterialsList />
            </div>
          )}

          {viewMode === 'constructions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--iris-text-primary)' }}>Конструкции</h2>
                <button 
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                  style={{ background: 'var(--iris-accent-green)' }}
                >
                  + Добавить конструкцию
                </button>
              </div>
              <ConstructionsList />
            </div>
          )}

          {viewMode === 'statistics' && (
            <ArchiveStatistics
              statistics={statistics}
              entries={timeline.map((e) => ({
                id: e.id,
                project_id: '',
                entry_type: e.type as any,
                source_table: '',
                source_id: e.id,
                title: e.title,
                description: null,
                content_snapshot: e.data,
                author_id: null,
                occurred_at: e.occurred_at,
                tags: [],
                attachments: [],
                related_entry_ids: [],
                is_pinned: false,
                is_deleted: false,
                created_at: e.occurred_at,
                updated_at: e.occurred_at,
              }))}
              timeline={timeline}
            />
          )}
        </div>

        {/* Правая колонка - детали */}
        {(selectedEntry || selectedMaterial || selectedConstruction) && (
          <div className="w-96 border-l p-4 overflow-y-auto" style={{ borderColor: 'var(--iris-border-default)', background: 'var(--iris-bg-surface-elevated)' }}>
            <button
              onClick={() => {
                selectEntry(null);
                selectMaterial(null);
                selectConstruction(null);
              }}
              className="mb-4 flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: 'var(--iris-text-muted)' }}
            >
              ← Назад
            </button>
            
            {selectedEntry && (
              <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-card)', border: '1px solid var(--iris-border-default)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--iris-text-primary)' }}>{selectedEntry.title}</h2>
                  {selectedEntry.is_pinned && <span>📌</span>}
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--iris-text-muted)' }}>
                  {new Date(selectedEntry.occurred_at).toLocaleString('ru-RU')}
                </p>
                
                {selectedEntry.description && (
                  <p className="text-sm mb-4" style={{ color: 'var(--iris-text-primary)' }}>{selectedEntry.description}</p>
                )}

                <div className="text-sm">
                  <p className="mb-2" style={{ color: 'var(--iris-text-muted)' }}>Тип:</p>
                  <p className="capitalize px-3 py-2 rounded" style={{ background: 'var(--iris-bg-surface)', color: 'var(--iris-text-primary)' }}>
                    {selectedEntry.entry_type}
                  </p>
                </div>

                {selectedEntry.content_snapshot && (
                  <div className="mt-4">
                    <p className="mb-2" style={{ color: 'var(--iris-text-muted)' }}>Данные:</p>
                    <pre className="text-xs p-3 rounded overflow-auto max-h-64" style={{ background: 'var(--iris-bg-surface)', color: 'var(--iris-text-primary)' }}>
                      {JSON.stringify(selectedEntry.content_snapshot, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {selectedMaterial && (
              <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-card)', border: '1px solid var(--iris-border-default)' }}>
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--iris-text-primary)' }}>{selectedMaterial.name}</h2>
                {selectedMaterial.specification && (
                  <p className="text-sm mb-4" style={{ color: 'var(--iris-text-muted)' }}>{selectedMaterial.specification}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div>
                    <p style={{ color: 'var(--iris-text-muted)' }}>Тип:</p>
                    <p className="capitalize" style={{ color: 'var(--iris-text-primary)' }}>{selectedMaterial.material_type}</p>
                  </div>
                  {selectedMaterial.manufacturer && (
                    <div>
                      <p style={{ color: 'var(--iris-text-muted)' }}>Производитель:</p>
                      <p style={{ color: 'var(--iris-text-primary)' }}>{selectedMaterial.manufacturer}</p>
                    </div>
                  )}
                  {selectedMaterial.quantity && selectedMaterial.unit && (
                    <div>
                      <p style={{ color: 'var(--iris-text-muted)' }}>Количество:</p>
                      <p style={{ color: 'var(--iris-text-primary)' }}>
                        {selectedMaterial.quantity} {selectedMaterial.unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedConstruction && (
              <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-card)', border: '1px solid var(--iris-border-default)' }}>
                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--iris-text-primary)' }}>{selectedConstruction.name}</h2>
                {selectedConstruction.designation && (
                  <p className="text-sm mb-4" style={{ color: 'var(--iris-text-muted)' }}>
                    Обозначение: {selectedConstruction.designation}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <div>
                    <p style={{ color: 'var(--iris-text-muted)' }}>Тип:</p>
                    <p className="capitalize" style={{ color: 'var(--iris-text-primary)' }}>{selectedConstruction.construction_type}</p>
                  </div>
                  {selectedConstruction.location && (
                    <div>
                      <p style={{ color: 'var(--iris-text-muted)' }}>Расположение:</p>
                      <p style={{ color: 'var(--iris-text-primary)' }}>{selectedConstruction.location}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ color: 'var(--iris-text-muted)' }}>Статус:</p>
                    <p className="capitalize" style={{ color: 'var(--iris-text-primary)' }}>{selectedConstruction.status}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
