import { useEffect, useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import {
  FolderKanban, ChevronRight, ChevronDown, AlertTriangle, Users, Loader2
} from 'lucide-react';
import { analyticsApi, type DepartmentLoadItem } from '@/features/analytics/api/analytics';

const COLORS = {
  textPrimary:   'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted:     'var(--text-muted)',
  cardBg:        'var(--card-bg)',
  borderColor:   'var(--border-color)',
};

const DEPT_ICON_COLORS = ['#2563EB', '#6B5B95', '#D4AF37', '#0C7205', '#DC2626', '#0EA5E9'];

export function DepartmentLoad() {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentLoadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    analyticsApi.getDepartmentLoad()
      .then((res) => {
        if (!cancelled) setDepartments(res.data.departments ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const sortedDepts = [...departments].sort((a, b) => (b.current / b.max) - (a.current / a.max));

  const getLoadLabel = (current: number, max: number) => {
    const pct = current / max;
    if (pct > 0.85) return 'Перегруз';
    if (pct > 0.6) return 'Норма';
    return 'Свободен';
  };

  const getStatusColor = (current: number, max: number) => {
    const pct = current / max;
    if (pct > 0.85) return '#DC2626';
    if (pct > 0.6) return '#D4AF37';
    return '#0C7205';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg"
            style={{ background: 'rgba(59, 130, 246, 0.12)' }}
          >
            <Users size={16} style={{ color: '#3B82F6' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Загрузка по отделам</h3>
        </div>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>Сортировка: по загрузке ↓</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 size={16} className="animate-spin" style={{ color: COLORS.textMuted }} />
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Загрузка…</span>
        </div>
      )}

      {!loading && (error || sortedDepts.length === 0) && (
        <div className="flex items-center justify-center py-6">
          <span className="text-xs" style={{ color: COLORS.textMuted }}>Нет данных по загрузке</span>
        </div>
      )}

      {!loading && !error && sortedDepts.length > 0 && (
      <div className="flex flex-col gap-1">
        {sortedDepts.map((dept, deptIndex) => {
          const pct = Math.round((dept.current / dept.max) * 100);
          const isExpanded = expandedId === dept.id;
          const loadLabel = getLoadLabel(dept.current, dept.max);
          const statusColor = getStatusColor(dept.current, dept.max);
          const iconColor = DEPT_ICON_COLORS[deptIndex % DEPT_ICON_COLORS.length];

          return (
            <div
              key={dept.id}
              className="rounded-lg overflow-hidden transition-all"
              style={{
                background: COLORS.cardBg,
                border: `1px solid ${isExpanded ? statusColor + '40' : COLORS.borderColor}`,
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                className="w-full text-left p-2.5 transition-colors hover:brightness-105"
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1 min-w-0">
                    <span style={{ color: iconColor }}>
                      <FolderKanban size={14} />
                    </span>
                    <span className="text-xs font-semibold truncate" style={{ color: COLORS.textPrimary }}>
                      {dept.name}
                    </span>
                    <span
                      className="text-xs px-1 py-0.5 rounded-full font-medium shrink-0"
                      style={{
                        background: statusColor + '20',
                        color: statusColor,
                        border: `1px solid ${statusColor}40`
                      }}
                    >
                      {loadLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                    <span className="text-xs font-bold" style={{ color: statusColor }}>{pct}%</span>
                    {isExpanded ? <ChevronDown size={12} style={{ color: COLORS.textMuted }} /> : <ChevronRight size={12} style={{ color: COLORS.textMuted }} />}
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: statusColor, opacity: 0.8 }} />
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>
                    Сотрудников: {dept.employees.length} | Задач: {dept.current}
                  </span>
                  {dept.current > dept.max && (
                    <span className="text-xs flex items-center gap-0.5 shrink-0 ml-1.5" style={{ color: '#DC2626' }}>
                      <AlertTriangle size={9} /> Перегруз
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-2.5 pb-2.5 pt-0">
                  <div className="border-t pt-2 mt-0.5" style={{ borderColor: COLORS.borderColor }}>
                <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Сотрудники</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {dept.employees.map((emp, ei) => {
                        const empColor = getStatusColor(emp.current, emp.max);
                        return (
                          <div key={ei} className="flex items-center justify-between">
                            <span className="text-xs truncate" style={{ color: COLORS.textPrimary }}>{emp.name}</span>
                            <div className="flex items-center gap-1 shrink-0 ml-1.5">
                              <span
                                className="text-xs px-1 py-0.5 rounded-full"
                                style={{
                                  background: empColor + '20',
                                  color: empColor,
                                  border: `1px solid ${empColor}40`
                                }}
                              >
                                {emp.current}{emp.max > 0 ? `/${emp.max}` : ''}
                              </span>
                              <span className="text-xs" style={{ color: COLORS.textMuted }}>{emp.role}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
