import React, { useMemo } from 'react';
import { Users, Briefcase, ArrowRightLeft } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import type { Employee, Department, BpmnNode } from './types';

interface EmployeesPanelProps {
  employees: Employee[];
  departments: Department[];
  nodes: BpmnNode[];
}

export const EmployeesPanel: React.FC<EmployeesPanelProps> = ({ employees, departments, nodes }) => {
  const sorted = useMemo(() => [...employees].sort((a, b) => b.kpiLoad - a.kpiLoad), [employees]);
  const handovers = useMemo(() => {
    const list: { from: string; to: string; count: number }[] = [];
    for (let i = 0; i < departments.length - 1; i++) {
      const from = departments[i];
      const to = departments[i + 1];
      const count = nodes.filter((n) => n.dept === from.key).length;
      list.push({ from: from.label, to: to.label, count });
    }
    return list;
  }, [departments, nodes]);

  const taskName = (id: string) => nodes.find((n) => n.id === id)?.label || id;

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--iris-text-primary)]">
          <ArrowRightLeft size={16} /> Точки передачи ответственности между отделами
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {handovers.map((h, idx) => (
            <React.Fragment key={idx}>
              <div className="rounded-md border border-[var(--iris-border-default)] px-2 py-1 text-xs text-[var(--iris-text-secondary)]">
                {h.from} → {h.to} ({h.count})
              </div>
              {idx < handovers.length - 1 && <span className="text-[var(--iris-text-muted)]">|</span>}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--iris-bg-surface)] text-xs uppercase text-[var(--iris-text-muted)]">
              <tr>
                <th className="px-3 py-2">Сотрудник</th>
                <th className="px-3 py-2">Роль</th>
                <th className="px-3 py-2">Отдел</th>
                <th className="px-3 py-2">Загрузка</th>
                <th className="px-3 py-2">Задачи</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((emp) => {
                const dept = departments.find((d) => d.key === emp.dept);
                return (
                  <tr key={emp.id} className="border-t border-[var(--iris-border-default)]">
                    <td className="px-3 py-2 font-medium text-[var(--iris-text-primary)]">
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-[var(--iris-text-muted)]" />
                        {emp.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--iris-text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Briefcase size={10} />
                        {emp.role}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dept?.color }} />
                        <span className="text-xs text-[var(--iris-text-secondary)]">{dept?.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={emp.kpiLoad >= 90 ? 'error' : emp.kpiLoad >= 80 ? 'warning' : 'neutral'} className="text-xs">
                        {emp.kpiLoad}%
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--iris-text-secondary)]">
                      {emp.tasks.map(taskName).join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
