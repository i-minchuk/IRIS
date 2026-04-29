import { useState, useMemo, useEffect } from 'react';
import type { PortfolioProject } from '../api/analytics';
import { Maximize2, X } from 'lucide-react';

interface ProjectPortfolioProps {
  data: { projects: PortfolioProject[]; zones: Record<string, number> } | null;
  loading?: boolean;
}

const ZONE_META: Record<string, { bg: string; fill: string; glow: string; label: string; icon: string }> = {
  stars:      { bg: 'var(--iris-status-bg-cyan)',    fill: 'var(--iris-accent-cyan)',    glow: 'var(--iris-glow-cyan)',    label: 'В плане', icon: '✅' },
  budget:     { bg: 'var(--iris-status-bg-amber)',   fill: 'var(--iris-accent-amber)',   glow: 'var(--iris-glow-amber)',   label: 'Проблемы бюджета', icon: '⚠️' },
  recoverable:{ bg: 'var(--iris-status-bg-blue)',    fill: 'var(--iris-accent-blue)',    glow: 'var(--iris-glow-blue)',    label: 'Риск срыва сроков', icon: '📈' },
  crisis:     { bg: 'var(--iris-status-bg-coral)',   fill: 'var(--iris-accent-coral)',   glow: 'var(--iris-glow-coral)',   label: 'Кризис', icon: '🔥' },
};

const MAX_AXIS = 160;
const PADDING = { top: 32, right: 32, bottom: 56, left: 64 };
const VB_W = 800;
const VB_H = 520;

