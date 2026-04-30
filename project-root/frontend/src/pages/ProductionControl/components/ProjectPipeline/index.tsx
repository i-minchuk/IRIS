import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { ProductionProject } from '../../types/production';
import { STAGE_CONFIG } from '../../constants/production';

interface Props {
  projects: ProductionProject[];
  onSelect: (p: ProductionProject) => void;
}

export const ProjectPipeline: React.FC<Props> = ({ projects, onSelect }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const stages = Object.entries(STAGE_CONFIG).sort((a, b) => a[1].order - b[1].order);

  return (
    <div className="p-6">
      {/* KPI сверху */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'В производстве', value: projects.filter(p => p.stage === 'production').length, color: '#06b6d4' },
          { label: 'Скоро в производство', value: projects.filter(p => ['material_ready', 'production_prep'].includes(p.stage)).length, color: '#22c55e' },
          { label: 'В разработке КД', value: projects.filter(p => ['design', 'kd_development', 'kd_approval'].includes(p.stage)).length, color: '#3b82f6' },
          { label: 'В риске', value: projects.filter(p => p.status === 'at_risk' || p.status === 'delayed').length, color: '#ef4444' },
          { label: 'Портфель', value: `${projects.reduce((s, p) => s + p.contractSum, 0)} млн ₽`, color: '#f59e0b' },
        ].map(kpi => (
          <div key={kpi.label} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)' }}>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Воронка */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map(([stageKey, config]) => {
          const stageProjects = projects.filter(p => p.stage === stageKey);

          return (
            <div key={stageKey} className="w-56 flex-shrink-0">
              <div
                className="p-3 rounded-lg mb-2"
                style={{
                  backgroundColor: isDark ? config.bg : config.bgLight,
                  borderLeft: `3px solid ${config.color}`,
                  opacity: stageProjects.length === 0 ? 0.5 : 1
                }}
              >
                <div className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{config.label}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {stageProjects.length} проектов | {stageProjects.reduce((s, p) => s + p.contractSum, 0)} млн ₽
                </div>
              </div>

              <div className="space-y-2">
                {stageProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => onSelect(project)}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:border-[var(--iris-accent-cyan)] ${
                      project.status === 'delayed' ? 'border-[var(--iris-accent-coral)]' :
                      project.status === 'at_risk' ? 'border-[var(--iris-accent-amber)]' :
                      'border-[var(--iris-border-subtle)]'
                    }`}
                    style={{ backgroundColor: 'var(--iris-bg-surface)', borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>👤 {project.customer}</div>

                    {/* Прогресс-бар */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>{project.progressPercent}%</span>
                        <span>{project.criticalPathDays} дн.</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--iris-border-subtle)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${project.progressPercent}%`,
                            backgroundColor: project.progressPercent > 80 ? 'var(--iris-accent-green)' :
                                            project.progressPercent > 50 ? 'var(--iris-accent-amber)' : 'var(--iris-accent-coral)'
                          }}
                        />
                      </div>
                    </div>

                    {project.status === 'delayed' && (
                      <div className="mt-1 text-xs" style={{ color: 'var(--iris-accent-coral)' }}>⚠️ Задержка</div>
                    )}
                    {project.status === 'at_risk' && (
                      <div className="mt-1 text-xs" style={{ color: 'var(--iris-accent-amber)' }}>⚡ В риске</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
