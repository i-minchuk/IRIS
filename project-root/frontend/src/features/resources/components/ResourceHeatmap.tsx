import { useState } from 'react';
import type { HeatmapDepartment, HeatmapEmployee } from '../api/resources';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface ResourceHeatmapProps {
  departments: HeatmapDepartment[];
  onEmployeeClick: (employee: HeatmapEmployee) => void;
}

function getLoadColor(load: number): { bg: string; text: string; glow: string } {
  if (load >= 90) return { bg: '#FF0055', text: '#FFFFFF', glow: 'rgba(255,0,85,0.3)' };
  if (load >= 70) return { bg: '#00F0FF', text: '#0B0E14', glow: 'rgba(0,240,255,0.3)' };
  if (load >= 50) return { bg: '#FFAA00', text: '#0B0E14', glow: 'rgba(255,170,0,0.3)' };
  return { bg: '#8892A8', text: '#FFFFFF', glow: 'rgba(136,146,168,0.3)' };
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
    <div className="rounded-2xl p-4 sm:p-5 neon-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
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
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  {dept.dept}
                </span>
                <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
                  ({dept.employees.length} чел. · средн. {avgLoad}%)
                </span>
                {status === 'warning' && (
                  <AlertTriangle size={14} style={{ color: '#FFAA00', marginLeft: 'auto' }} />
                )}
                {status === 'danger' && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#FF0055' }}>
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
                          className="px-2.5 py-1.5 rounded-md text-xs font-medium transition-transform hover:scale-105"
                          style={{
                            background: colors.bg,
                            color: colors.text,
                            boxShadow: `0 0 10px ${colors.glow}`,
                          }}
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
      <div className="mt-5 pt-4 border-t flex flex-wrap gap-3 text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#FF0055', boxShadow: '0 0 6px rgba(255,0,85,0.4)' }} /> Перегруз {'>'}90%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#00F0FF', boxShadow: '0 0 6px rgba(0,240,255,0.4)' }} /> Норма 70–90%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#FFAA00', boxShadow: '0 0 6px rgba(255,170,0,0.4)' }} /> Недогруз 50–70%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#8892A8', boxShadow: '0 0 6px rgba(136,146,168,0.4)' }} /> Простой {'<'}50%
        </span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 shadow-xl border text-xs"
          style={{
            left: hovered.x + 12,
            top: hovered.y - 12,
            background: 'rgba(11,14,20,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: '#FFFFFF',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div className="font-semibold">{hovered.emp.name}</div>
          <div className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>Загрузка: {hovered.emp.load}%</div>
          {hovered.emp.projects.length > 0 && (
            <div className="mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Проекты: {hovered.emp.projects.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
