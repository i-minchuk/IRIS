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

const STATUS_COLOR: Record<string, { bg: string; border: string; dot: string }> = {
  collected: { bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-200 dark:border-amber-900/30', dot: 'bg-amber-500' },
  qc: { bg: 'bg-purple-50 dark:bg-purple-900/15', border: 'border-purple-200 dark:border-purple-900/30', dot: 'bg-purple-500' },
  accepted: { bg: 'bg-emerald-50 dark:bg-emerald-900/15', border: 'border-emerald-200 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
  packed: { bg: 'bg-blue-50 dark:bg-blue-900/15', border: 'border-blue-200 dark:border-blue-900/30', dot: 'bg-blue-500' },
  shipped: { bg: 'bg-blue-50 dark:bg-blue-900/15', border: 'border-blue-200 dark:border-blue-900/30', dot: 'bg-blue-500' },
};

export function ShipmentCalendar({ data, loading }: ShipmentCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const days = data?.days ?? [];
  const pipeline = data?.pipeline ?? [];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
        <div className="mb-4 h-6 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
            Отгрузка и логистика
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">{data?.week}</span>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((day, idx) => (
          <button
            key={day.day_label}
            onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
            className={[
              'relative flex flex-col rounded-lg border p-2 text-left transition-all',
              day.is_weekend
                ? 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1e293b]',
              selectedDay === idx ? 'ring-2 ring-blue-500' : 'hover:border-blue-300',
              'min-h-[80px] sm:min-h-[100px]',
            ].join(' ')}
          >
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {day.day_label}
            </span>
            <div className="mt-1 flex flex-col gap-1">
              {day.items.map((item, i) => {
                const colors = STATUS_COLOR[item.status] ?? STATUS_COLOR.collected;
                return (
                  <div
                    key={i}
                    className={[
                      'rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium',
                      colors.bg,
                      colors.border,
                      'border',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 pl-2.5">{item.tons} т</div>
                  </div>
                );
              })}
            </div>
            {day.items.length === 0 && !day.is_weekend && (
              <span className="mt-auto text-[10px] text-slate-300 dark:text-slate-600">—</span>
            )}
          </button>
        ))}
      </div>

      {/* Day detail */}
      {selectedDay !== null && days[selectedDay]?.items.length > 0 && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            {days[selectedDay].day_label}, {days[selectedDay].date}
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {days[selectedDay].items.map((item, i) => (
              <span key={i} className="text-xs text-slate-600 dark:text-slate-400">
                {item.name}: {item.tons} т ({STATUS_COLOR[item.status]?.dot ? '' : item.status})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Статусная лента
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {pipeline.map((stage, idx) => {
            const colors = STATUS_COLOR[stage.key] ?? STATUS_COLOR.collected;
            const Icon = STATUS_ICON[stage.key] ?? Package;
            return (
              <div key={stage.key} className="flex items-center gap-2">
                <button
                  className={[
                    'flex items-center gap-1.5 rounded-lg border px-3 py-2 transition-colors hover:shadow-sm',
                    colors.bg,
                    colors.border,
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <div className="text-left">
                    <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      {stage.label}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {stage.tons} т
                    </div>
                  </div>
                  <span className={`ml-1 h-2 w-2 rounded-full ${colors.dot}`} />
                </button>
                {idx < pipeline.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
