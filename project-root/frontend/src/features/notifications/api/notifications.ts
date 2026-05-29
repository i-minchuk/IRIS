import apiClient from '@/shared/api/client';

export type NotificationType =
  | 'task_assigned'
  | 'remark_created'
  | 'workflow_step'
  | 'deadline_approaching'
  | 'document_approved';

export interface NotificationItem {
  id: number;
  type: NotificationType | string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  meta?: Record<string, unknown> | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
}

export async function fetchNotifications(): Promise<NotificationListResponse> {
  const { data } = await apiClient.get<NotificationListResponse>('/notifications');
  return data;
}

export async function markNotificationRead(id: number): Promise<{ ok: boolean }> {
  const { data } = await apiClient.patch<{ ok: boolean }>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const { data } = await apiClient.patch<{ ok: boolean }>('/notifications/read-all');
  return data;
}

export async function deleteNotification(id: number): Promise<{ ok: boolean }> {
  const { data } = await apiClient.delete<{ ok: boolean }>(`/notifications/${id}`);
  return data;
}
