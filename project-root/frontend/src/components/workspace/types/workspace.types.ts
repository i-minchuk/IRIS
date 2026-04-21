/**
 * Types для Workspace Layout
 */

export interface Tab {
  id: string;
  type: 'document' | 'revision' | 'task' | 'remark' | 'approval' | 'custom';
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  isDirty?: boolean; // есть несохранённые изменения
  onClose?: () => void;
  file?: File; // Файл для viewer
  documentId?: number; // Ссылка на документ из БД
}

export interface WorkspaceState {
  // Вкладки
  openTabs: Tab[];
  activeTabId: string | null;

  // Панели
  explorerWidth: number;
  inspectorWidth: number;
  bottomPanelHeight: number;
  explorerCollapsed: boolean;
  inspectorCollapsed: boolean;
  bottomPanelCollapsed: boolean;

  // Режимы
  splitViewEnabled: boolean;
  splitViewRatio: number; // 0.5 = 50/50

  // Действия
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  toggleExplorer: () => void;
  toggleInspector: () => void;
  toggleBottomPanel: () => void;
  toggleSplitView: () => void;
  setExplorerWidth: (width: number) => void;
  setInspectorWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
}

export interface ExplorerNode {
  id: string;
  type: 'project' | 'stage' | 'kit' | 'section' | 'document' | 'task' | 'remark';
  label: string;
  code?: string;
  status?: string;
  count?: number;
  children?: ExplorerNode[];
  expanded?: boolean;
  active?: boolean; // Явное active state для документа
  icon?: React.ReactNode;
  documentId?: number; // Ссылка на документ (для узлов типа document)
}
