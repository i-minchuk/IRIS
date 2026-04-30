import React from 'react';
import { WorkCenter } from '../../types/production';

interface Props {
  workCenters: WorkCenter[];
}

export const WorkloadHeatmap: React.FC<Props> = ({ workCenters }) => {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>⚡ ЗАГРУЖЕННОСТЬ УЧАСТКОВ</h2>

      <div className="grid grid-cols-3 gap-4">
        {workCenters.map(wc => {
          const utilizationColor = wc.utilization > 110 ? 'var(--iris-accent-coral)' :
                                   wc.utilization > 90 ? 'var(--iris-accent-amber)' :
                                   wc.utilization < 70 ? 'var(--text-muted)' : 'var(--iris-accent-green)';

          return (
            <div key={wc.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{wc.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{wc.department}</div>
                </div>
                <div
                  className="px-3 py-1 rounded text-lg font-bold"
                  style={{ backgroundColor: `color-mix(in srgb, ${utilizationColor} 12%, transparent)`, color: utilizationColor }}
                >
                  {wc.utilization}%
                </div>
              </div>

              {/* Полоса загрузки */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Загрузка</span>
                  <span>{wc.actualLoad} / {wc.capacity} ч</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--iris-border-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(wc.utilization, 100)}%`,
                      backgroundColor: utilizationColor
                    }}
                  />
                  {wc.utilization > 100 && (
                    <div
                      className="h-full rounded-full opacity-50"
                      style={{
                        width: `${wc.utilization - 100}%`,
                        backgroundColor: 'var(--iris-accent-coral)',
                        marginLeft: `${100 - (wc.utilization - 100)}%`
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div style={{ color: 'var(--text-secondary)' }}>
                  Проектов: <span style={{ color: 'var(--text-primary)' }}>{wc.activeProjects}</span>
                </div>
                <div style={{ color: wc.overdueOperations > 0 ? 'var(--iris-accent-coral)' : 'var(--text-secondary)' }}>
                  Просрочено: <span className="font-bold">{wc.overdueOperations}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--iris-accent-green)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Норма (70-90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--iris-accent-amber)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Высокая (90-110%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--iris-accent-coral)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Перегруз (&gt;110%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Недогруз (&lt;70%)</span>
        </div>
      </div>
    </div>
  );
};
