# Модуль: Frontend Components

## Назначение
Общие компоненты: UI-примитивы, вьюверы, workspace, ChromeBot.

## Структура
```
frontend/src/components/
  ui/              # Примитивы
  viewers/         # Мультиформатный просмотрщик
  workspace/       # VS Code-like workspace
  ChromeBot.tsx    # IRIS mascot
  Layout.tsx       # Главный shell
  Sidebar.tsx      # Legacy sidebar
  Breadcrumbs.tsx, StatusBadge.tsx, StatusBar.tsx
  NotificationBell.tsx, DailyQuestWidget.tsx
  SPIIndicator.tsx, DepartmentLoad.tsx
```

## UI Primitives (`components/ui/`)
Экспортируются из `index.ts`:
- `Badge`, `Button`, `Card`, `Tabs`, `Input`, `Select`, `Modal`, `Avatar`

## Viewers (`components/viewers/`)
Поддерживаемые форматы: PDF, Images, Excel, Word, DWG/DXF, CSV
- `ViewerContainer` — роутинг по типу файла
- `PDFViewer`, `ImageViewer`, `ExcelViewer`, `WordViewer`, `DWGViewer`, `CSVViewer`
- `MockViewerBase`, `Toolbar`, `DragDropOverlay`, `FileIcon`

## Workspace (`components/workspace/`)
VS Code-like layout:
- `WorkspaceLayout` — основной shell
- `ExplorerSidebar` — дерево файлов
- `EditorTabs`, `EditorArea` — вкладки редактирования
- `InspectorPanel` — правая панель свойств
- `BottomPanel` — нижняя панель
- `ActivityBar`, `Breadcrumbs`, `ScaleControl`
- `DocumentWorkspace` — высокоуровневый компонент
- `workspaceStore.ts` — Zustand + persist

## ChromeBot.tsx
- Единый компонент с пропом `variant: 'dark' | 'light'`
- SVG-анимации через CSS @keyframes
- 5 orbiting stars, 4 sparkles, blink, glow, shadow pulse
- Welcome animation (`botAppear`)

## Правила параллельной разработки
- UI-примитивы — **базовые**, изменения затрагивают всё приложение
- Viewers — можно добавлять новые форматы
- Workspace store — persisted, **НЕ удалять** ключи без миграции localStorage
