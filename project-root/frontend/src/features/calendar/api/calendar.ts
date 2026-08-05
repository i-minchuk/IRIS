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

/* ── Mock fallback ── */
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'mock-p1',
    type: 'project',
    title: 'ЖК «Северный» — дедлайн этапа КЖ',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 5)
      .toISOString()
      .split('T')[0],
    is_global: true,
    is_editable: false,
    source: 'system',
    details: { status: 'active', customer: 'ООО СтройГранд', entity_id: 1 },
  },
  {
    id: 'mock-p2',
    type: 'project',
    title: 'ТЭЦ-5 — сдача рабочей документации',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 12)
      .toISOString()
      .split('T')[0],
    is_global: true,
    is_editable: false,
    source: 'system',
    details: { status: 'active', customer: 'Мосэнерго', entity_id: 2 },
  },
  {
    id: 'mock-t1',
    type: 'task',
    title: 'Проверка арматуры КЖ-02-014',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 7)
      .toISOString()
      .split('T')[0],
    is_global: true,
    is_editable: false,
    source: 'system',
    details: { status: 'in_progress', priority: 'high', entity_id: 101 },
  },
  {
    id: 'mock-t2',
    type: 'task',
    title: 'Согласование ОВиК-03-008',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 14)
      .toISOString()
      .split('T')[0],
    is_global: true,
    is_editable: false,
    source: 'system',
    details: { status: 'pending', priority: 'medium', entity_id: 102 },
  },
  {
    id: 'mock-t3',
    type: 'task',
    title: 'Разработка АР-01-001',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 22)
      .toISOString()
      .split('T')[0],
    is_global: true,
    is_editable: false,
    source: 'system',
    details: { status: 'pending', priority: 'low', entity_id: 103 },
  },
  {
    id: 'mock-tr1',
    type: 'tender',
    title: 'Тендер ЖК «Южный» — подача заявки',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 18)
      .toISOString()
      .split('T')[0],
    is_global: true,
    is_editable: false,
    source: 'system',
    details: { status: 'open', customer: 'ООО ЮжСтрой', entity_id: 201 },
  },
  {
    id: 'mock-tr2',
    type: 'tender',
    title: 'Тендер Складской комплекс — раскрытие',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 25)
      .toISOString()
      .split('T')[0],
    is_global: true,
    is_editable: false,
    source: 'system',
    details: { status: 'evaluation', customer: 'ЛогистикПро', entity_id: 202 },
  },
];

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
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_EVENTS;
};
