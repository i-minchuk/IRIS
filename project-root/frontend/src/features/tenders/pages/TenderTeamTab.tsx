import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { tenderExtendedApi } from '@/features/tenders/api/tenderExtended';
import type { TeamAvailability } from '@/features/tenders/types/tender-extended';

export default function TenderTeamTab({ tenderId }: { tenderId: number }) {
  const [data, setData] = useState<TeamAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenderExtendedApi.getTeamAvailability(tenderId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Данные недоступны</div>;
  }

  const { team_members, recommended_assignment, required_hours, required_team_size } = data;

  const freeCount = team_members.filter(m => m.availability === 'free').length;
  const partialCount = team_members.filter(m => m.availability === 'partial').length;
  const busyCount = team_members.filter(m => m.availability === 'busy').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Всего сотрудников" value={team_members.length} color="#2563EB" />
        <StatCard label="Свободны" value={freeCount} color="#0C7205" />
        <StatCard label="Частично" value={partialCount} color="#D4AF37" />
        <StatCard label="Загружены" value={busyCount} color="#DC2626" />
      </div>

      {/* Required workload */}
      {(required_hours || required_team_size) && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} style={{ color: '#6B5B95' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Требования тендера</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2 rounded" style={{ background: 'var(--bg-surface-2)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Трудоёмкость</div>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{required_hours?.toLocaleString('ru-RU')} ч</div>
            </div>
            <div className="p-2 rounded" style={{ background: 'var(--bg-surface-2)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Требуется человек</div>
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{required_team_size} чел</div>
            </div>
          </div>
        </Card>
      )}

      {/* Recommended assignment */}
      {recommended_assignment.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={14} style={{ color: '#0C7205' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Рекомендуемая команда</h3>
          </div>
          <div className="space-y-3">
            {recommended_assignment.map(rec => (
              <div key={rec.role} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {roleLabels[rec.role] || rec.role}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>Нужно: {rec.needed}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {rec.candidates.map(c => (
                    <div
                      key={c.id}
                      className="p-2 rounded-lg text-xs"
                      style={{
                        background: c.availability === 'free' ? 'rgba(12,114,5,0.08)' : c.availability === 'partial' ? 'rgba(212,175,55,0.08)' : 'rgba(220,38,38,0.08)',
                        border: `1px solid ${c.availability === 'free' ? 'rgba(12,114,5,0.2)' : c.availability === 'partial' ? 'rgba(212,175,55,0.2)' : 'rgba(220,38,38,0.2)'}`,
                      }}
                    >
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.full_name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span style={{ color: 'var(--text-muted)' }}>{c.department}</span>
                        <span style={{ color: c.load_pct > 80 ? '#DC2626' : c.load_pct > 50 ? '#D4AF37' : '#0C7205' }}>{c.load_pct}%</span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Свободен с {new Date(c.available_from).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  ))}
                  {rec.candidates.length === 0 && (
                    <div className="text-xs p-2 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)' }}>
                      <UserX size={12} className="inline mr-1" /> Нет подходящих кандидатов
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Full team table */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} style={{ color: '#2563EB' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Все сотрудники</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Сотрудник', 'Отдел', 'Загрузка', 'Задачи', 'Часов', 'Свободен с', 'Статус'].map(h => (
                  <th key={h} className="text-left px-2 py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team_members.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td className="px-2 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{m.full_name}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{m.department}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(m.load_pct, 100)}%`, background: m.load_pct > 80 ? '#DC2626' : m.load_pct > 50 ? '#D4AF37' : '#0C7205' }} />
                      </div>
                      <span style={{ color: m.load_pct > 80 ? '#DC2626' : m.load_pct > 50 ? '#D4AF37' : '#0C7205' }}>{m.load_pct}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{m.active_tasks}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{m.total_hours_assigned}</td>
                  <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{new Date(m.available_from).toLocaleDateString('ru-RU')}</td>
                  <td className="px-2 py-2">
                    <AvailabilityBadge status={m.availability} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function AvailabilityBadge({ status }: { status: string }) {
  const config = {
    free: { color: '#0C7205', bg: 'rgba(12,114,5,0.12)', label: 'Свободен' },
    partial: { color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', label: 'Частично' },
    busy: { color: '#DC2626', bg: 'rgba(220,38,38,0.12)', label: 'Загружен' },
  };
  const c = config[status as keyof typeof config] || config.busy;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

const roleLabels: Record<string, string> = {
  lead_engineer: 'Ведущий инженер',
  engineer: 'Инженер',
  checker: 'Нормоконтролёр',
  tech_editor: 'Технический редактор',
};
