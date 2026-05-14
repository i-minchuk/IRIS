import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

/* ── Types ── */
interface LoadSegment {
  projectName: string;
  projectId: string;
  percent: number;
  color: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  totalLoad: number;
  segments: LoadSegment[];
}

interface HeatmapWeek {
  weekLabel: string;
  workdays: number;
  weekend: number;
  tasks: string[];
}

/* ── Mock data ── */
const teamLoad: TeamMember[] = [
  {
    id: '1', name: 'Иванов А.С.', role: 'ГИП', initials: 'ИА', totalLoad: 75,
    segments: [
      { projectName: 'ЖК «Северный»', projectId: 'p1', percent: 35, color: '#4F7A4C' },
      { projectName: 'ТЦ «Меридиан»', projectId: 'p2', percent: 40, color: '#6B5B95' },
      { projectName: 'Свободно', projectId: 'free', percent: 25, color: '#64748B' },
    ],
  },
  {
    id: '2', name: 'Петров В.К.', role: 'Инженер КЖ', initials: 'ПВ', totalLoad: 75,
    segments: [
      { projectName: 'Склад А-12', projectId: 'p3', percent: 55, color: '#D4AF37' },
      { projectName: 'Замечания', projectId: 'remarks', percent: 20, color: '#FF6B6B' },
      { projectName: 'Свободно', projectId: 'free', percent: 25, color: '#64748B' },
    ],
  },
  {
    id: '3', name: 'Сидорова Е.М.', role: 'Инженер ОВ', initials: 'СЕ', totalLoad: 60,
    segments: [
      { projectName: 'ТЭЦ-5', projectId: 'p4', percent: 45, color: '#3B82F6' },
      { projectName: 'Архив', projectId: 'archive', percent: 15, color: '#94A3B8' },
      { projectName: 'Свободно', projectId: 'free', percent: 40, color: '#64748B' },
    ],
  },
  {
    id: '4', name: 'Козлов Д.А.', role: 'Инженер ЭОМ', initials: 'КД', totalLoad: 90,
    segments: [
      { projectName: 'ЖК «Северный»', projectId: 'p1', percent: 50, color: '#4F7A4C' },
      { projectName: 'Офис «Гамма»', projectId: 'p5', percent: 30, color: '#6B5B95' },
      { projectName: 'Замечания', projectId: 'remarks', percent: 10, color: '#FF6B6B' },
    ],
  },
  {
    id: '5', name: 'Новикова И.П.', role: 'Тендерный спец.', initials: 'НИ', totalLoad: 45,
    segments: [
      { projectName: 'ТЦ «Меридиан»', projectId: 'p2', percent: 25, color: '#6B5B95' },
      { projectName: 'ТЭЦ-5', projectId: 'p4', percent: 20, color: '#3B82F6' },
      { projectName: 'Свободно', projectId: 'free', percent: 55, color: '#64748B' },
    ],
  },
];

