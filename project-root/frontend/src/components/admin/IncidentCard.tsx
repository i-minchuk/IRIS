import type { Incident } from '@/types/support';
import { Badge } from '@/components/ui';
import { Card } from '@/components/ui';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Clock, Server } from 'lucide-react';

const SEVERITY_CONFIG = {
  p1_critical: { label: 'P1 Критический', color: '#EF4444', icon: AlertTriangle },
  p2_major: { label: 'P2 Мажорный', color: '#F59E0B', icon: AlertCircle },
  p3_minor: { label: 'P3 Минорный', color: '#3B82F6', icon: Info },
  p4_info: { label: 'P4 Информация', color: '#6B7280', icon: Info },
};

const STATUS_CONFIG = {
  detected: { label: 'Обнаружен', variant: 'error' as const },
  investigating: { label: 'Расследование', variant: 'warning' as const },
  mitigated: { label: 'Смягчён', variant: 'info' as const },
  resolved: { label: 'Решён', variant: 'success' as const },
  postmortem: { label: 'Постмортем', variant: 'neutral' as const },
};

interface IncidentCardProps {
  incident: Incident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const sev = SEVERITY_CONFIG[incident.severity];
  const SevIcon = sev.icon;
  const status = STATUS_CONFIG[incident.status];

  return (
    <Card padding="md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <SevIcon size={18} style={{ color: sev.color }} />
          <span className="text-sm font-medium" style={{ color: sev.color }}>
            {sev.label}
          </span>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
        {incident.title}
      </h3>

      <p className="text-sm mb-3 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
        {incident.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {incident.affected_systems.map(sys => (
          <span
            key={sys}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md"
            style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
          >
            <Server size={10} />
            {sys}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Обнаружен: {new Date(incident.detected_at).toLocaleString('ru-RU')}
        </span>
        {incident.resolved_at && (
          <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <CheckCircle2 size={12} />
            Решён: {new Date(incident.resolved_at).toLocaleString('ru-RU')}
          </span>
        )}
      </div>

      <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
        Lead: <span className="font-medium">{incident.lead}</span>
      </div>

      {incident.timeline.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Timeline</h4>
          <div className="space-y-2">
            {incident.timeline.slice(-3).map((evt, idx) => (
              <div key={idx} className="flex gap-2 text-xs">
                <span className="whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(evt.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{evt.event}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
