import { useEffect, useState } from 'react';
import { ArrowDown, Trophy, Medal, Award } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { getLeaderboard } from '@/features/gamification/api/gamification';
import type { LeaderboardEntry } from '@/types';

export interface LeaderboardWidgetProps {
  isDark?: boolean;
}

interface LeaderRow {
  id: number;
  name: string;
  subtitle: string;
  score: number;
}

type SortField = 'score' | 'name';
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

export function LeaderboardWidget({ isDark = false }: LeaderboardWidgetProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [entries, setEntries] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const dark = isDark || theme === 'dark' || theme === 'midnight' || theme === 'contrast';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getLeaderboard()
      .then((data: LeaderboardEntry[]) => {
        if (cancelled) return;
        setEntries(
          data.map((e) => ({
            id: e.user_id,
            name: e.full_name || e.username,
            subtitle: e.level_title || `Уровень ${e.level}`,
            score: e.score,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = [...entries].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'score':
        comparison = a.score - b.score;
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
    score: 'по баллам',
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
          onClick={() => toggleSort('score')}
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

      {loading ? (
        <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
          Загрузка лидерборда…
        </p>
      ) : !leader ? (
        <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
          Пока нет данных лидерборда
        </p>
      ) : (
        <>
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
                  {leader.subtitle}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-sm font-bold" style={{ color: '#D4A62A' }}>
                    {leader.score.toLocaleString()} баллов
                  </span>
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
                      {emp.subtitle}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {emp.score.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>баллов</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
