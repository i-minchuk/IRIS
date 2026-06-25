import client from '@/shared/api/client';

export type CalendarEventType = 'project' | 'task' | 'tender' | 'birthday';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  sourceId: number;
  details?: {
    status?: string;
    priority?: string;
    customer?: string;
    description?: string;
  };
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

export const getCalendarEvents = async (
  year: number,
  month: number
): Promise<CalendarEvent[]> => {
  const { data } = await client.get<CalendarEventsResponse>(
    '/calendar/events',
    {
      params: { year, month },
    }
  );
  return data.events;
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
    sourceId: 1,
    details: { status: 'active', customer: 'ООО СтройГранд' },
  },
  {
    id: 'mock-p2',
    type: 'project',
    title: 'ТЭЦ-5 — сдача рабочей документации',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 12)
      .toISOString()
      .split('T')[0],
    sourceId: 2,
    details: { status: 'active', customer: 'Мосэнерго' },
  },
  {
    id: 'mock-t1',
    type: 'task',
    title: 'Проверка арматуры КЖ-02-014',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 7)
      .toISOString()
      .split('T')[0],
    sourceId: 101,
    details: { status: 'in_progress', priority: 'high' },
  },
  {
    id: 'mock-t2',
    type: 'task',
    title: 'Согласование ОВиК-03-008',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 14)
      .toISOString()
      .split('T')[0],
    sourceId: 102,
    details: { status: 'pending', priority: 'medium' },
  },
  {
    id: 'mock-t3',
    type: 'task',
    title: 'Разработка АР-01-001',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 22)
      .toISOString()
      .split('T')[0],
    sourceId: 103,
    details: { status: 'pending', priority: 'low' },
  },
  {
    id: 'mock-tr1',
    type: 'tender',
    title: 'Тендер ЖК «Южный» — подача заявки',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 18)
      .toISOString()
      .split('T')[0],
    sourceId: 201,
    details: { status: 'open', customer: 'ООО ЮжСтрой' },
  },
  {
    id: 'mock-tr2',
    type: 'tender',
    title: 'Тендер Складской комплекс — раскрытие',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 25)
      .toISOString()
      .split('T')[0],
    sourceId: 202,
    details: { status: 'evaluation', customer: 'ЛогистикПро' },
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
