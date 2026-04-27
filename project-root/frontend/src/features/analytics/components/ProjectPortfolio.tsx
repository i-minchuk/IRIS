import { useState, useMemo } from 'react';
import type { PortfolioProject } from '../api/analytics';

interface ProjectPortfolioProps {
  data: { projects: PortfolioProject[]; zones: Record<string, number> } | null;
  loading?: boolean;
}

const ZONE_META: Record<string, { bg: string; fill: string; label: string; icon: string }> = {
  stars: { bg: 'rgba(16,185,129,0.12)', fill: '#10b981', label: 'Звёзды', icon: '⭐' },
  budget: { bg: 'rgba(245,158,11,0.12)', fill: '#f59e0b', label: 'Проблемы бюджета', icon: '⚠️' },
  recoverable: { bg: 'rgba(59,130,246,0.12)', fill: '#3b82f6', label: 'Восстановимые', icon: '📈' },
  crisis: { bg: 'rgba(239,68,68,0.12)', fill: '#ef4444', label: 'Кризис', icon: '🔥' },
};

const MAX_AXIS = 160;
const PADDING = { top: 32, right: 32, bottom: 56, left: 64 };
const VB_W = 800;
const VB_H = 520;

export function ProjectPortfolio({ data, loading }: ProjectPortfolioProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const plotW = VB_W - PADDING.left - PADDING.right;
  const plotH = VB_H - PADDING.top - PADDING.bottom;

  const projects = data?.projects ?? [];

  const maxBudget = useMemo(() => {
    if (!projects.length) return 50;
    return Math.max(...projects.map((p) => p.total_budget_m));
  }, [projects]);

  const xScale = (v: number) => PADDING.left + (v / MAX_AXIS) * plotW;
  const yScale = (v: number) => PADDING.top + plotH - (v / MAX_AXIS) * plotH;
  const rScale = (v: number) => 8 + (v / maxBudget) * 32; // radius 8..40

  const handleMouseMove = (e: React.MouseEvent, project: PortfolioProject) => {
    const rect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 10 });
    }
    setHovered(project.id);
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setTooltipPos(null);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="aspect-[16/10] w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
            Портфель проектов
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            X = бюджет % · Y = график % · размер = бюджет проекта
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ZONE_META).map(([key, zone]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] sm:text-xs font-medium dark:border-slate-600"
              style={{ backgroundColor: zone.bg }}
            >
              <span className="hidden sm:inline">{zone.label}</span>
              <span className="sm:hidden">{zone.icon}</span>
              <span className="ml-1 text-slate-500 tabular-nums">{data?.zones?.[key] ?? 0}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full h-auto"
          style={{ minHeight: 280 }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background zones */}
          <rect
            x={xScale(0)}
            y={yScale(100)}
            width={(100 / MAX_AXIS) * plotW}
            height={(100 / MAX_AXIS) * plotH}
            fill={ZONE_META.stars.bg}
            rx={6}
          />
          <rect
            x={xScale(100)}
            y={yScale(100)}
            width={((MAX_AXIS - 100) / MAX_AXIS) * plotW}
            height={(100 / MAX_AXIS) * plotH}
            fill={ZONE_META.budget.bg}
            rx={6}
          />
          <rect
            x={xScale(0)}
            y={yScale(MAX_AXIS)}
            width={(100 / MAX_AXIS) * plotW}
            height={((MAX_AXIS - 100) / MAX_AXIS) * plotH}
            fill={ZONE_META.recoverable.bg}
            rx={6}
          />
          <rect
            x={xScale(100)}
            y={yScale(MAX_AXIS)}
            width={((MAX_AXIS - 100) / MAX_AXIS) * plotW}
            height={((MAX_AXIS - 100) / MAX_AXIS) * plotH}
            fill={ZONE_META.crisis.bg}
            rx={6}
          />

          {/* Grid lines + ticks X */}
          {[0, 50, 100, 150].map((tick) => (
            <g key={`x-${tick}`}>
              <line
                x1={xScale(tick)}
                y1={yScale(0)}
                x2={xScale(tick)}
                y2={yScale(MAX_AXIS)}
                stroke="currentColor"
                strokeDasharray="3,3"
                className="text-slate-200 dark:text-slate-700"
              />
              <text
                x={xScale(tick)}
                y={yScale(0) + 22}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500"
                style={{ fontSize: 13 }}
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Grid lines + ticks Y */}
          {[0, 50, 100, 150].map((tick) => (
            <g key={`y-${tick}`}>
              <line
                x1={xScale(0)}
                y1={yScale(tick)}
                x2={xScale(MAX_AXIS)}
                y2={yScale(tick)}
                stroke="currentColor"
                strokeDasharray="3,3"
                className="text-slate-200 dark:text-slate-700"
              />
              <text
                x={xScale(0) - 10}
                y={yScale(tick) + 4}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500"
                style={{ fontSize: 13 }}
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Zone labels */}
          <text x={xScale(50)} y={yScale(50)} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: 14 }}>
            Звёзды
          </text>
          <text x={xScale(130)} y={yScale(50)} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: 14 }}>
            Проблемы бюджета
          </text>
          <text x={xScale(50)} y={yScale(130)} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: 14 }}>
            Восстановимые
          </text>
          <text x={xScale(130)} y={yScale(130)} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" style={{ fontSize: 14 }}>
            Кризис
          </text>

          {/* 100% threshold lines */}
          <line
            x1={xScale(100)}
            y1={yScale(0)}
            x2={xScale(100)}
            y2={yScale(MAX_AXIS)}
            stroke="currentColor"
            strokeWidth={2}
            className="text-slate-300 dark:text-slate-600"
          />
          <line
            x1={xScale(0)}
            y1={yScale(100)}
            x2={xScale(MAX_AXIS)}
            y2={yScale(100)}
            stroke="currentColor"
            strokeWidth={2}
            className="text-slate-300 dark:text-slate-600"
          />

          {/* Bubbles */}
          {projects.map((p) => {
            const cx = xScale(p.budget_pct);
            const cy = yScale(p.schedule_pct);
            const r = rScale(p.total_budget_m);
            const isHovered = hovered === p.id;
            const fill = ZONE_META[p.zone]?.fill ?? '#3b82f6';

            return (
              <g key={p.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={fill}
                  fillOpacity={isHovered ? 0.9 : 0.55}
                  stroke={fill}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeOpacity={isHovered ? 1 : 0.75}
                  className="cursor-pointer transition-all duration-200"
                  onMouseMove={(e) => handleMouseMove(e, p)}
                  onMouseEnter={(e) => handleMouseMove(e, p)}
                  onMouseLeave={handleMouseLeave}
                />
                {r > 16 && (
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    className="fill-white font-semibold pointer-events-none select-none"
                    style={{ fontSize: Math.max(10, r * 0.5) }}
                  >
                    {p.code}
                  </text>
                )}
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={VB_W / 2}
            y={VB_H - 14}
            textAnchor="middle"
            className="fill-slate-500 dark:fill-slate-400"
            style={{ fontSize: 14 }}
          >
            Бюджет выполнено, %
          </text>
          <text
            x={18}
            y={VB_H / 2}
            textAnchor="middle"
            transform={`rotate(-90, 18, ${VB_H / 2})`}
            className="fill-slate-500 dark:fill-slate-400"
            style={{ fontSize: 14 }}
          >
            График выполнено, %
          </text>

          {/* Tooltip inside SVG */}
          {hovered !== null && tooltipPos && (() => {
            const p = projects.find((pr) => pr.id === hovered);
            if (!p) return null;
            const tx = Math.min(tooltipPos.x, VB_W - 210);
            const ty = Math.max(tooltipPos.y - 80, 10);
            return (
              <g>
                <rect
                  x={tx}
                  y={ty}
                  width={200}
                  height={72}
                  rx={8}
                  fill="rgba(15,23,42,0.92)"
                  className="dark:fill-slate-900"
                  stroke="rgba(100,116,139,0.3)"
                  strokeWidth={1}
                />
                <text x={tx + 12} y={ty + 22} className="fill-white" style={{ fontSize: 14, fontWeight: 600 }}>
                  {p.name}
                </text>
                <text x={tx + 12} y={ty + 42} className="fill-slate-300" style={{ fontSize: 12 }}>
                  Бюджет: {p.budget_pct}% · График: {p.schedule_pct}%
                </text>
                <text x={tx + 12} y={ty + 60} className="fill-slate-400" style={{ fontSize: 12 }}>
                  Стоимость: {p.total_budget_m.toFixed(1)} млн · {p.zone_label}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {projects.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          Нет активных проектов для отображения
        </div>
      )}
    </div>
  );
}
