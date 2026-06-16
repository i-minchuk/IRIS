import { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Search, Calendar, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock3, Send, Plus, Filter,
} from 'lucide-react';
import { getTenders } from '@/features/tenders/api/tenders';
import type { Tender } from '@/features/tenders/types/tender';
import AddTenderModal from '@/features/tenders/components/AddTenderModal';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
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
  stage: string;
}

/* ═══════════════════════════════════════════════════════════
   MAPPER
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
  const budget = t.nmc ? `₽ ${(t.nmc / 1e6).toFixed(1)} млн` : '—';
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
    stage,
  };
}

/* ═══════════════════════════════════════════════════════════
   FILTER BAR
   ═══════════════════════════════════════════════════════════ */
function FilterBar({ options, active, onChange, count }: {
  options: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={12} style={{ color: 'var(--text-muted)' }} />
      {options.map((opt) => {
        const isActive = active === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer"
            style={{
              background: isActive ? '#2563EB' : 'var(--card-bg)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              border: isActive ? '1px solid #2563EB' : '1px solid var(--border-color)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
      <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>{count} шт.</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function TendersPage() {
  // const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
    <div className="w-full overflow-x-hidden px-3 md:px-6 py-4 md:pt-2 pb-6" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Тендеры</h1>
            <p className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>Управление тендерами и предложениями</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer shrink-0"
            style={{ background: '#2563EB', color: '#ffffff' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
          >
            <Plus size={13} /> Добавить тендер
          </button>
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

        <AddTenderModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreated={fetchTenders} />

        <FilterBar options={filterOptions} active={filter} onChange={setFilter} count={filtered.length} />

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['№ тендера','Название','Заказчик','Статус','Срок','Бюджет','Шанс','Действия'].map((h) => (
                    <th key={h} className="text-[10px] font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{h}</th>
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
                        <tr key={t.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <td className="px-3 py-2.5 text-[11px] font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{t.number}</td>
                          <td className="px-3 py-2.5 text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</td>
                          <td className="px-3 py-2.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t.customer}</td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: meta.color + '15', color: meta.color, border: `1px solid ${meta.color}30` }}>
                              {meta.icon} {meta.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px]" style={{ color: t.daysLeft < 0 ? '#DC2626' : t.daysLeft <= 3 ? '#D4AF37' : 'var(--text-secondary)' }}>
                            <span className="flex items-center gap-1"><Calendar size={10} /> {t.deadline} {t.daysLeft < 0 && `(${t.daysLeft} дн.)`}</span>
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
                            <a
                              href={`/portfolio?tender=${t.id}`}
                              className="inline-block text-[9px] px-2 py-1 rounded transition-colors"
                              style={{ color: '#2563EB', background: 'rgba(37,99,235,0.1)', textDecoration: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              Открыть
                            </a>
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
    </div>
  );
}
