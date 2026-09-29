import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export interface DateInputProps {
  /** Значение в формате ISO YYYY-MM-DD (пустая строка = не выбрано) */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'aria-label'?: string;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export default function DateInput({
  value,
  onChange,
  label,
  placeholder = 'дд.мм.гггг',
  disabled,
  className = '',
  style,
  id,
  ...rest
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (!open && value) {
      const d = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        setView({ year: d.getFullYear(), month: d.getMonth() });
      }
    }
    setOpen((o) => !o);
  };

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const select = (d: Date) => {
    onChange(toISODate(d));
    setOpen(false);
  };

  const today = new Date();
  const selected = value ? new Date(`${value}T00:00:00`) : null;

  const startOffset = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const days: Date[] = [];
  for (let i = 0; i < totalCells; i++) {
    days.push(new Date(view.year, view.month, 1 - startOffset + i));
  }

  return (
    <div className={className} style={style}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      ) : null}
      <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggle}
        aria-label={rest['aria-label']}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition-colors disabled:opacity-60"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <span className="flex-1 text-left">{value ? formatDisplay(value) : placeholder}</span>
        <Calendar size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Выбор даты"
          className="absolute z-50 mt-1 w-64 rounded-lg border p-2 shadow-lg"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--iris-shadow-lg, 0 8px 24px rgba(0,0,0,0.12))',
          }}
        >
          <div className="mb-1 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Предыдущий месяц"
              className="rounded p-1 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {MONTHS[view.month]} {view.year}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Следующий месяц"
              className="rounded p-1 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((wd) => (
              <span key={wd} className="py-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {wd}
              </span>
            ))}
            {days.map((d) => {
              const inMonth = d.getMonth() === view.month;
              const isSelected = selected !== null && sameDay(d, selected);
              const isToday = sameDay(d, today);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => select(d)}
                  className="rounded py-1 text-xs transition-colors"
                  style={{
                    background: isSelected ? 'var(--iris-accent-blue)' : 'transparent',
                    color: isSelected
                      ? 'var(--iris-text-on-accent)'
                      : inMonth
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                    border: isToday && !isSelected ? '1px solid var(--iris-accent-blue)' : '1px solid transparent',
                    opacity: inMonth ? 1 : 0.45,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--iris-bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-1 flex items-center justify-between border-t px-1 pt-1" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="rounded px-2 py-1 text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={() => select(new Date())}
              className="rounded px-2 py-1 text-xs font-medium transition-colors"
              style={{ color: 'var(--iris-accent-blue)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Сегодня
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
