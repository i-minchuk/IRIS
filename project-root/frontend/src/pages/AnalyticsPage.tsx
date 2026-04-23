import React, { useEffect, useState } from 'react';
import { getEmployeeAnalytics, type EmployeeAnalytics } from '@/api/timeTracking';
import Card from '@/components/ui/Card';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const userId = 1; // TODO: from auth

  useEffect(() => {
    getEmployeeAnalytics(userId).then(setAnalytics);
  }, [userId]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Аналитика</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="text-3xl font-bold text-purple-700">{analytics?.total_sessions || 0}</div>
          <div className="text-sm text-purple-600">Сессий</div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="text-3xl font-bold text-blue-700">{Math.round((analytics?.total_active_time || 0) / 3600)}ч</div>
          <div className="text-sm text-blue-600">Активного времени</div>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="text-3xl font-bold text-emerald-700">{Math.round((analytics?.avg_efficiency || 0) * 100)}%</div>
          <div className="text-sm text-emerald-600">Средняя эффективность</div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="text-3xl font-bold text-amber-700">12</div>
          <div className="text-sm text-amber-600">Активных проектов</div>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-400">
        <p>Полный дашборд аналитики в разработке</p>
        <p className="text-sm mt-2">Рейтинг сотрудников, загрузка команды, критический путь</p>
      </div>
    </div>
  );
};
