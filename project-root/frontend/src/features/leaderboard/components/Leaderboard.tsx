import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Trophy, Medal, Award, FileText, TrendingUp, TrendingDown,
  Minus, Crown, Download, Filter, ChevronDown, Loader2, Search,
  Calendar, ChevronLeft, ChevronRight, X
} from 'lucide-react';

export type LeaderboardVariant = 'ladder' | 'podium' | 'table' | 'cards' | 'compact';
export type Period = 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface LeaderboardEmployee {
  id: number;
  name: string;
  position: string;
  docs: number;
  avatar?: string;
  trend?: number;
  department?: string;
  sparkline?: number[];
}

export interface LeaderboardProps {
  employees: LeaderboardEmployee[];
  variant?: LeaderboardVariant;
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showTrend?: boolean;
  showDepartment?: boolean;
  showSparkline?: boolean;
  className?: string;
  loading?: boolean;
  enableExport?: boolean;
  enableFilter?: boolean;
  enableSearch?: boolean;
  enablePeriod?: boolean;
  enablePagination?: boolean;
  enableConfetti?: boolean;
  animateCounter?: boolean;
  theme?: 'auto' | 'dark' | 'light';
  pageSize?: number;
}

// ─── useCountUp hook ─────────────────────────────────────────────
const useCountUp = (target: number, duration: number = 1500, start: boolean = true) => {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!start) { setValue(0); return; }
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setValue(target);
    };
    requestAnimationFrame(animate);
    return () => { startTime.current = null; };
  }, [target, duration, start]);

  return value;
};

// ─── Confetti Effect ─────────────────────────────────────────────
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!active) return;
    const colors = ['#D4A62A', '#3B4FA8', '#8D79C7', '#222B5C', '#C0392B', '#3498DB'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            animation: `confettiFall 2.5s ease-out ${p.delay}s forwards`,
            opacity: 0.8,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ─── Sparkline Chart ─────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#3B4FA8' }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="2" fill={color} />
    </svg>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1: return 'from-[#D4A62A] to-[#B8941F]';   // Sunflower Yellow
    case 2: return 'from-[#8D79C7] to-[#6B5B9A]';   // Siberian Lilac
    case 3: return 'from-[#C0392B] to-[#A93226]';   // IRIS Red
    default: return 'from-[#3B4FA8] to-[#222B5C]'; // IRIS Blue → Deep IRIS
  }
};

const getRankBorder = (rank: number) => {
  switch (rank) {
    case 1: return 'border-[#D4A62A]/50';
    case 2: return 'border-[#8D79C7]/50';
    case 3: return 'border-[#C0392B]/50';
    default: return 'border-[#3B4FA8]/30';
  }
};

const periodLabels: Record<Period, string> = {
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
  all: 'Всё время',
};

// ─── Animated Counter ────────────────────────────────────────────
const AnimatedNumber: React.FC<{ value: number; animate: boolean; className?: string }> =
  ({ value, animate, className }) => {
  const display = useCountUp(value, 1500, animate);
  return <span className={className}>{display.toLocaleString()}</span>;
};

// ─── Tooltip ─────────────────────────────────────────────────────
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg
          bg-black/90 border border-[#3B4FA8]/30 text-xs text-white whitespace-nowrap z-50
          shadow-[0_0_10px_rgba(59,79,168,0.2)]">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90" />
        </div>
      )}
    </div>
  );
};

// ─── Trend Badge ─────────────────────────────────────────────────
const TrendBadge: React.FC<{ value?: number }> = ({ value }) => {
  if (value === undefined) return <Minus className="w-3 h-3 text-white/30" />;
  if (value > 0) return (
    <Tooltip text={`+${value} позиций за период`}>
      <span className="flex items-center gap-0.5 text-xs text-[#3B4FA8] cursor-help">
        <TrendingUp className="w-3 h-3" />+{value}
      </span>
    </Tooltip>
  );
  if (value < 0) return (
    <Tooltip text={`${value} позиций за период`}>
      <span className="flex items-center gap-0.5 text-xs text-red-400 cursor-help">
        <TrendingDown className="w-3 h-3" />{value}
      </span>
    </Tooltip>
  );
  return <span className="text-xs text-white/30">0</span>;
};

