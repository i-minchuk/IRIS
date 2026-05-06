import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useArchiveStore } from '@/stores/archiveStore';

export const ArchivePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id') || undefined;
  
  const { entries, materials, constructions, activeTab, setActiveTab, fetchArchive, isLoading } = useArchiveStore();

  // Fetch data on mount
  React.useEffect(() => {
    fetchArchive(projectId);
  }, [fetchArchive, projectId]);

  return (
    <div className="h-screen bg-[#0f172a] text-[#e2e8f0] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e293b] border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <ArchiveIcon className="w-6 h-6 text-[#3b82f6]" />
          <div>
            <h1 className="text-lg font-bold">Архив</h1>
            <p className="text-xs text-[#64748b]">
              Хронология событий, материалы и конструкции
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchArchive(projectId)}
          className="px-3 py-1.5 bg-[#334155] rounded text-xs text-[#e2e8f0] hover:bg-[#475569] transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#334155] bg-[#1e293b]">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Хронология
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'materials'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Материалы
        </button>
        <button
          onClick={() => setActiveTab('constructions')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'constructions'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Конструкции
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
          </div>
        )}

        {!isLoading && activeTab === 'timeline' && (
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center text-[#64748b] py-12">
                Нет данных в хронологии (API может быть недоступен на SQLite)
              </div>
            ) : (
              entries.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <EventIcon type={event.type} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[#e2e8f0]">{event.title}</div>
                      <div className="text-xs text-[#64748b] mt-1">
                        {event.occurred_at && new Date(event.occurred_at).toLocaleString('ru-RU')}
                        {event.author_name && ` • ${event.author_name}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!isLoading && activeTab === 'materials' && (
          <div className="space-y-3">
            {materials.length === 0 ? (
              <div className="text-center text-[#64748b] py-12">
                Нет данных о материалах (API может быть недоступен на SQLite)
              </div>
            ) : (
              materials.map((material) => (
                <div
                  key={material.id}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg p-4"
                >
                  <div className="font-medium text-[#e2e8f0]">{material.name}</div>
                  <div className="text-xs text-[#64748b] mt-1">
                    Тип: {material.material_type}
                    {material.quantity && ` • ${material.quantity} ${material.unit || ''}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!isLoading && activeTab === 'constructions' && (
          <div className="space-y-3">
            {constructions.length === 0 ? (
              <div className="text-center text-[#64748b] py-12">
                Нет данных о конструкциях (API может быть недоступен на SQLite)
              </div>
            ) : (
              constructions.map((construction) => (
                <div
                  key={construction.id}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#e2e8f0]">{construction.name}</div>
                      <div className="text-xs text-[#64748b] mt-1">
                        {construction.construction_type} • {construction.designation || 'Без обозначения'}
                      </div>
                    </div>
                    <StatusBadge status={construction.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components
const EventIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap: Record<string, string> = {
    document: '📄',
    revision: '🔄',
    remark: '💬',
    workflow: '⚙️',
    material: '🧱',
    construction: '🏗️',
    project_event: '📌',
  };
  return <span>{iconMap[type] || '📌'}</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    planned: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'План' },
    in_production: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'В производстве' },
    installed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Установлено' },
    tested: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Тестировано' },
    accepted: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Принято' },
    rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Отклонено' },
  };
  const config = statusMap[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: status };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const ArchiveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);
