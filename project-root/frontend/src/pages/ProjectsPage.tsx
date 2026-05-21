import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import {
  FolderKanban, FileCheck, Clock, AlertTriangle,
  ArrowRight, Users, ChevronRight, ChevronDown,
  Link as LinkIcon, Gavel, Search,
  Calendar, DollarSign, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock3, Send
} from 'lucide-react';
import { DepartmentLoad } from './DashboardWidgets';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
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

interface TenderItem {
  id: string;
  number: string;
  name: string;
  customer: string;
  status: 'preparation' | 'submitted' | 'review' | 'won' | 'lost';
  deadline: string;
  budget: string;
  daysLeft: number;
  winChance: number;
}

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */
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

const tenderData: TenderItem[] = [
  { id: 't1', number: 'Т-2026-044', name: 'Строительство ЖК «Северный»', customer: 'ООО «СеверСтрой»', status: 'review', deadline: '25.05.2026', budget: '₽ 420 млн', daysLeft: 4, winChance: 65 },
  { id: 't2', number: 'Т-2026-045', name: 'Реконструкция ТЭЦ-5', customer: 'ПАО «МосЭнерго»', status: 'preparation', deadline: '30.06.2026', budget: '₽ 180 млн', daysLeft: 40, winChance: 45 },
  { id: 't3', number: 'Т-2026-046', name: 'Офисный комплекс «Гамма»', customer: 'ООО «ГаммаДев»', status: 'submitted', deadline: '15.05.2026', budget: '₽ 95 млн', daysLeft: -6, winChance: 30 },
  { id: 't4', number: 'Т-2026-042', name: 'Склад А-12 — электрика', customer: 'ООО «ЛогистикПро»', status: 'won', deadline: '01.04.2026', budget: '₽ 38 млн', daysLeft: 0, winChance: 100 },
  { id: 't5', number: 'Т-2026-043', name: 'ТЦ «Меридиан» — ОВиК', customer: 'ООО «МеридианГрупп»', status: 'lost', deadline: '10.04.2026', budget: '₽ 62 млн', daysLeft: 0, winChance: 0 },
  { id: 't6', number: 'Т-2026-047', name: 'ЖК «Южный парк»', customer: 'ООО «ЮжПарк»', status: 'preparation', deadline: '12.07.2026', budget: '₽ 550 млн', daysLeft: 52, winChance: 55 },
];

/* ═══════════════════════════════════════════════════════════
   TABS — 1:1 как «Панель аналитики / Портфель заказов»
   ═══════════════════════════════════════════════════════════ */
type TabKey = 'tenders' | 'projects';

function PageTabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'tenders', label: 'ТЕНДЕРЫ', icon: <Gavel size={16} /> },
    { key: 'projects', label: 'ПРОЕКТЫ', icon: <FolderKanban size={16} /> },
  ];

  return (
    <div 
      className="flex items-center gap-1"
      style={{ borderBottom: '1px solid #e5e7eb' }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer outline-none"
            style={{
              color: isActive ? '#111827' : '#9ca3af',
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
              marginBottom: '-1px',
              fontWeight: isActive ? 600 : 400,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = '#4b5563';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <span style={{ opacity: isActive ? 1 : 0.6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER BAR — плашки как на скриншоте
   ═══════════════════════════════════════════════════════════ */
function FilterBar({ 
  options, 
  active, 
  onChange, 
  count 
}: { 
  options: { key: string; label: string }[]; 
  active: string; 
  onChange: (k: string) => void;
  count?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer outline-none"
          style={{
            background: '#ffffff',
            color: active === opt.key ? '#111827' : '#64748b',
            border: active === opt.key ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
            fontWeight: active === opt.key ? 500 : 400,
          }}
        >
          {opt.label}
          <ChevronDown size={12} style={{ opacity: 0.5 }} />
        </button>
      ))}
      {count !== undefined && (
        <span className="text-xs ml-1" style={{ color: '#94a3b8' }}>
          Найдено: {count}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TENDER VIEW
   ═══════════════════════════════════════════════════════════ */
function TendersView() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = tenderData.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    preparation: { label: 'Подготовка', color: '#2563EB', icon: <Clock3 size={12} /> },
    submitted:   { label: 'Подана',     color: '#D4AF37', icon: <Send size={12} /> },
    review:      { label: 'Рассмотрение', color: '#0EA5E9', icon: <Search size={12} /> },
    won:         { label: 'Выиграна',   color: '#0C7205', icon: <CheckCircle2 size={12} /> },
    lost:        { label: 'Проиграна',  color: '#DC2626', icon: <XCircle size={12} /> },
  };

  const kpi = [
    { label: 'Активные', value: '12', sub: 'в работе', color: '#2563EB', icon: <Clock3 size={14} /> },
    { label: 'На рассмотрении', value: '3', sub: 'ожидание', color: '#0EA5E9', icon: <Search size={14} /> },
    { label: 'Выиграно', value: '8', sub: 'в этом году', color: '#0C7205', icon: <TrendingUp size={14} /> },
    { label: 'Проиграно', value: '4', sub: 'в этом году', color: '#DC2626', icon: <TrendingDown size={14} /> },
  ];

  const filterOptions = [
    { key: 'all', label: 'Все статусы' },
    { key: 'preparation', label: 'Подготовка' },
    { key: 'submitted', label: 'Подана' },
    { key: 'review', label: 'Рассмотрение' },
    { key: 'won', label: 'Выиграно' },
    { key: 'lost', label: 'Проиграно' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Тендерный отдел
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Управление тендерами и предложениями
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpi.map((item, i) => (
          <div key={i} className="p-3 rounded-lg flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: item.color + '15', color: item.color }}>
                {item.icon}
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md flex-1 min-w-[200px] max-w-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по номеру или названию..."
            className="bg-transparent text-xs outline-none w-full"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <FilterBar 
        options={filterOptions} 
        active={filter} 
        onChange={setFilter} 
        count={filtered.length} 
      />

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['№ тендера','Название','Заказчик','Статус','Срок','Бюджет','Шанс','Действия'].map((h) => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const meta = statusMeta[t.status];
                return (
                  <tr 
                    key={t.id} 
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-3 py-2.5 text-[11px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{t.number}</td>
                    <td className="px-3 py-2.5 text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                    <td className="px-3 py-2.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t.customer}</td>
                    <td className="px-3 py-2.5">
                      <span 
                        className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: meta.color + '15', color: meta.color, border: `1px solid ${meta.color}30` }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px]" style={{ color: t.daysLeft < 0 ? '#DC2626' : t.daysLeft <= 3 ? '#D4AF37' : 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {t.deadline} {t.daysLeft < 0 && `(${t.daysLeft} дн.)`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{t.budget}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${t.winChance}%`, background: t.winChance >= 70 ? '#0C7205' : t.winChance >= 40 ? '#D4AF37' : '#DC2626' }} />
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t.winChance}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <button 
                        onClick={() => navigate('/documents')}
                        className="text-[9px] px-2 py-1 rounded transition-colors cursor-pointer"
                        style={{ color: '#2563EB', background: 'rgba(37,99,235,0.1)' }}
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROJECTS VIEW (упрощённый дашборд — ЗГД / мастер участка)
   ═══════════════════════════════════════════════════════════ */
function ProjectsView() {
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

  const filterOptions = [
    { key: 'all', label: 'Все типы объектов' },
    { key: 'active', label: 'В работе' },
    { key: 'review', label: 'На проверке' },
    { key: 'overdue', label: 'Просрочен' },
    { key: 'approved', label: 'Завершён' },
  ];
  const [projFilter, setProjFilter] = useState('all');

  const filteredProjects = projFilter === 'all' 
    ? sortedProjects 
    : sortedProjects.filter(p => p.status === projFilter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Проекты
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Аналитика по проектам и документообороту
          </p>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => alert('Массовое согласование — в разработке')}
          className="text-xs px-2 py-1 rounded-md transition-all hover:brightness-105 cursor-pointer"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          ⚡ Утвердить 84 документа
        </button>
        <button 
          onClick={() => navigate('/team')}
          className="text-xs px-2 py-1 rounded-md transition-all hover:brightness-105 cursor-pointer"
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
        <button onClick={() => navigate('/workflow?filter=overdue')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1 cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid rgba(220,38,38,0.35)' }}>
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
        <button onClick={() => navigate('/workflow')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1 cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid rgba(212,175,55,0.35)' }}>
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
        <button onClick={() => navigate('/documents?dept=tender')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1 cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid rgba(37,99,235,0.35)' }}>
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

      <FilterBar 
        options={filterOptions} 
        active={projFilter} 
        onChange={setProjFilter} 
        count={filteredProjects.length} 
      />

      {/* ═══ ГЛАВНЫЙ GRID: контент + sidebar ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="space-y-4 min-w-0">
          {/* ДВА БЛОКА В ОДИН РЯД */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Прогресс проектов */}
            <div className="p-3 rounded-xl min-w-0" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => navigate('/projects')}
                  className="text-xs font-semibold text-left cursor-pointer"
                  style={{ color: 'var(--text-primary)', background: 'none', border: 'none' }}
                >
                  Прогресс проектов
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/projects')}
                    className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    Все <ArrowRight size={10} />
                  </button>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>По риску ↓</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {filteredProjects.map((project) => {
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
                        className="w-full text-left p-2.5 transition-colors hover:brightness-105 cursor-pointer"
                        style={{ background: 'none', border: 'none' }}
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
                                className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
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

            {/* Загрузка по отделам */}
            <div
              className="p-3 rounded-xl min-w-0"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
            >
              <DepartmentLoad />
            </div>
          </div>
        </div>

        {/* ПРАВАЯ SIDEBAR */}
        <div className="space-y-4 lg:sticky lg:top-5">
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
                    className="text-[9px] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
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
                className="w-full text-center text-[10px] py-1 rounded-md cursor-pointer" 
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

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('projects');

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
      {/* Header area */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Портфель заказов
        </h1>
        <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--text-secondary)' }}>
          Управление тендерами, проектами и документооборотом
        </p>
        <PageTabs active={activeTab} onChange={setActiveTab} />
      </div>
      
      <div style={{ padding: '1.5rem' }}>
        {activeTab === 'tenders' ? <TendersView /> : <ProjectsView />}
      </div>
    </div>
  );
}