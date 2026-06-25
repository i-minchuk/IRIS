// src/pages/ArchivePage/components/MaterialsList/index.tsx
import React from 'react';
import { useArchiveStore } from '../../store/archiveStore';

export const MaterialsList: React.FC = () => {
  const { materials, selectMaterial } = useArchiveStore();

  const getMaterialTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; bg: string; icon: string }> = {
      steel: { color: 'var(--iris-text-muted)', bg: 'var(--iris-bg-surface-elevated)', icon: '🔩' },
      concrete: { color: 'var(--iris-text-secondary)', bg: 'var(--iris-bg-surface-elevated)', icon: '🧱' },
      reinforcement: { color: 'var(--iris-text-secondary)', bg: 'var(--iris-bg-surface-elevated)', icon: '📏' },
      insulation: { color: 'var(--iris-accent-orange)', bg: 'var(--iris-accent-orange-light)', icon: '🔥' },
      finishing: { color: 'var(--iris-accent-green)', bg: 'var(--iris-accent-green-light)', icon: '🎨' },
      equipment: { color: 'var(--iris-accent-blue)', bg: 'var(--iris-accent-blue-light)', icon: '⚙️' },
      pipe: { color: 'var(--iris-accent-sky)', bg: 'var(--iris-accent-sky-light)', icon: '🚰' },
      cable: { color: 'var(--iris-accent-purple)', bg: 'var(--iris-accent-purple-light)', icon: '⚡' },
      other: { color: 'var(--iris-text-muted)', bg: 'var(--iris-bg-surface-elevated)', icon: '📦' },
    };
    return configs[type] || configs.other;
  };

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--iris-text-muted)' }}>
        <p>Нет материалов</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {materials.map((material) => {
          const config = getMaterialTypeConfig(material.material_type);
          return (
            <div
              key={material.id}
              onClick={() => selectMaterial(material)}
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
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold mb-1" style={{ color: 'var(--iris-text-primary)' }}>{material.name}</h3>
                  {material.specification && (
                    <p className="text-sm mb-1" style={{ color: 'var(--iris-text-secondary)' }}>
                      {material.specification}
                    </p>
                  )}
                  {material.manufacturer && (
                    <p className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>
                      Производитель: {material.manufacturer}
                    </p>
                  )}
                  {material.quantity && material.unit && (
                    <p className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--iris-text-muted)' }}>
                      Количество: {material.quantity} {material.unit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
