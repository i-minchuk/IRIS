import { useWorkspaceStore } from './store/workspaceStore';
import { Folder, FileText, CheckSquare, MessageSquare, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import type { ExplorerNode } from './types/workspace.types';
import { projectsApi, type ProjectTree, type ProjectTreeStage, type ProjectTreeKit, type ProjectTreeSection, type ProjectTreeDoc } from '@/features/projects/api/projects';

interface ExplorerSidebarProps {
  projectId?: number;
  onNodeClick?: (nodeId: string, nodeType: string, documentId?: number) => void;
  activeNodeId?: string | null;
  onCreateDocument?: () => void;
}

// Transform API tree response into ExplorerNode[]
function transformProjectTree(tree: ProjectTree): ExplorerNode[] {
  const projectNode: ExplorerNode = {
    id: `project-${tree.id}`,
    type: 'project',
    label: tree.name,
    code: tree.code,
    expanded: true,
    children: tree.stages.map(transformStage),
  };
  return [projectNode];
}

function transformStage(stage: ProjectTreeStage): ExplorerNode {
  const docCount = stage.kits.reduce(
    (sum, kit) => sum + kit.sections.reduce((s, sec) => s + sec.documents.length, 0),
    0
  );
  return {
    id: `stage-${stage.id}`,
    type: 'stage',
    label: stage.name,
    code: stage.code,
    count: docCount || undefined,
    expanded: false,
    children: stage.kits.map(transformKit),
  };
}

function transformKit(kit: ProjectTreeKit): ExplorerNode {
  const docCount = kit.sections.reduce((sum, sec) => sum + sec.documents.length, 0);
  return {
    id: `kit-${kit.id}`,
    type: 'kit',
    label: kit.name,
    code: kit.code,
    count: docCount || undefined,
    expanded: false,
    children: kit.sections.map(transformSection),
  };
}

function transformSection(section: ProjectTreeSection): ExplorerNode {
  return {
    id: `section-${section.id}`,
    type: 'section',
    label: section.name,
    code: section.code,
    count: section.documents.length || undefined,
    expanded: false,
    children: section.documents.map(transformDocument),
  };
}

function getFileTypeFromDocType(docType: string): string {
  const type = docType.toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('dwg')) return 'dwg';
  if (type.includes('doc')) return 'word';
  if (type.includes('xls') || type.includes('excel')) return 'excel';
  if (type.includes('image') || type.includes('png') || type.includes('jpg')) return 'image';
  return 'unknown';
}

function countDocuments(nodes: ExplorerNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'document') count++;
    if (node.children) count += countDocuments(node.children);
  }
  return count;
}

function transformDocument(doc: ProjectTreeDoc): ExplorerNode {
  const fileType = getFileTypeFromDocType(doc.doc_type);
  const ext = fileType === 'pdf' ? '.pdf' : fileType === 'dwg' ? '.dwg' : fileType === 'word' ? '.docx' : fileType === 'excel' ? '.xlsx' : fileType === 'image' ? '.png' : '';
  return {
    id: `doc-${doc.id}`,
    type: 'document',
    label: doc.number || doc.name,
    code: doc.crs_code,
    status: doc.status,
    documentId: doc.id,
    fileName: doc.number ? `${doc.number}${ext}` : doc.name,
    fileType,
  };
}

