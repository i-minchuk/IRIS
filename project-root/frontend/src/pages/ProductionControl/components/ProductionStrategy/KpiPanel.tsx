import React from 'react';
import { TrendingUp, Clock, AlertCircle, Users } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import type { Department, BpmnNode, Employee, KpiStatus } from './types';

interface KpiPanelProps {
  departments: Department[];
  nodes: BpmnNode[];
  employees: Employee[];
}

const statusClass = (status: KpiStatus) => {
  if (status === 'crit') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'warn') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

export const KpiPanel: React.FC<KpiPanelProps> = ({ departments, nodes, employees }) => {
  const totalCycle = nodes.reduce((sum, n) => sum + n.avgDays, 0);
  const bottleneckDays = nodes.filter((n) => n.issue === 'bottleneck').reduce((sum, n) => sum + n.avgDays, 0);
  const avgLoad = employees.length
    ? Math.round(employees.reduce((s, e) => s + e.kpiLoad, 0) / employees.length)
    : 0;

  const cards = [
    { label: 'Общий цикл производства', value: `${totalCycle} дн.`, icon: Clock, status: 'ok' as KpiStatus, note: 'плановая длительность' },
    { label: 'Потери на узких местах', value: `${bottleneckDays} дн.`, icon: AlertCircle, status: 'warn' as KpiStatus, note: 'влияние bottleneck' },
    { label: 'Средняя загрузка сотрудников', value: avgLoad > 0 ? `${avgLoad}%` : ' ', icon: Users, status: avgLoad >= 85 ? ('warn' as KpiStatus) : ('ok' as KpiStatus), note: avgLoad > 0 ? 'по всем отделам' : 'нет данных' },
    { label: 'Производительность, усл. ед./мес', value: ' ', icon: TrendingUp, status: 'ok' as KpiStatus, note: 'нет данных' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-3">
            <div className="mb-2 flex items-center gap-2 text-[var(--iris-text-muted)]">
              <c.icon size={14} />
              <span className="text-xs font-medium">{c.label}</span>
            </div>
            <div className="text-xl font-bold text-[var(--iris-text-primary)]">{c.value}</div>
            <Badge variant="neutral" className={`mt-1 text-xs ${statusClass(c.status)}`}>
              {c.note}
            </Badge>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h4 className="mb-3 text-sm font-bold text-[var(--iris-text-primary)]">KPI по отделам</h4>
          <div className="space-y-3">
            {departments.map((d) => {
              const deptEmps = employees.filter((e) => e.dept === d.key);
              const avg = deptEmps.length ? Math.round(deptEmps.reduce((s, e) => s + e.kpiLoad, 0) / deptEmps.length) : 0;
              const tasks = nodes.filter((n) => n.dept === d.key && n.type === 'task').length;
              return (
                <div key={d.key} className="flex items-center justify-between rounded-lg border border-[var(--iris-border-default)] p-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <div>
                      <div className="text-xs font-medium text-[var(--iris-text-primary)]">{d.label}</div>
                      <div className="text-xs text-[var(--iris-text-muted)]">{tasks} задач(и)</div>
                    </div>
                  </div>
                  <Badge variant={avg >= 90 ? 'error' : avg >= 80 ? 'warning' : 'neutral'} className="text-xs">
                    {avg > 0 ? `${avg}% загрузка` : ' '}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="mb-3 text-sm font-bold text-[var(--iris-text-primary)]">Временная шкала этапов</h4>
          <div className="space-y-2">
            {nodes
              .filter((n) => n.type === 'task')
              .map((n) => {
                const pct = Math.max(2, Math.round((n.avgDays / totalCycle) * 100));
                return (
                  <div key={n.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[var(--iris-text-secondary)]">{n.label}</span>
                      <span className="text-[var(--iris-text-muted)]">{n.avgDays} дн.</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--iris-bg-surface)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: n.issue === 'bottleneck' ? '#f97316' : '#3b82f6' }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
  );
};
