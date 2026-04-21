import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tab, ExplorerNode } from '../types/workspace.types';

const DEFAULT_EXPLORER_WIDTH = 280;
const DEFAULT_INSPECTOR_WIDTH = 280;
const DEFAULT_BOTTOM_PANEL_HEIGHT = 220;
const DEFAULT_CONTENT_SCALE = 100;

export type ContentScale = 90 | 100 | 110 | 120;

// Новая типизация для документа
export interface SelectedDocument {
  id: number;
  code: string;
  title: string;
  fileUrl?: string;
  fileName: string;
  project_id: number;
  status?: string;
  doc_type?: string;
  discipline?: string;
}

interface WorkspaceStore {
  // Вкладки
  openTabs: Tab[];
  activeTabId: string | null;

  // Активный документ (single source of truth)
  selectedDocument: SelectedDocument | null;

  // Панели - размеры
  explorerWidth: number;
  inspectorWidth: number;
  bottomPanelHeight: number;

  // Состояние панелей
  explorerCollapsed: boolean;
  inspectorCollapsed: boolean;
  bottomPanelCollapsed: boolean;

  // Режимы
  splitViewEnabled: boolean;
  splitViewRatio: number;

  // Масштаб контента
  contentScale: ContentScale;

  // Explorer data
  explorerData: ExplorerNode[];
  activeExplorerNode: string | null;

  // Actions для вкладок
  setTabs: (tabs: Tab[]) => void;
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  setActiveTab: (tabId: string) => void;

  // Actions для документа
  setSelectedDocument: (doc: SelectedDocument | null) => void;

  // Actions для панелей
  toggleExplorer: () => void;
  toggleInspector: () => void;
  toggleBottomPanel: () => void;
  setExplorerWidth: (width: number) => void;
  setInspectorWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;

  // Actions для масштабирования
  setContentScale: (scale: ContentScale) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Actions для Explorer
  setExplorerData: (data: ExplorerNode[]) => void;
  toggleExplorerNode: (nodeId: string) => void;
  setActiveExplorerNode: (nodeId: string | null) => void;

  // Split view
  toggleSplitView: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      // Вкладки
      openTabs: [],
      activeTabId: null,

      // Активный документ
      selectedDocument: null,

      // Панели - размеры
      explorerWidth: DEFAULT_EXPLORER_WIDTH,
      inspectorWidth: DEFAULT_INSPECTOR_WIDTH,
      bottomPanelHeight: DEFAULT_BOTTOM_PANEL_HEIGHT,

      // Состояние панелей
      explorerCollapsed: false,
      inspectorCollapsed: false,
      bottomPanelCollapsed: false,

      // Режимы
      splitViewEnabled: false,
      splitViewRatio: 0.5,

      // Масштаб контента
      contentScale: DEFAULT_CONTENT_SCALE as ContentScale,

      // Explorer data
      explorerData: [],
      activeExplorerNode: null,

      // Actions для вкладок
      setTabs: (tabs) => set({ openTabs: tabs }),

      addTab: (tab) =>
        set((state) => {
          const exists = state.openTabs.find((t) => t.id === tab.id);
          if (exists) {
            // Таб уже открыт, просто активируем
            return {
              activeTabId: tab.id,
              openTabs: state.openTabs.map((t) =>
                t.id === tab.id ? { ...t, ...tab } : t
              ),
            };
          }
          return {
            openTabs: [...state.openTabs, { ...tab, isActive: true }],
            activeTabId: tab.id,
          };
        }),

      removeTab: (tabId) =>
        set((state) => {
          const newTabs = state.openTabs.filter((t) => t.id !== tabId);
          let newActiveTabId = state.activeTabId;

          // Если закрыли активный таб, активируем предыдущий
          if (state.activeTabId === tabId) {
            const tabIndex = state.openTabs.findIndex((t) => t.id === tabId);
            const prevTab = newTabs[tabIndex - 1] || newTabs[tabIndex];
            newActiveTabId = prevTab?.id || null;
          }

          return {
            openTabs: newTabs.map((t) => ({
              ...t,
              isActive: t.id === newActiveTabId,
            })),
            activeTabId: newActiveTabId,
          };
        }),

      updateTab: (tabId, updates) =>
        set((state) => ({
          openTabs: state.openTabs.map((t) =>
            t.id === tabId ? { ...t, ...updates } : t
          ),
        })),

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      // Actions для документа
      setSelectedDocument: (doc) => set({ selectedDocument: doc }),

      // Actions для панелей
      toggleExplorer: () =>
        set((state) => ({ explorerCollapsed: !state.explorerCollapsed })),

      toggleInspector: () =>
        set((state) => ({ inspectorCollapsed: !state.inspectorCollapsed })),

      toggleBottomPanel: () =>
        set((state) => ({ bottomPanelCollapsed: !state.bottomPanelCollapsed })),

      setExplorerWidth: (width) => set({ explorerWidth: Math.max(200, Math.min(400, width)) }),

      setInspectorWidth: (width) => set({ inspectorWidth: Math.max(200, Math.min(400, width)) }),

      setBottomPanelHeight: (height) =>
        set({ bottomPanelHeight: Math.max(150, Math.min(400, height)) }),

      // Actions для масштабирования
      setContentScale: (scale) => set({ contentScale: scale }),
      
      zoomIn: () =>
        set((state) => {
          const scales: ContentScale[] = [90, 100, 110, 120];
          const currentIndex = scales.indexOf(state.contentScale);
          const nextIndex = Math.min(currentIndex + 1, scales.length - 1);
          return { contentScale: scales[nextIndex] };
        }),

      zoomOut: () =>
        set((state) => {
          const scales: ContentScale[] = [90, 100, 110, 120];
          const currentIndex = scales.indexOf(state.contentScale);
          const nextIndex = Math.max(currentIndex - 1, 0);
          return { contentScale: scales[nextIndex] };
        }),

      resetZoom: () => set({ contentScale: DEFAULT_CONTENT_SCALE as ContentScale }),

      // Actions для Explorer
      setExplorerData: (data) => set({ explorerData: data }),

      toggleExplorerNode: (nodeId) =>
        set((state) => ({
          explorerData: toggleNodeExpanded(state.explorerData, nodeId),
        })),

      setActiveExplorerNode: (nodeId) => set({ activeExplorerNode: nodeId }),

      // Split view
      toggleSplitView: () =>
        set((state) => ({ splitViewEnabled: !state.splitViewEnabled })),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        explorerWidth: state.explorerWidth,
        inspectorWidth: state.inspectorWidth,
        bottomPanelHeight: state.bottomPanelHeight,
        explorerCollapsed: state.explorerCollapsed,
        inspectorCollapsed: state.inspectorCollapsed,
        bottomPanelCollapsed: state.bottomPanelCollapsed,
        contentScale: state.contentScale,
      }),
    }
  )
);

// Рекурсивная функция для разворачивания/сворачивания узлов дерева
function toggleNodeExpanded(nodes: ExplorerNode[], nodeId: string): ExplorerNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return { ...node, children: toggleNodeExpanded(node.children, nodeId) };
    }
    return node;
  });
}
