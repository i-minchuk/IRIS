import { Clock, Activity, Settings } from 'lucide-react';
import { useState } from 'react';

interface BottomPanelProps {
  projectId?: string;
  documentId?: string;
}

type PanelTab = 'history' | 'integrations' | 'settings';

export default function BottomPanel({}: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('history');

  const getTabLabel = (tab: PanelTab) => {
    switch (tab) {
      case 'history':
        return 'История';
      case 'integrations':
        return 'Интеграции';
      case 'settings':
        return 'Настройки';
    }
  };

  const getTabIcon = (tab: PanelTab) => {
    switch (tab) {
      case 'history':
        return <Clock size={14} />;
      case 'integrations':
        return <Activity size={14} />;
      case 'settings':
        return <Settings size={14} />;
    }
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-surface)' }}
      aria-label="Нижняя панель"
    >
      {/* Табы */}
      <div
        className="flex items-center gap-1 px-2 border-b"
        style={{ borderColor: 'var(--border-default)' }}
        role="tablist"
      >
        {(['history', 'integrations', 'settings'] as PanelTab[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? ''
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                color: activeTab === tab ? 'var(--accent-engineering)' : 'var(--text-secondary)',
                borderColor:
                  activeTab === tab ? 'var(--accent-engineering)' : 'transparent',
                backgroundColor: 'transparent',
              }}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {getTabIcon(tab)}
              {getTabLabel(tab)}
            </button>
          )
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'history' && (
          <EmptyState message="Выберите документ для просмотра истории изменений" />
        )}

        {activeTab === 'integrations' && (
          <EmptyState message="Интеграции будут доступны после настройки" />
        )}

        {activeTab === 'settings' && (
          <SettingsContent />
        )}
      </div>
    </aside>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div
        className="text-xs mb-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {message}
      </div>
    </div>
  );
}

function SettingsContent() {
  return (
    <div>
      <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Настройки панели
      </h4>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Автоскролл
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div
              className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-800 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-engineering)]"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Звуковые уведомления
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div
              className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-gray-800 after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-engineering)]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
