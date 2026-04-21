import { X, Plus } from 'lucide-react';
import { useWorkspaceStore } from './store/workspaceStore';
import type { Tab } from './types/workspace.types';

interface EditorTabsProps {
  onNewTab?: () => void;
  onNewRevision?: () => void;
  onApprove?: () => void;
  onVerify?: () => void;
}

export default function EditorTabs({ 
  onNewTab, 
  onNewRevision,
  onApprove,
  onVerify
}: EditorTabsProps) {
  const { openTabs, activeTabId, setActiveTab, removeTab } = useWorkspaceStore();

  if (openTabs.length === 0) {
    return (
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b"
        style={{
          backgroundColor: 'var(--bg-surface-2)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Нет открытых вкладок
          </span>
        </div>
        {onNewTab && (
          <button
            onClick={onNewTab}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Создать документ"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between border-b overflow-x-auto"
      style={{
        backgroundColor: 'var(--bg-surface-2)',
        borderColor: 'var(--border-default)',
        minHeight: '38px',
      }}
      role="tablist"
      aria-label="Открытые вкладки"
    >
      {/* Вкладки слева */}
      <div className="flex items-center gap-1 px-1 flex-1 overflow-x-auto">
        {openTabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onClick={() => setActiveTab(tab.id)}
            onClose={() => removeTab(tab.id)}
          />
        ))}
        
        {/* Кнопка создания нового документа рядом с вкладками */}
        {onNewTab && (
          <button
            onClick={onNewTab}
            className="p-1.5 m-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors shrink-0 flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
            title="Создать документ"
            aria-label="Создать документ"
          >
            <Plus size={14} />
            <span>Создать документ</span>
          </button>
        )}
      </div>

      {/* Быстрые действия справа */}
      <div className="flex items-center gap-1 px-2 shrink-0 border-l" style={{ borderColor: 'var(--border-default)' }}>
        {onNewRevision && (
          <button
            onClick={onNewRevision}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--accent-engineering)',
              color: 'var(--text-inverse)',
            }}
            title="Создать новую ревизию"
          >
            Создать новую ревизию
          </button>
        )}
        
        {onApprove && (
          <button
            onClick={onApprove}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--success)',
              color: 'var(--text-inverse)',
            }}
            title="Направить на согласование"
          >
            Направить на согласование
          </button>
        )}
        
        {onVerify && (
          <button
            onClick={onVerify}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--warning)',
              color: 'var(--text-inverse)',
            }}
            title="Направить на проверку"
          >
            Направить на проверку
          </button>
        )}
      </div>
    </div>
  );
}

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

function TabItem({ tab, isActive, onClick, onClose }: TabItemProps) {
  return (
    <div
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all duration-150 min-w-[120px] max-w-[180px] border-t border-x ${
        isActive ? '' : 'hover:bg-[var(--bg-hover)]'
      }`}
      style={{
        backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
        borderColor: isActive
          ? 'var(--border-default)'
          : 'transparent',
        borderBottom: isActive ? '1px solid var(--bg-surface)' : 'none',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      {/* Иконка таба */}
      {tab.icon && <span className="shrink-0">{tab.icon}</span>}

      {/* Название */}
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className="text-xs font-medium truncate"
          style={{
            color: isActive
              ? 'var(--accent-engineering)'
              : 'var(--text-secondary)',
          }}
        >
          {tab.title}
        </span>
        {tab.subtitle && (
          <span
            className="text-[10px] truncate"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {tab.subtitle}
          </span>
        )}
      </div>

      {/* Индикатор несохранённых изменений */}
      {tab.isDirty && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: 'var(--warning)' }}
        />
      )}

      {/* Кнопка закрытия */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-[var(--bg-hover)]"
        style={{ color: 'var(--text-tertiary)' }}
        title="Закрыть вкладку"
        aria-label={`Закрыть ${tab.title}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}