// ─── Avatar ──────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; rank: number; src?: string }> = ({ name, rank, src }) => {
  const size = rank <= 3 ? 'w-14 h-14' : 'w-10 h-10';
  const textSize = rank <= 3 ? 'text-sm' : 'text-xs';
  return (
    <div className={`${size} rounded-full bg-[#3B4FA8]/15 border-2 ${getRankBorder(rank)} flex items-center justify-center relative`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className={`${textSize} font-bold text-white`}>{getInitials(name)}</span>
      )}
      {rank <= 3 && (
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
          {rank === 1 ? <Crown className="w-3 h-3" /> : rank}
        </div>
      )}
    </div>
  );
};

// ─── SKELETON COMPONENTS ─────────────────────────────────────────
const SkeletonLadder: React.FC = () => (
  <div className="flex items-end justify-center gap-3 px-2">
    {[5,4,3,2,1].map((_, i) => (
      <div key={i} className={`w-32 ${['h-36','h-44','h-52','h-60','h-72'][i]} rounded-xl bg-white/[0.03] animate-pulse`} />
    ))}
  </div>
);

const SkeletonTable: React.FC = () => (
  <div className="w-full space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] animate-pulse">
        <div className="w-7 h-7 rounded-full bg-white/5" />
        <div className="w-10 h-10 rounded-full bg-white/5" />
        <div className="flex-1 space-y-1">
          <div className="w-32 h-3 rounded bg-white/5" />
          <div className="w-20 h-2 rounded bg-white/5" />
        </div>
        <div className="w-16 h-3 rounded bg-white/5" />
      </div>
    ))}
  </div>
);

const SkeletonCards: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-48 rounded-xl bg-white/[0.03] animate-pulse" />
    ))}
  </div>
);