export function ProjectPortfolio({ data, loading }: ProjectPortfolioProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const plotW = VB_W - PADDING.left - PADDING.right;
  const plotH = VB_H - PADDING.top - PADDING.bottom;

  const projects = data?.projects ?? [];

  const maxBudget = useMemo(() => {
    if (!projects.length) return 50;
    return Math.max(...projects.map((p) => p.total_budget_m));
  }, [projects]);

  const xScale = (v: number) => PADDING.left + (v / MAX_AXIS) * plotW;
  const yScale = (v: number) => PADDING.top + plotH - (v / MAX_AXIS) * plotH;
  const rScale = (v: number) => 8 + (v / maxBudget) * 32;

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        <div className="mb-4 h-6 w-48 animate-pulse rounded" style={{ background: 'var(--iris-bg-skeleton)' }} />
        <div className="aspect-[16/10] w-full animate-pulse rounded-lg" style={{ background: 'var(--iris-bg-skeleton)' }} />
      </div>
    );
  }

  const renderChart = (isFs: boolean) => (
    <div className={`relative w-full flex-1 ${isFs ? 'overflow-hidden flex items-center justify-center' : 'overflow-x-auto'}`}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className={isFs ? 'max-w-full max-h-full' : 'w-full h-auto'}
        style={isFs ? {} : { minHeight: 280 }}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <filter id="bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="grad-stars" cx="30%" cy="30%">
            <stop offset="0%" stopColor="var(--iris-accent-cyan)" />
            <stop offset="100%" stopColor="var(--iris-accent-cyan)" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="grad-budget" cx="30%" cy="30%">
            <stop offset="0%" stopColor="var(--iris-accent-amber)" />
            <stop offset="100%" stopColor="var(--iris-accent-amber)" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="grad-recoverable" cx="30%" cy="30%">
            <stop offset="0%" stopColor="var(--iris-accent-blue)" />
            <stop offset="100%" stopColor="var(--iris-accent-blue)" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="grad-crisis" cx="30%" cy="30%">
            <stop offset="0%" stopColor="var(--iris-accent-coral)" />
            <stop offset="100%" stopColor="var(--iris-accent-coral)" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Background zones */}
        <rect x={xScale(0)} y={yScale(100)} width={(100 / MAX_AXIS) * plotW} height={(100 / MAX_AXIS) * plotH} fill={ZONE_META.stars.bg} rx={6} />
        <rect x={xScale(100)} y={yScale(100)} width={((MAX_AXIS - 100) / MAX_AXIS) * plotW} height={(100 / MAX_AXIS) * plotH} fill={ZONE_META.budget.bg} rx={6} />
        <rect x={xScale(0)} y={yScale(MAX_AXIS)} width={(100 / MAX_AXIS) * plotW} height={((MAX_AXIS - 100) / MAX_AXIS) * plotH} fill={ZONE_META.recoverable.bg} rx={6} />
        <rect x={xScale(100)} y={yScale(MAX_AXIS)} width={((MAX_AXIS - 100) / MAX_AXIS) * plotW} height={((MAX_AXIS - 100) / MAX_AXIS) * plotH} fill={ZONE_META.crisis.bg} rx={6} />

        {/* Grid lines + ticks X */}
        {[0, 50, 100, 150].map((tick) => (
          <g key={`x-${tick}`}>
            <line x1={xScale(tick)} y1={yScale(0)} x2={xScale(tick)} y2={yScale(MAX_AXIS)} stroke="var(--iris-border-default)" strokeDasharray="3,3" />
            <text x={xScale(tick)} y={yScale(0) + 22} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 13 }}>{tick}%</text>
          </g>
        ))}

        {/* Grid lines + ticks Y */}
        {[0, 50, 100, 150].map((tick) => (
          <g key={`y-${tick}`}>
            <line x1={xScale(0)} y1={yScale(tick)} x2={xScale(MAX_AXIS)} y2={yScale(tick)} stroke="var(--iris-border-default)" strokeDasharray="3,3" />
            <text x={xScale(0) - 10} y={yScale(tick) + 4} textAnchor="end" fill="var(--text-muted)" style={{ fontSize: 13 }}>{tick}%</text>
          </g>
        ))}

        {/* Zone labels */}
        <text x={xScale(50)} y={yScale(50)} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 14 }}>В плане</text>
        <text x={xScale(130)} y={yScale(50)} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 14 }}>Проблемы бюджета</text>
        <text x={xScale(50)} y={yScale(130)} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 14 }}>Риск срыва сроков</text>
        <text x={xScale(130)} y={yScale(130)} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 14 }}>Кризис</text>

        {/* 100% threshold lines */}
        <line x1={xScale(100)} y1={yScale(0)} x2={xScale(100)} y2={yScale(MAX_AXIS)} stroke="var(--iris-border-strong)" strokeWidth={2} />
        <line x1={xScale(0)} y1={yScale(100)} x2={xScale(MAX_AXIS)} y2={yScale(100)} stroke="var(--iris-border-strong)" strokeWidth={2} />

        {/* Bubbles */}
        {projects.map((p) => {
          const cx = xScale(p.budget_pct);
          const cy = yScale(p.schedule_pct);
          const r = rScale(p.total_budget_m);
          const isHovered = hovered === p.id;
          const zone = p.zone ?? 'recoverable';
          const gradId = `grad-${zone}`;
          const glow = ZONE_META[zone]?.glow ?? 'var(--iris-glow-blue)';

          return (
            <g key={p.id}>
              <circle cx={cx} cy={cy} r={r + 4} fill={glow} opacity={isHovered ? 0.5 : 0.2} className="pointer-events-none transition-all duration-200" />
              <circle
                cx={cx} cy={cy} r={r}
                fill={`url(#${gradId})`}
                stroke={ZONE_META[zone]?.fill ?? 'var(--iris-accent-blue)'}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeOpacity={isHovered ? 1 : 0.8}
                className="cursor-pointer transition-all duration-200"
                filter="url(#bubble-glow)"
                onMouseMove={(e) => handleMouseMove(e, p)}
                onMouseEnter={(e) => handleMouseMove(e, p)}
                onMouseLeave={handleMouseLeave}
              />
              {r > 16 && (
                <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--iris-text-inverse)" fontWeight={600} className="pointer-events-none select-none" style={{ fontSize: Math.max(10, r * 0.5), textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  {p.code}
                </text>
              )}
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={VB_W / 2} y={VB_H - 14} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 14 }}>Бюджет выполнено, %</text>
        <text x={18} y={VB_H / 2} textAnchor="middle" transform={`rotate(-90, 18, ${VB_H / 2})`} fill="var(--text-muted)" style={{ fontSize: 14 }}>График выполнено, %</text>

        {/* Tooltip */}
        {hovered !== null && tooltipPos && (() => {
          const p = projects.find((pr) => pr.id === hovered);
          if (!p) return null;
          const tx = Math.min(tooltipPos.x, VB_W - 210);
          const ty = Math.max(tooltipPos.y - 80, 10);
          return (
            <g>
              <rect x={tx} y={ty} width={200} height={72} rx={8} fill="var(--iris-bg-tooltip)" stroke="var(--iris-border-subtle)" strokeWidth={1} />
              <text x={tx + 12} y={ty + 22} fill="var(--iris-text-primary)" style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</text>
              <text x={tx + 12} y={ty + 42} fill="var(--iris-text-secondary)" style={{ fontSize: 12 }}>Бюджет: {p.budget_pct}% · График: {p.schedule_pct}%</text>
              <text x={tx + 12} y={ty + 60} fill="var(--iris-text-muted)" style={{ fontSize: 12 }}>Стоимость: {p.total_budget_m.toFixed(1)} млн · {p.zone_label}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );

  const renderHeader = (isFs: boolean) => (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between shrink-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${isFs ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`} style={{ color: 'var(--text-primary)' }}>
            Портфель проектов
          </h3>
          {isFs && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: 'var(--iris-status-bg-blue)', color: 'var(--iris-accent-blue)' }}>
              Режим демонстрации
            </span>
          )}
        </div>
        <p className={`${isFs ? 'text-sm mt-1' : 'text-[11px] sm:text-xs'}`} style={{ color: 'var(--text-muted)' }}>
          X = бюджет % · Y = график % · размер = бюджет проекта
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(ZONE_META).map(([key, zone]) => (
            <span key={key} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] sm:text-xs font-medium" style={{ backgroundColor: zone.bg, borderColor: 'var(--iris-border-subtle)', color: 'var(--text-secondary)' }}>
              <span className="hidden sm:inline">{zone.label}</span>
              <span className="sm:hidden">{zone.icon}</span>
              <span className="ml-1 tabular-nums">{data?.zones?.[key] ?? 0}</span>
            </span>
          ))}
        </div>
        {isFs ? (
          <button
            onClick={() => setIsFullscreen(false)}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)', color: 'var(--text-secondary)' }}
            title="Закрыть (Esc)"
          >
            <X size={14} />
            <span className="hidden sm:inline">Закрыть</span>
          </button>
        ) : (
          <button
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors"
            style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)', color: 'var(--text-muted)' }}
            title="Развернуть на весь экран"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">На весь экран</span>
          </button>
        )}
      </div>
    </div>
  );

  const emptyState = (
    <div className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm" style={{ borderColor: 'var(--iris-border-dashed)', color: 'var(--text-muted)' }}>
      Нет активных проектов для отображения
    </div>
  );

  return (
    <>
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        {renderHeader(false)}
        {renderChart(false)}
        {projects.length === 0 && emptyState}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col p-3 sm:p-6 lg:p-10" style={{ background: 'var(--iris-bg-backdrop)', backdropFilter: 'blur(8px)' }}>
          <div className="flex flex-col h-full rounded-2xl p-5 sm:p-8 overflow-hidden neon-card">
            {renderHeader(true)}
            {renderChart(true)}
            {projects.length === 0 && emptyState}
          </div>
        </div>
      )}
    </>
  );
}
