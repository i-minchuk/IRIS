// src/pages/ArchivePage/index.tsx
import React, { useEffect, useState } from 'react';
import { Timeline } from './components/Timeline';
import { ArchiveSearch } from './components/ArchiveSearch';
import { MaterialsList } from './components/MaterialsList';
import { ConstructionsList } from './components/ConstructionsList';
import { ArchiveStatistics } from './components/ArchiveStatistics';
import { useArchiveStore } from './store/archiveStore';
import { TimelineEvent } from './types/archive';

const ArchivePage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'timeline' | 'search' | 'materials' | 'constructions' | 'statistics'>('timeline');
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
    <div className="flex h-screen" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
      {/* Левая колонка - навигация */}
      <div className="w-72 border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}>
        <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>📁 АРХИВ</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Хронология и материалы проекта
        </p>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'timeline'
                ? 'text-white'
                : 'hover:opacity-80'
            }`}
            style={{
              background: viewMode === 'timeline' ? '#3b82f6' : 'var(--card-bg)',
              color: viewMode === 'timeline' ? '#ffffff' : 'var(--text-primary)',
            }}
          >
            📅 Таймлайн
          </button>
          <button
            onClick={() => setViewMode('search')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'search'
                ? 'text-white'
                : 'hover:opacity-80'
            }`}
            style={{
              background: viewMode === 'search' ? '#3b82f6' : 'var(--card-bg)',
              color: viewMode === 'search' ? '#ffffff' : 'var(--text-primary)',
            }}
          >
            🔍 Поиск
          </button>
          <button
            onClick={() => setViewMode('materials')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'materials'
                ? 'text-white'
                : 'hover:opacity-80'
            }`}
            style={{
              background: viewMode === 'materials' ? '#3b82f6' : 'var(--card-bg)',
              color: viewMode === 'materials' ? '#ffffff' : 'var(--text-primary)',
            }}
          >
            🧱 Материалы
          </button>
          <button
            onClick={() => setViewMode('constructions')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'constructions'
                ? 'text-white'
                : 'hover:opacity-80'
            }`}
            style={{
              background: viewMode === 'constructions' ? '#3b82f6' : 'var(--card-bg)',
              color: viewMode === 'constructions' ? '#ffffff' : 'var(--text-primary)',
            }}
          >
            🏗️ Конструкции
          </button>
          <button
            onClick={() => setViewMode('statistics')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'statistics'
                ? 'text-white'
                : 'hover:opacity-80'
            }`}
            style={{
              background: viewMode === 'statistics' ? '#3b82f6' : 'var(--card-bg)',
              color: viewMode === 'statistics' ? '#ffffff' : 'var(--text-primary)',
            }}
          >
            📊 Статистика
          </button>
        </nav>
          
        {/* Статистика в сайдбаре */}
        {statistics && (
          <div className="mt-6 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <h3 className="text-base md:text-lg font-medium leading-relaxed mt-1 font-bold mb-3 uppercase" style={{ color: 'var(--text-secondary)' }}>Сводка</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Событий:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{statistics.total_entries}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Материалов:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{statistics.materials_count}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Конструкций:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{statistics.constructions_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Центральная колонка - контент */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-surface)' }}>
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Материалы</h2>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: '#22c55e' }}
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
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Конструкции</h2>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: '#22c55e' }}
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
        <div className="w-96 border-l p-4 overflow-y-auto" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}>
          <button
            onClick={() => {
              selectEntry(null);
              selectMaterial(null);
              selectConstruction(null);
            }}
            className="mb-4 flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Назад
          </button>
          
          {selectedEntry && (
            <div className="rounded-lg p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEntry.title}</h2>
                {selectedEntry.is_pinned && <span>📌</span>}
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {new Date(selectedEntry.occurred_at).toLocaleString('ru-RU')}
              </p>
              
              {selectedEntry.description && (
                <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{selectedEntry.description}</p>
              )}

              <div className="text-sm">
                <p className="mb-2" style={{ color: 'var(--text-muted)' }}>Тип:</p>
                <p className="capitalize px-3 py-2 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  {selectedEntry.entry_type}
                </p>
              </div>

              {selectedEntry.content_snapshot && (
                <div className="mt-4">
                  <p className="mb-2" style={{ color: 'var(--text-muted)' }}>Данные:</p>
                  <pre className="text-xs p-3 rounded overflow-auto max-h-64" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {JSON.stringify(selectedEntry.content_snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {selectedMaterial && (
            <div className="rounded-lg p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{selectedMaterial.name}</h2>
              {selectedMaterial.specification && (
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{selectedMaterial.specification}</p>
              )}
              <div className="space-y-2 text-sm">
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Тип:</p>
                  <p className="capitalize" style={{ color: 'var(--text-primary)' }}>{selectedMaterial.material_type}</p>
                </div>
                {selectedMaterial.manufacturer && (
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Производитель:</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedMaterial.manufacturer}</p>
                  </div>
                )}
                {selectedMaterial.quantity && selectedMaterial.unit && (
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Количество:</p>
                    <p style={{ color: 'var(--text-primary)' }}>
                      {selectedMaterial.quantity} {selectedMaterial.unit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedConstruction && (
            <div className="rounded-lg p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{selectedConstruction.name}</h2>
              {selectedConstruction.designation && (
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Обозначение: {selectedConstruction.designation}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Тип:</p>
                  <p className="capitalize" style={{ color: 'var(--text-primary)' }}>{selectedConstruction.construction_type}</p>
                </div>
                {selectedConstruction.location && (
                  <div>
                    <p style={{ color: 'var(--text-muted)' }}>Расположение:</p>
                    <p style={{ color: 'var(--text-primary)' }}>{selectedConstruction.location}</p>
                  </div>
                )}
                <div>
                  <p style={{ color: 'var(--text-muted)' }}>Статус:</p>
                  <p className="capitalize" style={{ color: 'var(--text-primary)' }}>{selectedConstruction.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
