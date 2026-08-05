# Document Viewers

Компоненты для просмотра файлов различных форматов в документе. Поддерживают как загрузку по URL, так и прямую работу с `File`-объектами (drag-and-drop, автозагрузка).

## Поддерживаемые форматы

| Формат | Компонент | Статус | Возможности |
|--------|-----------|--------|-------------|
| **PDF** | `PDFViewer` | ✅ Полный | Рендеринг страниц, зум, навигация |
| **Изображения** | `ImageViewer` | ✅ Полный | PNG, JPG, JPEG, WebP, SVG, TIFF |
| **Excel** | `ExcelViewer` | ✅ Полный | XLS, XLSX, multiple sheets |
| **Word** | `WordViewer` | ✅ Полный | DOC, DOCX (через mammoth.js) |
| **DWG/DXF** | `DWGViewer` | ✅ Fallback | Ссылки на Autodesk Viewer |
| **CSV** | `CSVViewer` | ✅ Полный | Парсинг и отображение таблиц |

## Архитектура

```
viewers/
├── ViewerContainer.tsx      # Главный роутер (определяет тип → рендерит viewer)
├── DocumentViewerHost.tsx   # Интеграция с workspace (store → viewer)
├── ViewerShell.tsx          # Единая обёртка: toolbar, загрузка, ошибки, drag-and-drop
├── MockViewerBase.tsx       # Базовый компонент для mock-режима
├── types.ts                 # Общие типы и утилиты
├── viewer.module.css        # Стили для всех viewer
│
├── PDFViewer.tsx            # PDF viewer (pdfjs-dist)
├── ImageViewer.tsx          # Image viewer
├── ExcelViewer.tsx          # Excel viewer (SheetJS/xlsx)
├── WordViewer.tsx           # Word viewer (mammoth)
├── DWGViewer.tsx            # DWG fallback viewer
└── CSVViewer.tsx            # CSV viewer
```

## Использование

### Базовое (через DocumentViewerHost)

```typescript
import DocumentViewerHost from '@/components/viewers/DocumentViewerHost';

// В компоненте страницы:
export function ProjectsPage() {
  return (
    <div className="workspace">
      <ExplorerSidebar />
      <DocumentViewerHost />  {/* Автоматически определяет и показывает файл */}
      <RemarksSidebar />
    </div>
  );
}
```

### Продвинутое (через ViewerContainer)

```typescript
import { ViewerContainer } from '@/components/viewers/ViewerContainer';

// С File-объектом (drag-and-drop / автозагрузка):
<ViewerContainer file={fileObject} />

// С URL:
<ViewerContainer 
  fileUrl="https://example.com/doc.pdf" 
  fileName="document.pdf"
/>

// В mock-режиме (демо):
<ViewerContainer 
  fileName="КМ1-А01.pdf" 
  mock={true}
/>
```

### Прямое использование viewer

```typescript
import { PDFViewer } from '@/components/viewers/PDFViewer';

// С File-объектом:
<PDFViewer file={fileObject} fileName="document.pdf" />

// С URL:
<PDFViewer fileUrl={url} fileName="document.pdf" />

// Mock-режим:
<PDFViewer fileName="document.pdf" mock={true} />
```

## Mock-режим

Когда `mock={true}` или источник (`file` / `fileUrl`) не указан, viewer показывает format-specific mock контент:

- **PDF**: Макет страницы с текстовыми блоками
- **Image**: Placeholder с иконкой
- **Excel**: Таблица с демо-данными
- **Word**: Документ с заголовками и списками
- **DWG**: Placeholder с кнопкой Autodesk Viewer
- **CSV**: Таблица с демо-данными

## API

### ViewerContainer

```typescript
interface ViewerContainerProps {
  file?: File;           // Прямой File-объект
  fileUrl?: string;      // URL файла (remote или blob)
  fileName?: string;     // Имя файла (если не передан File)
  mock?: boolean;        // Принудительный демо-режим
}
```

### Viewer Props (для всех viewer)

```typescript
interface ViewerProps {
  file?: File;           // Прямой File-объект
  fileUrl?: string;      // URL файла
  fileName: string;      // Название файла (для заголовка)
  mock?: boolean;        // Режим mock (демо без реального файла)
  documentId?: number;   // Для связи с remarks
}
```

### ViewerShell (единая обёртка)

