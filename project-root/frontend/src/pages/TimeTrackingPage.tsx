import { useState } from 'react';
import { Clock, BarChart3, List, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import TimerWidget from '@/features/time_tracking/components/TimerWidget';
import SessionList from '@/features/time_tracking/components/SessionList';
import AnalyticsPanel from '@/features/time_tracking/components/AnalyticsPanel';

type Tab = 'timer' | 'sessions' | 'analytics';

export default function TimeTrackingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('timer');

  const tabs = [
    { id: 'timer' as Tab, label: 'Таймер', icon: <Play size={18} /> },
    { id: 'sessions' as Tab, label: 'Сессии', icon: <List size={18} /> },
    { id: 'analytics' as Tab, label: 'Аналитика', icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[var(--iris-accent)]/10 text-[var(--iris-accent)]">
          <Clock size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--iris-text-primary)]">Трекер времени</h1>
          <p className="text-sm text-[var(--iris-text-muted)]">
            Учёт рабочего времени и аналитика продуктивности
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--iris-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[var(--iris-accent)]'
                : 'text-[var(--iris-text-muted)] hover:text-[var(--iris-text-secondary)]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="time-tracking-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--iris-accent)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'timer' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--iris-border)] bg-[var(--iris-bg-card)]">
              <h2 className="text-lg font-semibold text-[var(--iris-text-primary)] mb-4">
                Быстрый таймер
              </h2>
              <p className="text-sm text-[var(--iris-text-muted)] mb-4">
                Запустите таймер для отслеживания времени работы. Используйте горячую клавишу{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--iris-bg-elevated)] text-xs font-mono">
                  Ctrl+Shift+T
                </kbd>{' '}
                для быстрого запуска/остановки.
              </p>
              <div className="flex items-center gap-4">
                <TimerWidget variant="inline" />
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[var(--iris-border)] bg-[var(--iris-bg-card)]">
              <h2 className="text-lg font-semibold text-[var(--iris-text-primary)] mb-2">
                Как это работает
              </h2>
              <ul className="space-y-2 text-sm text-[var(--iris-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--iris-accent)]/10 text-[var(--iris-accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <span>Запустите таймер перед началом работы над документом или проектом</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--iris-accent)]/10 text-[var(--iris-accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span>Отмечайте правки кнопкой «+1 правка» для расчёта эффективности</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--iris-accent)]/10 text-[var(--iris-accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span>Остановите таймер по завершении — данные сохранятся автоматически</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--iris-accent)]/10 text-[var(--iris-accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                  <span>Смотрите аналитику продуктивности во вкладке «Аналитика»</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && <SessionList />}

        {activeTab === 'analytics' && <AnalyticsPanel />}
      </motion.div>

      {/* Floating timer widget (always visible on all tabs) */}
      <TimerWidget />
    </div>
  );
}
