/**
 * Document Viewers - компоненты для просмотра файлов разных форматов
 * 
 * Поддерживаемые форматы:
 * - PDF (.pdf) - полноценный viewer с навигацией по страницам и зумом
 * - Изображения (.png, .jpg, .jpeg, .webp, .svg, .tiff) - viewer с зумом и поворотом
 * - Excel (.xls, .xlsx) - просмотр таблиц с поддержкой multiple sheets
 * - Word (.doc, .docx) - fallback strategy с возможностью скачивания
 * - DWG/DXF (.dwg, .dxf) - CAD viewer с интеграцией Autodesk Viewer
 * - CSV (.csv) - упрощённый просмотр
 */

// Экспорт ViewerContainer как главного компонента-роутера
export { ViewerContainer, default } from './ViewerContainer';

// Экспорт типов
export type { ViewerType, ViewerProps, ViewerConfig } from './types';
export { VIEWER_CONFIGS, detectType } from './types';

// Экспорт отдельных viewer компонентов (для продвинутого использования)
export { PDFViewer } from './PDFViewer';
export { ImageViewer } from './ImageViewer';
export { ExcelViewer } from './ExcelViewer';
export { WordViewer } from './WordViewer';
export { DWGViewer } from './DWGViewer';
export { CSVViewer } from './CSVViewer';
export { UnsupportedViewer } from './UnsupportedViewer';

// Экспорт MockViewerBase для создания кастомных viewer
export { MockViewerBase } from './MockViewerBase';

// Экспорт утилит
// (types.ts экспортируется выше)
