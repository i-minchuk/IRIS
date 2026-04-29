import { AlertTriangle, ShieldAlert, Clock, FileWarning, ArrowRight } from 'lucide-react';
import type { AlertItem } from '../api/analytics';
import { useNavigate } from 'react-router-dom';

interface TopAlertsProps {
  data: { alerts: AlertItem[]; total: number } | null;
  loading?: boolean;
}

const severityConfig = {
  critical: {
    border: 'var(--iris-accent-coral)',
    bg: 'var(--iris-status-bg-coral)',
    iconColor: 'var(--iris-accent-coral)',
    iconGlow: 'var(--iris-glow-coral)',
    btnBg: 'linear-gradient(135deg, var(--iris-accent-coral), #FF4D6D)',
    btnGlow: 'var(--iris-glow-coral)',
    badgeBg: 'var(--iris-status-bg-coral)',
    badgeColor: 'var(--iris-accent-coral)',
  },
  warning: {
    border: 'var(--iris-accent-amber)',
    bg: 'var(--iris-status-bg-amber)',
    iconColor: 'var(--iris-accent-amber)',
    iconGlow: 'var(--iris-glow-amber)',
    btnBg: 'linear-gradient(135deg, var(--iris-accent-amber), #FFCC33)',
    btnGlow: 'var(--iris-glow-amber)',
    badgeBg: 'var(--iris-status-bg-amber)',
    badgeColor: 'var(--iris-accent-amber)',
  },
  info: {
    border: 'var(--iris-accent-blue)',
    bg: 'var(--iris-status-bg-blue)',
    iconColor: 'var(--iris-accent-blue)',
    iconGlow: 'var(--iris-glow-blue)',
    btnBg: 'linear-gradient(135deg, var(--iris-accent-blue), var(--iris-accent-cyan))',
    btnGlow: 'var(--iris-glow-blue)',
    badgeBg: 'var(--iris-status-bg-blue)',
    badgeColor: 'var(--iris-accent-blue)',
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
        <div className="mb-4 h-6 w-40 animate-pulse rounded" style={{ background: 'var(--iris-bg-skeleton)' }} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--iris-bg-skeleton)' }} />
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
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold" style={{ background: 'var(--iris-status-bg-coral)', color: 'var(--iris-accent-coral)' }}>
              {total}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Топ-3 приоритетных</span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: 'var(--iris-border-dashed)', color: 'var(--text-muted)' }}>
            <ShieldAlert className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Все системы в норме. Тревог нет.
          </div>
        )}

        {alerts.map((alert) => {
          const cfg = severityConfig[alert.severity] ?? severityConfig.info;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border p-3 transition-all duration-200"
              style={{
                borderColor: cfg.border,
                background: cfg.bg,
              }}
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: cfg.iconGlow,
                  color: cfg.iconColor,
                  boxShadow: `0 0 12px ${cfg.iconGlow}`,
                }}
              >
                <AlertIcon icon={alert.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {alert.title}
                  </p>
                  {alert.severity === 'critical' && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: cfg.badgeBg, color: cfg.badgeColor }}>
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
                className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium transition-all duration-200 hover:brightness-110"
                style={{
                  background: cfg.btnBg,
                  color: 'var(--iris-text-inverse)',
                  boxShadow: `0 0 12px ${cfg.btnGlow}`,
                }}
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
