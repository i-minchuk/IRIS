// src/pages/ProjectPortfolioPage/components/ProjectList/index.tsx
import React, { useState, useMemo } from 'react';
import { Project } from '../../types/project';
import { PROJECT_STATUS_CONFIG, PROJECT_PRIORITY_CONFIG } from '../../constants/projectStatuses';

interface Props {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export const ProjectList: React.FC<Props> = ({ projects, onSelect }) => {
  const [sortField, setSortField] = useState<keyof Project>('deadline');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = [...projects];
    if (filterStatus !== 'all') result = result.filter((p) => p.status === filterStatus);
    result.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return result;
  }, [projects, sortField, sortDir, filterStatus]);

  return (
    <div className="flex flex-col h-full">
      {/* Фильтры */}
      <div className="flex items-center gap-3 px-6 py-3 bg-[#1e293b] border-b border-[#334155] overflow-x-auto">
        <span className="text-sm text-[#94a3b8]">Фильтр:</span>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap ${
            filterStatus === 'all' ? 'bg-[#3b82f6] text-white' : 'bg-[#334155] text-[#94a3b8]'
          }`}
        >
          Все
        </button>
        {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-3 py-1 rounded text-xs font-bold transition-all whitespace-nowrap`}
            style={{
              backgroundColor: filterStatus === key ? config.color : '#334155',
              color: filterStatus === key ? 'white' : '#94a3b8',
            }}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              {[
                { field: 'name', label: 'Название' },
                { field: 'customer', label: 'Заказчик' },
                { field: 'status', label: 'Статус' },
                { field: 'priority', label: 'Приоритет' },
                { field: 'contractSum', label: 'Контракт' },
                { field: 'progressPercent', label: 'Прогресс' },
                { field: 'deadline', label: 'Дедлайн' },
                { field: 'projectManager', label: 'РП' },
              ].map((col) => (
                <th
                  key={col.field}
                  onClick={() => {
                    setSortField(col.field as keyof Project);
                    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="text-left p-3 text-[#94a3b8] font-bold cursor-pointer hover:text-[#e2e8f0]"
                >
                  {col.label} {sortField === col.field && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              ))}
              <th className="p-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => {
              const statusConfig = PROJECT_STATUS_CONFIG[project.status];
              const priorityConfig = PROJECT_PRIORITY_CONFIG[project.priority];

              return (
                <tr
                  key={project.id}
                  onClick={() => onSelect(project)}
                  className="border-b border-[#334155] hover:bg-[#1e293b] cursor-pointer transition-colors"
                >
                  <td className="p-3">
                    <div className="font-bold text-[#e2e8f0]">{project.name}</div>
                    {project.tenderId && (
                      <div className="text-xs text-[#3b82f6]">🎯 Из тендера</div>
                    )}
                  </td>
                  <td className="p-3 text-[#94a3b8]">{project.customer}</td>
                  <td className="p-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                    >
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color }}
                    >
                      {priorityConfig.label}
                    </span>
                  </td>
                  <td className="p-3 text-[#e2e8f0]">{project.contractSum} млн ₽</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-[#334155] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
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
                      <span className="text-xs text-[#94a3b8]">{project.progressPercent}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#94a3b8]">
                    {new Date(project.deadline).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="p-3 text-[#94a3b8]">{project.projectManager}</td>
                  <td className="p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(project);
                      }}
                      className="px-3 py-1 bg-[#334155] rounded text-xs font-bold text-[#e2e8f0] hover:bg-[#475569]"
                    >
                      Открыть →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
