import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

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
  initialsColor: string;
  totalLoad: number;
  segments: LoadSegment[];
}

/* ── Mock data ── */
const teamLoad: TeamMember[] = [
  {
    id: '1', name: 'Иванов А.С.', role: 'ГИП', initials: 'ИА', initialsColor: '#2563EB', totalLoad: 75,
    segments: [
      { projectName: 'ЖК «Северный»', projectId: 'p1', percent: 35, color: '#4F7A4C' },
      { projectName: 'ТЦ «Меридиан»', projectId: 'p2', percent: 40, color: '#6B5B95' },
    ],
  },
  {
    id: '2', name: 'Петров В.К.', role: 'Инженер КЖ', initials: 'ПВ', initialsColor: '#6B5B95', totalLoad: 75,
    segments: [
      { projectName: 'Склад А-12', projectId: 'p3', percent: 55, color: '#D4AF37' },
      { projectName: 'Замечания', projectId: 'remarks', percent: 20, color: '#FF6B6B' },
    ],
  },
  {
    id: '3', name: 'Сидорова Е.М.', role: 'Инженер ОВ', initials: 'СЕ', initialsColor: '#D4AF37', totalLoad: 60,
    segments: [
      { projectName: 'ТЭЦ-5', projectId: 'p4', percent: 45, color: '#3B82F6' },
      { projectName: 'Архив', projectId: 'archive', percent: 15, color: '#94A3B8' },
    ],
  },
  {
    id: '4', name: 'Козлов Д.А.', role: 'Инженер ЭОМ', initials: 'КД', initialsColor: '#0C7205', totalLoad: 90,
    segments: [
      { projectName: 'ЖК «Северный»', projectId: 'p1', percent: 50, color: '#4F7A4C' },
      { projectName: 'Офис «Гамма»', projectId: 'p5', percent: 30, color: '#6B5B95' },
    ],
  },
  {
    id: '5', name: 'Новикова И.П.', role: 'Тендерный спец.', initials: 'НИ', initialsColor: '#DC2626', totalLoad: 45,
    segments: [
      { projectName: 'ТЦ «Меридиан»', projectId: 'p2', percent: 25, color: '#6B5B95' },
      { projectName: 'ТЭЦ-5', projectId: 'p4', percent: 20, color: '#3B82F6' },
    ],
  },
];

/* ── Helpers ── */
const getLoadColor = (percent: number) => {
  if (percent <= 50) return '#4F7A4C';
  if (percent <= 75) return '#2563EB';
  if (percent <= 89) return '#D4AF37';
  return '#DC2626';
};

/* ── Component ── */
export default function TeamLoadSection() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          Загрузка команды
        </h3>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {teamLoad.length} сотрудников
        </span>
      </div>

      {/* Team List */}
      <div className="flex flex-col gap-1.5">
        {teamLoad.map((member, _idx) => {
          const isExpanded = expandedId === member.id;
          const loadColor = getLoadColor(member.totalLoad);
          const loadLabel = member.totalLoad <= 50 ? 'Свободен' : member.totalLoad <= 75 ? 'Норма' : member.totalLoad <= 89 ? 'Планируется' : 'Перегруз';
          const activeProjects = member.segments.length;

          return (
            <div 
              key={member.id} 
              className="rounded-lg overflow-hidden transition-all"
              style={{ 
                background: 'var(--card-bg)', 
                border: `1px solid ${isExpanded ? loadColor + '40' : 'var(--border-color)'}`,
              }}
            >
              <button
                onClick={() => toggleExpand(member.id)}
                className="w-full text-left p-2.5 transition-colors hover:brightness-105"
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: member.initialsColor + '20', color: member.initialsColor, border: `1px solid ${member.initialsColor}40` }}
                    >
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {member.name}
                      </div>
                      <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    <span className="text-xs font-bold" style={{ color: loadColor }}>{member.totalLoad}%</span>
                    {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(member.totalLoad, 100)}%`, background: loadColor, opacity: 0.8 }} />
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Проектов: {activeProjects}
                  </span>
                  {member.totalLoad > 90 && (
                    <span className="text-[9px] flex items-center gap-0.5 shrink-0 ml-1.5" style={{ color: '#DC2626' }}>
                      <AlertTriangle size={9} /> Критично
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-2.5 pb-2.5 pt-0">
                  <div className="border-t pt-2 mt-0.5" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>Активные проекты</span>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{loadLabel}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {member.segments.map((seg, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>{seg.projectName}</span>
                          <div className="flex items-center gap-1 shrink-0 ml-1.5">
                            <span 
                              className="text-[9px] px-1 py-0.5 rounded-full"
                              style={{ 
                                background: seg.color + '20', 
                                color: seg.color,
                                border: `1px solid ${seg.color}40`
                              }}
                            >
                              {seg.percent}%
                            </span>
                          </div>
                        </div>
                      ))}
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