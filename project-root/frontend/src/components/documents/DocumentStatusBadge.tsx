import type { DocumentStatus } from '@/lib/documentStatusMachine';
import { getStatusLabel, getStatusColor } from '@/lib/documentStatusMachine';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

export function DocumentStatusBadge({ status, size = 'sm' }: DocumentStatusBadgeProps) {
  const label = getStatusLabel(status);
  const color = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}35`,
      }}
    >
      {label}
    </span>
  );
}
