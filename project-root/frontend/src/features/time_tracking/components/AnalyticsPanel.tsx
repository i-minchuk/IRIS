import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, Zap, BarChart3 } from 'lucide-react';
import { getEmployeeAnalytics, type EmployeeAnalytics } from '../api/sessions';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'sonner';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}ч ${m}мин`;
  return `${m}мин`;
}

export default function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;
    loadAnalytics(user.id);
  }, [user?.id]);

  const loadAnalytics = async (userId: number) => {
    setIsLoading(true);
    try {
      const data = await getEmployeeAnalytics(userId);
      setAnalytics(data);
    } catch {
      toast.error('Не удалось загрузить аналитику');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--iris-bg-elevated)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-[var(--iris-text-muted)]">
        <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
        <p>Аналитика недоступна</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Всего сессий',
      value: analytics.total_sessions.toString(),
      icon: <Clock size={20} />,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      label: 'Активное время',
      value: formatDuration(analytics.total_active_time),
      icon: <Zap size={20} />,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Средняя эффективность',
      value: `${Math.round(analytics.avg_efficiency)}%`,
      icon: <Target size={20} />,
      color: analytics.avg_efficiency >= 80 ? '#10B981' : analytics.avg_efficiency >= 50 ? '#F59E0B' : '#EF4444',
      bg: analytics.avg_efficiency >= 80 ? 'rgba(16, 185, 129, 0.1)' : analytics.avg_efficiency >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    },
    {
      label: 'Среднее время за сессию',
      value: analytics.total_sessions > 0
        ? formatDuration(Math.round(analytics.total_active_time / analytics.total_sessions))
        : '—',
      icon: <TrendingUp size={20} />,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--iris-text-primary)]">Аналитика</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-xl border border-[var(--iris-border)] bg-[var(--iris-bg-card)] hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                {card.icon}
              </div>
              <span className="text-sm text-[var(--iris-text-muted)]">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-[var(--iris-text-primary)]">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
