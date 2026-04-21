import { ViewerContainer } from './ViewerContainer';
import { useWorkspaceStore } from '../workspace/store/workspaceStore';

/**
 * DocumentViewerHost - единый host компонент для отображения документов разных типов
 * 
 * Интеграция с workspace store:
 * - Получает активную вкладку из openTabs
 * - Получает selectedDocument из store
 * - Определяет тип файла по имени (расширению)
 * - Рендерит соответствующий viewer через ViewerContainer
 * - Поддерживает как реальные файлы (File object), так и mock данные
 */
export default function DocumentViewerHost() {
  const { activeTabId, openTabs, selectedDocument } = useWorkspaceStore();
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  // Приоритет 1: selectedDocument из store (новая логика)
  if (selectedDocument) {
    return (
      <ViewerContainer 
        fileUrl={selectedDocument.fileUrl}
        fileName={selectedDocument.fileName}
        mock={!selectedDocument.fileUrl}
      />
    );
  }

  // Приоритет 2: activeTab (старая логика для backward compatibility)
  // Если таб не выбрана - показываем пустое состояние
  if (!activeTab) {
    return <EmptyState />;
  }

  // Получаем файл из tab
  const file = activeTab.file as File | null;

  // Если есть файл - передаём его в ViewerContainer
  if (file) {
    return <ViewerContainer file={file} />;
  }

  // Если файла нет (mock данные) - используем fileName и mock режим
  return (
    <ViewerContainer
      fileName={activeTab.title}
      mock={true}
    />
  );
}

// Пустое состояние
function EmptyState() {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <div className="text-center max-w-md px-6">
        <div
          className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-tertiary)' }}>
            <path
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3
          className="text-base font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Выберите документ из Explorer
        </h3>
        <p
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Документ откроется в этом окне для просмотра
        </p>
      </div>
    </div>
  );
}
