import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Briefcase,
  CheckSquare,
  Gavel,
  Cake,
} from 'lucide-react';
import {
  getCalendarEvents,
  getCalendarEventsMock,
  getCalendarBirthdays,
  type CalendarEvent,
  type CalendarEventType,
  type BirthdayEvent,
} from '@/features/calendar/api/calendar';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'month' | 'week';

const EVENT_META: Record<
  CalendarEventType,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
  }
> = {
  project: {
    label: 'Проект',
    icon: <Briefcase size={14} />,
    color: '#1A5ACC',
    bg: 'rgba(26, 90, 204, 0.10)',
    border: 'rgba(26, 90, 204, 0.35)',
  },
  task: {
    label: 'Задача',
    icon: <CheckSquare size={14} />,
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.10)',
    border: 'rgba(5, 150, 105, 0.35)',
  },
  tender: {
    label: 'Тендер',
    icon: <Gavel size={14} />,
    color: '#B86E00',
    bg: 'rgba(184, 110, 0, 0.10)',
    border: 'rgba(184, 110, 0, 0.35)',
  },
  birthday: {
    label: 'День рождения',
    icon: <Cake size={14} />,
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.10)',
    border: 'rgba(236, 72, 153, 0.35)',
  },
};

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getMonthGrid(date: Date): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startDay = start.getDay() || 7;
  const totalDays = end.getDate();
  const days: Date[] = [];
  const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);
  for (let i = startDay - 1; i > 0; i--) {
    days.push(new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate() - i + 1));
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), i));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(end.getFullYear(), end.getMonth() + 1, i));
  }
  return days;
}

function getWeekGrid(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(monday);
    curr.setDate(monday.getDate() + i);
    days.push(curr);
  }
  return days;
}

function sameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function birthdaysToEvents(birthdays: BirthdayEvent[], year: number): CalendarEvent[] {
  return birthdays.map((b) => {
    const [month, day] = b.date.split('-');
    return {
      id: `birthday-${b.id}`,
      type: 'birthday' as CalendarEventType,
      title: `🎂 ${b.name}`,
      date: `${year}-${month}-${day}`,
      sourceId: 0,
      details: {
        status: b.role,
        description: 'День рождения сотрудника',
      },
    };
  });
}

interface CalendarWidgetProps {
  isDark?: boolean;
}

