import { useNavigate } from 'react-router-dom';
import type { NotificationItem, NotificationType } from '../api/notifications';

const typeConfig: Record<NotificationType | string, { color: string; label: string }> = {
  task_assigned: { color: '#3B82F6', label: 'Задача' },
  remark_created: { color: '#FF6B6B', label: 'Замечание' },
  workflow_step: { color: '#D4AF37', label: 'Workflow' },
  deadline_approaching: { color: '#F59E0B', label: 'Дедлайн' },
  document_approved: { color: '#4F7A4C', label: 'Утверждение' },
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'вчера';
  return `${days} дн назад`;
}

interface Props {
  items: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export default function NotificationDropdown({
  items,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const recent = items.slice(0, 5);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.is_read) onMarkRead(n.id);
    onClose();
    const meta = (n.meta ?? {}) as Record<string, unknown>;
    const link = (meta.link as string) || undefined;
    if (link) navigate(link);
  };

  return (
    <div
      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border shadow-lg overflow-hidden"
      style={{
        background: 'var(--iris-bg-surface)',
        borderColor: 'var(--iris-border-subtle)',
        boxShadow: 'var(--iris-shadow-lg)',
        zIndex: 50,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--iris-border-subtle)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Уведомления
        </span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs hover:underline"
            style={{ color: 'var(--iris-accent-blue)' }}
          >
            Прочитать все
          </button>
        )}
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {recent.length === 0 && (
          <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Нет уведомлений
          </div>
        )}
        {recent.map((n) => {
          const cfg = typeConfig[n.type] || { color: '#6B7280', label: n.type };
          return (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className="flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
              style={{
                borderColor: 'var(--iris-border-subtle)',
                background: n.is_read ? 'transparent' : 'var(--iris-bg-hover)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--iris-bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!n.is_read) e.currentTarget.style.background = 'var(--iris-bg-hover)';
                else e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="mt-0.5 shrink-0">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-medium"
                    style={{ color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}
                  >
                    {n.title}
                  </span>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF6B6B' }} />}
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {n.message}
                </p>
                <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
                  {formatTimeAgo(n.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="px-4 py-2 border-t text-center"
        style={{ borderColor: 'var(--iris-border-subtle)' }}
      >
        <button
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="text-xs hover:underline"
          style={{ color: 'var(--iris-accent-blue)' }}
        >
          Все уведомления →
        </button>
      </div>
    </div>
  );
}
