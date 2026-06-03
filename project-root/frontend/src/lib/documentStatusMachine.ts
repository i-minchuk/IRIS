export type DocumentStatus =
  | 'draft'
  | 'in_review'
  | 'review_ok'
  | 'approval'
  | 'approved'
  | 'release'
  | 'archived'
  | 'cancelled';

const TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ['in_review', 'cancelled'],
  in_review: ['review_ok', 'draft', 'cancelled'],
  review_ok: ['approval', 'draft', 'cancelled'],
  approval: ['approved', 'draft', 'cancelled'],
  approved: ['release', 'draft'],
  release: ['archived', 'draft'],
  archived: ['draft'],
  cancelled: ['draft'],
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Черновик',
  in_review: 'На проверке',
  review_ok: 'Проверка ОК',
  approval: 'На согласовании',
  approved: 'Согласован',
  release: 'Выпущен',
  archived: 'В архиве',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: '#6B7280',
  in_review: '#3B82F6',
  review_ok: '#8B5CF6',
  approval: '#F59E0B',
  approved: '#10B981',
  release: '#0EA5E9',
  archived: '#6B7280',
  cancelled: '#EF4444',
};

export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: DocumentStatus): DocumentStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function getNextStatuses(from: DocumentStatus): DocumentStatus[] {
  return getAllowedTransitions(from);
}

export function getStatusLabel(status: DocumentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status: DocumentStatus): string {
  return STATUS_COLORS[status] ?? '#6B7280';
}

export const ALL_STATUSES: DocumentStatus[] = [
  'draft', 'in_review', 'review_ok', 'approval', 'approved', 'release', 'archived', 'cancelled',
];
