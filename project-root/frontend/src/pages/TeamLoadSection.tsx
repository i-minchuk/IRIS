import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import {
  User, FolderKanban, ChevronRight, ChevronDown
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

interface Employee {
  name: string;
  role: string;
  current: number;
  max: number;
  avatar?: string;
  projects: { name: string; status: 'active' | 'review' | 'approved' | 'overdue' }[];
}

export function TeamLoadSection() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const employees: Employee[] = [
    {
      name: 'А. Смирнов',
      role: 'Ведущий инженер',
      current: 12,
      max: 10,
      projects: [
        { name: 'ЖК «Северный»', status: 'active' },
        { name: 'ТЦ «Меридиан»', status: 'review' },
      ],
    },
    {
      name: 'Е. Козлова',
      role: 'Инженер КД',
      current: 9,
      max: 8,
      projects: [
        { name: 'Офис «Гамма»', status: 'overdue' },
        { name: 'ТЭЦ-5', status: 'active' },
      ],
    },
    {
      name: 'Д. Петров',
      role: 'Младший инженер',
      current: 8,
      max: 12,
      projects: [
        { name: 'Склад А-12', status: 'approved' },
      ],
    },
    {
      name: 'И. Соколов',
      role: 'ГИП',
      current: 8,
      max: 6,
      projects: [
        { name: 'ЖК «Северный»', status: 'active' },
        { name: 'ТЦ «Меридиан»', status: 'review' },
        { name: 'ТЭЦ-5', status: 'active' },
      ],
    },
    {
      name: 'Н. Лебедева',
      role: 'Инженер ПТО',
      current: 11,
      max: 10,
      projects: [
        { name: 'ТЦ «Меридиан»', status: 'review' },
      ],
    },
  ];

  const totalLoad = employees.reduce((sum, e) => sum + e.current, 0);
  const totalMax = employees.reduce((sum, e) => sum + e.max, 0);
  const avgLoad = Math.round((totalLoad / totalMax) * 100);
  const overloadedCount = employees.filter(e => e.current > e.max).length;

  const getBarColor = (current: number, max: number) => {
    const pct = current / max;
    if (pct > 0.85) return COLORS.yellow;
    if (pct > 0.6) return COLORS.blue;
    return COLORS.green;
  };

  return (
    <div className="w-full">
      {/* Summary */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>Загрузка команды</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
            Средняя: <strong style={{ color: avgLoad > 85 ? COLORS.yellow : COLORS.blue }}>{avgLoad}%</strong>
          </span>
          {overloadedCount > 0 && (
            <span className="text-[10px] px-1 py-0.5 rounded-full" style={{ background: COLORS.coral + '15', color: COLORS.coral }}>
              {overloadedCount} перегружен
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {employees.map((emp, idx) => {
          const pct = Math.round((emp.current / emp.max) * 100);
          const barColor = getBarColor(emp.current, emp.max);
          const isExpanded = expandedId === String(idx);

          return (
            <div
              key={idx}
              className="rounded-xl overflow-hidden transition-all"
              style={{
                background: COLORS.cardBg,
                border: `1px solid ${isExpanded ? barColor + '40' : COLORS.borderColor}`,
              }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : String(idx))}
                className="w-full text-left p-2.5 transition-colors hover:brightness-105"
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: barColor + '15', color: barColor }}
                  >
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[12px] font-medium truncate"
                        style={{ color: COLORS.textPrimary }}
                      >
                        {emp.name}
                      </span>
                      <span className="text-[11px] font-bold shrink-0 ml-2" style={{ color: barColor }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] truncate" style={{ color: COLORS.textMuted }}>{emp.role}</span>
                      <span className="text-[10px] shrink-0" style={{ color: COLORS.textMuted }}>
                        {emp.current}/{emp.max}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={14} style={{ color: COLORS.textMuted }} /> : <ChevronRight size={14} style={{ color: COLORS.textMuted }} />}
                </div>

                <div className="h-1.5 w-full rounded-full overflow-hidden mt-1.5" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: barColor, opacity: 0.7 }} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-2.5 pb-2.5 pt-0">
                  <div className="border-t pt-2 mt-0.5" style={{ borderColor: COLORS.borderColor }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium" style={{ color: COLORS.textSecondary }}>Проекты</span>
                      <button
                        onClick={() => navigate('/projects')}
                        className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors"
                        style={{ color: COLORS.blue, background: COLORS.blue + '10', border: 'none', cursor: 'pointer' }}
                      >
                        Все <ChevronRight size={8} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {emp.projects.map((proj, pi) => {
                        const projColor = proj.status === 'overdue' ? COLORS.coral : proj.status === 'review' ? COLORS.yellow : proj.status === 'approved' ? COLORS.green : COLORS.blue;
                        return (
                          <div
                            key={pi}
                            onClick={() => navigate('/projects')}
                            className="flex items-center justify-between w-full p-1.5 rounded transition-colors cursor-pointer"
                            style={{ background: 'transparent' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div className="flex items-center gap-1.5">
                              <FolderKanban size={12} style={{ color: projColor }} />
                              <span className="text-[11px]" style={{ color: COLORS.textPrimary }}>{proj.name}</span>
                            </div>
                            <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ background: projColor + '15', color: projColor }}>
                              {proj.status === 'active' ? 'В работе' : proj.status === 'review' ? 'На проверке' : proj.status === 'approved' ? 'Завершён' : 'Просрочен'}
                            </span>
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