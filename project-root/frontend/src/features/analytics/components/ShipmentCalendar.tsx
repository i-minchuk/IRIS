import { useState } from 'react';
import { Truck, Package, ClipboardCheck, CheckCircle, ArrowRight } from 'lucide-react';
import type { ShipmentCalendarData } from '../api/analytics';

interface ShipmentCalendarProps {
  data: ShipmentCalendarData | null;
  loading?: boolean;
}

const STATUS_ICON: Record<string, React.ElementType> = {
  collected: Package,
  qc: ClipboardCheck,
  accepted: CheckCircle,
  packed: Package,
  shipped: Truck,
};

const STATUS_NEON: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  collected: { border: 'var(--iris-accent-cyan)',  glow: 'var(--iris-glow-cyan)',  text: 'var(--iris-accent-cyan)',  bg: 'var(--iris-status-bg-cyan)' },
  qc:        { border: 'var(--iris-accent-purple)', glow: 'var(--iris-glow-purple)', text: 'var(--iris-accent-purple)', bg: 'var(--iris-status-bg-purple)' },
  accepted:  { border: 'var(--iris-accent-cyan)',  glow: 'var(--iris-glow-cyan)',  text: 'var(--iris-accent-cyan)',  bg: 'var(--iris-status-bg-cyan)' },
  packed:    { border: 'var(--iris-accent-blue)',  glow: 'var(--iris-glow-blue)',  text: 'var(--iris-accent-blue)',  bg: 'var(--iris-status-bg-blue)' },
  shipped:   { border: 'var(--iris-accent-amber)', glow: 'var(--iris-glow-amber)', text: 'var(--iris-accent-amber)', bg: 'var(--iris-status-bg-amber)' },
};

export function ShipmentCalendar({ data, loading }: ShipmentCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const days = data?.days ?? [];
  const pipeline = data?.pipeline ?? [];

  if (loading) {
    return (
      <div className="rounded-xl p-4 sm:p-6 neon-card">
        <div className="mb-4 h-6 w-56 animate-pulse rounded" style={{ background: 'var(--iris-bg-skeleton)' }} />
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg" style={{ background: 'var(--iris-bg-skeleton)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 sm:p-6 neon-card">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5" style={{ color: 'var(--iris-accent-amber)' }} />
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Отгрузка и логистика
          </h3>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{data?.week}</span>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {days.map((day, idx) => (
          <button
            key={day.day_label}
            onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
            className="relative flex flex-col rounded-lg border p-2 text-left transition-all"
            style={{
              borderColor: day.is_weekend ? 'var(--iris-border-subtle)' : (selectedDay === idx ? 'var(--iris-accent-cyan)' : 'var(--iris-border-subtle)'),
              background: day.is_weekend ? 'var(--iris-bg-tertiary)' : 'var(--iris-bg-subtle)',
              boxShadow: selectedDay === idx ? '0 0 16px var(--iris-glow-cyan)' : 'none',
              minHeight: '80px',
            }}
          >
            <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
              {day.day_label}
            </span>
            <div className="mt-1 flex flex-col gap-1">
              {day.items.map((item, i) => {
                const neon = STATUS_NEON[item.status] ?? STATUS_NEON.collected;
                return (
                  <div
                    key={i}
                    className="rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium border"
                    style={{
                      background: neon.bg,
                      borderColor: neon.border,
                      color: neon.text,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: neon.text, boxShadow: `0 0 4px ${neon.glow}` }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="pl-2.5" style={{ color: 'var(--text-muted)' }}>{item.tons} т</div>
                  </div>
                );
              })}
            </div>
            {day.items.length === 0 && !day.is_weekend && (
              <span className="mt-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>—</span>
            )}
          </button>
        ))}
      </div>

      {/* Day detail */}
      {selectedDay !== null && days[selectedDay]?.items.length > 0 && (
        <div className="mt-3 rounded-lg border p-3" style={{ borderColor: 'var(--iris-accent-cyan)', background: 'var(--iris-status-bg-cyan)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--iris-accent-cyan)' }}>
            {days[selectedDay].day_label}, {days[selectedDay].date}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {days[selectedDay].items.map((item, i) => (
              <span key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.name}: {item.tons} т ({item.status})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Статусная лента
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {pipeline.map((stage, idx) => {
            const neon = STATUS_NEON[stage.key] ?? STATUS_NEON.collected;
            const Icon = STATUS_ICON[stage.key] ?? Package;
            return (
              <div key={stage.key} className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2 transition-all duration-200 hover:shadow-md"
                  style={{
                    background: neon.bg,
                    borderColor: neon.border,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: neon.text }} />
                  <div className="text-left">
                    <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {stage.label}
                    </div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stage.tons} т
                    </div>
                  </div>
                  <span className="ml-1 h-2 w-2 rounded-full" style={{ background: neon.text, boxShadow: `0 0 6px ${neon.glow}` }} />
                </button>
                {idx < pipeline.length - 1 && (
                  <ArrowRight className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
