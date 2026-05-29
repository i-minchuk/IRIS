import { create } from 'zustand';
import type { NotificationItem } from '../api/notifications';

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  setItems: (items: NotificationItem[], unreadCount: number) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  setItems: (items, unreadCount) => set({ items, unreadCount }),
  markAsRead: (id) =>
    set((state) => {
      const updated = state.items.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      const unreadCount = updated.filter((n) => !n.is_read).length;
      return { items: updated, unreadCount };
    }),
  markAllAsRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => {
      const updated = state.items.filter((n) => n.id !== id);
      const unreadCount = updated.filter((n) => !n.is_read).length;
      return { items: updated, unreadCount };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
