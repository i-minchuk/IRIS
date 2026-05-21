import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import {
  FolderKanban, FileCheck, Clock, AlertTriangle,
  ArrowRight, Users, ChevronRight, ChevronDown,
  Bell, Gift, CheckCircle, MessageSquare, UserPlus, FileWarning, Link as LinkIcon
} from 'lucide-react';
import { TeamLoadSection } from './TeamLoadSection';
import { DepartmentLoad } from './DashboardWidgets';

/* ── Types ── */
interface ProjectDoc {
  name: string;
  status: string;
  date: string;
}

interface ProjectItem {
  id: string;
  name: string;
  percent: number;
  status: 'active' | 'review' | 'approved' | 'overdue';
  route: string;
  docs: ProjectDoc[];
  deadline: string;
  daysLeft: number;
  riskLevel: 'high' | 'medium' | 'low';
  blockedBy?: string;
}

const projectData: ProjectItem[] = [
  { 
    id: 'gamma', name: 'Офис «Гамма»', percent: 23, status: 'overdue', route: '/projects?filter=overdue',
    deadline: '18.05.2026', daysLeft: 2, riskLevel: 'high', blockedBy: 'ТЭЦ-5',
    docs: [
      { name: 'ЭОМ-05-003.dwg', status: 'Просрочен', date: '01.05.2026' },
      { name: 'КЖ-02-014.dwg', status: 'На проверке', date: '10.05.2026' },
    ]
  },
  { 
    id: 'meridian', name: 'ТЦ «Меридиан»', percent: 45, status: 'review', route: '/projects?filter=review',
    deadline: '25.05.2026', daysLeft: 9, riskLevel: 'medium',
    docs: [
      { name: 'АР-03-015.pdf', status: 'Согласован', date: '08.05.2026' },
      { name: 'ОВиК-01-005.docx', status: 'На согласовании', date: '12.05.2026' },
    ]
  },
  { 
    id: 'severny', name: 'ЖК «Северный»', percent: 78, status: 'active', route: '/projects?filter=active',
    deadline: '10.05.2026', daysLeft: 5, riskLevel: 'high',
    docs: [
      { name: 'КЖ-01-001.dwg', status: 'На проверке', date: '09.05.2026' },
      { name: 'ЭМ-04-002.pdf', status: 'В работе', date: '11.05.2026' },
    ]
  },
  { 
    id: 'tec5', name: 'ТЭЦ-5', percent: 61, status: 'active', route: '/projects?filter=active',
    deadline: '30.05.2026', daysLeft: 25, riskLevel: 'low',
    docs: [
      { name: 'КР-01-002.pdf', status: 'На согласовании', date: '06.05.2026' },
    ]
  },
  { 
    id: 'sklad', name: 'Склад А-12', percent: 92, status: 'approved', route: '/projects?filter=approved',
    deadline: '05.05.2026', daysLeft: 0, riskLevel: 'low', blockedBy: 'Склад А-12',
    docs: [
      { name: 'ОВиК-02-008.docx', status: 'Утверждён', date: '07.05.2026' },
    ]
  },
];

