import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Briefcase,
  CheckSquare,
  Gavel,
} from 'lucide-react';
import {
  getCalendarEvents,
  getCalendarEventsMock,
  type CalendarEvent,
  type CalendarEventType,
} from '@/features/calendar/api/calendar';

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
    icon: <Briefcase size={12} />,
    color: '#1A5ACC',
    bg: 'rgba(26, 90, 204, 0.10)',
    border: 'rgba(26, 90, 204, 0.35)',
  },
  task: {
    label: 'Задача',
    icon: <CheckSquare size={12} />,
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.10)',
    border: 'rgba(5, 150, 105, 0.35)',
  },
  tender: {
    label: 'Тендер',
    icon: <Gavel size={12} />,
    color: '#B86E00',
    bg: 'rgba(184, 110, 0, 0.10)',
    border: 'rgba(184, 110, 0, 0.35)',
  },
};

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
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
  const startDay = start.getDay() || 7; // 1..7 (Mon..Sun)
  const totalDays = end.getDate();
  const days: Date[] = [];
  // Previous month padding
  const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0);
  for (let i = startDay - 1; i > 0; i--) {
    days.push(new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), prevMonthEnd.getDate() - i + 1));
  }
  // Current month
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), i));
  }
  // Next month padding to fill 6 weeks (42 cells)
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

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCalendarEvents(year, month)
      .then((data) => {
        if (!cancelled) setEvents(data);
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

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--iris-bg-app)' }}>
      {/* Toolbar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b"
        style={{ borderColor: 'var(--iris-border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center h-9 w-9 rounded-lg"
            style={{ background: 'rgba(236, 72, 153, 0.12)' }}
          >
            <CalendarIcon size={18} style={{ color: '#EC4899' }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--iris-text-primary)' }}>
              Календарь
            </h1>
            <p className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>
              Дедлайны, задачи и тендеры
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--iris-border-default)' }}>
            <button
              onClick={() => setView('month')}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: view === 'month' ? 'var(--iris-bg-active)' : 'transparent',
                color: view === 'month' ? 'var(--iris-accent-cyan)' : 'var(--iris-text-secondary)',
              }}
            >
              Месяц
            </button>
            <button
              onClick={() => setView('week')}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: view === 'week' ? 'var(--iris-bg-active)' : 'transparent',
                color: view === 'week' ? 'var(--iris-accent-cyan)' : 'var(--iris-text-secondary)',
              }}
            >
              Неделя
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setCurrentDate((d) => (view === 'month' ? addMonths(d, -1) : new Date(d.getTime() - 7 * 86400000)))
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--iris-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span
              className="text-sm font-medium min-w-[140px] text-center tabular-nums"
              style={{ color: 'var(--iris-text-primary)' }}
            >
              {headerTitle}
            </span>
            <button
              onClick={() =>
                setCurrentDate((d) => (view === 'month' ? addMonths(d, 1) : new Date(d.getTime() + 7 * 86400000)))
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--iris-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'var(--iris-bg-subtle)',
              color: 'var(--iris-text-secondary)',
              border: '1px solid var(--iris-border-default)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--iris-bg-subtle)';
            }}
          >
            Сегодня
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-2 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
        {(Object.keys(EVENT_META) as CalendarEventType[]).map((type) => {
          const meta = EVENT_META[type];
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center justify-center h-4 w-4 rounded"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.icon}
              </span>
              <span className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        {view === 'month' ? (
          <div className="flex flex-col h-full">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAYS.map((wd) => (
                <div
                  key={wd}
                  className="text-center text-xs font-medium py-1"
                  style={{ color: 'var(--iris-text-muted)' }}
                >
                  {wd}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 flex-1 gap-1">
              {gridDays.map((day, idx) => {
                const iso = toISODate(day);
                const dayEvents = eventsByDate[iso] || [];
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = sameDate(day, today);
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 rounded-lg border p-1.5 min-h-[80px] transition-colors"
                    style={{
                      background: isCurrentMonth ? 'var(--iris-bg-surface)' : 'var(--iris-bg-tertiary)',
                      borderColor: isToday ? 'var(--iris-accent-cyan)' : 'var(--iris-border-subtle)',
                      opacity: isCurrentMonth ? 1 : 0.55,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium tabular-nums ${isToday ? 'px-1.5 py-0.5 rounded-full' : ''}`}
                        style={{
                          color: isToday ? '#FFFFFF' : 'var(--iris-text-primary)',
                          background: isToday ? 'var(--iris-accent-cyan)' : 'transparent',
                        }}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span
                          className="text-[10px] font-medium px-1 rounded"
                          style={{ background: 'var(--iris-bg-hover)', color: 'var(--iris-text-muted)' }}
                        >
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const meta = EVENT_META[ev.type];
                        return (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className="flex items-center gap-1 text-left rounded px-1 py-0.5 text-[11px] leading-tight truncate transition-colors"
                            style={{
                              background: meta.bg,
                              color: meta.color,
                              borderLeft: `2px solid ${meta.border}`,
                            }}
                            title={ev.title}
                          >
                            <span className="shrink-0">{meta.icon}</span>
                            <span className="truncate">{ev.title}</span>
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] px-1" style={{ color: 'var(--iris-text-muted)' }}>
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week view */
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEK_DAYS.map((wd, i) => {
                const day = gridDays[i];
                const isToday = sameDate(day, today);
                return (
                  <div
                    key={wd}
                    className="text-center text-xs font-medium py-2 rounded-lg"
                    style={{
                      color: isToday ? '#FFFFFF' : 'var(--iris-text-muted)',
                      background: isToday ? 'var(--iris-accent-cyan)' : 'transparent',
                    }}
                  >
                    {wd}, {day.getDate()}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 flex-1 gap-1">
              {gridDays.map((day, idx) => {
                const iso = toISODate(day);
                const dayEvents = eventsByDate[iso] || [];
                const isToday = sameDate(day, today);
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border p-2 min-h-[120px]"
                    style={{
                      background: 'var(--iris-bg-surface)',
                      borderColor: isToday ? 'var(--iris-accent-cyan)' : 'var(--iris-border-subtle)',
                    }}
                  >
                    {dayEvents.length === 0 && (
                      <span className="text-xs mt-1" style={{ color: 'var(--iris-text-muted)' }}>
                        Нет событий
                      </span>
                    )}
                    {dayEvents.map((ev) => {
                      const meta = EVENT_META[ev.type];
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="flex flex-col gap-0.5 text-left rounded-md px-2 py-1.5 text-xs transition-colors"
                          style={{
                            background: meta.bg,
                            color: meta.color,
                            borderLeft: `3px solid ${meta.border}`,
                          }}
                        >
                          <span className="font-medium truncate">{ev.title}</span>
                          {ev.details?.status && (
                            <span className="text-[10px] opacity-80">{ev.details.status}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--iris-bg-backdrop)' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--iris-bg-surface)', color: 'var(--iris-text-secondary)' }}>
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            Загрузка…
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--iris-bg-backdrop)' }}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border shadow-lg p-5"
            style={{
              background: 'var(--iris-bg-surface)',
              borderColor: 'var(--iris-border-subtle)',
              boxShadow: 'var(--iris-shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center h-6 w-6 rounded"
                  style={{
                    background: EVENT_META[selectedEvent.type].bg,
                    color: EVENT_META[selectedEvent.type].color,
                  }}
                >
                  {EVENT_META[selectedEvent.type].icon}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{
                    background: EVENT_META[selectedEvent.type].bg,
                    color: EVENT_META[selectedEvent.type].color,
                  }}
                >
                  {EVENT_META[selectedEvent.type].label}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--iris-text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--iris-text-primary)' }}>
              {selectedEvent.title}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--iris-text-muted)' }}>Дата:</span>
                <span style={{ color: 'var(--iris-text-secondary)' }}>
                  {new Date(selectedEvent.date).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {selectedEvent.details?.status && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--iris-text-muted)' }}>Статус:</span>
                  <span style={{ color: 'var(--iris-text-secondary)' }}>{selectedEvent.details.status}</span>
                </div>
              )}
              {selectedEvent.details?.priority && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--iris-text-muted)' }}>Приоритет:</span>
                  <span style={{ color: 'var(--iris-text-secondary)' }}>{selectedEvent.details.priority}</span>
                </div>
              )}
              {selectedEvent.details?.customer && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--iris-text-muted)' }}>Заказчик:</span>
                  <span style={{ color: 'var(--iris-text-secondary)' }}>{selectedEvent.details.customer}</span>
                </div>
              )}
              {selectedEvent.details?.description && (
                <div className="flex items-start gap-2">
                  <span style={{ color: 'var(--iris-text-muted)' }}>Описание:</span>
                  <span style={{ color: 'var(--iris-text-secondary)' }}>{selectedEvent.details.description}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: 'var(--iris-bg-subtle)',
                  color: 'var(--iris-text-secondary)',
                  border: '1px solid var(--iris-border-default)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--iris-bg-subtle)';
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
