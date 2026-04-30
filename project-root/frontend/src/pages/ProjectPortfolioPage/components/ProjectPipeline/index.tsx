// src/pages/ProjectPortfolioPage/components/ProjectPipeline/index.tsx
import React from 'react';
import { Project } from '../../types/project';
import { PROJECT_STATUS_CONFIG } from '../../constants/projectStatuses';

interface Props {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export const ProjectPipeline: React.FC<Props> = ({ projects, onSelect }) => {
  const stages = [
    'initiation',
    'design',
    'documentation',
    'approval',
    'procurement',
    'production',
    'delivery',
    'installation',
    'commissioning',
    'completed',
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Статистика сверху */}
      <div className="flex gap-4 px-6 py-3 bg-[#1e293b] border-b border-[#334155]">
        {[
          {
            label: 'Активных',
            value: projects.filter((p) => p.status !== 'completed').length,
            color: '#3b82f6',
          },
          {
            label: 'Завершенных',
            value: projects.filter((p) => p.status === 'completed').length,
            color: '#22c55e',
          },
          {
            label: 'В риске',
            value: projects.filter(
              (p) => p.status === 'production' && p.progressPercent < 30
            ).length,
            color: '#ef4444',
          },
          {
            label: 'Портфель',
            value: `${projects.reduce((sum, p) => sum + p.contractSum, 0)} млн ₽`,
            color: '#f59e0b',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-1 p-3 bg-[#0f172a] rounded-lg border border-[#334155]"
          >
            <div className="text-xs text-[#94a3b8]">{stat.label}</div>
            <div className="text-lg font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Воронка */}
      <div className="flex-1 overflow-x-auto px-6 py-4">
        <div className="flex gap-4 min-w-max">
          {stages.map((stage) => {
            const config = PROJECT_STATUS_CONFIG[stage];
            const stageProjects = projects.filter((p) => p.status === stage);

            return (
              <div key={stage} className="w-64 flex-shrink-0">
                <div
                  className="p-3 rounded-lg mb-3"
                  style={{ backgroundColor: config.bg, borderLeft: `4px solid ${config.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-sm font-bold text-[#e2e8f0]">
                      {config.label}
                    </span>
                  </div>
                  <div className="text-xs text-[#94a3b8] mt-1">
                    {stageProjects.length} проектов |{' '}
                    {stageProjects.reduce((s, p) => s + p.contractSum, 0)} млн ₽
                  </div>
                </div>

                <div className="space-y-2">
                  {stageProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => onSelect(project)}
                      className="p-3 bg-[#1e293b] border border-[#334155] rounded-lg hover:border-[#3b82f6] cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-bold text-[#e2e8f0] truncate">
                          {project.name}
                        </span>
                      </div>
                      <div className="text-xs text-[#94a3b8]">
                        👤 {project.customer}
                      </div>
                      <div className="text-xs text-[#94a3b8] mt-1">
                        💰 {project.contractSum} млн ₽
                      </div>

                      {/* Прогресс-бар */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-[#94a3b8] mb-1">
                          <span>Прогресс</span>
                          <span>{project.progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#334155] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${project.progressPercent}%`,
                              backgroundColor:
                                project.progressPercent > 80
                                  ? '#22c55e'
                                  : project.progressPercent > 50
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          />
                        </div>
                      </div>

                      {project.tenderId && (
                        <div className="mt-2 px-2 py-1 bg-[#3b82f6]/20 rounded text-xs text-[#3b82f6]">
                          🎯 Из тендера
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
