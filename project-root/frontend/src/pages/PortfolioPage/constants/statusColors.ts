// src/pages/PortfolioPage/constants/statusColors.ts
import { DocumentStatus, AuthorType, StatusColor } from '../types/portfolio';

/**
 * Цвета статусов документов согласно бренд-буку ДокПоток IRIS
 */
export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, StatusColor> = {
  customer_deleted: {
    bg: '#1E2230',
    text: '#FFFFFF',
    opacity: 1,
    label: 'Удалены заказчиком',
  },
  in_progress: {
    bg: '#F59E0B',
    text: '#1E2230',
    opacity: 1,
    label: 'В работе',
  },
  sent: {
    bg: '#22C55E',
    text: '#1E2230',
    opacity: 1,
    label: 'Отправлены',
  },
  accepted: {
    bg: '#15803D',
    text: '#FFFFFF',
    opacity: 1,
    label: 'Приняты',
  },
  remarks: {
    bg: '#EA580C',
    text: '#FFFFFF',
    opacity: 1,
    label: 'Замечания',
  },
  excluded: {
    bg: '#64748B',
    text: '#FFFFFF',
    opacity: 0.3,
    label: 'Исключены',
  },
  not_started: {
    bg: '#334155',
    text: '#94A3B8',
    opacity: 1,
    label: 'Не начаты',
  },
};

/**
 * Цвета авторов замечаний
 */
export const AUTHOR_COLORS: Record<AuthorType, string> = {
  customer: '#ef4444',
  pdo: '#22c55e',
  project_manager: '#3b82f6',
  tender: '#f59e0b',
  otk: '#a855f7',
};