const heatmapData: Record<string, HeatmapWeek[]> = {
  '1': [
    { weekLabel: '19-25 мая', workdays: 80, weekend: 10, tasks: ['КЖ-01-001', 'АР-03-015'] },
    { weekLabel: '26-01 июн', workdays: 40, weekend: 0, tasks: ['АР-03-015'] },
    { weekLabel: '02-08 июн', workdays: 95, weekend: 15, tasks: ['КЖ-01-002', 'ТЦ-Меридиан-05'] },
    { weekLabel: '09-15 июн', workdays: 70, weekend: 0, tasks: ['ТЦ-Меридиан-05'] },
    { weekLabel: '16-22 июн', workdays: 30, weekend: 0, tasks: [] },
  ],
  '2': [
    { weekLabel: '19-25 мая', workdays: 90, weekend: 20, tasks: ['Склад-А12-ОВиК'] },
    { weekLabel: '26-01 июн', workdays: 75, weekend: 0, tasks: ['Склад-А12-ОВиК', 'Замечание-42'] },
    { weekLabel: '02-08 июн', workdays: 60, weekend: 0, tasks: ['Замечание-42'] },
    { weekLabel: '09-15 июн', workdays: 85, weekend: 10, tasks: ['ТЭЦ-5-КР'] },
    { weekLabel: '16-22 июн', workdays: 50, weekend: 0, tasks: ['ТЭЦ-5-КР'] },
  ],
  '3': [
    { weekLabel: '19-25 мая', workdays: 60, weekend: 0, tasks: ['ТЭЦ-5-ОВ'] },
    { weekLabel: '26-01 июн', workdays: 55, weekend: 0, tasks: ['ТЭЦ-5-ОВ', 'Архив-1859'] },
    { weekLabel: '02-08 июн', workdays: 70, weekend: 5, tasks: ['Архив-1859'] },
    { weekLabel: '09-15 июн', workdays: 45, weekend: 0, tasks: [] },
    { weekLabel: '16-22 июн', workdays: 50, weekend: 0, tasks: ['Новый проект'] },
  ],
  '4': [
    { weekLabel: '19-25 мая', workdays: 95, weekend: 10, tasks: ['ЖК-Северный-ЭОМ', 'Офис-Гамма-ЭОМ'] },
    { weekLabel: '26-01 июн', workdays: 85, weekend: 0, tasks: ['ЖК-Северный-ЭОМ'] },
    { weekLabel: '02-08 июн', workdays: 90, weekend: 15, tasks: ['Офис-Гамма-ЭОМ', 'Замечание-55'] },
    { weekLabel: '09-15 июн', workdays: 100, weekend: 20, tasks: ['Замечание-55', 'ЖК-Северный-ЭОМ-2'] },
    { weekLabel: '16-22 июн', workdays: 80, weekend: 0, tasks: ['ЖК-Северный-ЭОМ-2'] },
  ],
  '5': [
    { weekLabel: '19-25 мая', workdays: 45, weekend: 0, tasks: ['ТЦ-Меридиан-тендер'] },
    { weekLabel: '26-01 июн', workdays: 50, weekend: 0, tasks: ['ТЦ-Меридиан-тендер', 'ТЭЦ-5-тендер'] },
    { weekLabel: '02-08 июн', workdays: 40, weekend: 0, tasks: ['ТЭЦ-5-тендер'] },
    { weekLabel: '09-15 июн', workdays: 30, weekend: 0, tasks: [] },
    { weekLabel: '16-22 июн', workdays: 35, weekend: 0, tasks: ['Подготовка пакета'] },
  ],
};

/* ── Helpers ── */
const getLoadColor = (percent: number) => {
  if (percent < 70) return '#4F7A4C';
  if (percent <= 90) return '#D4AF37';
  return '#FF6B6B';
};

const getHeatmapCellStyle = (percent: number, isDark: boolean) => {
  const alpha = isDark ? '0.25' : '0.12';
  if (percent <= 30) return { background: `rgba(79, 122, 76, ${alpha})`, color: '#4F7A4C' };
  if (percent <= 70) return { background: `rgba(212, 175, 55, ${alpha})`, color: '#D4AF37' };
  if (percent <= 100) return { background: `rgba(255, 107, 107, ${alpha})`, color: '#FF6B6B' };
  return { background: `rgba(220, 38, 38, ${isDark ? '0.35' : '0.2'})`, color: '#DC2626' };
};

