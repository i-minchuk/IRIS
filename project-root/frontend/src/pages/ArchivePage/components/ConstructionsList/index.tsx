// src/pages/ArchivePage/components/ConstructionsList/index.tsx
import React from 'react';
import { useArchiveStore } from '../../store/archiveStore';

export const ConstructionsList: React.FC = () => {
  const { constructions, selectConstruction } = useArchiveStore();

  const getConstructionTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; bg: string; icon: string }> = {
      foundation: { color: 'var(--iris-text-muted)', bg: 'var(--iris-bg-surface-elevated)', icon: '🏗️' },
      column: { color: 'var(--iris-accent-blue)', bg: 'var(--iris-accent-blue-light)', icon: '🏛️' },
      beam: { color: 'var(--iris-accent-purple)', bg: 'var(--iris-accent-purple-light)', icon: '📐' },
      slab: { color: 'var(--iris-accent-green)', bg: 'var(--iris-accent-green-light)', icon: '📄' },
      wall: { color: 'var(--iris-accent-orange)', bg: 'var(--iris-accent-orange-light)', icon: '🧱' },
      roof: { color: 'var(--iris-accent-red)', bg: 'var(--iris-accent-red-light)', icon: '🏠' },
      frame: { color: 'var(--iris-accent-sky)', bg: 'var(--iris-accent-sky-light)', icon: '🔗' },
      pipeline: { color: 'var(--iris-accent-teal)', bg: 'var(--iris-accent-teal-light)', icon: '🚰' },
      electrical: { color: 'var(--iris-accent-yellow)', bg: 'var(--iris-accent-yellow-light)', icon: '⚡' },
      other: { color: 'var(--iris-text-muted)', bg: 'var(--iris-bg-surface-elevated)', icon: '🔨' },
    };
    return configs[type] || configs.other;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bg: string; label: string }> = {
      planned: { color: 'var(--iris-text-muted)', bg: 'var(--iris-bg-surface-elevated)', label: 'План' },
      in_production: { color: 'var(--iris-accent-orange)', bg: 'var(--iris-accent-orange-light)', label: 'В производстве' },
      installed: { color: 'var(--iris-accent-blue)', bg: 'var(--iris-accent-blue-light)', label: 'Монтировано' },
      tested: { color: 'var(--iris-accent-green)', bg: 'var(--iris-accent-green-light)', label: 'Протестировано' },
      accepted: { color: 'var(--iris-accent-green)', bg: 'var(--iris-accent-green-light)', label: 'Принято' },
      rejected: { color: 'var(--iris-accent-red)', bg: 'var(--iris-accent-red-light)', label: 'Отклонено' },
    };
    return configs[status] || configs.planned;
  };

  if (constructions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--iris-text-muted)' }}>
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
              className="p-4 rounded-lg transition-colors cursor-pointer"
              style={{
                background: 'var(--iris-bg-surface)',
                border: '1px solid var(--iris-border-default)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--iris-accent-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--iris-border-default)';
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: typeConfig.bg, color: typeConfig.color }}
                  >
                    {typeConfig.icon}
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--iris-text-primary)' }}>{construction.name}</h3>
                    {construction.designation && (
                      <p className="text-sm" style={{ color: 'var(--iris-text-secondary)' }}>
                        Обозначение: {construction.designation}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: statusConfig.bg,
                    color: statusConfig.color,
                  }}
                >
                  {statusConfig.label}
                </span>
              </div>
              {construction.location && (
                <p className="text-sm mb-2" style={{ color: 'var(--iris-text-secondary)' }}>
                  📍 {construction.location}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--iris-text-muted)' }}>
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
