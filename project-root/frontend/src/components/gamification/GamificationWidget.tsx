import { useEffect } from 'react';
import { Card } from '@/components/ui';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getLevelInfo, getLevelProgress } from '@/lib/levelSystem';
import { Coins, Zap, Award } from 'lucide-react';

export function GamificationWidget() {
  const { xp, coins, badges, quests, fetchAll } = useGamificationStore();
  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);
  const levelNum = useGamificationStore(s => s.level);
  const level = getLevelInfo(levelNum);
  const progress = getLevelProgress(xp, levelNum);
  const earnedBadges = badges.filter(b => b.earnedAt);
  const activeQuests = quests.filter(q => !q.claimed && !q.completed);

  return (
    <Card padding="md" className="space-y-3">
      {/* Level & XP */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{
            backgroundColor: `${level.tierColor}20`,
            color: level.tierColor,
            border: `2px solid ${level.tierColor}`,
          }}
        >
          {levelNum}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{level.title}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: level.tierColor }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-around text-xs">
        <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <Coins size={12} style={{ color: '#F59E0B' }} />
          <span>{coins}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          <Award size={12} style={{ color: '#D4AF37' }} />
          <span>{earnedBadges.length}</span>
        </div>
      </div>

      {/* Active Quests */}
      {activeQuests.length > 0 && (
        <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            <Zap size={12} style={{ color: 'var(--brand-iris)' }} /> Квесты
          </div>
          {activeQuests.slice(0, 2).map(quest => (
            <div key={quest.id} className="text-xs">
              <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                <span className="truncate">{quest.title}</span>
                <span>{quest.current}/{quest.target}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(quest.current / quest.target) * 100}%`, backgroundColor: 'var(--brand-iris)' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last badge */}
      {earnedBadges.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <Award size={12} style={{ color: '#D4AF37' }} />
          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            Последний: {earnedBadges[earnedBadges.length - 1]?.name}
          </span>
        </div>
      )}
    </Card>
  );
}
