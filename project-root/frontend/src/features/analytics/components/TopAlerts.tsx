import { AlertTriangle, ShieldAlert, Clock, FileWarning, ArrowRight } from 'lucide-react';
import type { AlertItem } from '../api/analytics';
import { useNavigate } from 'react-router-dom';

interface TopAlertsProps {
  data: { alerts: AlertItem[]; total: number } | null;
  loading?: boolean;
}

const severityConfig = {
  critical: {
    border: 'border-rose-200 dark:border-rose-900/40',
    bg: 'bg-rose-50 dark:bg-rose-900/15',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-500',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-900/40',
    bg: 'bg-amber-50 dark:bg-amber-900/15',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500',
  },
  info: {
    border: 'border-blue-200 dark:border-blue-900/40',
    bg: 'bg-blue-50 dark:bg-blue-900/15',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-500',
  },
};

function AlertIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'idle':
      return <Clock className="h-4 w-4" />;
    case 'qc':
      return <ShieldAlert className="h-4 w-4" />;
    case 'tender':
      return <AlertTriangle className="h-4 w-4" />;
    case 'overdue':
      return <FileWarning className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
}

export function TopAlerts({ data, loading }: TopAlertsProps) {
  const navigate = useNavigate();
  const alerts = data?.alerts ?? [];
  const total = data?.total ?? 0;

  if (loading) {
    return (
      <div className="rounded-2xl p-6 neon-card">
        <div className="mb-4 h-6 w-40 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 neon-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Тревоги
          </h3>
          {total > 0 && (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-100 px-1.5 text-[11px] font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              {total}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Топ-3 приоритетных</span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
            <ShieldAlert className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Все системы в норме. Тревог нет.
          </div>
        )}

        {alerts.map((alert) => {
          const cfg = severityConfig[alert.severity] ?? severityConfig.info;
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${cfg.border} ${cfg.bg}`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.iconBg}`}>
                <AlertIcon icon={alert.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {alert.title}
                  </p>
                  {alert.severity === 'critical' && (
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      КРИТИЧНО
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => navigate(alert.action_path)}
                className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${cfg.btn}`}
              >
                <span className="hidden sm:inline">{alert.action_label}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
