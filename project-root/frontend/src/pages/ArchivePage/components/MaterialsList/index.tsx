// src/pages/ArchivePage/components/MaterialsList/index.tsx
import React from 'react';
import { useArchiveStore } from '../../store/archiveStore';

export const MaterialsList: React.FC = () => {
  const { materials, selectMaterial } = useArchiveStore();

  const getMaterialTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; icon: string }> = {
      steel: { color: '#6b7280', icon: '🔩' },
      concrete: { color: '#9ca3af', icon: '🧱' },
      reinforcement: { color: '#4b5563', icon: '📏' },
      insulation: { color: '#f59e0b', icon: '🔥' },
      finishing: { color: '#10b981', icon: '🎨' },
      equipment: { color: '#3b82f6', icon: '⚙️' },
      pipe: { color: '#06b6d4', icon: '�管道' },
      cable: { color: '#8b5cf6', icon: '⚡' },
      other: { color: '#64748b', icon: '📦' },
    };
    return configs[type] || configs.other;
  };

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#64748b]">
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
              className="p-4 bg-[#1e293b] border border-[#334155] rounded-lg hover:border-[#3b82f6] transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: config.color + '20' }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#e2e8f0] mb-1">{material.name}</h3>
                  {material.specification && (
                    <p className="text-sm text-[#94a3b8] mb-1">
                      {material.specification}
                    </p>
                  )}
                  {material.manufacturer && (
                    <p className="text-xs text-[#64748b]">
                      Производитель: {material.manufacturer}
                    </p>
                  )}
                  {material.quantity && material.unit && (
                    <p className="text-xs text-[#64748b] mt-1">
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
