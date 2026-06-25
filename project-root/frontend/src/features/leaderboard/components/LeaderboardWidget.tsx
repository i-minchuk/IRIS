import { useState } from 'react';
import { ArrowDown, Trophy } from 'lucide-react';
import Leaderboard from '@/features/leaderboard/components/Leaderboard';

export interface LeaderboardWidgetProps {
  isDark?: boolean;
}

// ─── Моковые данные для Dashboard ───────────────────────────────
const employees = [
  { id: 1, name: 'Иванов А.П.', position: 'Гл. инженер', department: 'ПТО', docs: 847, trend: 12, sparkline: [120, 145, 180, 210, 280, 350, 847] },
  { id: 2, name: 'Петрова М.С.', position: 'Вед. специалист', department: 'ПТО', docs: 723, trend: 5, sparkline: [200, 220, 210, 300, 350, 400, 723] },
  { id: 3, name: 'Сидоров К.В.', position: 'Инженер ПТО', department: 'ПТО', docs: 691, trend: -3, sparkline: [300, 280, 350, 400, 380, 450, 691] },
  { id: 4, name: 'Кузнецова Е.А.', position: 'Специалист', department: 'ОВиК', docs: 534, trend: 8, sparkline: [100, 150, 180, 200, 250, 300, 534] },
  { id: 5, name: 'Морозов Д.И.', position: 'Мастер участка', department: 'АСУТП', docs: 412, trend: 2, sparkline: [80, 100, 120, 150, 200, 250, 412] },
  { id: 6, name: 'Новиков С.Р.', position: 'Технолог', department: 'ПТО', docs: 398, sparkline: [50, 80, 100, 120, 150, 200, 398] },
  { id: 7, name: 'Волкова А.К.', position: 'Инженер', department: 'ОВиК', docs: 356, trend: -1, sparkline: [150, 140, 160, 180, 200, 220, 356] },
  { id: 8, name: 'Лебедев П.М.', position: 'Старший мастер', department: 'АСУТП', docs: 312, trend: 4, sparkline: [60, 80, 100, 120, 140, 180, 312] },
];

type SortField = 'docs' | 'trend' | 'name';
type SortOrder = 'asc' | 'desc';

export function LeaderboardWidget({ isDark = false }: LeaderboardWidgetProps) {
  const [sortField, setSortField] = useState<SortField>('docs');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedEmployees = [...employees].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'docs':
        comparison = a.docs - b.docs;
        break;
      case 'trend':
        comparison = (a.trend || 0) - (b.trend || 0);
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

  const sortLabel = {
    docs: 'по документам',
    trend: 'по тренду',
    name: 'по имени',
  }[sortField];

  return (
    <div className="w-full">
      {/* Заголовок + сортировка — аналогично "Загрузка по отделам" */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg"
            style={{ background: 'rgba(212, 166, 42, 0.12)' }}
          >
            <Trophy size={16} style={{ color: '#D4A62A' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Лидерборд
          </h3>
        </div>
        <button
          onClick={() => toggleSort('docs')}
          className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          Сортировка: {sortLabel}
          <ArrowDown
            size={12}
            className={`transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Leaderboard — только лестница */}
      <Leaderboard
        employees={sortedEmployees}
        variant="ladder"
        title=""
        subtitle=""
        showTrend={true}
        showSparkline={true}
        maxItems={5}
        loading={false}
        enableExport={false}
        enableFilter={false}
        enableSearch={false}
        enablePeriod={false}
        enablePagination={false}
        enableConfetti={false}
        animateCounter={true}
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  );
}
