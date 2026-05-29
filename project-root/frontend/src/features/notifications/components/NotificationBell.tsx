import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const items = useNotificationStore((s) => s.items);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setItems = useNotificationStore((s) => s.setItems);
  const markAsReadLocal = useNotificationStore((s) => s.markAsRead);
  const markAllLocal = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    let mounted = true;
    fetchNotifications()
      .then((data) => {
        if (mounted) setItems(data.items, data.unread_count);
      })
      .catch(() => {
        // silently fail on initial load
      });
    return () => {
      mounted = false;
    };
  }, [setItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleMarkRead = async (id: number) => {
    markAsReadLocal(id);
    try {
      await markNotificationRead(id);
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    markAllLocal();
    try {
      await markAllNotificationsRead();
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Уведомления"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
            style={{ background: '#FF6B6B', color: '#FFFFFF' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          items={items}
          unreadCount={unreadCount}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
