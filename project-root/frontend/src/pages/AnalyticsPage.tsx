import React, { useEffect, useState } from 'react';
import { getEmployeeAnalytics, type EmployeeAnalytics } from '@/api/timeTracking';
import { useAuthStore } from '@/features/auth/store/authStore';
import Card from '@/components/ui/Card';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? 1;

  useEffect(() => {
    if (userId) {
      getEmployeeAnalytics(userId).then(setAnalytics);
    }
  }, [userId]);

  return (
    <div className="space-y-6 bg-[#1E2230] min-h-screen p-6">
      <h2 className="text-2xl font-bold text-neon-blue">Панель аналитики</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#2A3042] neon-purple">
          <div className="text-3xl font-bold text-neon-purple">{analytics?.total_sessions || 0}</div>
          <div className="text-sm text-[#94A3B8]">Сессий</div>
        </Card>
        <Card className="bg-[#2A3042] neon-blue">
          <div className="text-3xl font-bold text-neon-blue">{Math.round((analytics?.total_active_time || 0) / 3600)}ч</div>
          <div className="text-sm text-[#94A3B8]">Активного времени</div>
        </Card>
        <Card className="bg-[#2A3042] neon-green">
          <div className="text-3xl font-bold text-neon-green">{Math.round((analytics?.avg_efficiency || 0) * 100)}%</div>
          <div className="text-sm text-[#94A3B8]">Средняя эффективность</div>
        </Card>
        <Card className="bg-[#2A3042] neon-yellow">
          <div className="text-3xl font-bold text-neon-yellow">12</div>
          <div className="text-sm text-[#94A3B8]">Активных проектов</div>
        </Card>
      </div>

      <div className="bg-[#2A3042] neon-blue rounded-lg p-8 text-center text-[#94A3B8]">
        <p>Полный дашборд аналитики в разработке</p>
        <p className="text-sm mt-2">Рейтинг сотрудников, загрузка команды, критический путь</p>
      </div>
    </div>
  );
};
