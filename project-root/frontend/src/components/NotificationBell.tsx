import { useMemo, useState, useEffect, useCallback } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { getNotifications, markNotificationRead, type Notification } from '@/api/gamification';
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silently fail
    }
  };

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
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Loader2 size={14} className="animate-spin" />
                Загрузка...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-center" style={{ color: 'var(--error)' }}>
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                Нет уведомлений
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="border-b px-4 py-3 last:border-b-0 cursor-pointer"
                  style={{
                    borderColor: 'var(--border-light)',
                    backgroundColor: n.is_read ? 'transparent' : 'var(--bg-hover)',
                  }}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  title={n.is_read ? 'Прочитано' : 'Нажмите, чтобы отметить прочитанным'}
                >
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {n.title}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {n.message}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(n.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}