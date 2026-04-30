import React, { useMemo } from 'react';
import { MTOItem, ProductionProject } from '../../types/production';

interface Props {
  mtoItems: MTOItem[];
  projects: ProductionProject[];
}

export const MTOStatus: React.FC<Props> = ({ mtoItems, projects }) => {
  const byProject = useMemo(() => {
    const grouped: Record<string, MTOItem[]> = {};
    mtoItems.forEach(m => {
      if (!grouped[m.projectId]) grouped[m.projectId] = [];
      grouped[m.projectId].push(m);
    });
    return grouped;
  }, [mtoItems]);

  const statusColors: Record<string, { bg: string; text: string }> = {
    spec_draft:     { bg: 'var(--iris-border-subtle)', text: 'var(--text-secondary)' },
    spec_submitted: { bg: 'var(--iris-accent-cyan)', text: 'var(--iris-text-inverse)' },
    in_procurement:  { bg: 'var(--iris-accent-amber)', text: 'var(--iris-text-inverse)' },
    ordered:        { bg: 'var(--iris-accent-purple)', text: 'var(--iris-text-inverse)' },
    delivered:      { bg: 'var(--iris-accent-green)', text: 'var(--iris-text-inverse)' },
    in_stock:       { bg: 'var(--iris-accent-green)', text: 'var(--iris-text-inverse)' },
  };

  const statusLabels: Record<string, string> = {
    spec_draft: 'Черновик спецификации',
    spec_submitted: 'Подано в МТО',
    in_procurement: 'В закупке',
    ordered: 'Заказано',
    delivered: 'Доставлено',
    in_stock: 'На складе',
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🛒 МТО / ЗАКУПКИ</h2>

      {/* Сводка */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Подано в МТО', value: mtoItems.filter(m => m.status === 'spec_submitted').length, color: 'var(--iris-accent-cyan)' },
          { label: 'В закупке', value: mtoItems.filter(m => m.status === 'in_procurement' || m.status === 'ordered').length, color: 'var(--iris-accent-amber)' },
          { label: 'На складе', value: mtoItems.filter(m => m.status === 'in_stock').length, color: 'var(--iris-accent-green)' },
          { label: 'Всего позиций', value: mtoItems.length, color: 'var(--text-secondary)' },
        ].map(kpi => (
          <div key={kpi.label} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)' }}>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* По проектам */}
      <div className="space-y-3">
        {projects.filter(p => byProject[p.id]).map(project => {
          const items = byProject[project.id] || [];

          return (
            <div key={project.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
              <div className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {project.name} ({project.code})
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const st = statusColors[item.status];
                  return (
                    <div key={item.id} className="flex items-center gap-3 text-xs p-2 rounded" style={{ backgroundColor: 'var(--iris-bg-app)' }}>
                      <span
                        className="px-2 py-1 rounded font-bold"
                        style={{ backgroundColor: st.bg, color: st.text }}
                      >
                        {statusLabels[item.status]}
                      </span>
                      <span className="flex-1" style={{ color: 'var(--text-primary)' }}>{item.itemName}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.quantity} шт/кг</span>
                      {item.plannedDelivery && (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Поставка: {new Date(item.plannedDelivery).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {item.actualDelivery && (
                        <span style={{ color: 'var(--iris-accent-green)' }}>
                          Факт: {new Date(item.actualDelivery).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
