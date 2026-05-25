# Модуль: Frontend State Management

## Назначение
Zustand-сторы для управления состоянием.

## Сторы
| Store | Файл | Persist | Описание |
|-------|------|---------|----------|
| `useAuthStore` | `features/auth/store/authStore.ts` | Нет | Auth: user, token, `isAuthenticated` |
| `useZoomStore` | `features/zoom/store/zoomStore.ts` | Да | Zoom scale 0.75–1.5 |
| `useWorkspaceStore` | `components/workspace/store/workspaceStore.ts` | Да (partial) | Tabs, selected doc, panel sizes |
| `useArchiveStore` | `pages/ArchivePage/store/archiveStore.ts` | Нет | Archive timeline, materials |
| `useRemarksStore` | `stores/remarksStore.ts` | Нет | Remarks CRUD, filters, stats |
| `useCollaborationStore` | `features/collaboration/store/collaborationStore.ts` | Нет | WS state, presence, locked docs |

## Auth Store
```ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

## Zoom Store
```ts
interface ZoomState {
  scale: number;
  setScale: (scale: number) => void;
  setHidden: (hidden: boolean) => void;
}
```
- Persisted в localStorage
- Применяет CSS `zoom` к корневому элементу Layout

## Workspace Store
```ts
interface WorkspaceState {
  tabs: Tab[];
  selectedDocumentId: string | null;
  panelWidths: { explorer: number; inspector: number };
  bottomPanelHeight: number;
  collapsedPanels: string[];
  contentScale: number;
  explorerNodes: Node[];
}
```

## Remarks Store
Полный CRUD для замечаний:
- `remarks`, `currentRemark`, `statistics`, `tags`
- `filters`, `comments`, `actions`
- Асинхронные actions с API-вызовами

## Правила параллельной разработки
- **Zustand only** — не добавлять Redux
- Persist store — **НЕ менять** ключи без `version` в persist-конфиге
- Auth store — **не persist**, токен в localStorage отдельно
- Store можно создавать в `features/{name}/store/` или `stores/`
