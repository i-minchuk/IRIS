import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Briefcase,
  CheckSquare,
  Gavel,
  Cake,
  Cog,
  FileText,
  User,
  Clock,
} from 'lucide-react';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarBirthdays,
  getCalendarEvents,
  getCalendarEventsMock,
  type CalendarEvent,
  type CalendarEventCreatePayload,
  type CalendarEventType,
  type BirthdayEvent,
} from '@/features/calendar/api/calendar';
import { toast } from 'sonner';

type ViewMode = 'month' | 'week';

const EVENT_META: Record<
  CalendarEventType,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    dot: string;
    bg: string;
  }
> = {
  project: {
    label: 'Проект',
    icon: <Briefcase size={14} />,
    color: '#3B82F6',
    dot: 'bg-blue-500',
    bg: 'bg-blue-500/10',
  },
  task: {
    label: 'Задача',
    icon: <CheckSquare size={14} />,
    color: '#10B981',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  tender: {
    label: 'Тендер',
    icon: <Gavel size={14} />,
    color: '#F59E0B',
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/10',
  },
  operation: {
    label: 'Операция',
    icon: <Cog size={14} />,
    color: '#8B5CF6',
    dot: 'bg-violet-500',
    bg: 'bg-violet-500/10',
  },
  document: {
    label: 'Документ',
    icon: <FileText size={14} />,
    color: '#06B6D4',
    dot: 'bg-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  birthday: {
    label: 'День рождения',
    icon: <Cake size={14} />,
    color: '#EC4899',
    dot: 'bg-pink-500',
    bg: 'bg-pink-500/10',
  },
  personal: {
    label: 'Личное',
    icon: <User size={14} />,
    color: '#6366F1',
    dot: 'bg-indigo-500',
    bg: 'bg-indigo-500/10',
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

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
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
      type: 'birthday',
      title: `🎂 ${b.name}`,
      date: `${year}-${month}-${day}`,
      is_global: true,
      is_editable: false,
      source: 'system',
      details: { description: b.role },
    };
  });
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<CalendarEventType>('personal');

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

  const upcomingDeadlines = useMemo(() => {
    const system = events
      .filter((e) => e.source === 'system' && e.type !== 'birthday')
      .sort((a, b) => a.date.localeCompare(b.date));
    return system.slice(0, 5);
  }, [events]);

  const handlePrev = () => {
    setCurrentDate((d) =>
      view === 'month' ? addMonths(d, -1) : addDays(d, -7),
    );
  };

  const handleNext = () => {
    setCurrentDate((d) =>
      view === 'month' ? addMonths(d, 1) : addDays(d, 7),
    );
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setShowPanel(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay || !newTitle.trim()) return;
    try {
      const payload: CalendarEventCreatePayload = {
        title: newTitle.trim(),
        date: toISODate(selectedDay),
        type: newType,
        description: newDescription.trim() || undefined,
      };
      const created = await createCalendarEvent(payload);
      setEvents((prev) => [...prev, created]);
      setNewTitle('');
      setNewDescription('');
      setNewType('personal');
      toast.success('Событие добавлено');
    } catch {
      toast.error('Не удалось добавить событие');
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!event.is_editable) return;
    try {
      await deleteCalendarEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      toast.success('Событие удалено');
    } catch {
      toast.error('Не удалось удалить событие');
    }
  };

  const panelEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDate[toISODate(selectedDay)] || [];
  }, [selectedDay, eventsByDate]);

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--iris-bg-app)' }}>
      {/* Toolbar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-6 py-4 border-b"
        style={{ borderColor: 'var(--iris-border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center h-11 w-11 rounded-xl"
            style={{ background: 'rgba(236, 72, 153, 0.12)' }}
          >
            <CalendarIcon size={24} style={{ color: '#EC4899' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--iris-text-primary)' }}>
              Календарь
            </h1>
            <p className="text-sm" style={{ color: 'var(--iris-text-secondary)' }}>
              Дедлайны, задачи, тендеры и дни рождения
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
              onClick={handlePrev}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--iris-text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {view === 'month' ? <ChevronUp size={18} /> : <ChevronLeft size={18} />}
            </button>
            <span
              className="text-sm font-medium min-w-[140px] text-center tabular-nums"
              style={{ color: 'var(--iris-text-primary)' }}
            >
              {headerTitle}
            </span>
            <button
              onClick={handleNext}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--iris-text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {view === 'month' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
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
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-subtle)'; }}
          >
            Сегодня
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 h-full">
          {/* Calendar */}
          <div className="flex flex-col">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEK_DAYS.map((wd) => (
                <div key={wd} className="text-center text-xs font-medium py-2 uppercase tracking-wider" style={{ color: 'var(--iris-text-muted)' }}>
                  {wd}
                </div>
              ))}
            </div>

            {view === 'month' ? (
              <div className="grid grid-cols-7 flex-1 gap-2">
                {gridDays.map((day, idx) => {
                  const iso = toISODate(day);
                  const dayEvents = eventsByDate[iso] || [];
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = sameDate(day, today);
                  const eventTypes = Array.from(new Set(dayEvents.map((e) => e.type)));
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDayClick(day)}
                      className="flex flex-col items-center justify-start gap-2 rounded-xl p-2 transition-colors min-h-[72px]"
                      style={{
                        background: isCurrentMonth ? 'var(--iris-bg-surface)' : 'transparent',
                        border: '1px solid var(--iris-border-subtle)',
                        opacity: isCurrentMonth ? 1 : 0.4,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isCurrentMonth ? 'var(--iris-bg-surface)' : 'transparent'; }}
                    >
                      <span
                        className={`flex items-center justify-center h-8 w-8 text-sm font-semibold ${isToday ? 'rounded-full' : ''}`}
                        style={{
                          color: isToday ? '#FFFFFF' : 'var(--iris-text-primary)',
                          background: isToday ? 'var(--iris-accent-coral, #FF6B6B)' : 'transparent',
                        }}
                      >
                        {day.getDate()}
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {eventTypes.slice(0, 4).map((type) => (
                          <span
                            key={type}
                            className={`h-1.5 w-1.5 rounded-full ${EVENT_META[type].dot}`}
                            title={EVENT_META[type].label}
                          />
                        ))}
                        {eventTypes.length > 4 && (
                          <span className="text-[10px] leading-none" style={{ color: 'var(--iris-text-muted)' }}>
                            +{eventTypes.length - 4}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-7 flex-1 gap-2">
                {gridDays.map((day, idx) => {
                  const iso = toISODate(day);
                  const dayEvents = eventsByDate[iso] || [];
                  const isToday = sameDate(day, today);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDayClick(day)}
                      className="flex flex-col items-start gap-2 rounded-xl p-2 transition-colors text-left"
                      style={{
                        background: 'var(--iris-bg-surface)',
                        border: '1px solid var(--iris-border-subtle)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-surface)'; }}
                    >
                      <span
                        className={`text-sm font-semibold ${isToday ? 'px-2 py-0.5 rounded-full' : ''}`}
                        style={{
                          color: isToday ? '#FFFFFF' : 'var(--iris-text-primary)',
                          background: isToday ? 'var(--iris-accent-coral, #FF6B6B)' : 'transparent',
                        }}
                      >
                        {WEEK_DAYS[idx]}, {day.getDate()}
                      </span>
                      <div className="flex flex-col gap-1 w-full">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const meta = EVENT_META[ev.type];
                          return (
                            <div
                              key={ev.id}
                              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs truncate ${meta.bg}`}
                              style={{ color: meta.color }}
                              title={ev.title}
                            >
                              <span className="shrink-0">{meta.icon}</span>
                              <span className="truncate">{ev.title}</span>
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-xs px-1" style={{ color: 'var(--iris-text-muted)' }}>
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border p-4" style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={18} style={{ color: 'var(--iris-accent-cyan)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--iris-text-primary)' }}>
                  Ближайшие дедлайны
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {upcomingDeadlines.length === 0 && (
                  <span className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>
                    Нет дедлайнов в выбранном периоде
                  </span>
                )}
                {upcomingDeadlines.map((ev) => {
                  const meta = EVENT_META[ev.type];
                  return (
                    <div key={ev.id} className="flex items-start gap-2 rounded-lg p-2 transition-colors" style={{ background: 'var(--iris-bg-tertiary)' }}>
                      <span className={`shrink-0 mt-0.5 ${meta.bg} rounded p-1`} style={{ color: meta.color }}>
                        {meta.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--iris-text-primary)' }}>
                          {ev.title}
                        </p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--iris-text-muted)' }}>
                          {ev.date}
                        </p>
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={{ color: meta.color }}>
                        {ev.type === 'tender' ? 'Тендер' : ev.type === 'task' ? 'Задача' : ev.type === 'project' ? 'Проект' : meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--iris-text-primary)' }}>Легенда</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(EVENT_META) as CalendarEventType[]).map((type) => {
                  const meta = EVENT_META[type];
                  return (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <span className="text-xs" style={{ color: 'var(--iris-text-secondary)' }}>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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

      {/* Day panel */}
      {showPanel && selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--iris-bg-backdrop)' }}
          onClick={() => setShowPanel(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border shadow-lg p-5 max-h-[80vh] overflow-auto"
            style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)', boxShadow: 'var(--iris-shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: 'var(--iris-text-primary)' }}>
                {selectedDay.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}
              </h3>
              <button
                onClick={() => setShowPanel(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--iris-text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {panelEvents.length === 0 && (
                <span className="text-sm" style={{ color: 'var(--iris-text-muted)' }}>Нет событий</span>
              )}
              {panelEvents.map((ev) => {
                const meta = EVENT_META[ev.type];
                return (
                  <div key={ev.id} className="flex items-start gap-2 rounded-lg p-2 border" style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-tertiary)' }}>
                    <span className={`shrink-0 rounded p-1 ${meta.bg}`} style={{ color: meta.color }}>
                      {meta.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--iris-text-primary)' }}>{ev.title}</p>
                      {ev.details.description && (
                        <p className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>{ev.details.description}</p>
                      )}
                      {ev.details.customer && (
                        <p className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>{ev.details.customer}</p>
                      )}
                    </div>
                    {ev.is_editable && (
                      <button
                        onClick={() => handleDeleteEvent(ev)}
                        className="shrink-0 p-1 rounded transition-colors"
                        style={{ color: 'var(--iris-text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--iris-text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddEvent} className="border-t pt-4" style={{ borderColor: 'var(--iris-border-subtle)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Plus size={16} style={{ color: 'var(--iris-accent-cyan)' }} />
                <h4 className="text-sm font-semibold" style={{ color: 'var(--iris-text-primary)' }}>Добавить событие</h4>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Название события"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--iris-bg-tertiary)', borderColor: 'var(--iris-border-default)', color: 'var(--iris-text-primary)' }}
                  required
                />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Описание (необязательно)"
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: 'var(--iris-bg-tertiary)', borderColor: 'var(--iris-border-default)', color: 'var(--iris-text-primary)' }}
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as CalendarEventType)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--iris-bg-tertiary)', borderColor: 'var(--iris-border-default)', color: 'var(--iris-text-primary)' }}
                >
                  <option value="personal">Личное</option>
                  <option value="task">Задача</option>
                  <option value="meeting">Встреча</option>
                  <option value="reminder">Напоминание</option>
                </select>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ background: 'var(--iris-accent-cyan)', color: '#FFFFFF' }}
                >
                  <Plus size={14} /> Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
