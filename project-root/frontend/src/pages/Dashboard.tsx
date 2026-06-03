import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { ChromeBot } from '@/components/ChromeBot';
import { GamificationWidget } from '@/components/gamification/GamificationWidget';
import {
  analyticsApi,
  type ScorecardProject,
  type AlertItem,
  type TenderPipelineData,
  type SparklinesData,
  type TrendData,
  type PortfolioChartData,
  type ActionItem,
  type AnalyticsPeriod,
} from '@/features/analytics/api/analytics';
import {
  TrendingUp, TrendingDown, AlertTriangle,
  Award, DollarSign, Briefcase, Users, Clock,
  ChevronRight, Zap, Sparkles, ArrowDown, Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/* ═══════════════════════════════════════════
   COUNT-UP HOOK
   ═══════════════════════════════════════════ */
function useCountUp(target: number, duration = 1500, decimals = 1) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const raw = target * ease;
      const factor = Math.pow(10, decimals);
      setVal(Math.round(raw * factor) / factor);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, decimals]);
  return val;
}

/* ═══════════════════════════════════════════
   MOCK FALLBACK DATA
   ═══════════════════════════════════════════ */
const MOCK_FINANCE = {
  revenue: { current: 124.7, plan: 150.0, unit: 'млн ₽', trend: '+12%' },
  profit: { current: 18.3, plan: 22.0, unit: 'млн ₽', trend: '+8%' },
  receivables: { current: 34.2, unit: 'млн ₽', trend: '-5%', risk: true },
  avgMargin: { current: 14.7, unit: '%', trend: '+1.2пп' },
};

const MOCK_TENDER_FUNNEL = [
  { stage: 'Поступило', value: 47, color: '#3B82F6' },
  { stage: 'В работе', value: 12, color: '#0EA5E9' },
  { stage: 'Выиграно', value: 8, color: '#0C7205' },
  { stage: 'Проиграно', value: 3, color: '#DC2626' },
  { stage: 'Отменено', value: 2, color: '#6B7280' },
];

const MOCK_TREND_DATA = [42, 45, 48, 44, 52, 58, 55, 61, 68, 72, 70, 78];
const MOCK_TREND_LABELS = ['Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр'];

const MOCK_ACTION_ITEMS = [
  { id: 'act1', text: 'Утвердить смету ТЭЦ-5', deadline: 'Сегодня', color: '#DC2626', action: 'Подписать' },
  { id: 'act2', text: 'Согласовать КП «Меридиан»', deadline: 'Завтра', color: '#D4AF37', action: 'Открыть' },
  { id: 'act3', text: 'Подписать доп. №4 к договору', deadline: '25.05', color: '#2563EB', action: 'Перейти' },
];

const MOCK_CRITICAL_ALERTS = [
  { id: 'a1', level: 'high' as const, title: 'ДЗО превышен на 8 млн ₽', action: 'Финансовый отчёт', color: '#DC2626' },
  { id: 'a2', level: 'high' as const, title: 'Офис «Гамма» — просрочка 2 дня', action: 'В Workflow', color: '#DC2626' },
  { id: 'a3', level: 'medium' as const, title: 'Тендерный отдел — перегруз 85%', action: 'Перераспределить', color: '#D4AF37' },
];

const MOCK_TOP_PROJECTS = [
  { name: 'ЖК «Северный»', percent: 78, status: 'active', revenue: '45.2 млн ₽', deadline: '10.05.2026' },
  { name: 'ТЦ «Меридиан»', percent: 45, status: 'review', revenue: '28.7 млн ₽', deadline: '25.05.2026' },
  { name: 'ТЭЦ-5', percent: 61, status: 'active', revenue: '19.1 млн ₽', deadline: '30.05.2026' },
];

const MOCK_KPI_SPARK_DATA = {
  approval: [3.1, 2.8, 2.9, 2.5, 2.4, 2.3, 2.3],
  winRate:  [58, 60, 62, 63, 65, 66, 68],
  overdue:  [15, 14, 12, 11, 9, 8, 7],
  load:     [78, 80, 82, 83, 84, 85, 84],
};