export function CalendarWidget({ isDark = false }: CalendarWidgetProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getCalendarEvents(year, month).catch(() => getCalendarEventsMock()),
      getCalendarBirthdays().catch(() => [] as BirthdayEvent[]),
    ])
      .then(([calendarEvents, birthdays]) => {
        if (cancelled) return;
        const birthdayEvents = birthdaysToEvents(birthdays, year);
        setEvents([...calendarEvents, ...birthdayEvents]);
      })
      .catch(() => {
        if (!cancelled) {
          getCalendarEventsMock().then((data) => setEvents(data));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const gridDays = useMemo(() => {
    return view === 'month' ? getMonthGrid(currentDate) : getWeekGrid(currentDate);
  }, [currentDate, view]);

  const today = new Date();

  const headerTitle =
    view === 'month'
      ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : (() => {
          const days = getWeekGrid(currentDate);
          const start = days[0];
          const end = days[6];
          const sameMonth = start.getMonth() === end.getMonth();
          if (sameMonth) {
            return `${start.getDate()}–${end.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`;
          }
          return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
        })();

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate[toISODate(selectedDate)] || [];
  }, [selectedDate, eventsByDate]);

  // Upcoming deadlines (next 5 events from today)
  const upcomingEvents = useMemo(() => {
    const todayISO = toISODate(today);
    const future = events
      .filter((e) => e.date >= todayISO && e.type !== 'birthday')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
    return future;
  }, [events]);

  // Upcoming birthdays (next 3)
  const upcomingBirthdays = useMemo(() => {
    const todayISO = toISODate(today);
    const bdays = events
      .filter((e) => e.type === 'birthday' && e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    return bdays;
  }, [events]);

  const handleDateClick = (day: Date) => {
    if (selectedDate && sameDate(selectedDate, day)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

  return (
    <div className="rounded-xl p-3 md:p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <CalendarIcon size={20} style={{ color: '#3B82F6' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Календарь
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('month')}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: view === 'month' ? '#3B82F6' : 'transparent',
              color: view === 'month' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Месяц
          </button>
          <button
            onClick={() => setView('week')}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: view === 'week' ? '#3B82F6' : 'transparent',
              color: view === 'week' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Неделя
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() =>
            setCurrentDate((d) => (view === 'month' ? addMonths(d, -1) : new Date(d.getTime() - 7 * 86400000)))
          }
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {headerTitle}
        </span>
        <button
          onClick={() =>
            setCurrentDate((d) => (view === 'month' ? addMonths(d, 1) : new Date(d.getTime() + 7 * 86400000)))
          }
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map((wd) => (
          <div key={wd} className="text-center text-xs font-semibold py-1.5" style={{ color: 'var(--text-muted)' }}>
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((day, idx) => {
          const iso = toISODate(day);
          const dayEvents = eventsByDate[iso] || [];
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = sameDate(day, today);
          const isSelected = selectedDate && sameDate(selectedDate, day);

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(day)}
              className="flex flex-col items-center gap-1 rounded-lg p-1.5 min-h-[40px] transition-all"
              style={{
                background: isSelected
                  ? 'rgba(59, 130, 246, 0.2)'
                  : isToday
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                border: isSelected
                  ? '1px solid #3B82F6'
                  : isToday
                  ? '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid transparent',
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{
                  color: isToday ? '#3B82F6' : 'var(--text-primary)',
                }}
              >
                {day.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-1">
                  {dayEvents.slice(0, 4).map((ev, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: EVENT_META[ev.type].color }}
                    />
                  ))}
                  {dayEvents.length > 4 && (
                    <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                      +
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date events */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--card-elevated)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            {selectedDate.toLocaleDateString('ru-RU')}
          </p>
          <div className="flex flex-col gap-1.5">
            {selectedDateEvents.map((ev) => {
              const meta = EVENT_META[ev.type];
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-2 text-left rounded-lg px-2 py-1.5 text-xs"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    borderLeft: `3px solid ${meta.border}`,
                  }}
                >
                  <span className="shrink-0">{meta.icon}</span>
                  <span className="truncate font-medium">{ev.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming deadlines */}
      {upcomingEvents.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Ближайшие дедлайны
          </p>
          <div className="flex flex-col gap-2">
            {upcomingEvents.map((ev) => {
              const meta = EVENT_META[ev.type];
              const daysLeft = Math.ceil((new Date(ev.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => navigate('/calendar')}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0" style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{ev.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ev.details?.status || meta.label}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold" style={{ color: daysLeft <= 2 ? '#DC2626' : daysLeft <= 5 ? '#D4AF37' : 'var(--text-secondary)' }}>
                      {new Date(ev.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {daysLeft === 0 ? 'Сегодня' : daysLeft === 1 ? 'Завтра' : `через ${daysLeft} дн`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Дни рождения
          </p>
          <div className="flex flex-col gap-2">
            {upcomingBirthdays.map((ev) => {
              const meta = EVENT_META.birthday;
              const daysLeft = Math.ceil((new Date(ev.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: 'rgba(236, 72, 153, 0.05)' }}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0" style={{ background: meta.bg, color: meta.color }}>
                    <Cake size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{ev.title.replace('🎂 ', '')}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ev.details?.status}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold" style={{ color: '#EC4899' }}>
                      {new Date(ev.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {daysLeft === 0 ? 'Сегодня!' : daysLeft === 1 ? 'Завтра' : `через ${daysLeft} дн`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Link to full calendar — скрыто, вкладка календаря встроена в Dashboard
      <button
        onClick={() => navigate('/calendar')}
        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
      >
        Открыть полный календарь <ChevronRightIcon size={12} />
      </button>
      */}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-3">
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка…</span>
        </div>
      )}
    </div>
  );
}
