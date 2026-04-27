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

const statusColors: Record<string, { border: string; glow: string; trendUp: string; trendDown: string }> = {
  green: {
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/10',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
  },
  yellow: {
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/10',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
  },
  red: {
    border: 'border-rose-500/40',
    glow: 'shadow-rose-500/10',
    trendUp: 'text-emerald-400',
    trendDown: 'text-rose-400',
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
  const colors = statusColors[status] || statusColors.green;
  const animatedValue = useCountUp(value);

  return (
    <div
      onClick={onClick}
      className={[
        'relative rounded-xl border bg-white dark:bg-[#1e293b] p-4 sm:p-5 transition-all duration-200',
        'shadow-sm dark:shadow-lg',
        colors.border,
        colors.glow,
        clickable ? 'cursor-pointer hover:brightness-105 dark:hover:brightness-110 hover:scale-[1.01]' : '',
      ].join(' ')}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">
        {label}
      </div>

      <div className="flex items-end justify-between gap-3 mb-3">
        <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {animatedValue}
        </span>
        {trend && (
          <span
            className={[
              'text-xs font-semibold whitespace-nowrap mb-1',
              trend_direction === 'up' ? colors.trendUp : colors.trendDown,
            ].join(' ')}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed truncate">
        {subtext}
      </div>

      <div className="absolute top-4 right-4">
        <span
          className={[
            'inline-block w-2 h-2 rounded-full',
            status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500',
          ].join(' ')}
        />
      </div>
    </div>
  );
};