export default function ExplorerSidebar({ 
  projectId, 
  onNodeClick, 
  activeNodeId,
  onCreateDocument,
}: ExplorerSidebarProps) {
  const { explorerData, activeExplorerNode, setActiveExplorerNode, toggleExplorerNode, addTab, setExplorerData } =
    useWorkspaceStore();

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchTree = useCallback(async (pid: number) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await projectsApi.getTree(pid);
      const data = transformProjectTree(response.data);
      setExplorerData(data);
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Ошибка загрузки дерева проекта';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setExplorerData]);

  // Fetch real data when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchTree(projectId);
    }
  }, [projectId, fetchTree]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
      case 'in-progress':
        return 'var(--success)';
      case 'in-review':
      case 'approval':
        return 'var(--warning)';
      case 'rejected':
      case 'error':
        return 'var(--error)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Folder size={16} />;
      case 'stage':
        return <Folder size={16} />;
      case 'kit':
        return <Folder size={16} />;
      case 'section':
        return <Folder size={16} />;
      case 'document':
        return <FileText size={16} />;
      case 'task':
        return <CheckSquare size={16} />;
      case 'remark':
        return <MessageSquare size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const handleNodeClick = (node: ExplorerNode, hasChildren: boolean) => {
    // Использовать внешний callback если передан
    if (onNodeClick) {
      onNodeClick(node.id, node.type, node.documentId);
    } else {
      // Локальная логика для backward compatibility
      setActiveExplorerNode(node.id);
      
      if (node.type === 'document') {
        const mockFile = node.fileName
          ? new File(['mock file content'], node.fileName, {
              type: getFileMimeType(node.fileType || ''),
            })
          : undefined;

        addTab({
          id: node.id,
          type: 'document',
          title: node.label,
          subtitle: node.code || node.status,
          icon: <FileText size={14} />,
          file: mockFile,
          documentId: node.documentId,
        });
      } else if (hasChildren) {
        toggleExplorerNode(node.id);
      }
    }
  };

  // Helper для получения mime type по расширению
  function getFileMimeType(fileType: string): string {
    switch (fileType) {
      case 'pdf':
        return 'application/pdf';
      case 'image':
        return 'image/png';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'word':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'dwg':
        return 'application/acad';
      default:
        return 'application/octet-stream';
    }
  }

  const renderTree = (nodes: ExplorerNode[], level: number = 0) => {
    return nodes.map((node) => {
      const hasChildren = (node.children?.length ?? 0) > 0;
      // Использовать внешний activeNodeId если передан
      const isActive = (activeNodeId !== undefined ? activeNodeId === node.id : node.id === activeExplorerNode);
      const isExpanded = node.expanded ?? true;

      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors rounded ${
              isActive ? '' : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={{
              paddingLeft: `${level * 12 + 6}px`,
              backgroundColor: isActive ? 'var(--topbar-active)' : 'transparent',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNodeClick(node, hasChildren);
            }}
            role="treeitem"
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-selected={isActive}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNodeClick(node, hasChildren);
              }
            }}
          >
            {/* Expand/Collapse icon */}
            <div className="w-2.5 h-2.5 flex items-center justify-center shrink-0">
              {hasChildren && (
                <span
                  className="text-[9px] leading-none"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
            </div>

            {/* Node icon */}
            <span
              className="shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              {getNodeIcon(node.type)}
            </span>

            {/* Node label */}
            <div className="flex-1 min-w-0">
              <div
                className="text-xs font-medium truncate leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {node.label}
              </div>
              {node.code && (
                <div
                  className="text-[10px] font-mono truncate"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {node.code}
                </div>
              )}
            </div>

            {/* Count badge */}
            {node.count !== undefined && (
              <span
                className="text-[10px] px-1 py-0.5 rounded shrink-0"
                style={{
                  backgroundColor: 'var(--bg-surface-2)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {node.count}
              </span>
            )}

            {/* Status indicator */}
            {node.status && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getStatusColor(node.status) }}
              />
            )}
          </div>

          {/* Render children if expanded */}
          {hasChildren && isExpanded && (
            <div role="group">
              {renderTree(node.children || [], level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-surface)' }}
      role="tree"
      aria-label="Обозреватель проектов"
    >
      {/* Header с поиском и кнопкой создания */}
      <div
        className="px-2.5 py-2 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3
            className="text-xs font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Проекты
          </h3>
          <button
            onClick={onCreateDocument}
            className="p-1 rounded hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}
            title="Создать новый документ"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Поиск */}
        <input
          type="text"
          placeholder="Поиск..."
          className="w-full px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 transition-all"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.boxShadow = '0 0 0 2px rgba(124, 58, 237, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-default)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Дерево сущностей */}
      <div className="flex-1 overflow-y-auto py-0.5" role="group">
        {renderTree(explorerData)}
      </div>

      {/* Footer со статистикой */}
      <div
        className="px-2.5 py-1.5 border-t text-[10px]"
        style={{
          borderColor: 'var(--border-default)',
          color: 'var(--text-tertiary)',
          backgroundColor: 'var(--bg-surface-2)',
        }}
      >
        {isLoading ? (
          <div className="flex items-center gap-1">
            <Loader2 size={10} className="animate-spin" />
            <span>Загрузка...</span>
          </div>
        ) : loadError ? (
          <div className="text-[var(--error)]">{loadError}</div>
        ) : (
          <>
            <div>Проектов: {explorerData.length}</div>
            <div>Документов: {countDocuments(explorerData)}</div>
          </>
        )}
      </div>
    </aside>
  );
}
