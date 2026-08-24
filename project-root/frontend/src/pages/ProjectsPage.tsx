import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import AddTenderModal from '@/features/tenders/components/AddTenderModal';
import {
  FolderKanban, FileCheck, Clock, AlertTriangle,
  ArrowRight, Users, ChevronRight, ChevronDown,
  Gavel, Search,
  Calendar, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock3, Send,
  FileText, HardHat,
  Plus
} from 'lucide-react';
import { DepartmentLoad } from '@/components/DepartmentLoad';
import { getTenders } from '@/features/tenders/api/tenders';
import type { Tender } from '@/features/tenders/types/tender';
import { getProjects, type Project } from '@/features/projects/api/projects';
import { analyticsApi, type DocumentProjectSummary } from '@/features/analytics/api/analytics';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface ProjectItem {
  id: string;
  name: string;
  percent: number;
  status: 'active' | 'review' | 'approved' | 'overdue';
  customer: string;
  stats?: DocumentProjectSummary;
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
   SUB-TABS (Архив-стиль)
   ═══════════════════════════════════════════════════════════ */
type TabKey = 'tenders' | 'solutions' | 'templates' | 'projects';
const TAB_COLOR = '#8B5CF6';

function PageTabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'tenders', label: 'Тендеры', icon: <Gavel size={16} /> },
    { key: 'solutions', label: 'Типовые решения', icon: <HardHat size={16} /> },
    { key: 'templates', label: 'Шаблоны', icon: <FileText size={16} /> },
    { key: 'projects', label: 'Проекты', icon: <FolderKanban size={16} /> },
  ];

  return (
    <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-divider)' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
            style={{
              color: isActive ? TAB_COLOR : 'var(--text-secondary)',
              backgroundColor: isActive ? `${TAB_COLOR}26` : 'transparent',
            }}
          >
            {tab.icon} {tab.label}
            {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: TAB_COLOR, boxShadow: `0 0 8px ${TAB_COLOR}` }} />}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER BAR
   ═══════════════════════════════════════════════════════════ */
