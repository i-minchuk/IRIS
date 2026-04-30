// src/pages/ProjectPortfolioPage/components/ProjectAnalytics/index.tsx
import React from 'react';
import { ProjectStats, Project } from '../../types/project';
import { PROJECT_STATUS_CONFIG } from '../../constants/projectStatuses';

interface ProjectAnalyticsProps {
  stats: ProjectStats;
  projects: Project[];
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  stats,
  projects,
}) => {
  // Группируем проекты по статусам для диаграммы
  const statusDistribution = Object.entries(PROJECT_STATUS_CONFIG).map(
    ([status, config]) => ({
      status: config.label,
      count: projects.filter((p) => p.status === status).length,
      color: config.color,
    })
  ).filter((item) => item.count > 0);

  // Приоритеты
  const priorityDistribution = [
    {
      priority: 'Критичный',
      count: projects.filter((p) => p.priority === 'critical').length,
      color: '#dc2626',
    },
    {
      priority: 'Высокий',
      count: projects.filter((p) => p.priority === 'high').length,
      color: '#ef4444',
    },
    {
      priority: 'Средний',
      count: projects.filter((p) => p.priority === 'medium').length,
      color: '#f59e0b',
    },
    {
      priority: 'Низкий',
      count: projects.filter((p) => p.priority === 'low').length,
      color: '#22c55e',
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
            <div className="text-sm text-[#94a3b8] mb-2">Всего проектов</div>
            <div className="text-3xl font-bold text-[#e2e8f0]">{stats.total}</div>
          </div>

          <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
            <div className="text-sm text-[#94a3b8] mb-2">Активные</div>
            <div className="text-3xl font-bold text-[#3b82f6]">{stats.active}</div>
          </div>

          <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
            <div className="text-sm text-[#94a3b8] mb-2">Завершено</div>
            <div className="text-3xl font-bold text-[#22c55e]">{stats.completed}</div>
          </div>

          <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
            <div className="text-sm text-[#94a3b8] mb-2">Общий бюджет</div>
            <div className="text-3xl font-bold text-[#e2e8f0]">
              {stats.totalSum.toLocaleString('ru-RU')}
              <span className="text-sm font-normal text-[#94a3b8] ml-1">млн ₽</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
            <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">
              Распределение по статусам
            </h3>
            <div className="space-y-3">
              {statusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#e2e8f0]">{item.status}</span>
                    <span className="text-sm text-[#94a3b8]">{item.count}</span>
                  </div>
                  <div className="h-3 bg-[#0f172a] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(item.count / stats.total) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
            <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">
              Распределение по приоритетам
            </h3>
            <div className="space-y-3">
              {priorityDistribution.map((item) => (
                <div key={item.priority}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#e2e8f0]">{item.priority}</span>
                    <span className="text-sm text-[#94a3b8]">{item.count}</span>
                  </div>
                  <div className="h-3 bg-[#0f172a] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${(item.count / stats.total) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="bg-[#1e293b] rounded-lg border border-[#334155] p-6">
          <h3 className="text-lg font-semibold text-[#e2e8f0] mb-4">
            Сводка рисков
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#ef4444] mb-2">
                {stats.overdue}
              </div>
              <div className="text-sm text-[#94a3b8]">Просроченных</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#f59e0b] mb-2">
                {stats.atRisk}
              </div>
              <div className="text-sm text-[#94a3b8]">В риске</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#22c55e] mb-2">
                {stats.avgProgress}%
              </div>
              <div className="text-sm text-[#94a3b8]">Средний прогресс</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
