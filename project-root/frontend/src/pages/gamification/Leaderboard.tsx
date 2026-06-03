import { Card } from '@/components/ui';
import { useGamificationStore } from '@/stores/gamificationStore';
import { Trophy, Medal, Award, Flame, Star } from 'lucide-react';

export default function LeaderboardPage() {
  const entries = useGamificationStore(s => s.getLeaderboard('global_xp'));

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} style={{ color: '#D4AF37' }} />;
    if (rank === 2) return <Medal size={20} style={{ color: '#C0C0C0' }} />;
    if (rank === 3) return <Award size={20} style={{ color: '#CD7F32' }} />;
    return <span className="text-sm font-medium w-5 text-center" style={{ color: 'var(--text-secondary)' }}>{rank}</span>;
  };

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Лидерборд</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Топ игроков по XP</p>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-4 mb-6">
        {entries.slice(0, 3).map((_entry, idx) => {
          const heights = ['h-24', 'h-32', 'h-20'];
          const colors = ['#C0C0C0', '#D4AF37', '#CD7F32'];
          const positions = [2, 1, 3];
          const actualIdx = [1, 0, 2][idx];
          const e = entries[actualIdx];
          if (!e) return null;

          return (
            <div key={e.userId} className="flex flex-col items-center">
              <div
                className={`w-16 ${heights[idx]} rounded-t-lg flex flex-col items-center justify-end pb-2`}
                style={{ backgroundColor: `${colors[idx]}25`, borderTop: `3px solid ${colors[idx]}` }}
              >
                <span className="text-lg font-bold" style={{ color: colors[idx] }}>{positions[idx]}</span>
              </div>
              <div className="text-xs font-medium mt-2 text-center max-w-[80px] truncate" style={{ color: 'var(--text-primary)' }}>
                {e.userName}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{e.xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <Card padding="md">
        <div className="space-y-2">
          {entries.map(entry => (
            <div
              key={entry.userId}
              className="flex items-center gap-4 p-3 rounded-lg transition-colors"
              style={{ backgroundColor: entry.rank <= 3 ? 'var(--bg-surface-2)' : 'transparent' }}
            >
              <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>

              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: entry.rank === 1 ? '#D4AF3720' : entry.rank === 2 ? '#C0C0C020' : entry.rank === 3 ? '#CD7F3220' : 'var(--bg-surface-2)',
                  color: entry.rank === 1 ? '#D4AF37' : entry.rank === 2 ? '#9CA3AF' : entry.rank === 3 ? '#CD7F32' : 'var(--text-secondary)',
                }}
              >
                {entry.userName.charAt(0)}
              </div>

              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{entry.userName}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Уровень {entry.level}</div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Star size={12} /> {entry.xp.toLocaleString()}
                </span>
                <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Award size={12} /> {entry.badges}
                </span>
                <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Flame size={12} /> {entry.streak}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
