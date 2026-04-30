// src/pages/ProjectPortfolioPage/constants/projectStatuses.ts
import { ProjectStatus } from '../types/project';

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string;
    color: string;
    bg: string;
    icon: string;
    order: number;
  }
> = {
  initiation: {
    label: 'Инициация',
    color: '#3b82f6',
    bg: '#1e3a5f',
    icon: '🚀',
    order: 1,
  },
  design: {
    label: 'Проектирование',
    color: '#6366f1',
    bg: '#1e1b4b',
    icon: '📐',
    order: 2,
  },
  documentation: {
    label: 'Документация',
    color: '#8b5cf6',
    bg: '#2e1065',
    icon: '📄',
    order: 3,
  },
  approval: {
    label: 'Согласование',
    color: '#a855f7',
    bg: '#4c1d95',
    icon: '✓',
    order: 4,
  },
  procurement: {
    label: 'Закупки',
    color: '#d946ef',
    bg: '#701a75',
    icon: '🛒',
    order: 5,
  },
  production: {
    label: 'Производство',
    color: '#f59e0b',
    bg: '#78350f',
    icon: '⚙️',
    order: 6,
  },
  delivery: {
    label: 'Поставка',
    color: '#22c55e',
    bg: '#14532d',
    icon: '🚚',
    order: 7,
  },
  installation: {
    label: 'Монтаж',
    color: '#14b8a6',
    bg: '#134e4a',
    icon: '🔧',
    order: 8,
  },
  commissioning: {
    label: 'Пусконаладка',
    color: '#06b6d4',
    bg: '#164e63',
    icon: '▶️',
    order: 9,
  },
  completed: {
    label: 'Завершен',
    color: '#15803d',
    bg: '#052e16',
    icon: '✅',
    order: 10,
  },
};

export const PROJECT_PRIORITY_CONFIG = {
  low: { label: 'Низкий', color: '#22c55e', bg: '#14532d' },
  medium: { label: 'Средний', color: '#f59e0b', bg: '#78350f' },
  high: { label: 'Высокий', color: '#ef4444', bg: '#7f1d1d' },
  critical: { label: 'Критичный', color: '#dc2626', bg: '#450a0a' },
};
