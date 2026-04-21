import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';

import { getMyGamification, getBadges } from '../api/gamification';
import type { GamificationProfile, Badge } from '../types';
import { Star, Award, Target } from 'lucide-react';
import { Card } from '../components/ui';

const MOCK_PROFILE: GamificationProfile = {
  user_id: 1,
  username: 'admin',
  full_name: 'Администратор',
  score: 320,
  level: 3,
  level_title: 'Профессионал',
  badges: ['reliable', 'speedster'],
  next_level_at: 500,
};

const MOCK_BADGES: Badge[] = [
  { id: 'reliable', name: 'Надёжный', desc: 'SPI >= 1.0 на протяжении 5 задач подряд' },
  { id: 'speedster', name: 'Скоростной', desc: '3 задачи закрыты раньше срока' },
  { id: 'quality', name: 'Качественный', desc: '0 возвратов на доработку за 10 ревизий' },
  { id: 'teamplayer', name: 'Командный', desc: 'Участие в 3+ проектах одновременно' },
  { id: 'marathon', name: 'Марафонец', desc: '50+ закрытых задач' },
];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [badges, setBadges] = useState(MOCK_BADGES);

  useEffect(() => {
    getMyGamification().then(setProfile).catch(() => {});
    getBadges().then(setBadges).catch(() => {});
  }, []);

  const xpPercent = profile.next_level_at ? Math.min((profile.score / profile.next_level_at) * 100, 100) : 100;
  const initial = (user?.full_name || user?.email || 'U')[0]?.toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Мой кабинет
        </h1>
      </section>

      <Card className="p-0 overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
              color: 'var(--text-inverse)',
            }}
          >
            {initial}
          </div>

          <div>
            <h2 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {user?.full_name || profile.full_name}
            </h2>

            <p className="mt-1 text-lg" style={{ color: 'var(--text-secondary)' }}>
              {user?.email || 'admin@stdo.local'}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
              <span className="inline-flex items-center gap-2" style={{ color: 'var(--accent-approvals)' }}>
                <Star size={16} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  Уровень {profile.level}: {profile.level_title}
                </span>
              </span>

              <span className="inline-flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Target size={16} />
                <span>{profile.score} очков</span>
              </span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              SPI
            </div>
            <div
              className="mt-2 inline-flex rounded-md px-3 py-1 text-lg font-bold"
              style={{
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
              }}
            >
              0.95
            </div>
          </div>
        </div>

        <div
          className="border-t px-6 py-5"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div className="mb-3 flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Прогресс до следующего уровня</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {profile.score} / {profile.next_level_at || '∞'}
            </span>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--bg-surface-2)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${xpPercent}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--accent-leaders))',
              }}
            />
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Award size={20} style={{ color: 'var(--accent-approvals)' }} />
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Бейджи
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {badges.map((b) => {
            const earned = profile.badges.includes(b.id);

            return (
              <Card
                key={b.id}
                className="p-5"
                style={{
                  backgroundColor: earned ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                  opacity: earned ? 1 : 0.92,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: earned ? 'var(--accent-approvals-light)' : 'var(--bg-hover)',
                      color: earned ? 'var(--accent-approvals)' : 'var(--text-tertiary)',
                    }}
                  >
                    <Award size={18} />
                  </div>

                  <div>
                    <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {b.name}
                    </div>
                    <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}