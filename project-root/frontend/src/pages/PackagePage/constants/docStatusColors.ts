import { DocumentStatus, AuthorType } from '../types/package';

export const DOC_STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
  not_started: { bg: '#334155', text: '#94A3B8', label: 'Не начат' },
  in_progress: { bg: '#F59E0B', text: '#1E2230', label: 'В работе' },
  sent:        { bg: '#22C55E', text: '#1E2230', label: 'Отправлен' },
  approved:    { bg: '#15803D', text: '#FFFFFF', label: 'Утвержден' },
  remarks:     { bg: '#EA580C', text: '#FFFFFF', label: 'Замечания' },
  deleted:     { bg: '#1E2230', text: '#FFFFFF', label: 'Удален' },
  cancelled:   { bg: '#EF4444', text: '#FFFFFF', label: 'Аннулирован' },
};

export const AUTHOR_COLORS: Record<AuthorType, string> = {
  customer: '#ef4444',
  pdo: '#22c55e',
  project_manager: '#3b82f6',
  tender: '#f59e0b',
  otk: '#a855f7',
};

export const AUTHOR_LABELS: Record<AuthorType, string> = {
  customer: 'Заказчик',
  pdo: 'ПДО',
  project_manager: 'Руководитель проекта',
  tender: 'Тендерщик',
  otk: 'ОТК',
};
