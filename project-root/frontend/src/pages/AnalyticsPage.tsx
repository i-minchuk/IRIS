import { useState } from 'react';
import {
  BarChart3,
  Users,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { DepartmentLoad } from '@/components/DepartmentLoad';
import { useTheme } from '@/providers/ThemeProvider';

/* ─── Tab definitions ─── */
const TABS = [
  { id: 'load' as const, label: 'Загрузка команды', icon: <Users size={16} /> },
  { id: 'portfolio' as const, label: 'Портфель', icon: <Briefcase size={16} /> },
  { id: 'trends' as const, label: 'Тренды', icon: <TrendingUp size={16} /> },
] as const;

type TabId = typeof TABS[number]['id'];

/* ─── Mock portfolio data ─── */
const PORTFOLIO_DATA = [
  { name: 'ЖК «Северный»', budget: 120, spent: 85, progress: 72, status: 'active' },
  { name: 'ТЭЦ-5 Реконструкция', budget: 340, spent: 210, progress: 62, status: 'active' },
  { name: 'Мост через Волгу', budget: 560, spent: 480, progress: 86, status: 'warning' },
  { name: 'АЭС-2 Блок 3', budget: 890, spent: 320, progress: 36, status: 'active' },
  { name: 'ТРЦ «Галерея»', budget: 210, spent: 195, progress: 93, status: 'warning' },
  { name: 'Складской комплекс', budget: 85, spent: 12, progress: 14, status: 'active' },
];

/* ─── Mock trend data ─── */
const TREND_DATA = [
  { month: 'Янв', tasks: 120, closed: 98, load: 78 },
  { month: 'Фев', tasks: 135, closed: 110, load: 82 },
  { month: 'Мар', tasks: 142, closed: 125, load: 85 },
  { month: 'Апр', tasks: 128, closed: 115, load: 80 },
  { month: 'Май', tasks: 155, closed: 130, load: 88 },
  { month: 'Июн', tasks: 148, closed: 120, load: 84 },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('load');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textPrimary = 'var(--iris-text-primary)';
  const textSecondary = 'var(--iris-text-secondary)';
  const textMuted = 'var(--iris-text-muted)';
  const bgSurface = 'var(--iris-bg-surface)';
  const borderSubtle = 'var(--iris-border-subtle)';

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--iris-bg-app)' }}>
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b"
        style={{ borderColor: borderSubtle }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center h-9 w-9 rounded-lg"
            style={{ background: 'rgba(139, 92, 246, 0.12)' }}
          >
            <BarChart3 size={18} style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: textPrimary }}>
              Панель аналитики
            </h1>
            <p className="text-xs" style={{ color: textMuted }}>
              Загрузка, портфель и тренды команды
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 md:px-6 pt-3 border-b" style={{ borderColor: borderSubtle }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all"
            style={{
              color: activeTab === tab.id ? '#8B5CF6' : textSecondary,
              borderBottom: activeTab === tab.id ? '2px solid #8B5CF6' : '2px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        {/* ─── Загрузка команды ─── */}
        {activeTab === 'load' && (
          <div className="max-w-3xl mx-auto">
            <DepartmentLoad />
          </div>
        )}

        {/* ─── Портфель ─── */}
        {activeTab === 'portfolio' && (
          <div className="max-w-4xl mx-auto space-y-3">
            {PORTFOLIO_DATA.map((project) => {
              const statusColor =
                project.status === 'warning' ? '#D4AF37' : '#0C7205';
              const statusLabel =
                project.status === 'warning' ? 'Риск' : 'В плане';
              return (
                <div
                  key={project.name}
                  className="rounded-lg border p-4"
                  style={{ background: bgSurface, borderColor: borderSubtle }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: textPrimary }}>
                        {project.name}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: statusColor + '20',
                          color: statusColor,
                          border: `1px solid ${statusColor}40`,
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: textMuted }}>
                      {project.spent} / {project.budget} млн ₽
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(project.progress, 100)}%`,
                        background: statusColor,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px]" style={{ color: textMuted }}>
                      Прогресс: {project.progress}%
                    </span>
                    <span className="text-[10px]" style={{ color: textMuted }}>
                      Остаток: {project.budget - project.spent} млн ₽
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Тренды ─── */}
        {activeTab === 'trends' && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Monthly load chart */}
            <div
              className="rounded-lg border p-4"
              style={{ background: bgSurface, borderColor: borderSubtle }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>
                Динамика загрузки по месяцам
              </h3>
              <div className="flex items-end gap-2 h-40">
                {TREND_DATA.map((d) => {
                  const height = Math.min((d.load / 100) * 100, 100);
                  const barColor = d.load > 85 ? '#DC2626' : d.load > 70 ? '#D4AF37' : '#0C7205';
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[10px] font-medium" style={{ color: barColor }}>
                        {d.load}%
                      </div>
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${height}%`,
                          background: barColor + '60',
                          borderTop: `2px solid ${barColor}`,
                        }}
                      />
                      <div className="text-[10px]" style={{ color: textMuted }}>
                        {d.month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tasks created vs closed */}
            <div
              className="rounded-lg border p-4"
              style={{ background: bgSurface, borderColor: borderSubtle }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>
                Задачи: создано vs закрыто
              </h3>
              <div className="flex items-end gap-2 h-40">
                {TREND_DATA.map((d) => {
                  const maxVal = 160;
                  const taskHeight = (d.tasks / maxVal) * 100;
                  const closedHeight = (d.closed / maxVal) * 100;
                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '100%' }}>
                        <div
                          className="w-3 rounded-t-sm"
                          style={{
                            height: `${taskHeight}%`,
                            background: '#1A5ACC60',
                            borderTop: '2px solid #1A5ACC',
                          }}
                          title={`Создано: ${d.tasks}`}
                        />
                        <div
                          className="w-3 rounded-t-sm"
                          style={{
                            height: `${closedHeight}%`,
                            background: '#05966960',
                            borderTop: '2px solid #059669',
                          }}
                          title={`Закрыто: ${d.closed}`}
                        />
                      </div>
                      <div className="text-[10px]" style={{ color: textMuted }}>
                        {d.month}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: '#1A5ACC' }} />
                  <span className="text-[10px]" style={{ color: textMuted }}>Создано</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: '#059669' }} />
                  <span className="text-[10px]" style={{ color: textMuted }}>Закрыто</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
