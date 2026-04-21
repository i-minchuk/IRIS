import { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from './store/workspaceStore';
import ActivityBar from './ActivityBar';
import EditorTabs from './EditorTabs';
import ScaleControl from './ScaleControl';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  explorer?: React.ReactNode;
  inspector?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  documentData?: {
    code: string;
    revision: string;
    status: string;
    author: string;
    reviewer: string;
    approver: string;
    releaseDate: string;
    nextDeadline: string;
    dependencies: string[];
    totalRemarks: number;
    openRemarks: number;
  };
  toolbarActions?: React.ReactNode;
  onNewTab?: () => void;
  onNewRevision?: () => void;
  onApprove?: () => void;
  onVerify?: () => void;
}

export default function WorkspaceLayout({
  children,
  explorer,
  inspector,
  bottomPanel,
  documentData,
  toolbarActions,
  onNewTab,
  onNewRevision,
  onApprove,
  onVerify,
}: WorkspaceLayoutProps) {
  const {
    explorerWidth,
    inspectorWidth,
    bottomPanelHeight,
    explorerCollapsed,
    inspectorCollapsed,
    bottomPanelCollapsed,
    contentScale,
    setExplorerWidth,
    setInspectorWidth,
    // setBottomPanelHeight - больше не используется, панель статична
  } = useWorkspaceStore();

  // Resizer для Explorer
  const explorerResizerRef = useRef<HTMLDivElement>(null);
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);

  // Resizer для Inspector
  const inspectorResizerRef = useRef<HTMLDivElement>(null);
  const [isResizingInspector, setIsResizingInspector] = useState(false);

  // Нижняя панель теперь статична - resizer удалён

  // Drag handlers для Explorer
  const startResizingExplorer = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingExplorer(true);
  };

  const stopResizingExplorer = () => {
    setIsResizingExplorer(false);
  };

  const resizeExplorer = (e: MouseEvent) => {
    if (!isResizingExplorer) return;
    const newWidth = e.clientX - 56;
    setExplorerWidth(newWidth);
  };

  // Drag handlers для Inspector
  const startResizingInspector = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingInspector(true);
  };

  const stopResizingInspector = () => {
    setIsResizingInspector(false);
  };

  const resizeInspector = (e: MouseEvent) => {
    if (!isResizingInspector) return;
    const viewportWidth = window.innerWidth;
    const newWidth = viewportWidth - e.clientX;
    setInspectorWidth(newWidth);
  };

  // Обработчики для нижней панели удалены - панель статична

  // Глобальные обработчики mouse events - обновлено для без bottom panel resize
  useEffect(() => {
    if (isResizingExplorer || isResizingInspector) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingExplorer
        ? 'col-resize'
        : 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingExplorer, isResizingInspector]);

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizingExplorer) {
      resizeExplorer(e);
    } else if (isResizingInspector) {
      resizeInspector(e);
    }
  };

  const handleMouseUp = () => {
    stopResizingExplorer();
    stopResizingInspector();
  };

  // Масштаб контента
  const scaleValue = contentScale / 100;

  // Высота для центральной зоны (учитываем header и bottom panel)
  const centralAreaHeight = `calc(100vh - 50px - ${bottomPanelHeight}px)`;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-app)',
        '--content-scale': scaleValue,
      } as React.CSSProperties}
    >
      {/* Activity Bar */}
      <ActivityBar />

      {/* Основная рабочая область */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Scale Control */}
        <div className="flex items-center justify-between px-3 py-1" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <div />
          <ScaleControl />
        </div>

        {/* Центральная зона с панелями */}
        <div
          className="flex-1 flex overflow-hidden relative min-h-0"
          style={{ height: centralAreaHeight }}
        >
          {/* Explorer Sidebar */}
          {!explorerCollapsed && explorer && (
            <>
              <div
                className="shrink-0 overflow-y-auto overflow-x-hidden border-r flex flex-col"
                style={{
                  width: `${explorerWidth}px`,
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                {explorer}
              </div>

              {/* Resizer для Explorer */}
              <div
                ref={explorerResizerRef}
                onMouseDown={startResizingExplorer}
                className="w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors shrink-0"
                style={{ backgroundColor: 'transparent' }}
                role="separator"
                aria-orientation="vertical"
                title="Перетащите для изменения размера"
              />
            </>
          )}

          {/* Центральная область с EditorTabs и контентом */}
          <div 
            className="flex-1 flex flex-col overflow-hidden relative min-h-0"
            style={{ 
              height: centralAreaHeight,
              fontSize: `calc(1rem * var(--content-scale))`,
            }}
          >
            {/* Вкладки редактора */}
            <EditorTabs 
              onNewTab={onNewTab} 
              onNewRevision={onNewRevision}
              onApprove={onApprove}
              onVerify={onVerify}
            />
            
            {/* Toolbar с действиями */}
            {toolbarActions && (
              <div
                className="flex items-center gap-3 px-3 py-2 border-b overflow-x-auto"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  borderColor: 'var(--border-default)',
                }}
              >
                {toolbarActions}
              </div>
            )}
            
            {/* Metadata Bar - информация о документе сверху */}
            {documentData && (
              <DocumentMetadataBar data={documentData} />
            )}
            
            {/* Контент страницы */}
            <div className="flex-1 overflow-hidden relative">
              {children}
            </div>
          </div>

          {/* Inspector Panel */}
          {!inspectorCollapsed && inspector && (
            <>
              {/* Resizer для Inspector */}
              <div
                ref={inspectorResizerRef}
                onMouseDown={startResizingInspector}
                className="w-1 cursor-col-resize hover:bg-[var(--primary)] transition-colors shrink-0"
                style={{ backgroundColor: 'transparent' }}
                role="separator"
                aria-orientation="vertical"
                title="Перетащите для изменения размера"
              />

              <div
                className="shrink-0 overflow-y-auto border-l flex flex-col"
                style={{
                  width: `${inspectorWidth}px`,
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                {inspector}
              </div>
            </>
          )}
        </div>

        {/* Bottom Panel - статичная, без resizer */}
        {!bottomPanelCollapsed && bottomPanel && (
          <div
            className="shrink-0 overflow-y-auto border-t"
            style={{
              height: `${bottomPanelHeight}px`,
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            {bottomPanel}
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент строки метаданных документа
interface DocumentMetadataBarProps {
  data: {
    code: string;
    revision: string;
    status: string;
    author: string;
    reviewer: string;
    releaseDate: string;
    nextDeadline: string;
    dependencies: string[];
    totalRemarks: number;
    openRemarks: number;
  };
}

function DocumentMetadataBar({ data }: DocumentMetadataBarProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Утверждено';
      case 'in-review':
        return 'На проверке';
      case 'in-progress':
        return 'В работе';
      case 'draft':
        return 'Черновик';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'var(--success)';
      case 'in-review':
        return 'var(--warning)';
      case 'in-progress':
        return 'var(--info)';
      case 'draft':
        return 'var(--text-tertiary)';
      default:
        return 'var(--border-default)';
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 border-b overflow-x-auto whitespace-nowrap"
      style={{
        backgroundColor: 'var(--bg-surface-2)',
        borderColor: 'var(--border-default)',
        gap: `calc(0.75rem * var(--content-scale, 1))`,
        paddingLeft: `calc(0.75rem * var(--content-scale, 1))`,
        paddingRight: `calc(0.75rem * var(--content-scale, 1))`,
        paddingTop: `calc(0.375rem * var(--content-scale, 1))`,
        paddingBottom: `calc(0.375rem * var(--content-scale, 1))`,
      }}
    >
      {/* Код */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono font-semibold" style={{ 
          color: 'var(--text-primary)',
          fontSize: `calc(0.625rem * var(--content-scale, 1))`,
        }}>
          {data.code}
        </span>
      </div>

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Ревизия */}
      <div className="flex items-center gap-1.5">
        <span className="uppercase tracking-wide" style={{ 
          color: 'var(--text-tertiary)',
          fontSize: `calc(0.625rem * var(--content-scale, 1))`,
        }}>
          Ревизия
        </span>
        <span className="font-mono" style={{ 
          color: 'var(--text-primary)',
          fontSize: `calc(0.75rem * var(--content-scale, 1))`,
        }}>
          {data.revision}
        </span>
      </div>

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Статус */}
      <div className="flex items-center gap-1.5">
        <span
          className="px-1.5 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: getStatusColor(data.status),
            color: 'var(--text-inverse)',
            fontSize: `calc(0.625rem * var(--content-scale, 1))`,
            paddingLeft: `calc(0.375rem * var(--content-scale, 1))`,
            paddingRight: `calc(0.375rem * var(--content-scale, 1))`,
            paddingTop: `calc(0.125rem * var(--content-scale, 1))`,
            paddingBottom: `calc(0.125rem * var(--content-scale, 1))`,
          }}
        >
          {getStatusLabel(data.status)}
        </span>
      </div>

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Автор */}
      <div className="flex items-center gap-1">
        <span style={{ 
          color: 'var(--text-tertiary)',
          fontSize: `calc(0.625rem * var(--content-scale, 1))`,
        }}>
          {data.author}
        </span>
      </div>

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Проверил */}
      <div className="flex items-center gap-1">
        <span style={{ 
          color: 'var(--text-tertiary)',
          fontSize: `calc(0.625rem * var(--content-scale, 1))`,
        }}>
          {data.reviewer}
        </span>
      </div>

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Дата выпуска */}
      <div className="flex items-center gap-1">
        <span style={{ 
          color: 'var(--text-tertiary)',
          fontSize: `calc(0.625rem * var(--content-scale, 1))`,
        }}>
          {new Date(data.releaseDate).toLocaleDateString('ru-RU')}
        </span>
      </div>

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Срок */}
      <div className="flex items-center gap-1">
        <span style={{ 
          color: 'var(--text-tertiary)',
          fontSize: `calc(0.625rem * var(--content-scale, 1))`,
        }}>
          {new Date(data.nextDeadline).toLocaleDateString('ru-RU')}
        </span>
      </div>

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Зависит от */}
      {data.dependencies?.length > 0 && (
        <>
          <div className="w-px h-3" style={{ 
            backgroundColor: 'var(--border-default)',
            height: `calc(0.75rem * var(--content-scale, 1))`,
          }} />
          <div className="flex items-center gap-1">
            <span style={{ 
              color: 'var(--text-tertiary)',
              fontSize: `calc(0.625rem * var(--content-scale, 1))`,
            }}>
              {data.dependencies.join(', ')}
            </span>
          </div>
        </>
      )}

      <div className="w-px h-3" style={{ 
        backgroundColor: 'var(--border-default)',
        height: `calc(0.75rem * var(--content-scale, 1))`,
      }} />

      {/* Замечания */}
      <div className="flex items-center gap-1">
        <span style={{ 
          color: data.openRemarks > 0 ? 'var(--error)' : 'var(--text-tertiary)',
          fontSize: `calc(0.625rem * var(--content-scale, 1))`,
        }}>
          Замечания: {data.openRemarks}/{data.totalRemarks}
        </span>
      </div>
    </div>
  );
}