// ─── LADDER VARIANT ──────────────────────────────────────────────
const LadderView: React.FC<{ employees: LeaderboardEmployee[]; showTrend: boolean; showSparkline: boolean; animate: boolean }> =
  ({ employees, showTrend, showSparkline, animate }) => {
  const sorted = [...employees].sort((a, b) => b.docs - a.docs).slice(0, 5);
  const stepHeights = ['h-36', 'h-44', 'h-52', 'h-60', 'h-72'];

  return (
    <div className="flex items-end justify-center gap-3 px-2 relative">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        {sorted.map((_, idx) => {
          if (idx === sorted.length - 1) return null;
          const x1 = (idx * 152) + 76;
          const x2 = ((idx + 1) * 152) + 76;
          const y1 = 400 - ((sorted.length - idx) * 48);
          const y2 = 400 - ((sorted.length - idx - 1) * 48);
          return (
            <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(59,79,168,0.15)" strokeWidth="2" strokeDasharray="4 4" />
          );
        })}
      </svg>
      {sorted.map((emp, idx) => {
        const rank = idx + 1;
        const reversedIdx = sorted.length - 1 - idx;
        return (
          <div key={emp.id} className="relative flex flex-col items-center z-10"
            style={{ animation: `stepAppear 0.5s ease-out ${idx * 0.1}s both` }}>
            {rank <= 3 && (
              <div className={`absolute -top-7 z-20 w-8 h-8 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center shadow-lg`}>
                {rank === 1 ? <Trophy className="w-4 h-4 text-[#222B5C]" /> :
                 rank === 2 ? <Medal className="w-4 h-4 text-[#222B5C]" /> :
                 <Award className="w-4 h-4 text-[#222B5C]" />}
              </div>
            )}
            <div className={`relative w-32 ${stepHeights[reversedIdx]} rounded-xl backdrop-blur-md border border-[#3B4FA8]/15
              bg-gradient-to-b from-white/[0.07] to-white/[0.02] flex flex-col items-center justify-between py-3 px-2
              shadow-[0_0_15px_rgba(59,79,168,0.06)] hover:shadow-[0_0_25px_rgba(59,79,168,0.12)] transition-all duration-300`}>
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${getRankColor(rank)}`} />
              <Avatar name={emp.name} rank={rank} src={emp.avatar} />
              <div className="text-center mt-2">
                <p className="text-sm font-bold text-white leading-tight">{emp.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{emp.position}</p>
              </div>
              {showSparkline && emp.sparkline && (
                <div className="mt-1">
                  <Sparkline data={emp.sparkline} />
                </div>
              )}
              <div className="flex items-center gap-1 mt-1">
                <FileText className="w-3 h-3 text-[#3B4FA8]/70" />
                <AnimatedNumber value={emp.docs} animate={animate} className="text-base font-bold bg-gradient-to-r from-[#3B4FA8] to-[#8D79C7] bg-clip-text text-transparent" />
                <span className="text-[8px] text-[#3B4FA8]/50">док.</span>
              </div>
              {showTrend && <TrendBadge value={emp.trend} />}
            </div>
            <div className="mt-1 text-xl font-bold text-white/10">{rank}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── PODIUM VARIANT ──────────────────────────────────────────────
const PodiumView: React.FC<{ employees: LeaderboardEmployee[]; showTrend: boolean; showSparkline: boolean; animate: boolean }> =
  ({ employees, showTrend, showSparkline, animate }) => {
  const sorted = [...employees].sort((a, b) => b.docs - a.docs).slice(0, 5);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = ['h-48', 'h-60', 'h-44'];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end justify-center gap-4 mb-6">
        {podiumOrder.map((emp, idx) => {
          const rank = idx === 1 ? 1 : idx === 0 ? 2 : 3;
          return (
            <div key={emp.id} className="relative flex flex-col items-center"
              style={{ animation: `stepAppear 0.5s ease-out ${idx * 0.15}s both` }}>
              <div className={`w-36 ${heights[idx]} rounded-t-2xl backdrop-blur-md border-x border-t border-[#3B4FA8]/20
                bg-gradient-to-b from-white/[0.08] to-white/[0.02] flex flex-col items-center justify-start pt-4 px-3
                shadow-[0_0_20px_rgba(59,79,168,0.08)] relative`}>
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${getRankColor(rank)}`} />
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center mb-3 shadow-lg`}>
                  {rank === 1 ? <Trophy className="w-5 h-5 text-[#222B5C]" /> :
                   rank === 2 ? <Medal className="w-5 h-5 text-[#222B5C]" /> :
                   <Award className="w-5 h-5 text-[#222B5C]" />}
                </div>
                <Avatar name={emp.name} rank={rank} src={emp.avatar} />
                <p className="text-xs font-bold text-white mt-2 text-center">{emp.name}</p>
                <p className="text-xs text-white/40">{emp.position}</p>
                {showSparkline && emp.sparkline && (
                  <div className="mt-2">
                    <Sparkline data={emp.sparkline} />
                  </div>
                )}
                <div className="mt-auto mb-4 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#3B4FA8]" />
                  <AnimatedNumber value={emp.docs} animate={animate} className="text-lg font-bold text-[#3B4FA8]" />
                </div>
              </div>
              <div className={`w-36 h-8 rounded-b-lg bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center`}>
                <span className="text-sm font-bold text-white/90">{rank} МЕСТО</span>
              </div>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <div className="w-full max-w-md space-y-2">
          {rest.map((emp, idx) => (
            <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-md border border-[#3B4FA8]/10
              bg-gradient-to-r from-white/[0.05] to-transparent hover:bg-white/[0.08] transition-colors"
              style={{ animation: `stepAppear 0.4s ease-out ${(idx + 3) * 0.1}s both` }}>
              <span className="text-lg font-bold text-white/20 w-6">{idx + 4}</span>
              <Avatar name={emp.name} rank={idx + 4} src={emp.avatar} />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{emp.name}</p>
                <p className="text-xs text-white/40">{emp.position}</p>
              </div>
              {showSparkline && emp.sparkline && <Sparkline data={emp.sparkline} />}
              <div className="flex items-center gap-2">
                <AnimatedNumber value={emp.docs} animate={animate} className="text-sm font-bold text-[#3B4FA8]" />
                {showTrend && <TrendBadge value={emp.trend} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TABLE VARIANT ───────────────────────────────────────────────
const TableView: React.FC<{ employees: LeaderboardEmployee[]; showTrend: boolean; showDepartment: boolean; showSparkline: boolean; animate: boolean }> =
  ({ employees, showTrend, showDepartment, showSparkline, animate }) => {
  const sorted = [...employees].sort((a, b) => b.docs - a.docs);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#3B4FA8]/15 backdrop-blur-md">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#3B4FA8]/20 bg-[#3B4FA8]/5">
            <th className="px-4 py-3 text-left text-xs font-bold text-[#3B4FA8]/70 uppercase tracking-wider">#</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-[#3B4FA8]/70 uppercase tracking-wider">Сотрудник</th>
            {showDepartment && <th className="px-4 py-3 text-left text-xs font-bold text-[#3B4FA8]/70 uppercase tracking-wider">Отдел</th>}
            {showSparkline && <th className="px-4 py-3 text-center text-xs font-bold text-[#3B4FA8]/70 uppercase tracking-wider">Динамика</th>}
            <th className="px-4 py-3 text-right text-xs font-bold text-[#3B4FA8]/70 uppercase tracking-wider">Документы</th>
            {showTrend && <th className="px-4 py-3 text-center text-xs font-bold text-[#3B4FA8]/70 uppercase tracking-wider">Тренд</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((emp, idx) => {
            const rank = idx + 1;
            return (
              <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                style={{ animation: `stepAppear 0.3s ease-out ${idx * 0.05}s both` }}>
                <td className="px-4 py-3">
                  {rank <= 3 ? (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center shadow-lg`}>
                      {rank === 1 ? <Trophy className="w-3.5 h-3.5 text-[#222B5C]" /> :
                       rank === 2 ? <Medal className="w-3.5 h-3.5 text-[#222B5C]" /> :
                       <Award className="w-3.5 h-3.5 text-[#222B5C]" />}
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-white/20 ml-1.5">{rank}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} rank={rank} src={emp.avatar} />
                    <div>
                      <p className="text-sm font-bold text-white">{emp.name}</p>
                      <p className="text-xs text-white/40">{emp.position}</p>
                    </div>
                  </div>
                </td>
                {showDepartment && <td className="px-4 py-3 text-xs text-white/60">{emp.department || '—'}</td>}
                {showSparkline && (
                  <td className="px-4 py-3 text-center">
                    {emp.sparkline ? <Sparkline data={emp.sparkline} /> : '—'}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <AnimatedNumber value={emp.docs} animate={animate} className="text-sm font-bold text-[#3B4FA8]" />
                  <span className="text-xs text-[#3B4FA8]/50 ml-1">док.</span>
                </td>
                {showTrend && <td className="px-4 py-3 text-center"><TrendBadge value={emp.trend} /></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── CARDS VARIANT ───────────────────────────────────────────────
const CardsView: React.FC<{ employees: LeaderboardEmployee[]; showTrend: boolean; showSparkline: boolean; maxItems: number; animate: boolean }> =
  ({ employees, showTrend, showSparkline, maxItems, animate }) => {
  const sorted = [...employees].sort((a, b) => b.docs - a.docs).slice(0, maxItems);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {sorted.map((emp, idx) => {
        const rank = idx + 1;
        return (
          <div key={emp.id} className={`relative rounded-xl backdrop-blur-md border ${getRankBorder(rank)} p-4
            bg-gradient-to-b from-white/[0.07] to-white/[0.02]
            shadow-[0_0_15px_rgba(0,252,21,0.05)] hover:shadow-[0_0_25px_rgba(0,252,21,0.12)] transition-all duration-300`}
            style={{ animation: `stepAppear 0.4s ease-out ${idx * 0.08}s both` }}>
            <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
              {rank}
            </div>
            <div className="flex flex-col items-center">
              <Avatar name={emp.name} rank={rank} src={emp.avatar} />
              <p className="text-sm font-bold text-white mt-3 text-center">{emp.name}</p>
              <p className="text-xs text-white/40 text-center">{emp.position}</p>
              {showSparkline && emp.sparkline && (
                <div className="mt-2">
                  <Sparkline data={emp.sparkline} />
                </div>
              )}
              <div className="mt-3 w-full h-px bg-gradient-to-r from-transparent via-[#3B4FA8]/20 to-transparent" />
              <div className="flex items-center gap-2 mt-3">
                <FileText className="w-4 h-4 text-[#3B4FA8]/70" />
                <AnimatedNumber value={emp.docs} animate={animate} className="text-xl font-bold text-[#3B4FA8]" />
              </div>
              {showTrend && <div className="mt-2"><TrendBadge value={emp.trend} /></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── COMPACT VARIANT ─────────────────────────────────────────────
const CompactView: React.FC<{ employees: LeaderboardEmployee[]; showTrend: boolean; showSparkline: boolean; maxItems: number; animate: boolean }> =
  ({ employees, showTrend, showSparkline, maxItems, animate }) => {
  const sorted = [...employees].sort((a, b) => b.docs - a.docs).slice(0, maxItems);

  return (
    <div className="w-full space-y-1.5">
      {sorted.map((emp, idx) => {
        const rank = idx + 1;
        const widthPercent = (emp.docs / sorted[0].docs) * 100;
        return (
          <div key={emp.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.03] transition-colors"
            style={{ animation: `stepAppear 0.3s ease-out ${idx * 0.05}s both` }}>
            <span className={`text-xs font-bold w-5 ${rank <= 3 ? 'text-[#D4A62A]' : 'text-white/30'}`}>{rank}</span>
            <div className="w-8 h-8 rounded-full bg-[#3B4FA8]/15 border border-[#3B4FA8]/30 flex items-center justify-center text-xs font-bold text-white">
              {getInitials(emp.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-white truncate">{emp.name}</p>
                <AnimatedNumber value={emp.docs} animate={animate} className="text-xs font-bold text-[#3B4FA8] ml-2" />
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${getRankColor(rank)}`}
                  style={{ width: `${widthPercent}%`, transition: 'width 1s ease-out' }} />
              </div>
            </div>
            {showSparkline && emp.sparkline && <Sparkline data={emp.sparkline} />}
            {showTrend && <TrendBadge value={emp.trend} />}
          </div>
        );
      })}
    </div>
  );
};

// ─── EXPORT FUNCTION ─────────────────────────────────────────────
const exportToCSV = (employees: LeaderboardEmployee[]) => {
  const headers = ['Место', 'ФИО', 'Должность', 'Отдел', 'Документы', 'Тренд'];
  const sorted = [...employees].sort((a, b) => b.docs - a.docs);
  const rows = sorted.map((emp, idx) => [
    idx + 1, emp.name, emp.position, emp.department || '', emp.docs, emp.trend || 0
  ]);
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'leaderboard.csv';
  link.click();
};

// ─── PAGINATION COMPONENT ────────────────────────────────────────
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
            page === currentPage
              ? 'bg-gradient-to-r from-[#3B4FA8] to-[#8D79C7] text-white shadow-[0_0_10px_rgba(59,79,168,0.3)]'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────
const Leaderboard: React.FC<LeaderboardProps> = ({
  employees,
  variant = 'ladder',
  title = 'LEADERBOARD',
  subtitle = 'ТОП СОТРУДНИКОВ ПО ДОКУМЕНТООБОРОТУ',
  maxItems = 10,
  showTrend = true,
  showDepartment = false,
  showSparkline = false,
  className = '',
  loading = false,
  enableExport = false,
  enableFilter = false,
  enableSearch = false,
  enablePeriod = false,
  enablePagination = false,
  enableConfetti = false,
  animateCounter = true,
  theme: _theme = 'auto',
  pageSize = 10,
}) => {
  const [filterDept, setFilterDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<Period>('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevLeaderRef = useRef<number | null>(null);

  // Detect theme (unused for now, reserved for future theming)
  // const isDark = theme === 'dark' || (theme === 'auto' && typeof window !== 'undefined'
  //   ? document.documentElement.getAttribute('data-theme') === 'dark' ||
  //     document.documentElement.classList.contains('dark')
  //   : true);

  // Filter logic
  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (enableFilter && filterDept !== 'all') {
      result = result.filter(e => e.department === filterDept);
    }
    if (enableSearch && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        (e.department?.toLowerCase().includes(q) ?? false)
      );
    }
    return result.sort((a, b) => b.docs - a.docs);
  }, [employees, filterDept, searchQuery, enableFilter, enableSearch]);

  // Pagination
  const totalPages = enablePagination ? Math.ceil(filteredEmployees.length / pageSize) : 1;
  const paginatedEmployees = enablePagination
    ? filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredEmployees;

  // Confetti on leader change
  useEffect(() => {
    if (!enableConfetti || paginatedEmployees.length === 0) return;
    const currentLeader = paginatedEmployees[0].id;
    if (prevLeaderRef.current !== null && prevLeaderRef.current !== currentLeader) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
    prevLeaderRef.current = currentLeader;
  }, [paginatedEmployees, enableConfetti]);

  const departments = useMemo(() =>
    [...new Set(employees.map(e => e.department).filter(Boolean))],
    [employees]
  );

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV(filteredEmployees);
      setIsExporting(false);
    }, 500);
  };

  const renderSkeleton = () => {
    switch (variant) {
      case 'ladder': return <SkeletonLadder />;
      case 'podium': return <SkeletonLadder />;
      case 'table': return <SkeletonTable />;
      case 'cards': return <SkeletonCards />;
      case 'compact': return <SkeletonTable />;
      default: return <SkeletonLadder />;
    }
  };

  const renderContent = () => {
    if (loading) return renderSkeleton();
    const props = { employees: paginatedEmployees, showTrend, showSparkline, animate: animateCounter };
    switch (variant) {
      case 'ladder': return <LadderView {...props} />;
      case 'podium': return <PodiumView {...props} />;
      case 'table': return <TableView {...props} showDepartment={showDepartment} />;
      case 'cards': return <CardsView {...props} maxItems={maxItems} />;
      case 'compact': return <CompactView {...props} maxItems={maxItems} />;
      default: return <LadderView {...props} />;
    }
  };

  return (
    <div className={`w-full relative overflow-hidden ${className}`}>
      <Confetti active={showConfetti} />

      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `linear-gradient(rgba(59,79,168,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,79,168,0.5) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }} />
      </div>

      {/* Title & Controls */}
      <div className="relative z-10 text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#3B4FA8] via-[#8D79C7] to-[#D4A62A] bg-clip-text text-transparent"
          style={{ filter: 'drop-shadow(0 0 8px rgba(59,79,168,0.4))' }}>
          {title}
        </h2>
        <p className="text-xs text-[#3B4FA8]/60 mt-2 tracking-[0.25em] uppercase">{subtitle}</p>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {/* Search */}
          {enableSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3B4FA8]/50" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-8 py-2 rounded-lg bg-white/5 border border-[#3B4FA8]/20 text-xs text-white
                  placeholder:text-white/30 focus:outline-none focus:border-[#3B4FA8]/50 w-48
                  hover:bg-white/[0.08] transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-white/40 hover:text-white/80" />
                </button>
              )}
            </div>
          )}

          {/* Period */}
          {enablePeriod && (
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3B4FA8]/50" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-white/5 border border-[#3B4FA8]/20 text-xs text-white
                  focus:outline-none focus:border-[#3B4FA8]/50 cursor-pointer hover:bg-white/[0.08] transition-colors"
              >
                {(Object.keys(periodLabels) as Period[]).map(p => (
                  <option key={p} value={p} className="bg-[#0a0f1a]">{periodLabels[p]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#3B4FA8]/50 pointer-events-none" />
            </div>
          )}

          {/* Filter */}
          {enableFilter && departments.length > 0 && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#3B4FA8]/50" />
              <select
                value={filterDept}
                onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-9 pr-8 py-2 rounded-lg bg-white/5 border border-[#3B4FA8]/20 text-xs text-white
                  focus:outline-none focus:border-[#3B4FA8]/50 cursor-pointer hover:bg-white/[0.08] transition-colors"
              >
                <option value="all" className="bg-[#0a0f1a]">Все отделы</option>
                {departments.map(dept => (
                  <option key={dept} value={dept} className="bg-[#0a0f1a]">{dept}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#3B4FA8]/50 pointer-events-none" />
            </div>
          )}

          {/* Export */}
          {enableExport && (
            <Tooltip text="Скачать CSV">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-[#3B4FA8]/20
                  text-xs text-[#3B4FA8] hover:bg-[#3B4FA8]/10 hover:border-[#3B4FA8]/30
                  transition-all duration-300 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                CSV
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {renderContent()}
      </div>

      {/* Pagination */}
      {enablePagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Results count */}
      {(enableSearch || enableFilter) && (
        <div className="relative z-10 text-center mt-3">
          <span className="text-xs text-white/30">
            Показано {paginatedEmployees.length} из {filteredEmployees.length}
          </span>
        </div>
      )}

      {/* Branding */}
      <div className="relative z-10 text-center mt-6">
        <span className="text-xs text-[#3B4FA8]/30 tracking-[0.3em]">IRIS • DOKPOTOK</span>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes stepAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
