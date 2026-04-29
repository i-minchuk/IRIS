import { AlertTriangle, ShieldAlert, Clock, FileWarning, ArrowRight } from 'lucide-react';
import type { AlertItem } from '../api/analytics';
import { useNavigate } from 'react-router-dom';

interface TopAlertsProps {
  data: { alerts: AlertItem[]; total: number } | null;
  loading?: boolean;
}

const severityConfig = {
  critical: {
    border: 'rgba(255,0,85,0.2)',
    bg: 'rgba(255,0,85,0.06)',
    iconColor: '#FF0055',
    iconGlow: 'rgba(255,0,85,0.3)',
    btnBg: 'linear-gradient(135deg, #FF0055, #FF4D6D)',
    btnGlow: 'rgba(255,0,85,0.3)',
    badgeBg: 'rgba(255,0,85,0.15)',
    badgeColor: '#FF0055',
  },
  warning: {
    border: 'rgba(255,170,0,0.2)',
    bg: 'rgba(255,170,0,0.06)',
    iconColor: '#FFAA00',
    iconGlow: 'rgba(255,170,0,0.3)',
    btnBg: 'linear-gradient(135deg, #FFAA00, #FFCC33)',
    btnGlow: 'rgba(255,170,0,0.3)',
    badgeBg: 'rgba(255,170,0,0.15)',
    badgeColor: '#FFAA00',
  },
  info: {
    border: 'rgba(41,121,255,0.2)',
    bg: 'rgba(41,121,255,0.06)',
    iconColor: '#2979FF',
    iconGlow: 'rgba(41,121,255,0.3)',
    btnBg: 'linear-gradient(135deg, #2979FF, #00F0FF)',
    btnGlow: 'rgba(41,121,255,0.3)',
    badgeBg: 'rgba(41,121,255,0.15)',
    badgeColor: '#2979FF',
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
            <span
              className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
              style={{ background: 'rgba(255,0,85,0.15)', color: '#FF0055' }}
            >
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
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
                    >
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
                  color: '#FFFFFF',
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
