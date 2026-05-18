import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { 
  FileText,  ChevronRight, ChevronDown, 
  User, ArrowRightLeft, AlertTriangle, TrendingDown
} from 'lucide-react';

const COLORS = {
  blue:   '#2563EB',
  cyan:   '#0891B2',
  coral:  '#EF4444',
  green:  '#0C7205',
  yellow: '#D4AF37',
  textPrimary:   'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted:     'var(--text-muted)',
  cardBg:        'var(--card-bg)',
  borderColor:   'var(--border-color)',
};

// ═══════════════════════════════════════════
// DEPARTMENT LOAD — Загрузка по отделам
// ═══════════════════════════════════════════
interface Employee {
  name: string;
  role: string;
  current: number;
  max: number;
  avatar?: string;
}

interface Department {
  id: string;
  name: string;
  current: number;
  max: number;
  plan: number;
  route: string;
  employees: Employee[];
}

export function DepartmentLoad() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const departments: Department[] = [
    { 
      id: 'tender', name: 'Тендерный отдел', current: 34, max: 40, plan: 30, route: '/documents?dept=tender',
      employees: [
        { name: 'А. Смирнов', role: 'Ведущий инженер', current: 12, max: 10 },
        { name: 'Е. Козлова', role: 'Инженер КД', current: 9, max: 8 },
        { name: 'Д. Петров', role: 'Младший инженер', current: 8, max: 12 },
        { name: 'М. Волков', role: 'Архивариус', current: 5, max: 10 },
      ]
    },
    { 
      id: 'project', name: 'Проектный отдел', current: 28, max: 35, plan: 28, route: '/documents?dept=project',
      employees: [
        { name: 'И. Соколов', role: 'ГИП', current: 8, max: 6 },
        { name: 'Н. Лебедева', role: 'Инженер ПТО', current: 11, max: 10 },
        { name: 'В. Морозов', role: 'Конструктор', current: 9, max: 12 },
      ]
    },
    { 
      id: 'approval', name: 'ОК / Согласование', current: 19, max: 25, plan: 20, route: '/workflow?dept=approval',
      employees: [
        { name: 'О. Новиков', role: 'Начальник ОК', current: 7, max: 5 },
        { name: 'Т. Фёдорова', role: 'Специалист ОК', current: 8, max: 10 },
        { name: 'С. Павлов', role: 'Юрист', current: 4, max: 10 },
      ]
    },
    { 
      id: 'archive', name: 'Архив', current: 5, max: 20, plan: 10, route: '/archive',
      employees: [
        { name: 'Л. Гусева', role: 'Архивист', current: 3, max: 10 },
        { name: 'К. Борисов', role: 'Младший архивист', current: 2, max: 10 },
      ]
    },
    { 
      id: 'overdue', name: 'Просроченные', current: 7, max: 10, plan: 0, route: '/workflow?filter=overdue',
      employees: [
        { name: 'А. Смирнов', role: 'Ведущий инженер', current: 3, max: 0 },
        { name: 'Н. Лебедева', role: 'Инженер ПТО', current: 2, max: 0 },
        { name: 'О. Новиков', role: 'Начальник ОК', current: 2, max: 0 },
      ]
    },
  ];

  const sortedDepts = [...departments].sort((a, b) => (b.current / b.max) - (a.current / a.max));

  const getBarColor = (current: number, max: number) => {
    const pct = current / max;
    if (pct > 0.85) return COLORS.yellow;
    if (pct > 0.6) return COLORS.blue;
    return COLORS.green;
  };

  const getLoadLabel = (current: number, max: number) => {
    const pct = Math.round((current / max) * 100);
    if (pct > 85) return 'Перегруз';
    if (pct > 60) return 'Норма';
    return 'Свободен';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>Загрузка по отделам</h3>
        <span className="text-[10px]" style={{ color: COLORS.textMuted }}>Сортировка: по загрузке ↓</span>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {sortedDepts.map((dept) => {
          const pct = Math.round((dept.current / dept.max) * 100);
          const barColor = getBarColor(dept.current, dept.max);
          const isExpanded = expandedId === dept.id;
          const loadLabel = getLoadLabel(dept.current, dept.max);

          return (
            <div 
              key={dept.id} 
              className="rounded-xl overflow-hidden transition-all"
              style={{ 
                background: COLORS.cardBg, 
                border: `1px solid ${isExpanded ? barColor + '40' : COLORS.borderColor}`,
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                className="w-full text-left p-4 transition-colors hover:brightness-105"
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ color: barColor }}>
                      <FileText size={16} />
                    </span>
                    <span className="text-[13px] font-semibold truncate" style={{ color: COLORS.textPrimary }}>
                      {dept.name}
                    </span>
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{ 
                        background: barColor + '20', 
                        color: barColor,
                        border: `1px solid ${barColor}40`
                      }}
                    >
                      {loadLabel}
                    </span>
                    {dept.plan > 0 && (
                      <span className="shrink-0" style={{ color: dept.current > dept.plan ? COLORS.coral : (dept.current < dept.plan ? '#94A3B8' : barColor) }}>
                        {dept.current > dept.plan ? <AlertTriangle size={12} /> : (dept.current < dept.plan ? <TrendingDown size={12} /> : null)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[14px] font-bold" style={{ color: barColor }}>
                      {dept.current}
                    </span>
                    <span className="text-[10px]" style={{ color: COLORS.textMuted }}>/ {dept.max}</span>
                    <span className="text-[11px] font-bold ml-1" style={{ color: barColor }}>
                      {pct}%
                    </span>
                    {isExpanded ? <ChevronDown size={14} style={{ color: COLORS.textMuted }} /> : <ChevronRight size={14} style={{ color: COLORS.textMuted }} />}
                  </div>
                </div>

                <div className="h-2 w-full rounded-full overflow-hidden relative" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                  {dept.plan > 0 && (
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ 
                        width: `${Math.min((dept.plan / dept.max) * 100, 100)}%`, 
                        background: 'var(--text-muted)', 
                        opacity: 0.25 
                      }}
                    />
                  )}
                  <div 
                    className="h-full rounded-full transition-all duration-500 relative"
                    style={{ width: `${Math.min(pct, 100)}%`, background: barColor, opacity: 0.7 }}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t pt-3 mt-1" style={{ borderColor: COLORS.borderColor }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium" style={{ color: COLORS.textSecondary }}>Сотрудники</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(dept.route); }}
                        className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
                        style={{ color: COLORS.blue, background: COLORS.blue + '10' }}
                      >
                        Все документы <ArrowRightLeft size={10} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {dept.employees.map((emp, ei) => {
                        const empPct = emp.max > 0 ? Math.round((emp.current / emp.max) * 100) : 100;
                        const empColor = emp.max > 0 ? getBarColor(emp.current, emp.max) : COLORS.coral;
                        return (
                          <div key={ei} className="flex items-center gap-3">
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: empColor + '15', color: empColor }}
                            >
                              <User size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium truncate" style={{ color: COLORS.textPrimary }}>{emp.name}</span>
                                <span className="text-[11px] font-bold shrink-0 ml-2" style={{ color: empColor }}>
                                  {emp.current}{emp.max > 0 ? `/${emp.max}` : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>{emp.role}</span>
                                {emp.max > 0 && (
                                  <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(empPct, 100)}%`, background: empColor, opacity: 0.6 }} />
                                  </div>
                                )}
                              </div>
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
    </div>
  );
}