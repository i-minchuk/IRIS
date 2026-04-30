// src/pages/ArchivePage/components/ConstructionsList/index.tsx
import React from 'react';
import { useArchiveStore } from '../../store/archiveStore';

export const ConstructionsList: React.FC = () => {
  const { constructions, selectConstruction } = useArchiveStore();

  const getConstructionTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; icon: string }> = {
      foundation: { color: '#6b7280', icon: '🏗️' },
      column: { color: '#3b82f6', icon: '🏛️' },
      beam: { color: '#8b5cf6', icon: '📐' },
      slab: { color: '#10b981', icon: '📄' },
      wall: { color: '#f59e0b', icon: ' walls' },
      roof: { color: '#ef4444', icon: '🏠' },
      frame: { color: '#06b6d4', icon: '🔗' },
      pipeline: { color: '#14b8a6', icon: '🚰' },
      electrical: { color: '#fbbf24', icon: '⚡' },
      other: { color: '#64748b', icon: '🔨' },
    };
    return configs[type] || configs.other;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      planned: { color: '#64748b', label: 'План' },
      in_production: { color: '#f59e0b', label: 'В производстве' },
      installed: { color: '#3b82f6', label: 'Монтировано' },
      tested: { color: '#10b981', label: 'Протестировано' },
      accepted: { color: '#22c55e', label: 'Принято' },
      rejected: { color: '#ef4444', label: 'Отклонено' },
    };
    return configs[status] || configs.planned;
  };

  if (constructions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#64748b]">
        <p>Нет конструкций</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {constructions.map((construction) => {
          const typeConfig = getConstructionTypeConfig(construction.construction_type);
          const statusConfig = getStatusConfig(construction.status);
          return (
            <div
              key={construction.id}
              onClick={() => selectConstruction(construction)}
              className="p-4 bg-[#1e293b] border border-[#334155] rounded-lg hover:border-[#3b82f6] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: typeConfig.color + '20' }}
                  >
                    {typeConfig.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#e2e8f0]">{construction.name}</h3>
                    {construction.designation && (
                      <p className="text-sm text-[#94a3b8]">
                        Обозначение: {construction.designation}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: statusConfig.color + '20',
                    color: statusConfig.color,
                  }}
                >
                  {statusConfig.label}
                </span>
              </div>
              {construction.location && (
                <p className="text-sm text-[#94a3b8] mb-2">
                  📍 {construction.location}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <span>Материалов: {construction.materials_used.length}</span>
                <span>•</span>
                <span>Документов: {construction.documents_related.length}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
