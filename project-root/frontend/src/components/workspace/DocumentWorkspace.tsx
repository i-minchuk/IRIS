import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../workspace/store/workspaceStore';
import DocumentViewerHost from '../viewers/DocumentViewerHost';
import RemarksPanel from '../RemarksPanel';
import ExplorerSidebar from '../workspace/ExplorerSidebar';
import WorkspaceLayout from '../workspace/WorkspaceLayout';
import { getDocument } from '../../api/documents';
import { Plus, FileCheck, Eye } from 'lucide-react';

/**
 * DocumentWorkspace - единый сценарий работы с документами
 * 
 * TEST_MARKER_2026_IRINA - контрольная точка для проверки рендера
 * 
 * Три-панельная архитектура + нижняя панель:
 * - Левая панель: дерево документов + кнопка "Создать документ"
 * - Центр: Toolbar (Создать ревизию → На согласование → На проверку → Zoom → Page → DL) + Viewer
 * - Правая панель: замечания
 * - Нижняя панель: история/связи/версии (закреплена в layout)
 */
export default function DocumentWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const { selectedDocument, setSelectedDocument, activeExplorerNode, setActiveExplorerNode, bottomPanelCollapsed, toggleBottomPanel } = useWorkspaceStore();
  
  // Гарантируем, что нижняя панель раскрыта при загрузке DocumentWorkspace
  useEffect(() => {
    if (bottomPanelCollapsed) {
      toggleBottomPanel();
    }
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Обработчик клика по узлу дерева
  const handleNodeClick = async (nodeId: string, nodeType: string, documentId?: number) => {
    // Если кликнули по документу
    if (nodeType === 'document' && documentId) {
      // Проверка: уже выбран ли этот документ
      if (selectedDocument?.id === documentId) {
        return; // No-op
      }

      setLoading(true);
      setError(null);
      setActiveExplorerNode(nodeId);

      try {
        const doc = await getDocument(documentId);
        
        // Build file info from revision
        const currentRevision = doc.current_revision_id 
          ? doc.revisions?.find(r => r.id === doc.current_revision_id)
          : null;
        
        const fileUrl = currentRevision?.file_path 
          ? `/api/files/${currentRevision.file_path}`
          : undefined;

        setSelectedDocument({
          id: doc.id,
          code: doc.code,
          title: doc.title,
          fileUrl,
          fileName: `${doc.code}${currentRevision?.file_path?.includes('.pdf') ? '.pdf' : ''}`,
          project_id: doc.project_id,
          status: doc.status,
          doc_type: doc.doc_type,
          discipline: doc.discipline,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить документ');
        setSelectedDocument(null);
      } finally {
        setLoading(false);
      }
    } else if (nodeType === 'project' || nodeType === 'stage' || nodeType === 'kit') {
      // Клик по папке - только expand/collapse
      setActiveExplorerNode(nodeId);
    }
  };

  const handleCreateRevision = () => {
    // TODO: открыть модалку создания ревизии
    console.log('Создать ревизию для документа', selectedDocument?.id);
  };

  const handleSubmitForApproval = () => {
    // TODO: отправить на согласование
    console.log('Отправить на согласование документ', selectedDocument?.id);
  };

  const handleSubmitForReview = () => {
    // TODO: отправить на проверку
    console.log('Отправить на проверку документ', selectedDocument?.id);
  };

  const handleCreateDocument = () => {
    // TODO: перейти на страницу создания
    console.log('Создать документ в проекте', projectId);
  };

  return (
    <div data-test="document-workspace">
      {/* TEST_MARKER_2026_IRINA - проверь этот текст в DOM через DevTools */}
      <WorkspaceLayout
        explorer={
        <ExplorerSidebar 
          projectId={projectId ? Number(projectId) : 1}
          onNodeClick={handleNodeClick}
          activeNodeId={activeExplorerNode}
          onCreateDocument={handleCreateDocument}
        />
      }
      inspector={
        selectedDocument ? (
          <RemarksPanel 
            documentId={selectedDocument.id}
            projectId={selectedDocument.project_id}
          />
        ) : (
          <EmptyInspector />
        )
      }
      bottomPanel={
        selectedDocument ? (
          <DocumentBottomPanel document={selectedDocument} />
        ) : null
      }
      documentData={
        selectedDocument ? {
          code: selectedDocument.code,
          revision: 'A.1', // TODO: get from current revision
          status: selectedDocument.status || 'draft',
          author: 'Иванов И.И.', // TODO: get from revision author
          reviewer: 'Петров П.П.',
          approver: 'Сидоров С.С.',
          releaseDate: new Date().toISOString(),
          nextDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          dependencies: [],
          totalRemarks: 0, // TODO: get from remarks count
          openRemarks: 0,
        } : undefined
      }
      toolbarActions={
        selectedDocument && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateRevision}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent-engineering)',
                color: 'var(--text-inverse)',
              }}
              title="Создать новую ревизию документа"
            >
              <Plus size={14} />
              Создать ревизию
            </button>
            
            <button
              onClick={handleSubmitForApproval}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              title="Отправить документ на согласование"
            >
              <FileCheck size={14} />
              На согласование
            </button>
            
            <button
              onClick={handleSubmitForReview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              title="Отправить документ на проверку"
            >
              <Eye size={14} />
              На проверку
            </button>
          </div>
        )
      }
    >
      {loading ? (
        <DocumentLoadingState />
      ) : error ? (
        <DocumentErrorState error={error} />
      ) : selectedDocument ? (
        <DocumentViewerHost />
      ) : (
        <EmptyViewerState />
      )}
      </WorkspaceLayout>
    </div>
  );
}

