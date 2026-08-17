import client from '@/shared/api/client';

export type CalendarEventType =
  | 'project'
  | 'task'
  | 'tender'
  | 'operation'
  | 'document'
  | 'birthday'
  | 'personal';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  is_global: boolean;
  is_editable: boolean;
  source: 'system' | 'user';
  details: {
    status?: string;
    priority?: string;
    customer?: string;
    description?: string;
    entity_id?: number;
  };
}

export interface CalendarEventCreatePayload {
  title: string;
  date: string; // YYYY-MM-DD
  type?: CalendarEventType;
  description?: string;
}

function getMonthBounds(year: number, month: number): { from_date: string; to_date: string } {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { from_date: fmt(from), to_date: fmt(to) };
}

export const getCalendarEvents = async (
  year: number,
  month: number,
): Promise<CalendarEvent[]> => {
  const bounds = getMonthBounds(year, month);
  const { data } = await client.get<CalendarEvent[]>('/calendar/events', {
    params: bounds,
  });
  return data;
};

export const createCalendarEvent = async (
  payload: CalendarEventCreatePayload,
): Promise<CalendarEvent> => {
  const { data } = await client.post<CalendarEvent>('/calendar/events', payload);
  return data;
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const numericId = eventId.startsWith('user-') ? eventId.replace('user-', '') : eventId;
  await client.delete(`/calendar/events/${numericId}`);
};

/* ── Mock fallback удалён (зачистка 2026-08-17): при ошибке API показываем пустой календарь ── */

export interface BirthdayEvent {
  id: string;
  name: string;
  date: string; // MM-DD
  role: string;
  avatar?: string;
}

export const getCalendarBirthdays = async (): Promise<BirthdayEvent[]> => {
  const { data } = await client.get<BirthdayEvent[]>('/calendar/birthdays');
  return data;
};

export const getCalendarEventsMock = async (): Promise<CalendarEvent[]> => {
  // Оставлено для совместимости вызовов: моки удалены, возвращаем пустой список
  return [];
};