/* ── Component ── */
export default function TeamLoadSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<{ name: string; percent: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Collect unique projects for legend
  const projectLegend = Array.from(
    new Map(
      teamLoad.flatMap((m) =>
        m.segments
          .filter((s) => s.projectId !== 'free')
          .map((s) => [s.projectName, s.color])
      )
    ).entries()
  );

  return (
    <div className="chart-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Загрузка команды
        </h3>
        <span className="text-xs px-2.5 py-1 rounded-full border" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-divider)' }}>
          {teamLoad.length} сотрудников
        </span>
      </div>

      {/* Stacked Bars */}
      <div className="space-y-4">
        {teamLoad.map((member) => {
          const isExpanded = expandedId === member.id;
          const loadColor = getLoadColor(member.totalLoad);

          return (
            <div key={member.id} className="group">
              {/* Row */}
              <button
                onClick={() => toggleExpand(member.id)}
                className="w-full text-left flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-xl transition-colors"
                style={{ background: isExpanded ? 'var(--iris-bg-hover)' : 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
                onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'var(--iris-accent-blue)', color: '#fff' }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {member.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {member.role}
                    </div>
                  </div>
                </div>

                {/* Bar */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden flex" style={{ background: 'var(--card-elevated)' }}>
                    {member.segments.map((seg, i) => (
                      <div
                        key={i}
                        className="h-full transition-all duration-500 relative cursor-help"
                        style={{ width: `${seg.percent}%`, background: seg.color }}
                        onMouseEnter={(e) => {
                          setHoveredSegment({ name: seg.projectName, percent: seg.percent });
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredSegment(null)}
                        onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
                      />
                    ))}
                  </div>

                  {/* Percent */}
                  <div className="flex items-center gap-1.5 shrink-0 w-16 justify-end">
                    <span className="text-sm font-bold" style={{ color: loadColor }}>
                      {member.totalLoad}%
                    </span>
                    {member.totalLoad > 90 && <AlertTriangle size={14} style={{ color: '#FF6B6B' }} />}
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>
              </button>

              {/* Heatmap Detail */}
              {isExpanded && (
                <div className="mt-3 ml-0 sm:ml-[164px] p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-divider)' }}>
                  <div className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {member.name} — загрузка по неделям
                  </div>
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      {/* Header row */}
                      <div className="grid grid-cols-6 gap-2 mb-2">
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}></div>
                        {heatmapData[member.id]?.map((w) => (
                          <div key={w.weekLabel} className="text-xs text-center font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {w.weekLabel}
                          </div>
                        ))}
                      </div>
                      {/* Workdays row */}
                      <div className="grid grid-cols-6 gap-2 mb-1">
                        <div className="text-xs flex items-center" style={{ color: 'var(--text-muted)' }}>Будни</div>
                        {heatmapData[member.id]?.map((w, i) => {
                          const style = getHeatmapCellStyle(w.workdays, true); // detect theme in real app
                          return (
                            <div
                              key={`wd-${i}`}
                              className="h-10 rounded-lg flex items-center justify-center text-xs font-bold cursor-help relative group/cell"
                              style={{ background: style.background, color: style.color }}
                              title={w.tasks.join(', ') || 'Нет задач'}
                            >
                              {w.workdays}%
                              {/* Tooltip */}
                              {w.tasks.length > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50">
                                  <div className="rounded-lg px-3 py-2 text-xs whitespace-nowrap" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--iris-shadow-lg)' }}>
                                    {w.tasks.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Weekend row */}
                      <div className="grid grid-cols-6 gap-2">
                        <div className="text-xs flex items-center" style={{ color: 'var(--text-muted)' }}>Выходные</div>
                        {heatmapData[member.id]?.map((w, i) => {
                          const style = getHeatmapCellStyle(w.weekend, true);
                          return (
                            <div
                              key={`we-${i}`}
                              className="h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                              style={{ background: style.background, color: style.color, opacity: 0.7 }}
                              title={w.tasks.join(', ') || 'Нет задач'}
                            >
                              {w.weekend > 0 ? `${w.weekend}%` : '—'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 flex flex-wrap gap-x-4 gap-y-2" style={{ borderTop: '1px solid var(--border-divider)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Проекты:</span>
        {projectLegend.map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {name}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#64748B' }} />
          Свободно
        </span>
      </div>

      {/* Floating tooltip for bar segments */}
      {hoveredSegment && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 text-xs"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 36,
            background: 'var(--iris-bg-surface)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--iris-shadow-lg)',
          }}
        >
          {hoveredSegment.name}: {hoveredSegment.percent}%
        </div>
      )}
    </div>
  );
}
