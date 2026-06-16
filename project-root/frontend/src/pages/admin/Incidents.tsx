import { useState } from 'react';

import { useSupportStore } from '@/stores/supportStore';
import { IncidentCard } from '@/components/admin/IncidentCard';
import type { IncidentSeverity } from '@/types/support';
import { AlertTriangle } from 'lucide-react';

const SEVERITY_FILTERS: { severity: IncidentSeverity | 'all'; label: string }[] = [
  { severity: 'all', label: 'Все' },
  { severity: 'p1_critical', label: 'P1 Критический' },
  { severity: 'p2_major', label: 'P2 Мажорный' },
  { severity: 'p3_minor', label: 'P3 Минорный' },
  { severity: 'p4_info', label: 'P4 Информация' },
];

export default function IncidentsPage() {
  const incidents = useSupportStore(s => s.incidents);
  const [activeFilter, setActiveFilter] = useState<IncidentSeverity | 'all'>('all');

  const filtered = activeFilter === 'all'
    ? incidents
    : incidents.filter(i => i.severity === activeFilter);

  const openIncidents = incidents.filter(i => ['detected', 'investigating', 'mitigated'].includes(i.status));

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>
            Инциденты
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Управление инцидентами и постмортемами
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <AlertTriangle size={16} />
          <span>Открытых: {openIncidents.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {SEVERITY_FILTERS.map(f => (
          <button
            key={f.severity}
            onClick={() => setActiveFilter(f.severity)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeFilter === f.severity ? 'var(--brand-iris)' : 'var(--bg-surface-2)',
              color: activeFilter === f.severity ? 'var(--text-inverse)' : 'var(--text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(incident => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}
