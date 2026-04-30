// src/pages/ArchivePage/index.tsx
import React, { useEffect, useState } from 'react';
import { Timeline } from './components/Timeline';
import { ArchiveSearch } from './components/ArchiveSearch';
import { MaterialsList } from './components/MaterialsList';
import { ConstructionsList } from './components/ConstructionsList';
import { useArchiveStore } from './store/archiveStore';
import { TimelineEvent } from './types/archive';

export const ArchivePage: React.FC = () => {
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
    <div className="flex h-screen bg-[#0f172a] text-[#e2e8f0]">
      {/* Левая колонка - навигация */}
      <div className="w-72 border-r border-[#334155] p-4 overflow-y-auto">
        <h1 className="text-xl font-bold text-[#e2e8f0] mb-2">📁 АРХИВ</h1>
        <p className="text-sm text-[#94a3b8] mb-6">
          Хронология и материалы проекта
        </p>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'timeline'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
            }`}
          >
            📅 Таймлайн
          </button>
          <button
            onClick={() => setViewMode('search')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'search'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
            }`}
          >
            🔍 Поиск
          </button>
          <button
            onClick={() => setViewMode('materials')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'materials'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
            }`}
          >
            🧱 Материалы
          </button>
          <button
            onClick={() => setViewMode('constructions')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'constructions'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
            }`}
          >
            🏗️ Конструкции
          </button>
          <button
            onClick={() => setViewMode('statistics')}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              viewMode === 'statistics'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
            }`}
          >
            📊 Статистика
          </button>
        </nav>
          
        {/* Статистика в сайдбаре */}
        {statistics && (
          <div className="mt-6 pt-6 border-t border-[#334155]">
            <h3 className="text-xs font-bold text-[#94a3b8] mb-3 uppercase">Сводка</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Событий:</span>
                <span className="text-[#e2e8f0] font-bold">{statistics.total_entries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Материалов:</span>
                <span className="text-[#e2e8f0] font-bold">{statistics.materials_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Конструкций:</span>
                <span className="text-[#e2e8f0] font-bold">{statistics.constructions_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Центральная колонка - контент */}
      <div className="flex-1 overflow-y-auto p-6">
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
              <h2 className="text-lg font-bold">Материалы</h2>
              <button className="px-4 py-2 bg-[#22c55e] rounded-lg text-sm font-bold text-white hover:bg-[#16a34a]">
                + Добавить материал
              </button>
            </div>
            <MaterialsList />
          </div>
        )}

        {viewMode === 'constructions' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Конструкции</h2>
              <button className="px-4 py-2 bg-[#22c55e] rounded-lg text-sm font-bold text-white hover:bg-[#16a34a]">
                + Добавить конструкцию
              </button>
            </div>
            <ConstructionsList />
          </div>
        )}

        {viewMode === 'statistics' && (
          <div className="text-center text-[#94a3b8] py-12">
            <p>Статистика в разработке</p>
          </div>
        )}
      </div>

      {/* Правая колонка - детали */}
      {(selectedEntry || selectedMaterial || selectedConstruction) && (
        <div className="w-96 border-l border-[#334155] p-4 overflow-y-auto">
          <button
            onClick={() => {
              selectEntry(null);
              selectMaterial(null);
              selectConstruction(null);
            }}
            className="mb-4 text-[#94a3b8] hover:text-[#e2e8f0] flex items-center gap-1"
          >
            ← Назад
          </button>
          
          {selectedEntry && (
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-[#e2e8f0]">{selectedEntry.title}</h2>
                {selectedEntry.is_pinned && <span>📌</span>}
              </div>
              <p className="text-sm text-[#94a3b8] mb-4">
                {new Date(selectedEntry.occurred_at).toLocaleString('ru-RU')}
              </p>
              
              {selectedEntry.description && (
                <p className="text-sm text-[#e2e8f0] mb-4">{selectedEntry.description}</p>
              )}

              <div className="text-sm">
                <p className="text-[#94a3b8] mb-2">Тип:</p>
                <p className="capitalize bg-[#0f172a] px-3 py-2 rounded text-[#e2e8f0]">
                  {selectedEntry.entry_type}
                </p>
              </div>

              {selectedEntry.content_snapshot && (
                <div className="mt-4">
                  <p className="text-[#94a3b8] mb-2">Данные:</p>
                  <pre className="text-xs bg-[#0f172a] p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(selectedEntry.content_snapshot, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {selectedMaterial && (
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
              <h2 className="text-lg font-bold text-[#e2e8f0] mb-2">{selectedMaterial.name}</h2>
              {selectedMaterial.specification && (
                <p className="text-sm text-[#94a3b8] mb-4">{selectedMaterial.specification}</p>
              )}
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-[#94a3b8]">Тип:</p>
                  <p className="capitalize text-[#e2e8f0]">{selectedMaterial.material_type}</p>
                </div>
                {selectedMaterial.manufacturer && (
                  <div>
                    <p className="text-[#94a3b8]">Производитель:</p>
                    <p className="text-[#e2e8f0]">{selectedMaterial.manufacturer}</p>
                  </div>
                )}
                {selectedMaterial.quantity && selectedMaterial.unit && (
                  <div>
                    <p className="text-[#94a3b8]">Количество:</p>
                    <p className="text-[#e2e8f0]">
                      {selectedMaterial.quantity} {selectedMaterial.unit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedConstruction && (
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
              <h2 className="text-lg font-bold text-[#e2e8f0] mb-2">{selectedConstruction.name}</h2>
              {selectedConstruction.designation && (
                <p className="text-sm text-[#94a3b8] mb-4">
                  Обозначение: {selectedConstruction.designation}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-[#94a3b8]">Тип:</p>
                  <p className="capitalize text-[#e2e8f0]">{selectedConstruction.construction_type}</p>
                </div>
                {selectedConstruction.location && (
                  <div>
                    <p className="text-[#94a3b8]">Расположение:</p>
                    <p className="text-[#e2e8f0]">{selectedConstruction.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-[#94a3b8]">Статус:</p>
                  <p className="capitalize text-[#e2e8f0]">{selectedConstruction.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
