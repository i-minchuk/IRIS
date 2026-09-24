import { describe, it, expect } from 'vitest';
import { useNotificationStore } from './notificationStore';

describe('useNotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      items: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
    });
  });

  it('has correct initial state', () => {
    const s = useNotificationStore.getState();
    expect(s.items).toEqual([]);
    expect(s.unreadCount).toBe(0);
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('setItems updates items and unreadCount', () => {
    const items = [
      { id: 1, title: 'A', is_read: false },
      { id: 2, title: 'B', is_read: true },
    ] as any;
    useNotificationStore.getState().setItems(items, 1);
    const s = useNotificationStore.getState();
    expect(s.items).toEqual(items);
    expect(s.unreadCount).toBe(1);
  });

  it('markAsRead updates single item and recalculates unreadCount', () => {
    useNotificationStore.setState({
      items: [
        { id: 1, title: 'A', is_read: false },
        { id: 2, title: 'B', is_read: false },
      ] as any,
      unreadCount: 2,
    });
    useNotificationStore.getState().markAsRead(1);
    const s = useNotificationStore.getState();
    expect(s.items[0].is_read).toBe(true);
    expect(s.unreadCount).toBe(1);
  });

  it('markAllAsRead marks every item read and resets unreadCount', () => {
    useNotificationStore.setState({
      items: [
        { id: 1, title: 'A', is_read: false },
        { id: 2, title: 'B', is_read: false },
      ] as any,
      unreadCount: 2,
    });
    useNotificationStore.getState().markAllAsRead();
    const s = useNotificationStore.getState();
    expect(s.items.every((n) => n.is_read)).toBe(true);
    expect(s.unreadCount).toBe(0);
  });

  it('removeNotification filters item and recalculates unreadCount', () => {
    useNotificationStore.setState({
      items: [
        { id: 1, title: 'A', is_read: false },
        { id: 2, title: 'B', is_read: true },
        { id: 3, title: 'C', is_read: false },
      ] as any,
      unreadCount: 2,
    });
    useNotificationStore.getState().removeNotification(1);
    const s = useNotificationStore.getState();
    expect(s.items).toHaveLength(2);
    expect(s.items.find((n) => n.id === 1)).toBeUndefined();
    expect(s.unreadCount).toBe(1);
  });

  it('setLoading toggles loading state', () => {
    useNotificationStore.getState().setLoading(true);
    expect(useNotificationStore.getState().isLoading).toBe(true);
    useNotificationStore.getState().setLoading(false);
    expect(useNotificationStore.getState().isLoading).toBe(false);
  });

  it('setError stores error message', () => {
    useNotificationStore.getState().setError('Network failure');
    expect(useNotificationStore.getState().error).toBe('Network failure');
    useNotificationStore.getState().setError(null);
    expect(useNotificationStore.getState().error).toBeNull();
  });
});
