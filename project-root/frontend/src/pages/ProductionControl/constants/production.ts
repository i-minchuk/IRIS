import { ProductionStage } from '../types/production';

export const STAGE_CONFIG: Record<ProductionStage, {
  label: string;
  color: string;
  bg: string;
  bgLight: string;
  icon: string;
  order: number;
  group: 'pre_production' | 'production' | 'post_production';
}> = {
  design:          { label: 'Проектирование',       color: '#3b82f6', bg: '#1e3a5f', bgLight: '#dbeafe', icon: '📐', order: 1,  group: 'pre_production' },
  kd_development:  { label: 'Разработка КД',        color: '#6366f1', bg: '#1e1b4b', bgLight: '#e0e7ff', icon: '📄', order: 2,  group: 'pre_production' },
  kd_approval:     { label: 'Согласование КД',      color: '#8b5cf6', bg: '#2e1065', bgLight: '#f3e8ff', icon: '✓',  order: 3,  group: 'pre_production' },
  specification:   { label: 'Спецификация → МТО',   color: '#d946ef', bg: '#701a75', bgLight: '#fce7f3', icon: '📋', order: 4,  group: 'pre_production' },
  procurement:     { label: 'Закупка (МТО)',        color: '#f59e0b', bg: '#78350f', bgLight: '#fef3c7', icon: '🛒', order: 5,  group: 'pre_production' },
  material_ready:  { label: 'Материал на складе',   color: '#22c55e', bg: '#14532d', bgLight: '#dcfce7', icon: '📦', order: 6,  group: 'pre_production' },
  production_prep: { label: 'Подготовка произв.',   color: '#14b8a6', bg: '#134e4a', bgLight: '#ccfbf1', icon: '⚙️', order: 7,  group: 'production' },
  production:      { label: 'Производство',         color: '#06b6d4', bg: '#164e63', bgLight: '#cffafe', icon: '🔧', order: 8,  group: 'production' },
  qc:              { label: 'ОТК / Контроль',       color: '#84cc16', bg: '#3f6212', bgLight: '#ecfccb', icon: '🔍', order: 9,  group: 'production' },
  testing:         { label: 'Испытания',            color: '#eab308', bg: '#713f12', bgLight: '#fef9c3', icon: '▶️', order: 10, group: 'post_production' },
  packaging:       { label: 'Упаковка',             color: '#a855f7', bg: '#4c1d95', bgLight: '#f3e8ff', icon: '📦', order: 11, group: 'post_production' },
  shipment_ready:  { label: 'Готов к отгрузке',     color: '#22c55e', bg: '#14532d', bgLight: '#dcfce7', icon: '✅', order: 12, group: 'post_production' },
  shipped:         { label: 'Отгружен',             color: '#15803d', bg: '#052e16', bgLight: '#dcfce7', icon: '🚚', order: 13, group: 'post_production' },
};

export const OPERATION_STATUS_COLORS = {
  not_started: { border: 'var(--text-muted)',   text: 'var(--text-muted)',   label: 'Не начата' },
  planned:     { border: 'var(--iris-accent-blue)', text: 'var(--iris-accent-blue)', label: 'Запланирована' },
  in_progress: { border: 'var(--iris-accent-cyan)', text: 'var(--iris-accent-cyan)', label: 'В работе' },
  paused:      { border: 'var(--iris-accent-amber)', text: 'var(--iris-accent-amber)', label: 'Приостановлена' },
  completed:   { border: 'var(--iris-accent-green)', text: 'var(--iris-accent-green)', label: 'Выполнена' },
  overdue:     { border: 'var(--iris-accent-coral)', text: 'var(--iris-accent-coral)', label: 'Просрочена' },
  scrap:       { border: 'var(--iris-accent-coral)', text: 'var(--iris-accent-coral)', label: 'Брак' },
};