/* ── Inline компактная воронка ── */
function CompactFunnel() {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const steps = [
    { label: 'Поступило', value: '1247', sub: 'всего', color: '#2563EB' },
    { label: 'В работе', value: '156', sub: 'активно', color: '#0EA5E9' },
    { label: 'На согласовании', value: '84', sub: '2.3 дня', color: '#D4AF37' },
    { label: 'Утверждено', value: '892', sub: 'за месяц', color: '#0C7205' },
    { label: 'Просрочено', value: '7', sub: 'внимание', color: '#DC2626' },
  ];

  return (
    <div 
      className="neon-blue p-3 rounded-xl cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--card-bg)',
        transform: hover ? 'scale(1.01) translateY(-2px)' : 'scale(1)',
        boxShadow: hover 
          ? (isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(0,0,0,0.08)') 
          : 'none',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          Воронка документооборота
        </h3>
        <button className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
          Все <ArrowRight size={10} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <button
              onClick={() => navigate('/workflow')}
              className="flex flex-col items-center text-center min-w-[60px] rounded-md py-1 transition-colors"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="text-[9px] leading-none mb-0.5" style={{ color: 'var(--text-muted)' }}>
                {step.label}
              </span>
              <span className="text-base font-bold leading-tight" style={{ color: step.color }}>
                {step.value}
              </span>
              <span className="text-[8px] leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {step.sub}
              </span>
            </button>
            {i < steps.length - 1 && (
              <ChevronRight size={10} className="mx-0.5 shrink-0" style={{ color: 'var(--text-muted)', opacity: 0.35 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Компактная загруженность по дням ── */
function CompactHeatmap() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const weeks = [
    { label: '←3н', days: [27, 28, 29, 30, 1, 2, 3] },
    { label: '←2н', days: [4, 5, 6, 7, 8, 9, 10] },
    { label: '←1н', days: [11, 12, 13, 14, 15, 16, 17] },
    { label: 'Тек', days: [18, 19, 20, 21, 22, 23, 24] },
    { label: '→',   days: [25, 26, 27, 28, 29, 30, 31] },
  ];

  // Массив значений, параллельный weeks
  const loadData = [
    [10, 25, 15, 55, 20, 35, 10],   // ←3н
    [15, 45, 60, 85, 50, 30, 15],   // ←2н
    [20, 40, 75, 90, 65, 35, 20],   // ←1н
    [25, 50, 70, 95, 80, 45, 30],   // Тек
    [20, 35, 60, 40, 25, 15, 10],   // →
  ];

  const getBg = (val: number) => {
    if (val <= 20) return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    if (val <= 45) return isDark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.14)';
    if (val <= 70) return isDark ? 'rgba(212,175,55,0.28)' : 'rgba(212,175,55,0.18)';
    if (val <= 85) return isDark ? 'rgba(251,146,60,0.32)' : 'rgba(251,146,60,0.22)';
    return isDark ? 'rgba(239,68,68,0.38)' : 'rgba(239,68,68,0.22)';
  };

  const getText = (val: number) => {
    if (val <= 20) return 'var(--text-muted)';
    if (val >= 85) return isDark ? '#fecaca' : '#991b1b';
    return isDark ? '#e2e8f0' : '#475569';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          Загруженность по дням
        </h3>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Последние 30 дней
        </span>
      </div>

      <div className="grid grid-cols-[1.75rem_repeat(7,1fr)] gap-1 mb-1">
        <div />
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
          <div key={d} className="text-center text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-cols-[1.75rem_repeat(7,1fr)] gap-1 items-center">
            <div className="text-[9px] text-right leading-none pr-1" style={{ color: 'var(--text-muted)' }}>
              {w.label}
            </div>
            {w.days.map((day, di) => {
              const val = loadData[wi][di] ?? 0;
              const isWeekend = di >= 5;
              return (
                <button
                  key={di}
                  onClick={() => navigate('/team')}
                  className="h-6 rounded-md flex items-center justify-center text-[9px] font-medium select-none transition-transform hover:scale-110"
                  style={{
                    background: getBg(val),
                    color: isWeekend && val <= 20 ? 'var(--text-muted)' : getText(val),
                    opacity: isWeekend && val <= 20 ? 0.5 : 1,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title={`${day}: загрузка ${val}%`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Низкая</span>
        <div className="flex gap-0.5">
          {[15, 35, 60, 90].map(v => (
            <div key={v} className="w-2.5 h-2.5 rounded-sm" style={{ background: getBg(v) }} />
          ))}
        </div>
        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Критическая</span>
      </div>
    </div>
  );
}

/* ── Component ── */
export default function Dashboard() {
  const navigate = useNavigate();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const statusWeight = { overdue: 0, review: 1, active: 2, approved: 3 };
  const sortedProjects = [...projectData].sort((a, b) => statusWeight[a.status] - statusWeight[b.status]);

  const getProjectColor = (status: string) => {
    if (status === 'overdue') return '#EF4444';
    if (status === 'review') return '#D4AF37';
    if (status === 'approved') return '#0C7205';
    return '#2563EB';
  };

  const getProjectLabel = (status: string) => {
    if (status === 'overdue') return 'Просрочен';
    if (status === 'review') return 'На проверке';
    if (status === 'approved') return 'Завершён';
    return 'В работе';
  };

  const getProjectIcon = (status: string) => {
    if (status === 'overdue') return <AlertTriangle size={14} />;
    if (status === 'review') return <Clock size={14} />;
    if (status === 'approved') return <FileCheck size={14} />;
    return <FolderKanban size={14} />;
  };

  const riskItems = [
    { 
      id: 'r1', level: 'high' as const, title: 'Офис «Гамма»', desc: 'Просрочка + нет согласования заказчика', 
      action: 'Перейти в Workflow', color: '#DC2626' 
    },
    { 
      id: 'r2', level: 'medium' as const, title: 'ТЭЦ-5', desc: 'Зависимость от подрядчика (блокирует Склад А-12)', 
      action: 'Посмотреть замечания', color: '#D4AF37' 
    },
    { 
      id: 'r3', level: 'medium' as const, title: 'Тендерный отдел', desc: 'Перегруз 85% (план 75%)', 
      action: 'Перераспределить', color: '#D4AF37' 
    },
  ];

  const [showAllRisks, setShowAllRisks] = useState(false);
  const visibleRisks = showAllRisks ? riskItems : riskItems.slice(0, 3);

  return (
    <div 
      className="min-h-screen w-full overflow-x-hidden" 
      style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)', padding: '1.5rem' }}
    >
      {/* ═══ ГЛАВНЫЙ GRID: левая основная + правая sidebar (260px) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

        {/* ═══ ЛЕВАЯ КОЛОНКА ═══ */}
        <div className="space-y-4 min-w-0">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Панель управления
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Аналитика по проектам и документообороту
              </p>
            </div>

          </div>

          {/* Быстрые действия (CTA) */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => alert('Массовое согласование — в разработке')}
              className="text-xs px-2 py-1 rounded-md transition-all hover:brightness-105"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              ⚡ Утвердить 84 документа
            </button>
            <button 
              onClick={() => navigate('/team')}
              className="text-xs px-2 py-1 rounded-md transition-all hover:brightness-105"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              👤 Назначить ресурс
            </button>
            <button 
              disabled
              className="text-xs px-2 py-1 rounded-md opacity-50 cursor-not-allowed"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              📋 Созвон по рискам
            </button>
            <button 
              disabled
              className="text-xs px-2 py-1 rounded-md opacity-50 cursor-not-allowed"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
            >
              📊 Экспорт отчёта
            </button>
          </div>

          {/* 3 KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => navigate('/workflow?filter=overdue')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid rgba(220,38,38,0.35)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Требуют внимания</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>
                  <AlertTriangle size={12} />
                </span>
              </div>
              <div className="text-xl font-bold" style={{ color: '#DC2626' }}>7</div>
              <div className="text-[10px] flex items-center gap-1 font-medium" style={{ color: '#DC2626' }}>
                <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
                Срочно в Workflow
              </div>
            </button>
            <button onClick={() => navigate('/workflow')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid rgba(212,175,55,0.35)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>На согласовании</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}>
                  <Clock size={12} />
                </span>
              </div>
              <div className="text-xl font-bold" style={{ color: '#D4AF37' }}>84</div>
              <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
                Среднее время: 2.3 дня
              </div>
            </button>
            <button onClick={() => navigate('/documents?dept=tender')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid rgba(37,99,235,0.35)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Перегруженный отдел</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563EB' }}>
                  <Users size={12} />
                </span>
              </div>
              <div className="text-xl font-bold" style={{ color: '#2563EB' }}>34/40</div>
              <div className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
                Тендерный отдел — 85%
              </div>
            </button>
          </div>

          {/* Воронка */}
          <CompactFunnel />

          {/* Загруженность по дням — компактная */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <CompactHeatmap />
          </div>

          {/* ═══ ТРИ БЛОКА В ОДИН РЯД — равные широкие колонки ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* 1. Прогресс проектов */}
            <div className="p-3 rounded-xl min-w-0" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => navigate('/projects')}
                  className="text-xs font-semibold text-left"
                  style={{ color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Прогресс проектов
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/projects')}
                    className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    Все <ArrowRight size={10} />
                  </button>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>По риску ↓</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {sortedProjects.map((project) => {
                  const color = getProjectColor(project.status);
                  const isExpanded = expandedProject === project.id;
                  const label = getProjectLabel(project.status);

                  return (
                    <div 
                      key={project.id}
                      className="rounded-lg overflow-hidden transition-all"
                      style={{ 
                        background: 'var(--card-bg)', 
                        border: `1px solid ${isExpanded ? color + '40' : 'var(--border-color)'}`,
                      }}
                    >
                      <button
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                        className="w-full text-left p-2.5 transition-colors hover:brightness-105"
                        style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span style={{ color }}>{getProjectIcon(project.status)}</span>
                            <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                              {project.name}
                            </span>
                            <span 
                              className="text-[9px] px-1 py-0.5 rounded-full font-medium shrink-0"
                              style={{ background: color + '20', color, border: `1px solid ${color}40` }}
                            >
                              {label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            <span className="text-xs font-bold" style={{ color }}>{project.percent}%</span>
                            {isExpanded ? <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                          </div>
                        </div>

                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${project.percent}%`, background: color, opacity: 0.8 }} />
                        </div>

                        <div className="mt-1.5 flex items-center justify-between">
                          <span 
                            className="text-[10px]"
                            style={{ 
                              color: project.daysLeft <= 3 ? '#DC2626' : 
                                     project.daysLeft <= 7 ? '#D4AF37' : 
                                     'var(--text-muted)'
                            }}
                          >
                            📅 Дедлайн: {project.deadline} ({project.daysLeft} дн.)
                          </span>
                          {project.blockedBy && (
                            <span className="text-[9px] flex items-center gap-0.5 shrink-0 ml-1.5" style={{ color: '#FF6B6B' }}>
                              <LinkIcon size={9} /> Блокирует: {project.blockedBy}
                            </span>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 pt-0">
                          <div className="border-t pt-2 mt-0.5" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>Документы</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); navigate(project.route); }}
                                className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors"
                                style={{ color: '#2563EB', background: 'rgba(37,99,235,0.1)' }}
                              >
                                Все <ArrowRight size={8} />
                              </button>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {project.docs.map((doc, di) => (
                                <div key={di} className="flex items-center justify-between">
                                  <span className="text-[11px] truncate" style={{ color: 'var(--text-primary)' }}>{doc.name}</span>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                                    <span 
                                      className="text-[9px] px-1 py-0.5 rounded-full"
                                      style={{ 
                                        background: doc.status === 'Просрочен' ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)', 
                                        color: doc.status === 'Просрочен' ? '#EF4444' : '#2563EB',
                                        border: `1px solid ${doc.status === 'Просрочен' ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.3)'}`
                                      }}
                                    >
                                      {doc.status}
                                    </span>
                                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{doc.date}</span>
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

            {/* 2. Загрузка по отделам */}
            <div
              className="p-3 rounded-xl min-w-0"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <DepartmentLoad />
            </div>

            {/* 3. Загрузка команды */}
            <div
              className="p-3 rounded-xl min-w-0"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <TeamLoadSection />
            </div>

          </div>

        </div>

        {/* ═══ ПРАВАЯ SIDEBAR (260px) ═══ */}
        <div className="space-y-4 lg:sticky lg:top-5">

          {/* Что нового */}
          <div className="p-3 rounded-xl flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Что нового</h3>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 py-0.5 rounded-full font-medium" style={{ background: 'rgba(220,38,38,0.15)', color: '#DC2626' }}>3</span>
                <Bell size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { icon: <FileWarning size={12} />, text: 'Новое замечание по КЖ-02-014', badge: 'Критично', badgeColor: '#DC2626', time: '10 мин' },
                { icon: <CheckCircle size={12} />, text: 'АР-03-015 согласован', badge: 'Согласование', badgeColor: '#D4AF37', time: '1 ч' },
                { icon: <MessageSquare size={12} />, text: 'Упоминание в ТЭЦ-5', badge: 'Новое', badgeColor: '#2563EB', time: '2 ч' },
                { icon: <UserPlus size={12} />, text: 'Назначен по Склад А-12', badge: 'Назначение', badgeColor: '#0C7205', time: '3 ч' },
              ].map((note, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/workflow')}
                  className="w-full text-left p-2 rounded-md transition-colors flex items-start gap-1.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ color: 'var(--text-muted)', marginTop: '1px' }}>{note.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] leading-snug" style={{ color: 'var(--text-primary)' }}>{note.text}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] px-1 py-0.5 rounded-full font-medium" style={{ background: note.badgeColor + '18', color: note.badgeColor, border: `1px solid ${note.badgeColor}30` }}>
                        {note.badge}
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{note.time}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/workflow')}
              className="w-full text-center text-[10px] py-1 rounded-md transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--card-elevated)', border: '1px solid var(--border-color)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card-elevated)'; }}
            >
              Показать все
            </button>
          </div>

          {/* Команда */}
          <div className="p-3 rounded-xl flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Команда</h3>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 py-0.5 rounded-full font-medium" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>2</span>
                <Gift size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { name: 'Анна Петрова', role: 'ГИП', date: 'Сегодня', avatar: 'АП', highlight: true },
                { name: 'Дмитрий Соколов', role: 'Конструктор', date: 'Завтра', avatar: 'ДС', highlight: true },
                { name: 'Елена Волкова', role: 'Архитектор', date: '18 мая', avatar: 'ЕВ', highlight: false },
                { name: 'Иван Кузнецов', role: 'ОВиК', date: '22 мая', avatar: 'ИК', highlight: false },
              ].map((person, i) => (
                <div
                  key={i}
                  onClick={() => navigate('/team')}
                  className="w-full flex items-center gap-2 p-1.5 rounded-md text-left transition-colors cursor-pointer"
                  style={{ background: person.highlight ? (isDark ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.06)') : 'transparent' }}
                  onMouseEnter={(e) => { if (!person.highlight) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = person.highlight ? (isDark ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.06)') : 'transparent'; }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: person.highlight ? 'rgba(212,175,55,0.2)' : 'var(--card-elevated)', color: person.highlight ? '#D4AF37' : 'var(--text-secondary)', border: `1px solid ${person.highlight ? '#D4AF3740' : 'var(--border-color)'}` }}>
                    {person.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{person.name}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{person.role}</div>
                  </div>
                  <div className="text-[9px] font-medium shrink-0" style={{ color: person.highlight ? '#D4AF37' : 'var(--text-muted)' }}>
                    {person.highlight && <Gift size={8} className="inline mr-0.5" />}
                    {person.date}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/team')} className="w-full text-center text-[10px] py-1 rounded-md" style={{ color: 'var(--text-secondary)', background: 'var(--card-elevated)', border: '1px solid var(--border-color)' }}>
              Вся команда
            </button>
          </div>

          {/* Риски */}
          <div className="p-3 rounded-xl flex flex-col gap-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Риски и требования внимания</h3>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 py-0.5 rounded-full font-medium" style={{ background: 'rgba(220,38,38,0.15)', color: '#DC2626' }}>{riskItems.length}</span>
                <AlertTriangle size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {visibleRisks.map((risk) => (
                <div 
                  key={risk.id} 
                  className="p-2 rounded-md"
                  style={{ 
                    borderLeft: '4px solid',
                    borderColor: risk.color,
                    background: risk.color + '08'
                  }}
                >
                  <div className="text-[10px] font-semibold mb-0.5" style={{ color: risk.color }}>
                    {risk.level === 'high' ? '🔴 Высокий' : '🟡 Средний'}: {risk.title}
                  </div>
                  <div className="text-[10px] mb-1.5" style={{ color: 'var(--text-primary)' }}>{risk.desc}</div>
                  <button 
                    onClick={() => navigate('/workflow')}
                    className="text-[9px] px-1.5 py-0.5 rounded transition-colors"
                    style={{ color: risk.color, background: risk.color + '15' }}
                  >
                    {risk.action}
                  </button>
                </div>
              ))}
            </div>
            {riskItems.length > 3 && (
              <button 
                onClick={() => setShowAllRisks(!showAllRisks)}
                className="w-full text-center text-[10px] py-1 rounded-md" 
                style={{ color: 'var(--text-secondary)', background: 'var(--card-elevated)', border: '1px solid var(--border-color)' }}
              >
                {showAllRisks ? 'Скрыть' : 'Показать все риски'}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}