import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationItem,
} from '../api/notifications';
import { useNotificationStore } from '../store/notificationStore';

const typeConfig: Record<string, { color: string; label: string }> = {
  task_assigned: { color: '#3B82F6', label: 'Задача' },
  remark_created: { color: '#FF6B6B', label: 'Замечание' },
  workflow_step: { color: '#D4AF37', label: 'Workflow' },
  deadline_approaching: { color: '#F59E0B', label: 'Дедлайн' },
  document_approved: { color: '#4F7A4C', label: 'Утверждение' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const storeSetItems = useNotificationStore((s) => s.setItems);
  const storeMarkAsRead = useNotificationStore((s) => s.markAsRead);
  const storeMarkAll = useNotificationStore((s) => s.markAllAsRead);
  const storeRemove = useNotificationStore((s) => s.removeNotification);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setItems(data.items);
      setUnreadCount(data.unread_count);
      storeSetItems(data.items, data.unread_count);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkRead = async (id: number) => {
    storeMarkAsRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAll = async () => {
    storeMarkAll();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: number) => {
    storeRemove(id);
    setItems((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => {
      const removed = items.find((n) => n.id === id);
      return removed && !removed.is_read ? Math.max(0, c - 1) : c;
    });
    try {
      await deleteNotification(id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Уведомления
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: 'var(--iris-bg-hover)',
              color: 'var(--iris-accent-blue)',
            }}
          >
            Прочитать все
          </button>
        )}
      </div>

      {loading && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Загрузка…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Нет уведомлений
        </div>
      )}

      <div className="space-y-2">
        {items.map((n) => {
          const cfg = typeConfig[n.type] || { color: '#6B7280', label: n.type };
          const meta = (n.meta ?? {}) as Record<string, unknown>;
          const link = (meta.link as string) || undefined;
          return (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors"
              style={{
                background: n.is_read ? 'var(--iris-bg-surface)' : 'var(--iris-bg-hover)',
                borderColor: 'var(--iris-border-subtle)',
              }}
            >
              <div className="mt-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  {!n.is_read && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#FF6B6B', color: '#fff' }}>
                      Новое
                    </span>
                  )}
                </div>
                <div
                  className="text-sm font-medium mt-0.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {n.title}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {n.message}
                </p>
                <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(n.created_at)}
                </span>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-sm px-2 py-1 rounded transition-colors"
                    style={{
                      background: 'var(--iris-bg-hover)',
                      color: 'var(--iris-accent-blue)',
                    }}
                  >
                    Прочитать
                  </button>
                )}
                {link && (
                  <button
                    onClick={() => navigate(link)}
                    className="text-sm px-2 py-1 rounded transition-colors"
                    style={{
                      background: 'var(--iris-bg-hover)',
                      color: 'var(--iris-accent-blue)',
                    }}
                  >
                    Перейти
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="text-sm px-2 py-1 rounded transition-colors"
                  style={{
                    background: 'transparent',
                    color: '#F87171',
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
