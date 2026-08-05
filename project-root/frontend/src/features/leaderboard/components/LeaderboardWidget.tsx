import { useState } from 'react';
import { ArrowDown, Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export interface LeaderboardWidgetProps {
  isDark?: boolean;
}

// ─── Моковые данные для Dashboard ───────────────────────────────
const employees = [
  { id: 1, name: 'Иванов А.П.', position: 'Гл. инженер', department: 'ПТО', docs: 847, trend: 12 },
  { id: 2, name: 'Петрова М.С.', position: 'Вед. специалист', department: 'ПТО', docs: 723, trend: 5 },
  { id: 3, name: 'Сидоров К.В.', position: 'Инженер ПТО', department: 'ПТО', docs: 691, trend: -3 },
  { id: 4, name: 'Кузнецова Е.А.', position: 'Специалист', department: 'ОВиК', docs: 534, trend: 8 },
  { id: 5, name: 'Морозов Д.И.', position: 'Мастер участка', department: 'АСУТП', docs: 412, trend: 2 },
];

type SortField = 'docs' | 'trend' | 'name';
type SortOrder = 'asc' | 'desc';

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const rankColor = (rank: number) => {
  switch (rank) {
    case 1: return '#D4A62A';
    case 2: return '#8D79C7';
    case 3: return '#C0392B';
    default: return '#3B4FA8';
  }
};

const TrendBadge = ({ value }: { value?: number }) => {
  if (value === undefined) return <Minus className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      <Icon className="w-3 h-3" />
      {isPositive ? `+${value}` : value}
    </span>
  );
};

export function LeaderboardWidget({ isDark = false }: LeaderboardWidgetProps) {
  const [sortField, setSortField] = useState<SortField>('docs');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { theme } = useTheme();
  const dark = isDark || theme === 'dark' || theme === 'midnight' || theme === 'contrast';

  const sorted = [...employees].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'docs':
        comparison = a.docs - b.docs;
        break;
      case 'trend':
        comparison = (a.trend || 0) - (b.trend || 0);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortLabels: Record<SortField, string> = {
    docs: 'по документам',
    trend: 'по тренду',
    name: 'по имени',
  };

  const leader = sorted[0];

  return (
    <div className="w-full">
      {/* Заголовок + сортировка */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: 'rgba(212, 166, 42, 0.12)' }}>
            <Trophy size={16} style={{ color: '#D4A62A' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Лидерборд
          </h3>
        </div>
        <button
          onClick={() => toggleSort('docs')}
          className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          Сортировка: {sortLabels[sortField]}
          <ArrowDown
            size={12}
            className={`transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Лидер — 1-е место, крупно и явно */}
      <div
        className="relative p-4 rounded-xl mb-3 border"
        style={{
          background: dark ? 'rgba(212, 166, 42, 0.10)' : 'rgba(212, 166, 42, 0.08)',
          borderColor: 'rgba(212, 166, 42, 0.30)',
        }}
      >
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A62A] to-[#B8941F] flex items-center justify-center shadow-md">
          <Trophy className="w-4 h-4 text-[#222B5C]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4A62A] to-[#B8941F] flex items-center justify-center text-lg font-bold text-white shadow-md shrink-0">
            {getInitials(leader.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {leader.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {leader.position} • {leader.department}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-sm font-bold" style={{ color: '#D4A62A' }}>
                {leader.docs.toLocaleString()} док.
              </span>
              <TrendBadge value={leader.trend} />
            </div>
          </div>
        </div>
      </div>

      {/* Места 2–5 */}
      <div className="flex flex-col gap-2">
        {sorted.slice(1, 5).map((emp, idx) => {
          const rank = idx + 2;
          const color = rankColor(rank);
          const RankIcon = rank === 2 ? Medal : rank === 3 ? Award : null;
          return (
            <div
              key={emp.id}
              className="flex items-center gap-3 p-2 rounded-lg border transition-colors"
              style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: color }}
              >
                {RankIcon ? <RankIcon className="w-3.5 h-3.5" /> : rank}
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'rgba(59, 79, 168, 0.12)', color: '#3B4FA8' }}
              >
                {getInitials(emp.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {emp.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {emp.position}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {emp.docs.toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>док.</p>
              </div>
              <div className="shrink-0">
                <TrendBadge value={emp.trend} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
