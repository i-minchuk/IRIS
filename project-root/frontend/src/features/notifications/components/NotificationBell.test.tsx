import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationBell from './NotificationBell';
import { useNotificationStore } from '../store/notificationStore';

vi.mock('../api/notifications', () => ({
  fetchNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock('./NotificationDropdown', () => ({
  __esModule: true,
  default: ({ items, unreadCount, onMarkRead, onMarkAllRead }: any) => (
    <div data-testid="dropdown">
      <span data-testid="dropdown-count">{unreadCount}</span>
      <span data-testid="dropdown-items">{items.length}</span>
      <button data-testid="mark-all" onClick={onMarkAllRead}>Mark all</button>
      {items.map((item: any) => (
        <button key={item.id} data-testid={`read-${item.id}`} onClick={() => onMarkRead(item.id)}>
          {item.title}
        </button>
      ))}
    </div>
  ),
}));

import { fetchNotifications } from '../api/notifications';

describe('NotificationBell', () => {
  beforeEach(() => {
    useNotificationStore.setState({ items: [], unreadCount: 0, isLoading: false, error: null });
    vi.clearAllMocks();
    (fetchNotifications as any).mockResolvedValue({ items: [], unread_count: 0 });
  });

  it('renders bell button with aria-label', () => {
    render(<NotificationBell />);
    expect(screen.getByLabelText('Уведомления')).toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', async () => {
    (fetchNotifications as any).mockResolvedValue({ items: [{ id: 1, title: 'A', is_read: false }], unread_count: 3 });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });

  it('shows 9+ when unreadCount > 9', async () => {
    (fetchNotifications as any).mockResolvedValue({ items: [], unread_count: 12 });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText('9+')).toBeInTheDocument());
  });

  it('does not show badge when unreadCount is 0', async () => {
    (fetchNotifications as any).mockResolvedValue({ items: [], unread_count: 0 });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.queryByText('0')).not.toBeInTheDocument());
  });

  it('toggles dropdown on click', async () => {
    (fetchNotifications as any).mockResolvedValue({ items: [], unread_count: 0 });
    render(<NotificationBell />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());
    const btn = screen.getByLabelText('Уведомления');
    fireEvent.click(btn);
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape key', async () => {
    (fetchNotifications as any).mockResolvedValue({ items: [], unread_count: 0 });
    render(<NotificationBell />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText('Уведомления'));
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('closes dropdown on click outside', async () => {
    (fetchNotifications as any).mockResolvedValue({ items: [], unread_count: 0 });
    render(<NotificationBell />);
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText('Уведомления'));
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
  });

  it('calls markAllRead handler', async () => {
    (fetchNotifications as any).mockResolvedValue({ items: [{ id: 1, title: 'A', is_read: false }], unread_count: 1 });
    render(<NotificationBell />);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Уведомления'));
    fireEvent.click(screen.getByTestId('mark-all'));
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
