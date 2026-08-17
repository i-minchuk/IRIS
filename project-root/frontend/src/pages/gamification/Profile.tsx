import { useEffect } from 'react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { useGamificationStore } from '@/stores/gamificationStore';
import { getLevelInfo } from '@/lib/levelSystem';
import { formatXP } from '@/lib/xpEngine';
import {
  Star, Coins, Trophy, Award, Zap, TrendingUp,
  FileText, CheckCircle2, BookOpen, Users, Crown
} from 'lucide-react';

const RARITY_COLORS = {
  common: '#6B7280',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#D4AF37',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  workflow: <FileText size={14} />,
  projects: <TrendingUp size={14} />,
  srm: <CheckCircle2 size={14} />,
  learning: <BookOpen size={14} />,
  activity: <Zap size={14} />,
  social: <Users size={14} />,
  special: <Crown size={14} />,
};

export default function GamificationProfilePage() {
  const { xp, coins, badges, quests, getCurrentLevel, getLevelProgress, fetchAll } = useGamificationStore();
  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);
  const level = getCurrentLevel();
  const progress = getLevelProgress();
  const levelInfo = getLevelInfo(level);

  const earnedBadges = badges.filter(b => b.earnedAt);
  const activeQuests = quests.filter(q => !q.claimed);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: `${levelInfo.tierColor}20`,
            color: levelInfo.tierColor,
            border: `3px solid ${levelInfo.tierColor}`,
          }}
        >
          {level}
        </div>
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
            Достижения
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="leaders" leftIcon={<Crown size={12} />}>
              {levelInfo.title}
            </Badge>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Уровень {level}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${levelInfo.tierColor}18` }}>
            <Star size={18} style={{ color: levelInfo.tierColor }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatXP(xp)}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>XP</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, #F59E0B 10%, var(--bg-surface))' }}>
            <Coins size={18} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{coins}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Монет</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, #D4AF37 10%, var(--bg-surface))' }}>
            <Trophy size={18} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{earnedBadges.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Бейджей</div>
          </div>
        </Card>
      </div>

      {/* XP Progress */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Прогресс до уровня {level + 1}</span>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{progress}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: levelInfo.tierColor }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Уровень {level}</span>
          <span>Уровень {level + 1}</span>
        </div>
      </Card>

      {/* Active Quests */}
      <Card padding="md">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap size={16} style={{ color: 'var(--brand-iris)' }} /> Активные квесты
        </h3>
        <div className="space-y-3">
          {activeQuests.map(quest => (
            <div key={quest.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{quest.title}</span>
                <Badge variant={quest.type === 'daily' ? 'info' : 'warning'}>
                  {quest.type === 'daily' ? 'Ежедневный' : 'Еженедельный'}
                </Badge>
              </div>
              <p className="text-base md:text-lg font-medium leading-relaxed mt-1 mb-2" style={{ color: 'var(--text-secondary)' }}>{quest.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>{quest.current} / {quest.target}</span>
                  <span>{Math.round((quest.current / quest.target) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(quest.current / quest.target) * 100}%`,
                      backgroundColor: quest.completed ? 'var(--success)' : 'var(--brand-iris)',
                    }}
                  />
                </div>
              </div>
              {quest.completed && !quest.claimed && (
                <Button size="sm" className="mt-2" onClick={() => useGamificationStore.getState().claimQuestReward(quest.id)}>
                  Получить награду: {quest.xpReward} XP + {quest.coinReward} 🪙
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Award size={16} style={{ color: '#D4AF37' }} /> Полученные бейджи
          </h3>
          <div className="space-y-2">
            {earnedBadges.map(badge => (
              <div key={badge.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${RARITY_COLORS[badge.rarity]}18` }}
                >
                  {CATEGORY_ICONS[badge.category]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{badge.name}</div>
                  <div className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{badge.description}</div>
                </div>
                <Badge variant="info">
                  Получен
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Бонусы уровня</h3>
          <div className="space-y-2">
            {levelInfo.perks.map((perk, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Star size={14} style={{ color: levelInfo.tierColor }} />
                {perk}
              </div>
            ))}
            {levelInfo.perks.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Бонусы начинаются с 5 уровня</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
