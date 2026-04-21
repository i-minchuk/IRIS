import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';

type LocalNotification = {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const MOCK_NOTIFICATIONS: LocalNotification[] = [
  {
    id: 1,
    type: 'approval',
    message: 'Документ DOC-001 ожидает согласования',
    is_read: false,
    created_at: '2026-04-15T09:00:00Z',
  },
  {
    id: 2,
    type: 'task',
    message: 'Задача по проекту PRJ-001 просрочена',
    is_read: false,
    created_at: '2026-04-15T08:30:00Z',
  },
  {
    id: 3,
    type: 'system',
    message: 'Импорт Excel завершён успешно',
    is_read: true,
    created_at: '2026-04-14T18:00:00Z',
  },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications] = useState<LocalNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-md"
        style={{ color: 'var(--notification-icon)' }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span
            className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{
              backgroundColor: 'var(--notification-badge)',
              color: 'white',
            }}
          >
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-80 rounded-xl border shadow-lg"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div
            className="border-b px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            Уведомления
          </div>

          <div className="max-h-96 overflow-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="border-b px-4 py-3 last:border-b-0"
                style={{
                  borderColor: 'var(--border-light)',
                  backgroundColor: n.is_read ? 'transparent' : 'var(--bg-hover)',
                }}
              >
                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {n.message}
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(n.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}