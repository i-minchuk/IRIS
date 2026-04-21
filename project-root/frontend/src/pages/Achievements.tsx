import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';

import {
  getMyGamification,
  getBadges,
  getDailyQuests,
  updateQuestProgress,
} from '../api/gamification';
import type {
  GamificationProfile,
  Badge as BadgeType,
  DailyQuest,
} from '../types';
import {
  Award,
  Star,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Trophy,
  Zap,
  Info,
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

interface BadgeProgress {
  badge: BadgeType;
  progress: number; // 0–100
  current: number;
  target: number;
  isCompleted: boolean;
}

export default function Achievements() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [loadingQuest, setLoadingQuest] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setInitialLoading(true)
    setError(null)
    try {
      const [profileData, badgesData, questsData] = await Promise.all([
        getMyGamification(),
        getBadges(),
        getDailyQuests(),
      ])
      setProfile(profileData)
      setAllBadges(badgesData)
      setDailyQuests(questsData)
      calculateProgress(profileData, badgesData)
    } catch (err) {
      console.error('Failed to load achievements', err)
      setError('Не удалось загрузить данные геймификации.')
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleQuestProgress = async (questType: string) => {
    if (loadingQuest) return;
    setLoadingQuest(true);
    setError(null);

    try {
      const updatedQuest = await updateQuestProgress(questType);

      setDailyQuests(prev =>
        prev.map(q => (q.quest_type === questType ? updatedQuest : q)),
      );

      const profileData = await getMyGamification();
      setProfile(profileData);
      calculateProgress(profileData, allBadges);
    } catch (err) {
      console.error('Failed to update quest progress', err);
      setError('Не удалось обновить прогресс по квесту.');
    } finally {
      setLoadingQuest(false);
    }
  };

  const calculateProgress = (
    profileData: GamificationProfile,
    badgesData: BadgeType[],
  ) => {
    // Упрощённая логика на основе score + наличия бейджа.
    // Когда появятся реальные метрики с бэка, сюда можно подставить другие поля.
    const progress: BadgeProgress[] = badgesData.map(badge => {
      let current = 0;
      let target = 1;
      const hasBadge = profileData.badges.includes(badge.id);

      switch (badge.id) {
        case 'first_project':
          current = profileData.score >= 50 ? 1 : 0;
          target = 1;
          break;
        case 'reliable':
          current = Math.min(5, Math.floor(profileData.score / 20));
          target = 5;
          break;
        case 'speedster':
          current = Math.min(3, Math.floor(profileData.score / 30));
          target = 3;
          break;
        case 'quality':
          current = Math.min(10, Math.floor(profileData.score / 15));
          target = 10;
          break;
        case 'marathon':
          current = Math.min(50, Math.floor(profileData.score / 2));
          target = 50;
          break;
        default:
          current = hasBadge ? 1 : 0;
          target = 1;
      }

      const isCompleted = hasBadge || current >= target;
      const progressPct = Math.min(100, (current / target) * 100 || 0);

      return {
        badge,
        progress: progressPct,
        current,
        target,
        isCompleted,
      };
    });

    setBadgeProgress(progress);
  };

  if (initialLoading) {
    return (
      <div className="max-w-6xl">
        <Card className="p-8 text-center text-gray-500">
          Загрузка достижений...
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl">
        <Card className="p-8 text-center text-gray-500 space-y-3">
          <Info className="mx-auto text-gray-400" size={32} />
          <p>Не удалось загрузить профиль геймификации.</p>
          <Button size="sm" variant="outline" onClick={loadData}>
            Повторить попытку
          </Button>
        </Card>
      </div>
    );
  }

  const completedBadges = badgeProgress.filter(bp => bp.isCompleted);
  const inProgressBadges = badgeProgress.filter(
    bp => !bp.isCompleted && bp.progress > 0,
  );
  const lockedBadges = badgeProgress.filter(
    bp => !bp.isCompleted && bp.progress === 0,
  );

  return (
    <div className="max-w-6xl space-y-8">
      {/* Заголовок и статус */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Достижения
        </h1>
        <p className="text-gray-600">
          Личный прогресс, бейджи и ежедневные задания. Механика пока
          упрощена и будет постепенно дорабатываться.
        </p>
        {user && (
          <p className="text-sm text-gray-500">
            Пользователь:{' '}
            <span className="font-medium">{user.full_name}</span>{' '}
            (<span className="font-mono">{user.username}</span>)
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Star}
          label="Уровень"
          value={profile.level}
          color="yellow"
          desc={profile.level_title}
        />
        <StatCard
          icon={Target}
          label="Очки"
          value={profile.score}
          color="blue"
          desc="общий счёт за активность"
        />
        <StatCard
          icon={Award}
          label="Бейджи"
          value={completedBadges.length}
          color="green"
          desc="получено достижений"
        />
        <StatCard
          icon={TrendingUp}
          label="До следующего уровня"
          value={
            profile.next_level_at
              ? Math.max(0, profile.next_level_at - profile.score)
              : '—'
          }
          color="purple"
          desc="оставшиеся очки"
        />
      </div>

      {/* Daily quests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Ежедневные задания
            </h2>
          </div>
          <Button size="sm" variant="outline" onClick={loadData}>
            Обновить
          </Button>
        </div>

        {dailyQuests.length === 0 ? (
          <Card className="p-6 text-sm text-gray-500 flex items-center gap-2">
            <Info size={18} className="text-gray-400" />
            На сегодня нет активных заданий.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyQuests.map(quest => {
              const progressPct = Math.min(
                100,
                (quest.current_count / quest.target_count) * 100 || 0,
              );
              return (
                <Card
                  key={quest.id}
                  className={`p-6 border ${
                    quest.is_completed ? 'border-green-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {quest.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {quest.description}
                      </p>
                    </div>
                    <div className="ml-3">
                      {quest.is_completed ? (
                        <CheckCircle
                          className="text-green-600"
                          size={24}
                        />
                      ) : (
                        <Clock className="text-blue-500" size={24} />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Прогресс</span>
                      <span className="font-medium text-gray-800">
                        {quest.current_count}/{quest.target_count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-gray-700">
                        <Star
                          className="text-yellow-500"
                          size={14}
                        />
                        {quest.reward_points} pts
                      </span>
                      <span className="flex items-center gap-1 text-gray-700">
                        <Zap
                          className="text-purple-500"
                          size={14}
                        />
                        {quest.reward_xp} XP
                      </span>
                    </div>
                    {!quest.is_completed && (
                      <Button
                        className="w-full mt-1"
                        size="sm"
                        disabled={loadingQuest}
                        onClick={() =>
                          handleQuestProgress(quest.quest_type)
                        }
                      >
                        {loadingQuest ? 'Обновление...' : 'Выполнить шаг'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed badges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">
            Полученные бейджи ({completedBadges.length})
          </h2>
        </div>
        {completedBadges.length === 0 ? (
          <Card className="p-6 text-sm text-gray-500">
            Пока нет полученных бейджей — выполняйте задачи и ежедневные
            задания, чтобы начать их открывать.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedBadges.map(({ badge }) => (
              <Card
                key={badge.id}
                className="p-6 border-2 border-green-200 flex items-center gap-4"
              >
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="text-green-600" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {badge.desc}
                  </p>
                  <Badge className="mt-2 bg-green-100 text-green-700 border-none">
                    Получен
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* In progress badges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">
            В процессе ({inProgressBadges.length})
          </h2>
        </div>
        {inProgressBadges.length === 0 ? (
          <Card className="p-6 text-sm text-gray-500">
            Сейчас нет бейджей с частичным прогрессом.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressBadges.map(
              ({ badge, progress, current, target }) => (
                <Card key={badge.id} className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Award className="text-blue-600" size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {badge.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Прогресс</span>
                      <span className="font-medium text-gray-800">
                        {current}/{target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ),
            )}
          </div>
        )}
      </section>

      {/* Locked badges */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="text-gray-400" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">
            Заблокированные ({lockedBadges.length})
          </h2>
        </div>
        {lockedBadges.length === 0 ? (
          <Card className="p-6 text-sm text-gray-500">
            Все текущие бейджи либо получены, либо уже в прогрессе.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedBadges.map(({ badge }) => (
              <Card
                key={badge.id}
                className="p-6 bg-gray-50 text-gray-600 flex items-center gap-4 opacity-80"
              >
                <div className="p-3 bg-gray-200 rounded-lg">
                  <Award className="text-gray-400" size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-700">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {badge.desc}
                  </p>
                  <Badge className="mt-2 bg-gray-200 text-gray-600 border-none">
                    Заблокирован
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ===== Helper component ===== */

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  desc,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'blue' | 'indigo' | 'red' | 'green' | 'yellow' | 'purple';
  desc?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100 shadow-blue-100/40',
    indigo:
      'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-100/40',
    red: 'bg-red-50 text-red-700 border-red-100 shadow-red-100/40',
    green:
      'bg-green-50 text-green-700 border-green-100 shadow-green-100/40',
    yellow:
      'bg-yellow-50 text-yellow-700 border-yellow-100 shadow-yellow-100/40',
    purple:
      'bg-purple-50 text-purple-700 border-purple-100 shadow-purple-100/40',
  };

  return (
    <Card
      className={`border shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${colors[color]}`}
      padding="sm"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black">{value}</span>
          </div>
          {desc && (
            <p className="text-[10px] font-medium opacity-60 mt-1 italic">
              {desc}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/60 shadow-inner">
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
}