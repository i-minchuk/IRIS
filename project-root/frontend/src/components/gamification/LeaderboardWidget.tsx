import { useGamificationStore } from '@/stores/gamificationStore';
import {
  Trophy, Medal, Award, Star, Flame, Zap, Crown,
  Target, BookOpen, Handshake, FileCheck, Users, Sparkles,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RARITY_COLORS = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#D4AF37',
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  file: <FileCheck size={12} />,
  check: <Target size={12} />,
  folder: <Award size={12} />,
  handshake: <Handshake size={12} />,
  book: <BookOpen size={12} />,
  users: <Users size={12} />,
  flame: <Flame size={12} />,
  crown: <Crown size={12} />,
  star: <Star size={12} />,
};

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'rgba(212,175,55,0.15)', border: '#D4AF37', icon: <Trophy size={14} /> };
  if (rank === 2) return { bg: 'rgba(192,192,192,0.15)', border: '#C0C0C0', icon: <Medal size={14} /> };
  if (rank === 3) return { bg: 'rgba(205,127,50,0.15)', border: '#CD7F32', icon: <Award size={14} /> };
  return { bg: 'var(--bg-surface-2)', border: 'var(--border-default)', icon: <span className="text-xs font-medium">{rank}</span> };
}

export function LeaderboardWidget() {
  const navigate = useNavigate();
  const entries = useGamificationStore(s => s.getLeaderboard('global_xp'));
  const badges = useGamificationStore(s => s.badges);
  const earnedBadges = badges.filter(b => b.earnedAt);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3, 6);

  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}>
            <Trophy size={14} style={{ color: '#D4AF37' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Лидерборд</h3>
        </div>
        <button
          onClick={() => navigate('/team')}
          className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          Все <ChevronRight size={10} />
        </button>
      </div>

      {/* Podium — Top 3 */}
      <div className="flex items-end justify-center gap-2 mb-3">
        {top3.map((_entry, idx) => {
          const heights = ['h-16', 'h-20', 'h-14'];
          const order = [1, 0, 2]; // 2nd, 1st, 3rd
          const actualIdx = order[idx];
          const e = top3[actualIdx];
          if (!e) return null;
          const style = getRankStyle(e.rank);

          return (
            <div key={e.userId} className="flex flex-col items-center flex-1">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                style={{
                  background: style.bg,
                  color: style.border,
                  border: `2px solid ${style.border}`,
                }}
              >
                {e.userName.charAt(0)}
              </div>
              {/* Bar */}
              <div
                className={`w-full ${heights[idx]} rounded-t-lg flex flex-col items-center justify-end pb-1`}
                style={{
                  background: `linear-gradient(180deg, ${style.border}30 0%, ${style.border}10 100%)`,
                  borderTop: `2px solid ${style.border}`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: style.border }}>{e.rank}</span>
              </div>
              <div className="text-xs font-medium mt-1 truncate w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {e.userName.split(' ')[0]}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.xp.toLocaleString()} XP</div>
            </div>
          );
        })}
      </div>

      {/* Rest of top */}
      <div className="flex flex-col gap-1.5 mb-3">
        {rest.map(entry => {
          const style = getRankStyle(entry.rank);
          return (
            <div
              key={entry.userId}
              className="flex items-center gap-2 p-1.5 rounded-lg transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-5 flex justify-center">{style.icon}</div>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: style.bg, color: style.border }}
              >
                {entry.userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{entry.userName}</div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-0.5">
                  <Star size={10} style={{ color: '#D4AF37' }} /> {entry.xp.toLocaleString()}
                </span>
                <span className="flex items-center gap-0.5">
                  <Flame size={10} style={{ color: '#EF4444' }} /> {entry.streak}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Best Practices / Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} style={{ color: '#D4AF37' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Лучшие практики</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {earnedBadges.slice(0, 5).map(badge => {
              const color = RARITY_COLORS[badge.rarity];
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: `${color}15`,
                    color: color,
                    border: `1px solid ${color}30`,
                  }}
                  title={badge.description}
                >
                  {BADGE_ICONS[badge.icon] || <Zap size={10} />}
                  <span>{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
