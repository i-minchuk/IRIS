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
}> = {
  green: {
    gradient: 'linear-gradient(135deg, #00F0FF, #00C853)',
    glow: 'rgba(0, 240, 255, 0.15)',
    border: 'rgba(0, 240, 255, 0.3)',
  },
  yellow: {
    gradient: 'linear-gradient(135deg, #FFAA00, #FF00AA)',
    glow: 'rgba(255, 170, 0, 0.15)',
    border: 'rgba(255, 170, 0, 0.3)',
  },
  red: {
    gradient: 'linear-gradient(135deg, #FF4D6D, #FF00AA)',
    glow: 'rgba(255, 77, 109, 0.15)',
    border: 'rgba(255, 77, 109, 0.3)',
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
        background: 'linear-gradient(145deg, rgba(26, 29, 45, 0.9), rgba(17, 20, 32, 0.95))',
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
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
                color: trend_direction === 'up' ? '#00F0FF' : '#FF4D6D',
                textShadow: trend_direction === 'up'
                  ? '0 0 8px rgba(0, 240, 255, 0.4)'
                  : '0 0 8px rgba(255, 77, 109, 0.4)',
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