// Loading state
function DocumentLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 border-t-2 rounded-full animate-spin mx-auto mb-3"
          style={{
            borderColor: 'var(--border-default)',
            borderTopColor: 'var(--accent-engineering)',
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Загрузка документа...
        </p>
      </div>
    </div>
  );
}

// Error state
function DocumentErrorState({ error }: { error: string }) {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="text-center max-w-md px-6">
        <div
          className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--bg-surface-2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--error)' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>
        <h3
          className="text-base font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Ошибка загрузки
        </h3>
        <p
          className="text-sm mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--accent-engineering)',
            color: 'var(--text-inverse)',
          }}
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

// Empty viewer state
function EmptyViewerState() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
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
          Выберите документ из дерева
        </h3>
        <p
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Документ откроется в этой области для просмотра
        </p>
      </div>
    </div>
  );
}

// Empty inspector state (когда документ не выбран)
function EmptyInspector() {
  return (
    <div className="w-96 h-full flex flex-col border-l items-center justify-center p-6 text-center" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        <path
          d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V21Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Замечания по документу
      </h4>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        Выберите документ для просмотра замечаний
      </p>
    </div>
  );
}

// Нижняя панель документа
interface DocumentBottomPanelProps {
  document: {
    id: number;
    code: string;
    title: string;
    status?: string;
  };
}

function DocumentBottomPanel({ document }: DocumentBottomPanelProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'connections' | 'versions' | 'metadata'>('history');

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-default)' }}>
        {[
          { id: 'history', label: 'История' },
          { id: 'connections', label: 'Связи' },
          { id: 'versions', label: 'Версии' },
          { id: 'metadata', label: 'Метаданные' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="px-4 py-2 text-sm font-medium transition-colors border-b-2"
            style={{
              borderColor: activeTab === tab.id ? 'var(--accent-engineering)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-engineering)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Журнал изменений</h4>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>• Ревизия A.1 создана 15.01.2026</p>
              <p>• Отправлено на согласование 20.01.2026</p>
              <p>• Утверждено 25.01.2026</p>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Связанные документы</h4>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>Зависимости: нет</p>
              <p>Ссылается на: нет</p>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>История версий</h4>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>Текущая версия: A.1</p>
              <p>Предыдущие версии: нет</p>
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Метаданные</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Код</p>
                <p style={{ color: 'var(--text-primary)' }}>{document.code}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Название</p>
                <p style={{ color: 'var(--text-primary)' }}>{document.title}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Статус</p>
                <p style={{ color: 'var(--text-primary)' }}>{document.status || 'Черновик'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