function FilterBar({
  options, active, onChange, count
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
        <span className="text-xs ml-1" style={{ color: '#94a3b8' }}>Найдено: {count}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TENDER VIEW
   ═══════════════════════════════════════════════════════════ */
function mapTenderToItem(t: Tender): TenderItem {
  const deadline = t.deadline ? new Date(t.deadline) : null;
  const now = new Date();
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const stage = t.stage || 'new';
  const statusMap: Record<string, TenderItem['status']> = {
    'new': 'preparation',
    'qualification': 'preparation',
    'preparation': 'preparation',
    'approval': 'preparation',
    'submitted': 'submitted',
    'auction': 'submitted',
    'waiting': 'review',
    'won': 'won',
    'lost': 'lost',
    'contract': 'won',
  };
  const budget = t.nmc ? `₽ ${(t.nmc / 1e6).toFixed(0)} млн` : '—';
  return {
    id: String(t.id),
    number: `Т-${t.id.toString().padStart(4, '0')}`,
    name: t.name,
    customer: t.customer_name,
    status: statusMap[stage] || 'preparation',
    deadline: deadline ? deadline.toLocaleDateString('ru-RU') : '—',
    budget,
    daysLeft,
    winChance: t.probability || 0,
  };
}

function TendersView() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [tenders, setTenders] = useState<TenderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTenders();
      setTenders(data.map(mapTenderToItem));
    } catch {
      setTenders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  const filtered = tenders.filter(t => {
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

  const activeCount = tenders.filter(t => t.status === 'preparation' || t.status === 'submitted' || t.status === 'review').length;
  const reviewCount = tenders.filter(t => t.status === 'review').length;
  const wonCount = tenders.filter(t => t.status === 'won').length;
  const lostCount = tenders.filter(t => t.status === 'lost').length;

  const kpi = [
    { label: 'Активные', value: String(activeCount), sub: 'в работе', color: '#2563EB', icon: <Clock3 size={14} /> },
    { label: 'На рассмотрении', value: String(reviewCount), sub: 'ожидание', color: '#0EA5E9', icon: <Search size={14} /> },
    { label: 'Выиграно', value: String(wonCount), sub: 'всего', color: '#0C7205', icon: <TrendingUp size={14} /> },
    { label: 'Проиграно', value: String(lostCount), sub: 'всего', color: '#DC2626', icon: <TrendingDown size={14} /> },
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
      <div className="mb-4">
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Тендерный отдел</h1>
        <p className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>Управление тендерами и предложениями</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpi.map((item, i) => (
          <div key={i} className="p-3 rounded-lg flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: item.color + '15', color: item.color }}>
                {item.icon}
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.sub}</div>
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
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: '#2563EB', color: '#ffffff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
        >
          <Plus size={13} /> Добавить тендер
        </button>
      </div>

      <AddTenderModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreated={fetchTenders} />

      <FilterBar options={filterOptions} active={filter} onChange={setFilter} count={filtered.length} />

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['№ тендера','Название','Заказчик','Статус','Срок','Бюджет','Шанс','Действия'].map((h) => (
                  <th key={h} className="text-xs font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Загрузка...</td></tr>
              ) : (
                <>
                  {filtered.map((t) => {
                    const meta = statusMeta[t.status];
                    return (
                      <tr key={t.id} className="transition-colors cursor-pointer" style={{ borderBottom: '1px solid var(--border-color)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-3 py-2.5 text-sm font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{t.number}</td>
                        <td className="px-3 py-2.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                        <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.customer}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: meta.color + '15', color: meta.color, border: `1px solid ${meta.color}30` }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm" style={{ color: t.daysLeft < 0 ? '#DC2626' : t.daysLeft <= 3 ? '#D4AF37' : 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {t.deadline} {t.daysLeft < 0 && `(${t.daysLeft} дн.)`}</span>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.budget}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                              <div className="h-full rounded-full" style={{ width: `${t.winChance}%`, background: t.winChance >= 70 ? '#0C7205' : t.winChance >= 40 ? '#D4AF37' : '#DC2626' }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{t.winChance}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => navigate('/documents')} className="text-xs px-2 py-1 rounded transition-colors cursor-pointer" style={{ color: '#2563EB', background: 'rgba(37,99,235,0.1)' }}>
                            Открыть
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Ничего не найдено</td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SOLUTIONS VIEW
   ═══════════════════════════════════════════════════════════ */
function SolutionsView() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <HardHat size={14} className="inline mr-1" style={{ color: '#4F7A4C' }} />
          База типовых решений. Узлы, детали и конструкции, которые уже применялись на проектах.
        </p>
      </div>
      <div className="p-8 rounded-xl text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <HardHat size={32} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Типовых решений пока нет</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATES VIEW
   ═══════════════════════════════════════════════════════════ */
function TemplatesView() {
  return (
    <div className="p-8 rounded-xl text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <FileText size={32} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Шаблонов пока нет</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROJECTS VIEW
   ═══════════════════════════════════════════════════════════ */
function ProjectsView() {
  const navigate = useNavigate();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProjects().catch(() => [] as Project[]),
      analyticsApi.getDocumentsByProject().then(r => r.data).catch(() => null),
    ]).then(([projectsData, docsData]) => {
      if (cancelled) return;
      const statsMap = new Map<number, DocumentProjectSummary>();
      docsData?.projects.forEach(p => statsMap.set(p.project_id, p));
      setProjects(projectsData.map(p => {
        const stats = statsMap.get(p.id);
        const total = stats ? stats.draft + stats.in_review + stats.approved + stats.overdue : 0;
        const percent = stats && total > 0 ? Math.round((stats.approved / total) * 100) : 0;
        let status: ProjectItem['status'] = 'active';
        if (stats && stats.overdue > 0) status = 'overdue';
        else if (p.status === 'completed') status = 'approved';
        else if (stats && stats.in_review > 0) status = 'review';
        return {
          id: String(p.id),
          name: p.name,
          percent,
          status,
          customer: p.customer_name || p.code || '—',
          stats,
        };
      }));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const statusWeight = { overdue: 0, review: 1, active: 2, approved: 3 };
  const sortedProjects = [...projects].sort((a, b) => statusWeight[a.status] - statusWeight[b.status]);

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

  const attentionCount = projects.filter(p => p.status === 'overdue').length;
  const inReviewCount = projects.reduce((sum, p) => sum + (p.stats?.in_review ?? 0), 0);

  const riskItems = projects
    .filter(p => (p.stats?.overdue ?? 0) > 0)
    .map(p => ({
      id: p.id,
      level: 'high' as const,
      title: p.name,
      desc: `Просрочено документов: ${p.stats?.overdue ?? 0}`,
      action: 'Перейти в Workflow',
      color: '#DC2626',
    }));

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
      <div className="mb-4">
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Проекты</h1>
        <p className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>Аналитика по проектам и документообороту</p>
      </div>

      {/* Быстрые действия */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => alert('Массовое согласование — в разработке')}
          className="text-xs px-2 py-1 rounded-md transition-all hover:brightness-105 cursor-pointer"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          Массовое согласование
        </button>
        <button onClick={() => navigate('/team')}
          className="text-xs px-2 py-1 rounded-md transition-all hover:brightness-105 cursor-pointer"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          Назначить ресурс
        </button>
        <button disabled
          className="text-xs px-2 py-1 rounded-md opacity-50 cursor-not-allowed"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          Созвон по рискам
        </button>
        <button disabled
          className="text-xs px-2 py-1 rounded-md opacity-50 cursor-not-allowed"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          Экспорт отчёта
        </button>
      </div>

      {/* 3 KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button onClick={() => navigate('/workflow?filter=overdue')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1 cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid rgba(220,38,38,0.35)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Требуют внимания</span>
            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}><AlertTriangle size={12} /></span>
          </div>
          <div className="text-xl font-bold" style={{ color: '#DC2626' }}>{attentionCount}</div>
          <div className="text-xs flex items-center gap-1 font-medium" style={{ color: '#DC2626' }}><ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />Срочно в Workflow</div>
        </button>
        <button onClick={() => navigate('/workflow')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1 cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid rgba(212,175,55,0.35)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>На согласовании</span>
            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}><Clock size={12} /></span>
          </div>
          <div className="text-xl font-bold" style={{ color: '#D4AF37' }}>{inReviewCount}</div>
          <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />документов в работе</div>
        </button>
        <button onClick={() => navigate('/projects')} className="group p-3 rounded-lg text-left transition-all hover:scale-[1.02] flex flex-col gap-1 cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid rgba(37,99,235,0.35)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Всего проектов</span>
            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563EB' }}><Users size={12} /></span>
          </div>
          <div className="text-xl font-bold" style={{ color: '#2563EB' }}>{projects.length}</div>
          <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />в портфеле</div>
        </button>
      </div>

      <FilterBar options={filterOptions} active={projFilter} onChange={setProjFilter} count={filteredProjects.length} />

      {/* ═══ ГЛАВНЫЙ GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Прогресс проектов */}
            <div className="p-3 rounded-xl min-w-0" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => navigate('/projects')} className="text-xs font-semibold text-left cursor-pointer" style={{ color: 'var(--text-primary)', background: 'none', border: 'none' }}>Прогресс проектов</button>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/projects')} className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors cursor-pointer" style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>Все <ArrowRight size={10} /></button>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>По риску ↓</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {loading && (
                  <div className="text-xs text-center py-6" style={{ color: 'var(--text-secondary)' }}>Загрузка проектов...</div>
                )}
                {!loading && filteredProjects.length === 0 && (
                  <div className="text-xs text-center py-6" style={{ color: 'var(--text-secondary)' }}>Проектов не найдено</div>
                )}
                {filteredProjects.map((project) => {
                  const color = getProjectColor(project.status);
                  const isExpanded = expandedProject === project.id;
                  const label = getProjectLabel(project.status);

                  return (
                    <div key={project.id} className="rounded-lg overflow-hidden transition-all" style={{ background: 'var(--card-bg)', border: `1px solid ${isExpanded ? color + '40' : 'var(--border-color)'}` }}>
                      <button onClick={() => setExpandedProject(isExpanded ? null : project.id)} className="w-full text-left p-2.5 transition-colors hover:brightness-105 cursor-pointer" style={{ background: 'none', border: 'none' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span style={{ color }}>{getProjectIcon(project.status)}</span>
                            <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
                            <span className="text-xs px-1 py-0.5 rounded-full font-medium shrink-0" style={{ background: color + '20', color, border: `1px solid ${color}40` }}>{label}</span>
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
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Заказчик: {project.customer}
                          </span>
                          {project.stats && project.stats.overdue > 0 && (
                            <span className="text-xs flex items-center gap-0.5 shrink-0 ml-1.5" style={{ color: '#FF6B6B' }}><AlertTriangle size={9} /> Просрочено: {project.stats.overdue}</span>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 pt-0">
                          <div className="border-t pt-2 mt-0.5" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Документы</span>
                              <button onClick={(e) => { e.stopPropagation(); navigate('/documents'); }} className="text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors cursor-pointer" style={{ color: '#2563EB', background: 'rgba(37,99,235,0.1)' }}>Все <ArrowRight size={8} /></button>
                            </div>
                            {project.stats ? (
                              <div className="flex flex-col gap-1.5">
                                {([
                                  ['Черновики', project.stats.draft],
                                  ['На проверке', project.stats.in_review],
                                  ['Согласовано', project.stats.approved],
                                  ['Просрочено', project.stats.overdue],
                                ] as [string, number][]).map(([docLabel, count]) => (
                                  <div key={docLabel} className="flex items-center justify-between">
                                    <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{docLabel}</span>
                                    <span className="text-xs px-1 py-0.5 rounded-full shrink-0 ml-1.5" style={{ background: docLabel === 'Просрочено' && count > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)', color: docLabel === 'Просрочено' && count > 0 ? '#EF4444' : '#2563EB', border: `1px solid ${docLabel === 'Просрочено' && count > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.3)'}` }}>{count}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Нет данных по документам</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Загрузка по отделам */}
            <div className="p-3 rounded-xl min-w-0" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
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
                <span className="text-xs px-1 py-0.5 rounded-full font-medium" style={{ background: 'rgba(220,38,38,0.15)', color: '#DC2626' }}>{riskItems.length}</span>
                <AlertTriangle size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {visibleRisks.map((risk) => (
                <div key={risk.id} className="p-2 rounded-md" style={{ borderLeft: '4px solid', borderColor: risk.color, background: risk.color + '08' }}>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: risk.color }}>Высокий: {risk.title}</div>
                  <div className="text-xs mb-1.5" style={{ color: 'var(--text-primary)' }}>{risk.desc}</div>
                  <button onClick={() => navigate('/workflow')} className="text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer" style={{ color: risk.color, background: risk.color + '15' }}>{risk.action}</button>
                </div>
              ))}
              {!loading && riskItems.length === 0 && (
                <div className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>Рисков не выявлено</div>
              )}
            </div>
            {riskItems.length > 3 && (
              <button onClick={() => setShowAllRisks(!showAllRisks)} className="w-full text-center text-xs py-1 rounded-md cursor-pointer" style={{ color: 'var(--text-secondary)', background: 'var(--card-elevated)', border: '1px solid var(--border-color)' }}>
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
      <div className="px-6 pt-2 pb-2">
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Портфель заказов</h1>
        <p className="text-base md:text-lg font-medium leading-relaxed mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>Управление тендерами, проектами и документооборотом</p>
        <PageTabs active={activeTab} onChange={setActiveTab} />
      </div>

      <div style={{ padding: '1.5rem' }}>
        {activeTab === 'tenders' && <TendersView />}
        {activeTab === 'solutions' && <SolutionsView />}
        {activeTab === 'templates' && <TemplatesView />}
        {activeTab === 'projects' && <ProjectsView />}
      </div>
    </div>
  );
}