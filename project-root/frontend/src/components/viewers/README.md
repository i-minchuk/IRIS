# Document Viewers

Компоненты для просмотра файлов различных форматов в документе.

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

// С реальным файлом:
<ViewerContainer file={fileObject} />

// С URL:
<ViewerContainer 
  fileUrl="https://example.com/doc.pdf" 
  fileName="document.pdf"
  mock={false}
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

<PDFViewer 
  fileUrl={url} 
  fileName="document.pdf" 
  mock={false} 
/>
```

## Mock-режим

Когда `mock={true}` или `fileUrl` не указан, viewer показывает format-specific mock контент:

- **PDF**: Макет страницы с текстовыми блоками
- **Image**: Placeholder с иконкой
- **Excel**: Таблица с демо-данными
- **Word**: Документ с заголовками и списками
- **DWG**: Placeholder с кнопкой Autodesk Viewer
- **CSV**: Таблица с демо-данными

## API

### ViewerContainer

```typescript
interface Props {
  // Legacy mode
  file?: File;
  
  // New mode
  fileName?: string;
  fileUrl?: string;
  mock?: boolean;
}
```

### Viewer Props (для всех viewer)

```typescript
interface ViewerProps {
  fileUrl?: string;   // URL файла
  fileName: string;   // Название файла (для заголовка)
  mock?: boolean;     // Режим mock (демо без реального файла)
}
```

### Утилиты

```typescript
import { detectType, VIEWER_CONFIGS, type ViewerType } from '@/components/viewers/types';

// Определить тип файла по названию:
const type: ViewerType = detectType("document.pdf");  // 'pdf'

// Конфигурация viewer:
const config = VIEWER_CONFIGS.pdf;
// { type: 'pdf', label: 'PDF', bgColor: '#fdf0d5', accentColor: '#dc2626' }
```

## Добавление нового формата

1. Создайте компонент `NewFormatViewer.tsx`:

```typescript
import type { ViewerProps } from './types';
import { VIEWER_CONFIGS } from './types';
import { MockViewerBase } from './MockViewerBase';

export const NewFormatViewer: React.FC<ViewerProps> = ({ fileUrl, fileName, mock }) => {
  const config = VIEWER_CONFIGS.newformat;
  
  if (mock || !fileUrl) {
    return (
      <MockViewerBase title={fileName} type={config.label} bgColor={config.bgColor}>
        {/* Mock content */}
      </MockViewerBase>
    );
  }
  
  // Real rendering
  return (
    <MockViewerBase title={fileName} type={config.label} bgColor={config.bgColor}>
      {/* Real content */}
    </MockViewerBase>
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
const NewFormatViewer = lazy(() => import('./NewFormatViewer'));

// В component:
{type === 'newformat' && <NewFormatViewer fileUrl={fileUrl} fileName={fileName} mock={mock} />}
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

## Стили

Все viewer используют CSS-модули (`viewer.module.css`) с CSS-переменными темы:

- `var(--bg-app)` - фон приложения
- `var(--bg-surface)` - фон поверхности
- `var(--border-default)` - границы
- `var(--text-primary)` - основной текст
- `var(--accent-engineering)` - акцентный цвет
