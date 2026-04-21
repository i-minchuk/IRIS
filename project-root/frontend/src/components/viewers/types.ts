/**
 * Viewer Types - общие типы для всех viewer компонентов
 */

export type ViewerType = 'pdf' | 'image' | 'excel' | 'word' | 'dwg' | 'csv' | 'unsupported';

export interface ViewerProps {
  fileUrl?: string;
  fileName: string;
  mock?: boolean;
  documentId?: number; // Для связи с remarks
}

export interface ViewerConfig {
  type: ViewerType;
  label: string;
  bgColor: string;
  accentColor: string;
  supportsPreview: boolean; // Есть ли полноценный inline preview
}

export const VIEWER_CONFIGS: Record<ViewerType, ViewerConfig> = {
  pdf: {
    type: 'pdf',
    label: 'PDF',
    bgColor: '#fdf0d5',
    accentColor: '#dc2626',
    supportsPreview: true,
  },
  image: {
    type: 'image',
    label: 'Изображение',
    bgColor: '#e0f2e9',
    accentColor: '#7c3aed',
    supportsPreview: true,
  },
  excel: {
    type: 'excel',
    label: 'Excel',
    bgColor: '#d9ead3',
    accentColor: '#16a34a',
    supportsPreview: true,
  },
  word: {
    type: 'word',
    label: 'Word',
    bgColor: '#c9daf8',
    accentColor: '#18559B',
    supportsPreview: true, // Базовый preview через mammoth
  },
  dwg: {
    type: 'dwg',
    label: 'DWG',
    bgColor: '#f4cccc',
    accentColor: '#f59e0b',
    supportsPreview: false, // Честный fallback
  },
  csv: {
    type: 'csv',
    label: 'CSV',
    bgColor: '#fff2cc',
    accentColor: '#6b7280',
    supportsPreview: true,
  },
  unsupported: {
    type: 'unsupported',
    label: 'Неподдерживаемый',
    bgColor: '#f3f4f6',
    accentColor: '#6b7280',
    supportsPreview: false,
  },
};

/**
 * Detect file type from filename
 */
export const detectType = (fileName: string): ViewerType => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'tiff'].includes(ext!)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['xls', 'xlsx', 'xlsm'].includes(ext!)) return 'excel';
  if (['doc', 'docx'].includes(ext!)) return 'word';
  if (ext === 'dwg' || ext === 'dxf') return 'dwg';
  if (ext === 'csv') return 'csv';

  return 'unsupported'; // Явный unsupported вместо default pdf
};

/**
 * Check if viewer type has native preview support
 */
export const hasNativePreview = (type: ViewerType): boolean => {
  return VIEWER_CONFIGS[type].supportsPreview;
};
