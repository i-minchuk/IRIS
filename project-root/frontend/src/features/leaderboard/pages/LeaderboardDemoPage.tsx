import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import Leaderboard, { type LeaderboardVariant } from '@/features/leaderboard/components/Leaderboard';

// ─── Моковые данные со sparkline ────────────────────────────────
const employees = [
  { id: 1, name: 'Иванов А.П.', position: 'Гл. инженер', department: 'ПТО', docs: 847, trend: 12, sparkline: [120, 145, 180, 210, 280, 350, 847] },
  { id: 2, name: 'Петрова М.С.', position: 'Вед. специалист', department: 'ПТО', docs: 723, trend: 5, sparkline: [200, 220, 210, 300, 350, 400, 723] },
  { id: 3, name: 'Сидоров К.В.', position: 'Инженер ПТО', department: 'ПТО', docs: 691, trend: -3, sparkline: [300, 280, 350, 400, 380, 450, 691] },
  { id: 4, name: 'Кузнецова Е.А.', position: 'Специалист', department: 'ОВиК', docs: 534, trend: 8, sparkline: [100, 150, 180, 200, 250, 300, 534] },
  { id: 5, name: 'Морозов Д.И.', position: 'Мастер участка', department: 'АСУТП', docs: 412, trend: 2, sparkline: [80, 100, 120, 150, 200, 250, 412] },
  { id: 6, name: 'Новиков С.Р.', position: 'Технолог', department: 'ПТО', docs: 398, sparkline: [50, 80, 100, 120, 150, 200, 398] },
  { id: 7, name: 'Волкова А.К.', position: 'Инженер', department: 'ОВиК', docs: 356, trend: -1, sparkline: [150, 140, 160, 180, 200, 220, 356] },
  { id: 8, name: 'Лебедев П.М.', position: 'Старший мастер', department: 'АСУТП', docs: 312, trend: 4, sparkline: [60, 80, 100, 120, 140, 180, 312] },
  { id: 9, name: 'Соколова Н.В.', position: 'Архитектор', department: 'ПТО', docs: 289, sparkline: [40, 60, 80, 100, 120, 150, 289] },
  { id: 10, name: 'Попов А.С.', position: 'Конструктор', department: 'ОВиК', docs: 267, sparkline: [30, 50, 70, 90, 110, 130, 267] },
  { id: 11, name: 'Козлов М.Д.', position: 'Инженер', department: 'АСУТП', docs: 245, trend: 6 },
  { id: 12, name: 'Новикова Е.Р.', position: 'Специалист', department: 'ПТО', docs: 198, trend: -2 },
];

// ─── Варианты переключения ──────────────────────────────────────
const variants: { key: LeaderboardVariant; label: string }[] = [
  { key: 'ladder', label: 'Лестница' },
  { key: 'podium', label: 'Подиум' },
  { key: 'table', label: 'Таблица' },
  { key: 'cards', label: 'Карточки' },
  { key: 'compact', label: 'Компакт' },
];

export default function LeaderboardDemoPage() {
  const [variant, setVariant] = useState<LeaderboardVariant>('ladder');
  const [loading, setLoading] = useState(false);
  const [animateCounter, setAnimateCounter] = useState(true);
  const [showSparkline, setShowSparkline] = useState(true);
  const [enableConfetti, setEnableConfetti] = useState(true);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: 'var(--iris-bg-app)' }}>
      {/* Переключатель вариантов */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {variants.map((v) => (
          <button
            key={v.key}
            onClick={() => setVariant(v.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              variant === v.key
                ? 'shadow-lg'
                : 'border hover:opacity-80'
            }`}
            style={{
              background: variant === v.key ? 'var(--iris-accent-cyan)' : 'var(--iris-bg-surface)',
              color: variant === v.key ? '#fff' : 'var(--iris-text-secondary)',
              borderColor: variant === v.key ? 'transparent' : 'var(--iris-border-default)',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Доп. контролы */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button 
          onClick={simulateLoading} 
          className="px-4 py-2 rounded-lg text-xs transition-colors"
          style={{ background: 'var(--iris-bg-surface)', color: 'var(--iris-text-secondary)', border: '1px solid var(--iris-border-default)' }}
        >
          Симулировать загрузку
        </button>
        <button 
          onClick={() => setAnimateCounter(!animateCounter)} 
          className={`px-4 py-2 rounded-lg text-xs transition-colors border`}
          style={{
            background: animateCounter ? 'rgba(6, 182, 212, 0.15)' : 'var(--iris-bg-surface)',
            color: animateCounter ? 'var(--iris-accent-cyan)' : 'var(--iris-text-secondary)',
            borderColor: animateCounter ? 'rgba(6, 182, 212, 0.3)' : 'var(--iris-border-default)',
          }}
        >
          Анимация: {animateCounter ? 'ON' : 'OFF'}
        </button>
        <button 
          onClick={() => setShowSparkline(!showSparkline)} 
          className={`px-4 py-2 rounded-lg text-xs transition-colors border`}
          style={{
            background: showSparkline ? 'rgba(6, 182, 212, 0.15)' : 'var(--iris-bg-surface)',
            color: showSparkline ? 'var(--iris-accent-cyan)' : 'var(--iris-text-secondary)',
            borderColor: showSparkline ? 'rgba(6, 182, 212, 0.3)' : 'var(--iris-border-default)',
          }}
        >
          Sparkline: {showSparkline ? 'ON' : 'OFF'}
        </button>
        <button 
          onClick={() => setEnableConfetti(!enableConfetti)} 
          className={`px-4 py-2 rounded-lg text-xs transition-colors border`}
          style={{
            background: enableConfetti ? 'rgba(234, 179, 8, 0.15)' : 'var(--iris-bg-surface)',
            color: enableConfetti ? '#eab308' : 'var(--iris-text-secondary)',
            borderColor: enableConfetti ? 'rgba(234, 179, 8, 0.3)' : 'var(--iris-border-default)',
          }}
        >
          <Sparkles className="w-3 h-3 inline mr-1" />
          Confetti: {enableConfetti ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Лидерборд с ВСЕМИ функциями */}
      <div className="max-w-6xl mx-auto">
        <Leaderboard
          employees={employees}
          variant={variant}
          title="LEADERBOARD"
          subtitle="ТОП СОТРУДНИКОВ ПО ДОКУМЕНТООБОРОТУ"
          showTrend={true}
          showDepartment={variant === 'table'}
          showSparkline={showSparkline}
          maxItems={variant === 'cards' ? 5 : 10}
          loading={loading}
          enableExport={true}
          enableFilter={true}
          enableSearch={true}
          enablePeriod={true}
          enablePagination={variant === 'table'}
          enableConfetti={enableConfetti}
          animateCounter={animateCounter}
          pageSize={5}
        />
      </div>
    </div>
  );
}
