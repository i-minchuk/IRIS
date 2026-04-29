import React, { useEffect, useRef, useState } from 'react';

export interface KPITileProps {
  label: string;
  value: string;
  trend: string | null;
  trend_direction: 'up' | 'down' | null;
  status: 'green' | 'yellow' | 'red';
  subtext: string;
  clickable?: boolean;
  onClick?: () => void;
}

const statusConfig: Record<string, {
  gradient: string;
  glow: string;
  border: string;
  accent: string;
}> = {
  green: {
    gradient: 'linear-gradient(135deg, var(--iris-accent-cyan), #00C853)',
    glow: 'var(--iris-glow-cyan)',
    border: 'var(--iris-accent-cyan)',
    accent: 'var(--iris-accent-cyan)',
  },
  yellow: {
    gradient: 'linear-gradient(135deg, var(--iris-accent-amber), var(--iris-accent-magenta))',
    glow: 'var(--iris-glow-amber)',
    border: 'var(--iris-accent-amber)',
    accent: 'var(--iris-accent-amber)',
  },
  red: {
    gradient: 'linear-gradient(135deg, var(--iris-accent-coral), var(--iris-accent-magenta))',
    glow: 'var(--iris-glow-coral)',
    border: 'var(--iris-accent-coral)',
    accent: 'var(--iris-accent-coral)',
  },
};

function useCountUp(target: string, duration = 1000) {
  const [display, setDisplay] = useState('0');
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const numMatch = target.match(/[\d.,]+/);
    if (!numMatch) {
      setDisplay(target);
      return;
    }
    const numStr = numMatch[0].replace(/,/g, '.');
    const targetNum = parseFloat(numStr);
    if (Number.isNaN(targetNum)) {
      setDisplay(target);
      return;
    }

    const suffix = target.replace(numMatch[0], '');
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * eased;

      if (Number.isInteger(targetNum)) {
        setDisplay(`${Math.round(current)}${suffix}`);
      } else {
        setDisplay(`${current.toFixed(1)}${suffix}`);
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return display;
}

export const KPITile: React.FC<KPITileProps> = ({
  label,
  value,
  trend,
  trend_direction,
  status,
  subtext,
  clickable,
  onClick,
}) => {
  const cfg = statusConfig[status] || statusConfig.green;
  const animatedValue = useCountUp(value);

  return (
    <div
      onClick={onClick}
      className={[
        'relative rounded-2xl p-4 sm:p-5 transition-all duration-300 overflow-hidden',
        clickable ? 'cursor-pointer hover:scale-[1.02]' : '',
      ].join(' ')}
      style={{
        background: 'var(--iris-bg-card)',
        border: `1px solid var(--iris-border-subtle)`,
        boxShadow: `var(--iris-shadow-card), 0 0 20px ${cfg.glow}, var(--iris-shadow-inset)`,
      }}
    >
      {/* Neon corner accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-20"
        style={{
          background: cfg.gradient,
          filter: 'blur(30px)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="relative">
        <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>

        <div className="flex items-end justify-between gap-3 mb-3">
          <span
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{
              background: cfg.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {animatedValue}
          </span>
          {trend && (
            <span
              className="text-xs font-semibold whitespace-nowrap mb-1"
              style={{
                color: trend_direction === 'up' ? 'var(--iris-accent-cyan)' : 'var(--iris-accent-coral)',
                textShadow: trend_direction === 'up'
                  ? '0 0 8px var(--iris-glow-cyan)'
                  : '0 0 8px var(--iris-glow-coral)',
              }}
            >
              {trend}
            </span>
          )}
        </div>

        <div className="text-[11px] leading-relaxed truncate" style={{ color: 'var(--text-muted)' }}>
          {subtext}
        </div>
      </div>

      {/* Status dot */}
      <div className="absolute top-4 right-4">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: cfg.gradient,
            boxShadow: `0 0 8px ${cfg.glow}`,
          }}
        />
      </div>
    </div>
  );
};
