import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { ChromeBot } from '@/components/ChromeBot';
import {
  TrendingUp, TrendingDown, AlertTriangle,
  Award, DollarSign, Briefcase, Users, Clock,
  ChevronRight, Zap, Sparkles, ArrowDown
} from 'lucide-react';

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
   DATA
   ═══════════════════════════════════════════ */
const finance = {
  revenue: { current: 124.7, plan: 150.0, unit: 'млн ₽', trend: '+12%' },
  profit: { current: 18.3, plan: 22.0, unit: 'млн ₽', trend: '+8%' },
  receivables: { current: 34.2, unit: 'млн ₽', trend: '-5%', risk: true },
  avgMargin: { current: 14.7, unit: '%', trend: '+1.2пп' },
};

const tenderFunnel = [
  { stage: 'Поступило', value: 47, color: '#3B82F6' },
  { stage: 'В работе', value: 12, color: '#0EA5E9' },
  { stage: 'Выиграно', value: 8, color: '#0C7205' },
  { stage: 'Проиграно', value: 3, color: '#DC2626' },
  { stage: 'Отменено', value: 2, color: '#6B7280' },
];
const funnelConversion = [26, 67, 38, 67];

const trendData = [42, 45, 48, 44, 52, 58, 55, 61, 68, 72, 70, 78];
const trendLabels = ['Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр'];

const actionItems = [
  { id: 'act1', text: 'Утвердить смету ТЭЦ-5', deadline: 'Сегодня', color: '#DC2626', action: 'Подписать' },
  { id: 'act2', text: 'Согласовать КП «Меридиан»', deadline: 'Завтра', color: '#D4AF37', action: 'Открыть' },
  { id: 'act3', text: 'Подписать доп. №4 к договору', deadline: '25.05', color: '#2563EB', action: 'Перейти' },
];

const criticalAlerts = [
  { id: 'a1', level: 'high', title: 'ДЗО превышен на 8 млн ₽', action: 'Финансовый отчёт', color: '#DC2626' },
  { id: 'a2', level: 'high', title: 'Офис «Гамма» — просрочка 2 дня', action: 'В Workflow', color: '#DC2626' },
  { id: 'a3', level: 'medium', title: 'Тендерный отдел — перегруз 85%', action: 'Перераспределить', color: '#D4AF37' },
];

const topProjects = [
  { name: 'ЖК «Северный»', percent: 78, status: 'active', revenue: '45.2 млн ₽', deadline: '10.05.2026' },
  { name: 'ТЦ «Меридиан»', percent: 45, status: 'review', revenue: '28.7 млн ₽', deadline: '25.05.2026' },
  { name: 'ТЭЦ-5', percent: 61, status: 'active', revenue: '19.1 млн ₽', deadline: '30.05.2026' },
];

const kpiSparkData = {
  approval: [3.1, 2.8, 2.9, 2.5, 2.4, 2.3, 2.3],
  winRate:  [58, 60, 62, 63, 65, 66, 68],
  overdue:  [15, 14, 12, 11, 9, 8, 7],
  load:     [78, 80, 82, 83, 84, 85, 84],
};