```typescript
import { ViewerShell } from '@/components/viewers/ViewerShell';

<ViewerShell
  file={file}
  fileUrl={fileUrl}
  fileName={fileName}
  fileType="pdf"
  onFileDrop={(f) => console.log('Dropped:', f)}
  onDownload={() => downloadFile()}
  loading={false}
  error={null}
  loadingText="Загрузка..."
  errorActions={<button>Скачать</button>}
  showZoom
  zoom={1}
  onZoomIn={() => {}}
  onZoomOut={() => {}}
  onZoomReset={() => {}}
  showPagination
  currentPage={1}
  totalPages={5}
  onPrevPage={() => {}}
  onNextPage={() => {}}
  onPageChange={(p) => {}}
  sheets={['Sheet1', 'Sheet2']}
  activeSheet="Sheet1"
  onSheetChange={(s) => {}}
>
  {/* Контент viewer */}
</ViewerShell>
```

### Утилиты

```typescript
import {
  detectType,
  VIEWER_CONFIGS,
  readFileAsArrayBuffer,
  readFileAsText,
  fetchAsArrayBuffer,
  fetchAsText,
  createObjectUrlForFile,
  type ViewerType,
} from '@/components/viewers/types';

// Определить тип файла по названию:
const type: ViewerType = detectType("document.pdf");  // 'pdf'

// Конфигурация viewer:
const config = VIEWER_CONFIGS.pdf;
// { type: 'pdf', label: 'PDF', bgColor: '#fdf0d5', accentColor: '#dc2626', supportsPreview: true }

// Чтение File как ArrayBuffer:
const buffer = await readFileAsArrayBuffer(file);

// Чтение File как текст:
const text = await readFileAsText(file);

// Загрузка URL как ArrayBuffer:
const buffer = await fetchAsArrayBuffer("https://example.com/file.xlsx");

// Создание временного object URL:
const url = createObjectUrlForFile(file);
// Не забудьте: URL.revokeObjectURL(url) после использования
```

## Добавление нового формата

1. Создайте компонент `NewFormatViewer.tsx`:

```typescript
import type { ViewerProps } from './types';
import { ViewerShell } from './ViewerShell';
import styles from './viewer.module.css';

export const NewFormatViewer: React.FC<ViewerProps> = ({
  file,
  fileUrl,
  fileName,
  mock = false,
}) => {
  const hasSource = Boolean(file || fileUrl);

  return (
    <ViewerShell
      file={file}
      fileUrl={fileUrl}
      fileName={fileName}
      fileType="newformat"
    >
      {mock || !hasSource ? (
        <div>Mock content</div>
      ) : (
        <div>Real content</div>
      )}
    </ViewerShell>
  );
};
```

2. Добавьте тип в `types.ts`:

```typescript
export type ViewerType = 'pdf' | 'image' | 'excel' | 'word' | 'dwg' | 'csv' | 'newformat';

export const VIEWER_CONFIGS: Record<ViewerType, ViewerConfig> = {
  // ...
  newformat: {
    type: 'newformat',
    label: 'New Format',
    bgColor: '#f0f0f0',
    accentColor: '#666666',
    supportsPreview: true,
  },
};
```

3. Добавьте в `detectType`:

```typescript
export const detectType = (fileName: string): ViewerType => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (ext === 'newext') return 'newformat';
  // ...
};
```

4. Добавьте в `ViewerContainer`:

```typescript
const NewFormatViewer = lazy(() => import('./NewFormatViewer').then(m => ({ default: m.NewFormatViewer })));

// В component:
{type === 'newformat' && <NewFormatViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />}
```

## Зависимости

```json
{
  "pdfjs-dist": "^4.x",
  "xlsx": "^0.18.x",
  "mammoth": "^1.6.x"
}
```

## Интеграция с workspace

`DocumentViewerHost` автоматически:
1. Получает активную вкладку из `useWorkspaceStore()`
2. Проверяет наличие `file` в tab
3. Если файл есть → рендерит viewer с реальным файлом
4. Если файла нет → рендерит mock viewer по названию

## Drag-and-drop

Все viewers обёрнуты в `DragDropOverlay`. При перетаскивании файла поверх viewer появляется оверлей с приглашением отпустить файл. Обработка drop делегируется через `onFileDrop` пропс.

## Стили

Все viewer используют CSS-модули (`viewer.module.css`) с CSS-переменными темы:

- `var(--bg-app)` - фон приложения
- `var(--bg-surface)` - фон поверхности
- `var(--border-default)` - границы
- `var(--text-primary)` - основной текст
- `var(--accent-engineering)` - акцентный цвет