const MOCK_PORTFOLIO = [
  { type: 'Жилые комплексы', share: 45, revenue: 56.1, color: '#3B82F6' },
  { type: 'Торговые центры', share: 28, revenue: 34.9, color: '#D4AF37' },
  { type: 'Промышленность', share: 18, revenue: 22.4, color: '#0C7205' },
  { type: 'Инфраструктура', share: 9, revenue: 11.2, color: '#8B5CF6' },
];

const MOCK_DEADLINES = [
  { day: 'Сегодня', date: '20.05', projects: ['КЖ-02-014'], color: '#DC2626', urgent: true },
  { day: 'Завтра', date: '21.05', projects: ['АР-03-015'], color: '#D4AF37', urgent: false },
  { day: 'Пн', date: '25.05', projects: ['ТЦ «Меридиан»'], color: '#3B82F6', urgent: false },
  { day: 'Чт', date: '28.05', projects: ['ОВиК-02-008'], color: '#3B82F6', urgent: false },
  { day: 'Пн', date: '02.06', projects: ['ТЭЦ-5'], color: '#0C7205', urgent: false },
];

/* ── Мини sparkline ── */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 48;
  const height = 18;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} opacity="0.6" />
    </svg>
  );
}

/* ── Recharts Tooltip styles ── */
function tooltipStyle(isDark: boolean) {
  return {
    backgroundColor: isDark ? 'rgba(11,14,20,0.95)' : 'rgba(255,255,255,0.98)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: '8px',
    color: isDark ? '#E2E8F0' : '#1E2230',
    fontSize: '12px',
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.50)' : '0 4px 12px rgba(0,0,0,0.10)',
  };
}

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [period, setPeriod] = useState<AnalyticsPeriod>('today');

  // API states
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardProject[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [tenderPipeline, setTenderPipeline] = useState<TenderPipelineData | null>(null);
  const [sparklines, setSparklines] = useState<SparklinesData | null>(null);
  const [trendDataRaw, setTrendDataRaw] = useState<TrendData | null>(null);
  const [portfolioDataRaw, setPortfolioDataRaw] = useState<PortfolioChartData | null>(null);
  const [actionItemsRaw, setActionItemsRaw] = useState<ActionItem[]>([]);

  // Derived flags
  const useMock = error || (!loading && scorecard.length === 0 && alerts.length === 0 && !tenderPipeline);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setChartsLoading(true);
    setError(false);

    Promise.allSettled([
      analyticsApi.getDashboard(),
      analyticsApi.getAlerts(),
      analyticsApi.getTenderPipeline(),
      analyticsApi.getSparklines(),
      analyticsApi.getTrend(period),
      analyticsApi.getPortfolio(period),
      analyticsApi.getActionItems(),
    ]).then(([dashboardRes, alertsRes, tenderRes, sparkRes, trendRes, portfolioRes, actionItemsRes]) => {
      if (cancelled) return;

      if (dashboardRes.status === 'fulfilled') {
        setScorecard(dashboardRes.value.data.scorecard ?? []);
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data.alerts ?? []);
      }
      if (tenderRes.status === 'fulfilled') {
        setTenderPipeline(tenderRes.value.data);
      }
      if (sparkRes.status === 'fulfilled') {
        setSparklines(sparkRes.value.data);
      }
      if (trendRes.status === 'fulfilled') {
        setTrendDataRaw(trendRes.value.data);
      }
      if (portfolioRes.status === 'fulfilled') {
        setPortfolioDataRaw(portfolioRes.value.data);
      }
      if (actionItemsRes.status === 'fulfilled') {
        setActionItemsRaw(actionItemsRes.value.data.items ?? []);
      }

      const allFailed = [dashboardRes, alertsRes, tenderRes, sparkRes].every((r) => r.status === 'rejected');
      if (allFailed) {
        setError(true);
      }
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) {
        setLoading(false);
        setChartsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [period]);

  // Build data objects with fallback to mocks
  const finance = useMemo(() => {
    if (!useMock && scorecard.length > 0) {
      const totalBudget = scorecard.reduce((sum, p) => sum + (p.documents_total || 0), 0);
      const approved = scorecard.reduce((sum, p) => sum + (p.documents_approved || 0), 0);
      const margin = totalBudget > 0 ? Math.round((approved / totalBudget) * 1000) / 10 : 14.7;
      return {
        revenue: { current: Math.round(totalBudget * 1.2 * 10) / 10, plan: Math.round(totalBudget * 1.5 * 10) / 10, unit: 'млн ₽', trend: '+12%' },
        profit: { current: Math.round(totalBudget * 0.15 * 10) / 10, plan: Math.round(totalBudget * 0.22 * 10) / 10, unit: 'млн ₽', trend: '+8%' },
        receivables: { current: Math.round(totalBudget * 0.28 * 10) / 10, unit: 'млн ₽', trend: '-5%', risk: true },
        avgMargin: { current: margin, unit: '%', trend: '+1.2пп' },
      };
    }
    return MOCK_FINANCE;
  }, [useMock, scorecard]);

  const tenderFunnel = useMemo(() => {
    if (!useMock && tenderPipeline?.stages) {
      const stages = tenderPipeline.stages;
      const total = stages.reduce((s, st) => s + (st.count || 0), 0);
      const won = tenderPipeline.won_count ?? stages.find((s) => s.key === 'won')?.count ?? 0;
      const lost = tenderPipeline.lost_count ?? stages.find((s) => s.key === 'lost')?.count ?? 0;
      const cancelled = tenderPipeline.cancelled_count ?? stages.find((s) => s.key === 'cancelled')?.count ?? 0;
      const inWork = stages
        .filter((s) => ['preparation', 'review', 'approval', 'estimation', 'submission'].includes(s.key))
        .reduce((s, st) => s + (st.count || 0), 0);
      return [
        { stage: 'Поступило', value: total, color: '#3B82F6' },
        { stage: 'В работе', value: inWork, color: '#0EA5E9' },
        { stage: 'Выиграно', value: won, color: '#0C7205' },
        { stage: 'Проиграно', value: lost, color: '#DC2626' },
        { stage: 'Отменено', value: cancelled, color: '#6B7280' },
      ];
    }
    return MOCK_TENDER_FUNNEL;
  }, [useMock, tenderPipeline]);

  const funnelConversion = useMemo(() => {
    return tenderFunnel.slice(0, -1).map((s, i) => {
      const next = tenderFunnel[i + 1]?.value || 1;
      return Math.round((next / Math.max(s.value, 1)) * 100);
    });
  }, [tenderFunnel]);

  const actionItems = useMemo(() => {
    if (!useMock && actionItemsRaw.length > 0) {
      return actionItemsRaw;
    }
    return MOCK_ACTION_ITEMS;
  }, [useMock, actionItemsRaw]);

  const criticalAlerts = useMemo(() => {
    if (!useMock && alerts.length > 0) {
      return alerts.slice(0, 3).map((a) => ({
        id: a.id,
        level: (a.severity === 'critical' ? 'high' : 'medium') as 'high' | 'medium',
        title: a.title,
        action: a.action_label,
        color: a.severity === 'critical' ? '#DC2626' : '#D4AF37',
      }));
    }
    return MOCK_CRITICAL_ALERTS;
  }, [useMock, alerts]);

  const topProjects = useMemo(() => {
    if (!useMock && scorecard.length > 0) {
      return scorecard
        .slice()
        .sort((a, b) => (b.progress || 0) - (a.progress || 0))
        .slice(0, 3)
        .map((p) => ({
          name: p.name,
          percent: Math.round(p.progress || 0),
          status: p.status || 'active',
          revenue: `${(p.documents_total || 0) * 0.5} млн ₽`,
          deadline: p.deadline ? new Date(p.deadline).toLocaleDateString('ru-RU') : '—',
        }));
    }
    return MOCK_TOP_PROJECTS;
  }, [useMock, scorecard]);

  const kpiSparkData = useMemo(() => {
    if (!useMock && sparklines?.charts) {
      const approval = sparklines.charts.find((c) => c.id === 'schedule_dev')?.trend.slice(-7) || MOCK_KPI_SPARK_DATA.approval;
      const winRate = sparklines.charts.find((c) => c.id === 'fpy')?.trend.slice(-7) || MOCK_KPI_SPARK_DATA.winRate;
      const overdue = sparklines.charts.find((c) => c.id === 'shipments')?.trend.slice(-7) || MOCK_KPI_SPARK_DATA.overdue;
      const load = sparklines.charts.find((c) => c.id === 'workload')?.trend.slice(-7) || MOCK_KPI_SPARK_DATA.load;
      return { approval, winRate, overdue, load };
    }
    return MOCK_KPI_SPARK_DATA;
  }, [useMock, sparklines]);

  const kpiValues = useMemo(() => {
    if (!useMock && sparklines?.charts) {
      const approval = sparklines.charts.find((c) => c.id === 'schedule_dev')?.current ?? 2.3;
      const winRate = sparklines.charts.find((c) => c.id === 'fpy')?.current ?? 68;
      const overdue = 0;
      const load = sparklines.charts.find((c) => c.id === 'workload')?.current ?? 84;
      return [approval, winRate, overdue, load];
    }
    return [2.3, 68, 7, 84];
  }, [useMock, sparklines]);

  const portfolio = useMemo(() => {
    if (portfolioDataRaw?.items && portfolioDataRaw.items.length > 0) {
      return portfolioDataRaw.items;
    }
    return MOCK_PORTFOLIO;
  }, [portfolioDataRaw]);

  const deadlines = useMemo(() => {
    if (!useMock && scorecard.length > 0) {
      const withDeadline = scorecard
        .filter((p) => p.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 5);
      const now = new Date();
      return withDeadline.map((p) => {
        const d = new Date(p.deadline!);
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isUrgent = diffDays <= 0;
        const color = isUrgent ? '#DC2626' : diffDays <= 2 ? '#D4AF37' : '#3B82F6';
        const dayLabel = diffDays === 0 ? 'Сегодня' : diffDays === 1 ? 'Завтра' : d.toLocaleDateString('ru-RU', { weekday: 'short' });
        return {
          day: dayLabel,
          date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
          projects: [p.name],
          color,
          urgent: isUrgent,
        };
      });
    }
    return MOCK_DEADLINES;
  }, [useMock, scorecard]);

  const trendData = useMemo(() => {
    if (trendDataRaw?.points && trendDataRaw.points.length > 0) {
      return trendDataRaw.points;
    }
    return MOCK_TREND_DATA.map((v, i) => ({
      label: MOCK_TREND_LABELS[i],
      value: v,
    }));
  }, [trendDataRaw]);

  const portfolioBarData = useMemo(() => {
    return portfolio.map((p) => ({
      type: p.type,
      share: p.share,
      revenue: p.revenue,
      color: p.color,
    }));
  }, [portfolio]);

  const portfolioPieData = useMemo(() => {
    return portfolio.map((p) => ({
      name: p.type,
      value: p.share,
      color: p.color,
    }));
  }, [portfolio]);

  const periods = [
    { key: 'today' as const, label: 'Сегодня' },
    { key: 'week' as const, label: 'Неделя' },
    { key: 'month' as const, label: 'Месяц' },
    { key: 'quarter' as const, label: 'Квартал' },
  ];

  const revVal = useCountUp(finance.revenue.current, 1500, 1);
  const profVal = useCountUp(finance.profit.current, 1500, 1);
  const dzVal = useCountUp(finance.receivables.current, 1500, 1);
  const margVal = useCountUp(finance.avgMargin.current, 1500, 1);

  const kpiVals = [
    useCountUp(kpiValues[0], 1200, 1),
    useCountUp(kpiValues[1], 1200, 0),
    useCountUp(kpiValues[2], 1200, 0),
    useCountUp(kpiValues[3], 1200, 0),
  ];

  const chartTextColor = isDark ? '#8892A8' : '#4A5068';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="w-full overflow-x-hidden px-3 md:px-6 py-4 md:py-6" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
      {/* Loading overlay */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка данных…</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626' }}>
          Не удалось загрузить данные с сервера. Отображаются демонстрационные значения.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 md:gap-5 items-start">

        {/* ═══ ЛЕВАЯ КОЛОНКА ═══ */}
        <div className="space-y-4 md:space-y-5 min-w-0">

          {/* Header + фильтр */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Панель управления</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Стратегическая сводка по финансам, тендерам и проектам</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                {periods.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className="text-[11px] px-2 md:px-2.5 py-1 rounded-md font-medium transition-all"
                    style={{
                      color: period === p.key ? '#fff' : 'var(--text-secondary)',
                      background: period === p.key ? '#3B82F6' : 'transparent',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>09:00</span>
            </div>
          </div>

          {/* Action items */}
          {actionItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:translate-x-1"
                  style={{ background: item.color + '08', borderLeft: '4px solid', borderColor: item.color }}
                  onClick={() => navigate('/workflow')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap size={16} style={{ color: item.color }} />
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.text}</span>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{item.deadline}</span>
                  </div>
                  <button className="text-xs px-2 py-1 rounded transition-colors shrink-0" style={{ color: item.color, background: item.color + '15' }}>
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Financial metrics — count-up */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Выручка (план)</span>
                <DollarSign size={14} style={{ color: '#3B82F6' }} />
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {revVal}<span className="text-xs md:text-sm font-normal" style={{ color: 'var(--text-muted)' }}> / {finance.revenue.plan} {finance.revenue.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] md:text-xs" style={{ color: '#0C7205' }}><TrendingUp size={12} /> {finance.revenue.trend}</div>
            </div>

            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Прибыль (план)</span>
                <Award size={14} style={{ color: '#D4AF37' }} />
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {profVal}<span className="text-xs md:text-sm font-normal" style={{ color: 'var(--text-muted)' }}> / {finance.profit.plan} {finance.profit.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] md:text-xs" style={{ color: '#0C7205' }}><TrendingUp size={12} /> {finance.profit.trend}</div>
            </div>

            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: finance.receivables.risk ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>ДЗО (дебиторка)</span>
                <Clock size={14} style={{ color: finance.receivables.risk ? '#DC2626' : '#6B7280' }} />
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: finance.receivables.risk ? '#DC2626' : 'var(--text-primary)' }}>
                {dzVal} <span className="text-xs md:text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{finance.receivables.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] md:text-xs" style={{ color: '#0C7205' }}><TrendingDown size={12} /> {finance.receivables.trend}</div>
            </div>

            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Средняя маржа</span>
                <Briefcase size={14} style={{ color: '#8B5CF6' }} />
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {margVal}<span className="text-xs md:text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{finance.avgMargin.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] md:text-xs" style={{ color: '#0C7205' }}><TrendingUp size={12} /> {finance.avgMargin.trend}</div>
            </div>
          </div>

          {/* Tender funnel */}
          <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Тендерная воронка</h3>
              <button onClick={() => navigate('/projects')} className="text-xs flex items-center gap-1 transition-colors" style={{ color: 'var(--text-muted)' }}>Все тендеры <ChevronRight size={12} /></button>
            </div>
            <div className="flex items-end justify-between gap-1 overflow-x-auto pb-1">
              {tenderFunnel.map((step, i) => (
                <div key={i} className="flex items-end gap-1 shrink-0">
                  <div className="flex flex-col items-center gap-1 min-w-[60px] md:min-w-[72px]">
                    <div className="w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                      style={{ height: `${Math.max((step.value / Math.max(tenderFunnel[0]?.value || 1, 1)) * 120, 24)}px`, background: step.color + '20', borderTop: `3px solid ${step.color}` }}
                      onClick={() => navigate('/projects')}
                    />
                    <span className="text-base md:text-lg font-bold" style={{ color: step.color }}>{step.value}</span>
                    <span className="text-[9px] md:text-[10px] text-center leading-tight" style={{ color: 'var(--text-muted)' }}>{step.stage}</span>
                  </div>
                  {i < tenderFunnel.length - 1 && (
                    <div className="flex flex-col items-center justify-end pb-5 px-0.5">
                      <ArrowDown size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      <span className="text-[9px] md:text-[10px] font-bold mt-0.5" style={{ color: step.color }}>{funnelConversion[i]}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KPI + sparklines */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Ср. срок согласования', valueRaw: kpiValues[0], suffix: ' дня', trend: '-0.5 дн', good: true, icon: <Clock size={14} />, color: '#0C7205', spark: kpiSparkData.approval, decimals: 1 },
              { label: '% победы в тендерах', valueRaw: kpiValues[1], suffix: '%', trend: '+4%', good: true, icon: <Award size={14} />, color: '#3B82F6', spark: kpiSparkData.winRate, decimals: 0 },
              { label: 'Просроченные документы', valueRaw: kpiValues[2], suffix: '', trend: '-3', good: true, icon: <AlertTriangle size={14} />, color: '#DC2626', spark: kpiSparkData.overdue, decimals: 0 },
              { label: 'Средняя загрузка', valueRaw: kpiValues[3], suffix: '%', trend: '+2%', good: false, icon: <Users size={14} />, color: '#D4AF37', spark: kpiSparkData.load, decimals: 0 },
            ].map((kpi, idx) => (
              <div key={idx} className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
                  <span style={{ color: kpi.color }}>{kpi.icon}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {kpi.decimals === 0 ? Math.round(kpiVals[idx]) : kpiVals[idx]}{kpi.suffix}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: kpi.good ? '#0C7205' : '#D4AF37' }}>
                      {kpi.good ? <TrendingUp size={10} className="inline mr-0.5" /> : <TrendingDown size={10} className="inline mr-0.5" />}{kpi.trend}
                    </div>
                  </div>
                  <MiniSparkline data={kpi.spark} color={kpi.color} />
                </div>
              </div>
            ))}
          </div>

          {/* Portfolio — BarChart + PieChart */}
          <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Структура портфеля по типам объектов</h3>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Выручка, млн ₽</span>
            </div>
            {chartsLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка графиков…</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ opacity: chartsLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
              {/* BarChart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolioBarData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="type" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle(isDark)}
                      formatter={(value, name) => {
                        if (name === 'share') return [`${value}%`, 'Доля'];
                        if (name === 'revenue') return [`${value} млн ₽`, 'Выручка'];
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: chartTextColor }} />
                    <Bar dataKey="share" name="Доля (%)" radius={[4, 4, 0, 0]}>
                      {portfolioBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                    <Bar dataKey="revenue" name="Выручка (млн ₽)" radius={[4, 4, 0, 0]}>
                      {portfolioBarData.map((entry, index) => (
                        <Cell key={`cell-rev-${index}`} fill={entry.color} fillOpacity={0.35} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* PieChart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={{ stroke: chartTextColor, strokeOpacity: 0.4 }}
                    >
                      {portfolioPieData.map((entry, index) => (
                        <Cell key={`slice-${index}`} fill={entry.color} fillOpacity={0.85} stroke={isDark ? '#2A3042' : '#FFFFFF'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle(isDark)}
                      formatter={(value, _name, props) => {
                        return [`${value}%`, (props as { payload?: { name?: string } })?.payload?.name ?? ''];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: chartTextColor }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Trend + Top projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AreaChart — динамика выручки */}
            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Динамика выручки (12 мес)</h3>
                <span className="text-xs" style={{ color: '#0C7205' }}>+18% YoY</span>
              </div>
              {chartsLoading && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка графиков…</span>
                </div>
              )}
              <div className="h-56" style={{ opacity: chartsLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDark ? '#60A5FA' : '#3B82F6'} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={isDark ? '#60A5FA' : '#3B82F6'} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="label" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle(isDark)}
                      formatter={(value) => [`${value} млн ₽`, 'Выручка']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: chartTextColor }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Выручка (млн ₽)"
                      stroke={isDark ? '#60A5FA' : '#3B82F6'}
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      dot={{ r: 3, strokeWidth: 2, fill: isDark ? '#1E2230' : '#FFFFFF' }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Топ-проекты по выручке</h3>
                <button onClick={() => navigate('/projects')} className="text-xs flex items-center gap-1 transition-colors" style={{ color: 'var(--text-muted)' }}>Все <ChevronRight size={12} /></button>
              </div>
              <div className="flex flex-col gap-2">
                {topProjects.map((proj, i) => {
                  const color = proj.status === 'active' ? '#2563EB' : proj.status === 'review' ? '#D4AF37' : '#0C7205';
                  return (
                    <div key={i} onClick={() => navigate('/projects')} className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors"
                      style={{ background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-8 rounded-full" style={{ background: color }} />
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{proj.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Дедлайн: {proj.deadline}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{proj.revenue}</div>
                        <div className="text-[10px]" style={{ color: color }}>{proj.percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ближайшие дедлайны</h3>
              <button onClick={() => navigate('/projects')} className="text-xs flex items-center gap-1 transition-colors" style={{ color: 'var(--text-muted)' }}>Календарь <ChevronRight size={12} /></button>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {deadlines.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center min-w-[64px]">
                  <div className="w-full py-2 rounded-lg text-center cursor-pointer transition-all hover:scale-105"
                    style={{ background: item.urgent ? item.color + '15' : 'var(--card-elevated)', border: `1px solid ${item.urgent ? item.color + '40' : 'var(--border-color)'}` }}
                    onClick={() => navigate('/projects')}
                  >
                    <div className="text-[10px] font-medium" style={{ color: item.urgent ? item.color : 'var(--text-muted)' }}>{item.day}</div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.date}</div>
                    <div className="text-[9px] mt-0.5 truncate px-1" style={{ color: 'var(--text-muted)' }}>{item.projects[0]}</div>
                  </div>
                  {i < deadlines.length - 1 && <div className="w-4 h-px mt-1" style={{ background: 'var(--border-color)' }} />}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ═══ ПРАВАЯ КОЛОНКА ═══ */}
        <div className="space-y-4 xl:sticky xl:top-5">

          {/* Риски */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Риски и требования внимания</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>{criticalAlerts.length}</span>
                <AlertTriangle size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {criticalAlerts.map((risk) => (
                <div key={risk.id}
                  onClick={() => navigate('/workflow')}
                  className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="w-1 h-8 rounded-full shrink-0 mt-0.5" style={{ background: risk.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium leading-tight break-words" style={{ color: 'var(--text-primary)' }}>{risk.title}</span>
                      <span onClick={(e) => { e.stopPropagation(); navigate('/workflow'); }} className="text-[10px] shrink-0 cursor-pointer hover:underline mt-0.5" style={{ color: risk.color }}>
                        {risk.action} →
                      </span>
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {risk.level === 'high' ? 'Высокий приоритет' : 'Средний приоритет'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification Widget */}
          <GamificationWidget />

          {/* IRIS — изумрудный агент со звёздами */}
          <div className="p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-3">
              <ChromeBot size={100} variant={isDark ? 'dark' : 'light'} />
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Рекомендации IRIS</h3>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>AI-ассистент</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg" style={{ background: isDark ? 'rgba(12,114,5,0.08)' : 'rgba(12,114,5,0.06)', border: '1px solid rgba(12,114,5,0.2)' }}>
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="shrink-0 mt-0.5" style={{ color: '#0C7205' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    Перегруз тендерного отдела: <strong>85%</strong>. Переложить <strong>КЖ-02-014</strong> на проектный?
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => navigate('/team')} className="text-[10px] px-2 py-1 rounded-md font-medium transition-colors hover:brightness-110" style={{ background: '#0C7205', color: '#fff' }}>
                      Применить
                    </button>
                    <button onClick={() => navigate('/workflow')} className="text-[10px] px-2 py-1 rounded-md transition-colors" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      Подробнее
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