/* ── Sparkline с tooltip ── */
function Sparkline({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 200;
  const height = 40;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="transparent" cursor="pointer">
              <title>{`${labels[i]}: ${v} млн ₽`}</title>
            </circle>
            <circle cx={x} cy={y} r="2" fill={color} opacity="0" className="hover:opacity-100 transition-opacity" />
          </g>
        );
      })}
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="3" fill={color} />
    </svg>
  );
}

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

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('today');

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
    useCountUp(2.3, 1200, 1),
    useCountUp(68, 1200, 0),
    useCountUp(7, 1200, 0),
    useCountUp(84, 1200, 0),
  ];

  return (
    <div className="w-full overflow-x-hidden px-3 md:px-6 py-4 md:py-6" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
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
                      style={{ height: `${Math.max((step.value / 47) * 120, 24)}px`, background: step.color + '20', borderTop: `3px solid ${step.color}` }}
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
              { label: 'Ср. срок согласования', valueRaw: 2.3, suffix: ' дня', trend: '-0.5 дн', good: true, icon: <Clock size={14} />, color: '#0C7205', spark: kpiSparkData.approval, decimals: 1 },
              { label: '% победы в тендерах', valueRaw: 68, suffix: '%', trend: '+4%', good: true, icon: <Award size={14} />, color: '#3B82F6', spark: kpiSparkData.winRate, decimals: 0 },
              { label: 'Просроченные документы', valueRaw: 7, suffix: '', trend: '-3', good: true, icon: <AlertTriangle size={14} />, color: '#DC2626', spark: kpiSparkData.overdue, decimals: 0 },
              { label: 'Средняя загрузка', valueRaw: 84, suffix: '%', trend: '+2%', good: false, icon: <Users size={14} />, color: '#D4AF37', spark: kpiSparkData.load, decimals: 0 },
            ].map((kpi, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
                  <span style={{ color: kpi.color }}>{kpi.icon}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {kpi.decimals === 0 ? Math.round(kpiVals[i]) : kpiVals[i]}{kpi.suffix}
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

          {/* Portfolio */}
          <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Структура портфеля по типам объектов</h3>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Выручка, млн ₽</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { type: 'Жилые комплексы', share: 45, revenue: 56.1, color: '#3B82F6' },
                { type: 'Торговые центры', share: 28, revenue: 34.9, color: '#D4AF37' },
                { type: 'Промышленность', share: 18, revenue: 22.4, color: '#0C7205' },
                { type: 'Инфраструктура', share: 9, revenue: 11.2, color: '#8B5CF6' },
              ].map((seg, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{seg.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: seg.color }}>{seg.share}%</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{seg.revenue} млн ₽</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                    <div className="h-full rounded-full" style={{ width: `${seg.share}%`, background: seg.color, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend + Top projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 md:p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Динамика выручки (12 мес)</h3>
                <span className="text-xs" style={{ color: '#0C7205' }}>+18% YoY</span>
              </div>
              <div className="flex items-end gap-3">
                <Sparkline data={trendData} labels={trendLabels} color={isDark ? '#60A5FA' : '#3B82F6'} />
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>78</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>млн ₽ (дек)</div>
                </div>
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
              {[
                { day: 'Сегодня', date: '20.05', projects: ['КЖ-02-014'], color: '#DC2626', urgent: true },
                { day: 'Завтра', date: '21.05', projects: ['АР-03-015'], color: '#D4AF37', urgent: false },
                { day: 'Пн', date: '25.05', projects: ['ТЦ «Меридиан»'], color: '#3B82F6', urgent: false },
                { day: 'Чт', date: '28.05', projects: ['ОВиК-02-008'], color: '#3B82F6', urgent: false },
                { day: 'Пн', date: '02.06', projects: ['ТЭЦ-5'], color: '#0C7205', urgent: false },
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center min-w-[64px]">
                  <div className="w-full py-2 rounded-lg text-center cursor-pointer transition-all hover:scale-105"
                    style={{ background: item.urgent ? item.color + '15' : 'var(--card-elevated)', border: `1px solid ${item.urgent ? item.color + '40' : 'var(--border-color)'}` }}
                    onClick={() => navigate('/projects')}
                  >
                    <div className="text-[10px] font-medium" style={{ color: item.urgent ? item.color : 'var(--text-muted)' }}>{item.day}</div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.date}</div>
                    <div className="text-[9px] mt-0.5 truncate px-1" style={{ color: 'var(--text-muted)' }}>{item.projects[0]}</div>
                  </div>
                  {i < 4 && <div className="w-4 h-px mt-1" style={{ background: 'var(--border-color)' }} />}
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