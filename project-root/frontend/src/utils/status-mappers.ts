export const STATUS_BADGE_VARIANTS: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'indigo'> = {
  active: 'green',
  in_progress: 'blue',
  completed: 'gray',
  not_started: 'gray',
  on_review: 'yellow',
  approved: 'green',
  draft: 'gray',
  archived: 'gray',
  low: 'green',
  medium: 'yellow',
  high: 'red',
  superseded: 'gray',
};

export const STATUS_BADGE_LABELS: Record<string, string> = {
  active: 'Активный',
  in_progress: 'В работе',
  completed: 'Завершён',
  not_started: 'Не начата',
  on_review: 'На проверке',
  approved: 'Утверждён',
  draft: 'Черновик',
  archived: 'Архив',
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  superseded: 'Замещен',
};

export function mapStatusToBadgeVariant(status: string): 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'indigo' {
  return STATUS_BADGE_VARIANTS[status] || 'gray';
}

export function mapStatusToBadgeLabel(status: string): string {
  return STATUS_BADGE_LABELS[status] || status;
}
