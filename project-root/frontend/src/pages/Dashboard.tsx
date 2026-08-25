import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import LiveClock from '@/shared/components/LiveClock';

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
  type TeamTimeAnalytics,
  type TeamTimePeriod,
  type FinanceSummary,
} from '@/features/analytics/api/analytics';
import { CalendarWidget } from '@/features/analytics/components/CalendarWidget';
import { LeaderboardWidget } from '@/features/leaderboard/components/LeaderboardWidget';

import { RemarksWidget } from '@/features/remarks/components/RemarksWidget';
import {
  TrendingUp, TrendingDown, AlertTriangle,
  Award, DollarSign, Briefcase, Users, Clock,
  ChevronRight, Zap, ArrowDown, Loader2,
  Gavel, BarChart3, Calendar as CalendarIcon
} from 'lucide-react';
import { DepartmentLoad } from '@/components/DepartmentLoad';
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
  ComposedChart,
  Line,
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
   MOCK FALLBACK DATA — удалены (зачистка 2026-08-17):
   виджеты показывают честные пустые состояния.
   ═══════════════════════════════════════════ */

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
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
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
  const [teamTimeData, setTeamTimeData] = useState<TeamTimeAnalytics[]>([]);
  const [teamTimeLoading, setTeamTimeLoading] = useState(true);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);

  // Derived flags — no mock fallback, show empty states instead
  const hasData = scorecard.length > 0 || alerts.length > 0 || tenderPipeline !== null || teamTimeData.length > 0;

  // Auto-refresh data every 30 seconds (silent — no loaders)
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboardData({ silent: true });
      }
    }, 30000);
    return () => clearInterval(refreshTimer);
  }, [period]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [period]);

  function loadDashboardData({ silent = false }: { silent?: boolean } = {}) {
    let cancelled = false;
    if (!silent) {
      setLoading(true);
      setChartsLoading(true);
      setError(false);
    }

    Promise.allSettled([
      analyticsApi.getDashboard(),
      analyticsApi.getAlerts(),
      analyticsApi.getTenderPipeline(),
      analyticsApi.getSparklines(),
      analyticsApi.getTrend(period),
      analyticsApi.getPortfolio(period),
      analyticsApi.getActionItems(),
      analyticsApi.getTeamTimeTracking(period as TeamTimePeriod),
      analyticsApi.getFinanceSummary(),
    ]).then(([dashboardRes, alertsRes, tenderRes, sparkRes, trendRes, portfolioRes, actionItemsRes, teamTimeRes, financeRes]) => {
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
      if (teamTimeRes.status === 'fulfilled') {
        setTeamTimeData(teamTimeRes.value.data ?? []);
      }
      if (financeRes.status === 'fulfilled') {
        setFinanceSummary(financeRes.value.data ?? null);
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
        setTeamTimeLoading(false);
      }
    });

  }

  // Build data objects — no mock fallback
  const finance = useMemo(() => {
    return {
      revenue: {
        current: financeSummary?.revenue_won_m ?? 0,
        plan: financeSummary?.revenue_plan_m ?? 0,
        unit: 'млн ₽',
        trend: '—',
      },
      profit: {
        current: financeSummary?.profit_plan_m ?? 0,
        plan: financeSummary?.profit_plan_m ?? 0,
        unit: 'млн ₽',
        trend: '—',
      },
      receivables: {
        current: financeSummary?.receivables_m ?? null,
        unit: 'млн ₽',
        trend: '—',
        risk: false,
      },
      avgMargin: { current: financeSummary?.avg_margin_pct ?? 0, unit: '%', trend: '—' },
    };
  }, [financeSummary]);

  const tenderFunnel = useMemo(() => {
    if (hasData && tenderPipeline?.stages) {
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
    return [];
  }, [hasData, tenderPipeline]);

  const funnelConversion = useMemo(() => {
    return tenderFunnel.slice(0, -1).map((s, i) => {
      const next = tenderFunnel[i + 1]?.value || 1;
      return Math.round((next / Math.max(s.value, 1)) * 100);
    });
  }, [tenderFunnel]);

  const actionItems = useMemo(() => {
    if (hasData && actionItemsRaw.length > 0) {
      return actionItemsRaw;
    }
    return [];
  }, [hasData, actionItemsRaw]);

  const criticalAlerts = useMemo(() => {
    if (hasData && alerts.length > 0) {
      return alerts.slice(0, 3).map((a) => ({
        id: a.id,
        level: (a.severity === 'critical' ? 'high' : 'medium') as 'high' | 'medium',
        title: a.title,
        action: a.action_label,
        color: a.severity === 'critical' ? '#DC2626' : '#D4AF37',
      }));
    }
    return [];
  }, [hasData, alerts]);

  const topProjects = useMemo(() => {
    if (hasData && scorecard.length > 0) {
      return scorecard
        .slice()
        .sort((a, b) => (b.progress || 0) - (a.progress || 0))
        .slice(0, 3)
        .map((p) => ({
          name: p.name,
          percent: Math.round(p.progress || 0),
          status: p.status || 'active',
          revenue: '—',
          deadline: p.deadline ? new Date(p.deadline).toLocaleDateString('ru-RU') : '—',
        }));
    }
    return [];
  }, [hasData, scorecard]);

  const kpiSparkData = useMemo(() => {
    if (hasData && sparklines?.charts) {
      const approval = sparklines.charts.find((c) => c.id === 'schedule_dev')?.trend.slice(-7) || [0];
      const winRate = sparklines.charts.find((c) => c.id === 'fpy')?.trend.slice(-7) || [0];
      const overdue = sparklines.charts.find((c) => c.id === 'shipments')?.trend.slice(-7) || [0];
      const load = sparklines.charts.find((c) => c.id === 'workload')?.trend.slice(-7) || [0];
      return { approval, winRate, overdue, load };
    }
    return { approval: [0], winRate: [0], overdue: [0], load: [0] };
  }, [hasData, sparklines]);

  const kpiValues = useMemo(() => {
    if (hasData && sparklines?.charts) {
      const approval = sparklines.charts.find((c) => c.id === 'schedule_dev')?.current ?? 0;
      const winRate = sparklines.charts.find((c) => c.id === 'fpy')?.current ?? 0;
      const overdue = alerts.find((a) => a.id === 'overdue_docs')?.count ?? 0;
      const load = sparklines.charts.find((c) => c.id === 'workload')?.current ?? 0;
      return [approval, winRate, overdue, load];
    }
    return [0, 0, 0, 0];
  }, [hasData, sparklines, alerts]);

  // Trend label from the real sparkline series (delta of last vs first point)
  const sparkTrend = (data: number[], unit: string, lowerIsBetter: boolean): { trend: string; good: boolean } => {
    if (!data || data.length < 2) return { trend: '—', good: true };
    const delta = Math.round((data[data.length - 1] - data[0]) * 10) / 10;
    return {
      trend: `${delta > 0 ? '+' : ''}${delta}${unit}`,
      good: lowerIsBetter ? delta <= 0 : delta >= 0,
    };
  };

  const portfolio = useMemo(() => {
    if (portfolioDataRaw?.items && portfolioDataRaw.items.length > 0) {
      return portfolioDataRaw.items;
    }
    return [];
  }, [portfolioDataRaw]);

  const deadlines = useMemo(() => {
    if (hasData && scorecard.length > 0) {
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
    return [];
  }, [hasData, scorecard]);

  // Keep deadlines variable to avoid breaking other code that may reference it
  void deadlines;

  const trendData = useMemo(() => {
    if (trendDataRaw?.points && trendDataRaw.points.length > 0) {
      return trendDataRaw.points;
    }
    return [];
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

  const kpiVals = [
    useCountUp(kpiValues[0], 1200, 1),
    useCountUp(kpiValues[1], 1200, 0),
    useCountUp(kpiValues[2], 1200, 0),
    useCountUp(kpiValues[3], 1200, 0),
  ];

  const chartTextColor = isDark ? '#8892A8' : '#4A5068';
  const chartGridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="w-full overflow-x-hidden overflow-y-auto px-3 md:px-6 py-4 md:pt-2 pb-6 text-base md:text-lg" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)', minHeight: '100vh' }}>
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
          Не удалось загрузить данные с сервера. Часть виджетов может быть пустой.
        </div>
      )}

      {/* Увеличили расстояние между колонками: gap-8 md:gap-10 */}
      <div className="grid grid-cols-1 xl:grid-cols-[5fr_2fr] gap-8 md:gap-12 items-start">

        {/* ═══ ЛЕВАЯ КОЛОНКА ═══ */}
        <div className="space-y-4 md:space-y-5 min-w-0">

          {/* Header + фильтр + AI-поиск — увеличенный шрифт для кнопок и часов */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Панель аналитики</h1>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Стратегическая сводка по финансам, тендерам и проектам</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  {periods.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPeriod(p.key)}
                      className="text-sm md:text-base px-3 md:px-4 py-1.5 rounded-md font-medium transition-all"
                      style={{
                        color: period === p.key ? '#fff' : 'var(--text-secondary)',
                        background: period === p.key ? '#3B82F6' : 'transparent',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <LiveClock className="text-lg md:text-2xl font-medium leading-relaxed mt-1 hidden sm:inline tabular-nums" style={{ color: 'var(--text-secondary)' }} />
              </div>
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
                    <span className="text-base md:text-lg font-medium leading-relaxed mt-1 shrink-0" style={{ color: 'var(--text-secondary)' }}>{item.deadline}</span>
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
                <span className="text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Выручка (план)</span>
                <div className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.12)' }}>
                  <DollarSign size={14} style={{ color: '#3B82F6' }} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {financeSummary ? (
                  <>
                    {finance.revenue.current}
                    <span className="text-base md:text-lg font-normal" style={{ color: 'var(--text-muted)' }}> / {finance.revenue.plan} {finance.revenue.unit}</span>
                  </>
                ) : '—'}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }}>{financeSummary ? 'факт / план' : 'Нет данных'}</div>
            </div>

            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Прибыль (план)</span>
                <div className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ background: 'rgba(212, 175, 55, 0.12)' }}>
                  <Award size={14} style={{ color: '#D4AF37' }} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {financeSummary ? (
                  <>
                    {finance.profit.current}
                    <span className="text-base md:text-lg font-normal" style={{ color: 'var(--text-muted)' }}> {finance.profit.unit}</span>
                  </>
                ) : '—'}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }}>{financeSummary ? 'по марже тендеров' : 'Нет данных'}</div>
            </div>

            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: finance.receivables.risk ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>ДЗО (дебиторка)</span>
                <div className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ background: finance.receivables.risk ? 'rgba(220, 38, 38, 0.12)' : 'rgba(107, 114, 128, 0.12)' }}>
                  <Clock size={14} style={{ color: finance.receivables.risk ? '#DC2626' : '#6B7280' }} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: finance.receivables.risk ? '#DC2626' : 'var(--text-primary)' }}>
                —
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }}>Нет данных</div>
            </div>

            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Средняя маржа</span>
                <div className="flex items-center justify-center h-7 w-7 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.12)' }}>
                  <Briefcase size={14} style={{ color: '#8B5CF6' }} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {financeSummary ? (
                  <>
                    {finance.avgMargin.current}
                    <span className="text-base md:text-lg font-normal" style={{ color: 'var(--text-muted)' }}>{finance.avgMargin.unit}</span>
                  </>
                ) : '—'}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }}>{financeSummary ? 'средневзвешенная' : 'Нет данных'}</div>
            </div>
          </div>

          {/* Tender funnel */}
          <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: 'rgba(124, 58, 237, 0.12)' }}>
                  <Gavel size={16} style={{ color: '#7C3AED' }} />
                </div>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Тендерная воронка</h2>
              </div>
              <button onClick={() => navigate('/portfolio?tab=tenders')} className="text-base md:text-lg font-medium leading-relaxed mt-1 flex items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>Все тендеры <ChevronRight size={12} /></button>
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
                    <span className="text-xs md:text-xs text-center leading-tight" style={{ color: 'var(--text-muted)' }}>{step.stage}</span>
                  </div>
                  {i < tenderFunnel.length - 1 && (
                    <div className="flex flex-col items-center justify-end pb-5 px-0.5">
                      <ArrowDown size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      <span className="text-xs md:text-xs font-bold mt-0.5" style={{ color: step.color }}>{funnelConversion[i]}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* KPI + sparklines */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Ср. срок согласования', valueRaw: kpiValues[0], suffix: ' дня', ...sparkTrend(kpiSparkData.approval, ' дн', true), icon: <Clock size={14} />, color: '#0C7205', spark: kpiSparkData.approval, decimals: 1 },
              { label: '% победы в тендерах', valueRaw: kpiValues[1], suffix: '%', ...sparkTrend(kpiSparkData.winRate, '%', false), icon: <Award size={14} />, color: '#3B82F6', spark: kpiSparkData.winRate, decimals: 0 },
              { label: 'Просроченные документы', valueRaw: kpiValues[2], suffix: '', ...sparkTrend(kpiSparkData.overdue, '', true), icon: <AlertTriangle size={14} />, color: '#DC2626', spark: kpiSparkData.overdue, decimals: 0 },
              { label: 'Средняя загрузка', valueRaw: kpiValues[3], suffix: '%', ...sparkTrend(kpiSparkData.load, '%', false), icon: <Users size={14} />, color: '#D4AF37', spark: kpiSparkData.load, decimals: 0 },
            ].map((kpi, idx) => (
              <div key={idx} className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</span>
                  <span style={{ color: kpi.color }}>{kpi.icon}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {kpi.decimals === 0 ? Math.round(kpiVals[idx]) : kpiVals[idx]}
                      <span className="text-base md:text-lg font-medium leading-relaxed mt-1 md:text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>{kpi.suffix}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs md:text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: kpi.good ? '#0C7205' : '#D4AF37' }}>
                      {kpi.good ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{kpi.trend}
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
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.12)' }}>
                  <BarChart3 size={16} style={{ color: '#3B82F6' }} />
                </div>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Структура портфеля по типам объектов
                </h2>
              </div>
              <span className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>Выручка, млн ₽</span>
            </div>
            {chartsLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Загрузка графиков…</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ opacity: chartsLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
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
              <div className="h-64 flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 h-44 md:h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="45%"
                        outerRadius="75%"
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
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
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>100%</div>
                      <div className="text-[10px] md:text-xs" style={{ color: 'var(--text-muted)' }}>всего</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col flex-wrap md:flex-nowrap justify-center md:justify-start gap-x-4 gap-y-1 md:gap-2 px-2 md:px-0 text-xs md:text-sm w-full md:w-auto min-w-0">
                  {portfolioPieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 min-w-0 max-w-[160px] md:max-w-none" title={`${item.name}: ${item.value}%`}>
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                      <span className="font-medium flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Учёт времени и качество работы */}
          <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: 'rgba(12, 114, 5, 0.12)' }}>
                  <Clock size={16} style={{ color: '#0C7205' }} />
                </div>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Учёт времени и качество работы
                </h2>
              </div>
              <span className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>
                Баллы начисляются за быстрое и качественное утверждение документов
              </span>
            </div>
            {teamTimeLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Загрузка графиков…</span>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ opacity: teamTimeLoading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
              <div className="lg:col-span-2 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={teamTimeData.map((u) => ({
                      name: u.full_name.split(' ').slice(0, 2).join(' '),
                      hours: u.total_active_hours,
                      quality: u.quality_score,
                      speed: u.speed_score,
                      bonus: u.bonus_points,
                    }))}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle(isDark)}
                      formatter={(value, name) => {
                        if (name === 'hours') return [`${value} ч`, 'Активные часы'];
                        if (name === 'quality') return [`${value}`, 'Качество'];
                        if (name === 'speed') return [`${value}`, 'Скорость'];
                        if (name === 'bonus') return [`${value}`, 'Баллы'];
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: chartTextColor }} />
                    <Bar yAxisId="left" dataKey="hours" name="Активные часы" fill="#3B82F6" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                    <Bar yAxisId="left" dataKey="bonus" name="Баллы" fill="#D4AF37" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
                    <Line yAxisId="right" type="monotone" dataKey="quality" name="Качество (0–100)" stroke="#0C7205" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="speed" name="Скорость (0–100)" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Топ по качеству</p>
                {teamTimeData.length === 0 && !teamTimeLoading && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Нет данных за выбранный период</p>
                )}
                {teamTimeData.slice(0, 3).map((user, idx) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                        style={{
                          background: idx === 0 ? '#D4AF37' : idx === 1 ? '#94A3B8' : '#B45309',
                          color: '#fff',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.full_name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.total_active_hours} ч · {user.total_sessions} сессий</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold" style={{ color: '#0C7205' }}>{user.quality_score}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>+{user.bonus_points} баллов</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend + Top projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-base md:text-xl font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Динамика выручки (12 мес)
                </p>
                <span className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-muted)' }}>—</span>
              </div>
              {chartsLoading && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Загрузка графиков…</span>
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
                <p className="text-base md:text-xl font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Топ проекты по выручке
                </p>
                <button onClick={() => navigate('/projects')} className="text-base md:text-lg font-medium leading-relaxed mt-1 flex items-center gap-1 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                  Все <ChevronRight size={14} />
                </button>
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
                          <div className="text-base md:text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{proj.name}</div>
                          <div className="text-xs md:text-sm" style={{ color: 'var(--text-muted)' }}>Дедлайн: {proj.deadline}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base md:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{proj.revenue}</div>
                        <div className="text-xs md:text-sm" style={{ color: color }}>{proj.percent}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ближайшие дедлайны — Календарь + дедлайны + дни рождения */}
          <div className="p-4 md:p-5 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: 'rgba(236, 72, 153, 0.12)' }}>
                  <CalendarIcon size={16} style={{ color: '#EC4899' }} />
                </div>
                <h2 className="text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Дедлайны, задачи, тендеры и дни рождения
                </h2>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                
              </p>
            </div>
            <CalendarWidget isDark={isDark} />
          </div>

        </div>

        {/* ═══ ПРАВАЯ КОЛОНКА — растянута на всё доступное пространство ═══ */}
        <div className="space-y-3 xl:sticky xl:top-5 min-w-0 w-full">

          {/* Риски — компактные */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: 'rgba(220, 38, 38, 0.12)' }}>
                  <AlertTriangle size={16} style={{ color: '#DC2626' }} />
                </div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Риски и требования внимания</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>{criticalAlerts.length}</span>
                <AlertTriangle size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {criticalAlerts.map((risk) => (
                <div key={risk.id}
                  onClick={() => navigate('/workflow')}
                  className="flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="w-1 h-10 rounded-full shrink-0 mt-0.5" style={{ background: risk.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-tight break-words" style={{ color: 'var(--text-primary)' }}>{risk.title}</span>
                      <span onClick={(e) => { e.stopPropagation(); navigate('/workflow'); }} className="text-xs shrink-0 cursor-pointer hover:underline mt-0.5" style={{ color: risk.color }}>
                        {risk.action} →
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {risk.level === 'high' ? 'Высокий приоритет' : 'Средний приоритет'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Загрузка команды */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="[&_*]:text-base">
              <DepartmentLoad />
            </div>
          </div>

          {/* Замечания */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <RemarksWidget isDark={isDark} />
          </div>

          {/* Лидерборд */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <LeaderboardWidget />
          </div>

        </div>

      </div>
    </div>
  );
}