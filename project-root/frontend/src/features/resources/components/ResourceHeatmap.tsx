import { useState } from 'react';
import type { HeatmapDepartment, HeatmapEmployee } from '../api/resources';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface ResourceHeatmapProps {
  departments: HeatmapDepartment[];
  onEmployeeClick: (employee: HeatmapEmployee) => void;
}

function getLoadColor(load: number): { bg: string; text: string } {
  if (load >= 90) return { bg: 'bg-rose-500', text: 'text-white' };
  if (load >= 70) return { bg: 'bg-emerald-500', text: 'text-white' };
  if (load >= 50) return { bg: 'bg-amber-500', text: 'text-white' };
  return { bg: 'bg-slate-400', text: 'text-white' };
}

function getDeptStatus(employees: HeatmapEmployee[]): 'normal' | 'warning' | 'danger' {
  if (employees.length === 0) return 'normal';
  const avg = employees.reduce((s, e) => s + e.load, 0) / employees.length;
  if (avg < 40) return 'danger';
  if (avg < 60) return 'warning';
  return 'normal';
}

export const ResourceHeatmap: React.FC<ResourceHeatmapProps> = ({
  departments,
  onEmployeeClick,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hovered, setHovered] = useState<{ emp: HeatmapEmployee; x: number; y: number } | null>(null);

  const toggleDept = (dept: string) => {
    setCollapsed((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-[#1e293b] p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
          ⚡ Загруженность персонала
        </span>
      </div>

      <div className="space-y-3">
        {departments.map((dept) => {
          const status = getDeptStatus(dept.employees);
          const isCollapsed = collapsed[dept.dept];
          const avgLoad =
            dept.employees.length > 0
              ? Math.round(dept.employees.reduce((s, e) => s + e.load, 0) / dept.employees.length)
              : 0;

          return (
            <div key={dept.dept}>
              {/* Department header */}
              <button
                onClick={() => toggleDept(dept.dept)}
                className="flex items-center gap-2 w-full text-left mb-2 group"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  {dept.dept}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-1">
                  ({dept.employees.length} чел. · средн. {avgLoad}%)
                </span>
                {status === 'warning' && (
                  <AlertTriangle size={14} className="text-amber-500 ml-auto" />
                )}
                {status === 'danger' && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
                    <AlertTriangle size={12} />
                    Переназначить ресурсы →
                  </span>
                )}
              </button>

              {/* Employees grid */}
              {!isCollapsed && (
                <div className="flex flex-wrap gap-2 pl-6">
                  {dept.employees.map((emp) => {
                    const colors = getLoadColor(emp.load);
                    return (
                      <div key={emp.id} className="relative">
                        <button
                          onClick={() => onEmployeeClick(emp)}
                          onMouseEnter={(e) =>
                            setHovered({
                              emp,
                              x: e.clientX,
                              y: e.clientY,
                            })
                          }
                          onMouseLeave={() => setHovered(null)}
                          className={[
                            'px-2.5 py-1.5 rounded-md text-xs font-medium transition-transform hover:scale-105',
                            colors.bg,
                            colors.text,
                          ].join(' ')}
                        >
                          {emp.name} {emp.load}%
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700/50 flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Перегруз {'>'}90%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Норма 70–90%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Недогруз 50–70%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Простой {'<'}50%
        </span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 dark:bg-black text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700"
          style={{
            left: hovered.x + 12,
            top: hovered.y - 12,
          }}
        >
          <div className="font-semibold">{hovered.emp.name}</div>
          <div className="text-gray-300 mt-0.5">Загрузка: {hovered.emp.load}%</div>
          {hovered.emp.projects.length > 0 && (
            <div className="text-gray-400 mt-0.5">
              Проекты: {hovered.emp.projects.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
