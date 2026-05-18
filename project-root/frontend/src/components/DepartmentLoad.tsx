import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { 
  FolderKanban, ChevronRight, ChevronDown, AlertTriangle
} from 'lucide-react';

const COLORS = {
  tender:   '#2563EB',
  project:  '#6B5B95',
  approval: '#D4AF37',
  archive:  '#0C7205',
  overdue:  '#DC2626',
  textPrimary:   'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted:     'var(--text-muted)',
  cardBg:        'var(--card-bg)',
  borderColor:   'var(--border-color)',
};

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
  iconColor: string;
  employees: Employee[];
}

export function DepartmentLoad() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const departments: Department[] = [
    { 
      id: 'tender', name: 'Тендерный отдел', current: 34, max: 40, plan: 30, route: '/documents?dept=tender', iconColor: COLORS.tender,
      employees: [
        { name: 'А. Смирнов', role: 'Ведущий инженер', current: 12, max: 10 },
        { name: 'Е. Козлова', role: 'Инженер КД', current: 9, max: 8 },
        { name: 'Д. Петров', role: 'Младший инженер', current: 8, max: 12 },
        { name: 'М. Волков', role: 'Архивариус', current: 5, max: 10 },
      ]
    },
    { 
      id: 'project', name: 'Проектный отдел', current: 28, max: 35, plan: 28, route: '/documents?dept=project', iconColor: COLORS.project,
      employees: [
        { name: 'И. Соколов', role: 'ГИП', current: 8, max: 6 },
        { name: 'Н. Лебедева', role: 'Инженер ПТО', current: 11, max: 10 },
        { name: 'В. Морозов', role: 'Конструктор', current: 9, max: 12 },
      ]
    },
    { 
      id: 'approval', name: 'ОК / Согласование', current: 19, max: 25, plan: 20, route: '/workflow?dept=approval', iconColor: COLORS.approval,
      employees: [
        { name: 'О. Новиков', role: 'Начальник ОК', current: 7, max: 5 },
        { name: 'Т. Фёдорова', role: 'Специалист ОК', current: 8, max: 10 },
        { name: 'С. Павлов', role: 'Юрист', current: 4, max: 10 },
      ]
    },
    { 
      id: 'archive', name: 'Архив', current: 5, max: 20, plan: 10, route: '/archive', iconColor: COLORS.archive,
      employees: [
        { name: 'Л. Гусева', role: 'Архивист', current: 3, max: 10 },
        { name: 'К. Борисов', role: 'Младший архивист', current: 2, max: 10 },
      ]
    },
    { 
      id: 'overdue', name: 'Просроченные', current: 7, max: 10, plan: 0, route: '/workflow?filter=overdue', iconColor: COLORS.overdue,
      employees: [
        { name: 'А. Смирнов', role: 'Ведущий инженер', current: 3, max: 0 },
        { name: 'Н. Лебедева', role: 'Инженер ПТО', current: 2, max: 0 },
        { name: 'О. Новиков', role: 'Начальник ОК', current: 2, max: 0 },
      ]
    },
  ];

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
        <h3 className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Загрузка по отделам</h3>
        <span className="text-[10px]" style={{ color: COLORS.textMuted }}>Сортировка: по загрузке ↓</span>
      </div>

      <div className="flex flex-col gap-1">
        {sortedDepts.map((dept) => {
          const pct = Math.round((dept.current / dept.max) * 100);
          const isExpanded = expandedId === dept.id;
          const loadLabel = getLoadLabel(dept.current, dept.max);
          const statusColor = getStatusColor(dept.current, dept.max);

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
                    <span style={{ color: dept.iconColor }}>
                      <FolderKanban size={14} />
                    </span>
                    <span className="text-xs font-semibold truncate" style={{ color: COLORS.textPrimary }}>
                      {dept.name}
                    </span>
                    <span 
                      className="text-[9px] px-1 py-0.5 rounded-full font-medium shrink-0"
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
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    Сотрудников: {dept.employees.length} | Задач: {dept.current}
                  </span>
                  {dept.current > dept.max && (
                    <span className="text-[9px] flex items-center gap-0.5 shrink-0 ml-1.5" style={{ color: '#DC2626' }}>
                      <AlertTriangle size={9} /> Перегруз
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-2.5 pb-2.5 pt-0">
                  <div className="border-t pt-2 mt-0.5" style={{ borderColor: COLORS.borderColor }}>
                <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium" style={{ color: COLORS.textSecondary }}>Сотрудники</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(dept.route); }}
                        className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors"
                        style={{ color: COLORS.tender, background: 'rgba(37,99,235,0.1)' }}
                      >
                        Все <ChevronRight size={8} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {dept.employees.map((emp, ei) => {
                        const empColor = getStatusColor(emp.current, emp.max);
                        return (
                          <div key={ei} className="flex items-center justify-between">
                            <span className="text-[10px] truncate" style={{ color: COLORS.textPrimary }}>{emp.name}</span>
                            <div className="flex items-center gap-1 shrink-0 ml-1.5">
                              <span 
                                className="text-[9px] px-1 py-0.5 rounded-full"
                                style={{ 
                                  background: empColor + '20', 
                                  color: empColor,
                                  border: `1px solid ${empColor}40`
                                }}
                              >
                                {emp.current}{emp.max > 0 ? `/${emp.max}` : ''}
                              </span>
                              <span className="text-[9px]" style={{ color: COLORS.textMuted }}>{emp.role}</span>
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