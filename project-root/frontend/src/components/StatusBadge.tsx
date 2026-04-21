type StatusBadgeProps = {
  status?: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'var(--info-light)', text: 'var(--info)' },
  archived: { bg: 'var(--bg-hover)', text: 'var(--text-secondary)' },
  completed: { bg: 'var(--success-light)', text: 'var(--success)' },
  inprogress: { bg: 'var(--warning-light)', text: 'var(--warning)' },
  notstarted: { bg: 'var(--bg-hover)', text: 'var(--text-secondary)' },
  overdue: { bg: 'var(--error-light)', text: 'var(--error)' },
  low: { bg: 'var(--success-light)', text: 'var(--success)' },
  medium: { bg: 'var(--warning-light)', text: 'var(--warning)' },
  high: { bg: 'var(--error-light)', text: 'var(--error)' },
};

const LABEL_MAP: Record<string, string> = {
  active: "Active",
  archived: "Archived",
  completed: "Completed",
  inprogress: "In progress",
  notstarted: "Not started",
  overdue: "Overdue",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function StatusBadge({ status = "unknown" }: StatusBadgeProps) {
  const key = String(status).toLowerCase().replace(/[\s_-]/g, "");
  const colors = STATUS_COLORS[key] ?? { bg: 'var(--bg-hover)', text: 'var(--text-secondary)' };
  const label = LABEL_MAP[key] ?? status;

  return (
    <span 
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}