import { Clock, Activity, Settings } from 'lucide-react';
import { useState } from 'react';

interface BottomPanelProps {
  projectId?: string;
  documentId?: string;
}

type PanelTab = 'history' | 'integrations' | 'settings';

export default function BottomPanel({}: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('history');

  // Мок-данные для истории
  const mockHistory = [
    {
      id: 1,
      action: 'revision_created',
      user: 'Иванов А.В.',
      date: '2025-01-15 14:30',
      details: 'Создана ревизия B02',
    },
    {
      id: 2,
      action: 'status_changed',
      user: 'Петров С.К.',
      date: '2025-01-14 10:15',
      details: 'Статус изменён с "В работе" на "На проверке"',
    },
    {
      id: 3,
      action: 'document_created',
      user: 'Сидоров В.М.',
      date: '2025-01-10 09:00',
      details: 'Документ создан',
    },
  ];

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
          <HistoryContent history={mockHistory} />
        )}

        {activeTab === 'integrations' && (
          <IntegrationsContent />
        )}

        {activeTab === 'settings' && (
          <SettingsContent />
        )}
      </div>
    </aside>
  );
}

interface HistoryContentProps {
  history: Array<Record<string, unknown>>;
}

function HistoryContent({ history }: HistoryContentProps) {
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'revision_created':
        return 'Создана ревизия';
      case 'status_changed':
        return 'Изменён статус';
      case 'document_created':
        return 'Документ создан';
      case 'document_updated':
        return 'Документ обновлён';
      case 'approved':
        return 'Утверждено';
      default:
        return action;
    }
  };

  return (
    <div>
      <h4 className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        Журнал изменений
      </h4>

      <div className="space-y-1.5">
        {history.map((item, index) => (
          <div key={item.id} className="flex gap-2">
            {/* Timeline marker */}
            <div className="flex flex-col items-center">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-engineering)' }}
              />
              {index < history.length - 1 && (
                <div
                  className="w-0.5 flex-1 my-0.5"
                  style={{ backgroundColor: 'var(--border-default)' }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1.5">
              <div
                className="text-xs font-medium mb-0.5"
                style={{ color: 'var(--text-primary)' }}
              >
                {getActionLabel(item.action)}
              </div>
              <div
                className="text-xs mb-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.details}
              </div>
              <div
                className="text-[10px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {item.user} · {item.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationsContent() {
  const integrations = [
    { name: '1C: ERP', status: 'synced', lastSync: '2025-01-15 14:30' },
    { name: 'AutoCAD', status: 'pending', lastSync: '2025-01-15 12:00' },
    { name: 'PDF Export', status: 'error', lastSync: '2025-01-14 18:00' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'var(--success)';
      case 'pending':
        return 'var(--warning)';
      case 'error':
        return 'var(--error)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'synced':
        return 'Синхронизировано';
      case 'pending':
        return 'В очереди';
      case 'error':
        return 'Ошибка';
      default:
        return status;
    }
  };

  return (
    <div>
      <h4 className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        Интеграции
      </h4>

      <div className="space-y-1.5">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between p-2 rounded-lg border"
            style={{
              borderColor: 'var(--border-default)',
              backgroundColor: 'var(--bg-surface-2)',
            }}
          >
            <div>
              <div
                className="text-xs font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {integration.name}
              </div>
              <div
                className="text-[10px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {integration.lastSync}
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0"
              style={{
                backgroundColor: getStatusColor(integration.status),
                color: 'var(--text-inverse)',
              }}
            >
              {getStatusLabel(integration.status)}
            </div>
          </div>
        ))}
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
              className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-engineering)]"
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
              className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-engineering)]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

