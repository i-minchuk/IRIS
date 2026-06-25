import React from 'react';
import { X, FileText, Users, Clock, AlertTriangle, GitMerge } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import type { BpmnNode, Employee } from './types';
import { DEPARTMENT_BY_KEY } from './data';

interface DetailPanelProps {
  node: BpmnNode;
  employees: Employee[];
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ node, employees, onClose }) => {
  const dept = DEPARTMENT_BY_KEY[node.dept];
  const nodeEmployees = employees.filter((e) => node.employees.includes(e.id));

  return (
    <Card className="h-full w-full overflow-auto p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: dept.color }} />
            <h3 className="text-base font-bold text-[var(--iris-text-primary)]">{node.label}</h3>
          </div>
          <div className="text-xs text-[var(--iris-text-muted)]">{dept.label}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-[var(--iris-text-secondary)]">{node.description}</p>

      {node.issue !== 'ok' && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-lg p-3 ${
            node.issue === 'bottleneck' ? 'bg-orange-50 text-orange-800' : 'bg-purple-50 text-purple-800'
          }`}
        >
          {node.issue === 'bottleneck' ? <AlertTriangle size={16} /> : <GitMerge size={16} />}
          <div className="text-xs">
            {node.issue === 'bottleneck'
              ? 'Узкое место процесса: задержки здесь сдвигают сроки всего производства.'
              : 'Дублирование операций/данных: есть потенциал для оптимизации.'}
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-2">
          <div className="mb-1 flex items-center gap-1 text-xs text-[var(--iris-text-muted)]">
            <Clock size={12} /> Средняя длительность
          </div>
          <div className="text-sm font-semibold text-[var(--iris-text-primary)]">
            {node.avgDays ? `${node.avgDays} дн.` : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--iris-border-default)] bg-[var(--iris-bg-surface)] p-2">
          <div className="mb-1 flex items-center gap-1 text-xs text-[var(--iris-text-muted)]">
            <Users size={12} /> Участники
          </div>
          <div className="text-sm font-semibold text-[var(--iris-text-primary)]">{nodeEmployees.length} чел.</div>
        </div>
      </div>

      {node.kpis.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--iris-text-muted)]">KPI задачи</h4>
          <div className="space-y-2">
            {node.kpis.map((k, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-md border border-[var(--iris-border-default)] px-3 py-2">
                <span className="text-xs text-[var(--iris-text-secondary)]">{k.label}</span>
                <Badge
                  variant={k.status === 'crit' ? 'error' : k.status === 'warn' ? 'warning' : 'neutral'}
                  className="text-xs"
                >
                  {k.value}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.docs.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--iris-text-muted)]">
            <FileText size={12} /> Документы
          </h4>
          <ul className="space-y-1">
            {node.docs.map((doc, idx) => (
              <li key={idx} className="text-xs text-[var(--iris-text-secondary)]">
                • {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {nodeEmployees.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--iris-text-muted)]">
            <Users size={12} /> Ответственные
          </h4>
          <div className="space-y-2">
            {nodeEmployees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between rounded-md border border-[var(--iris-border-default)] px-2 py-1.5">
                <div>
                  <div className="text-xs font-medium text-[var(--iris-text-primary)]">{emp.name}</div>
                  <div className="text-xs text-[var(--iris-text-muted)]">{emp.role}</div>
                </div>
                <Badge variant={emp.kpiLoad >= 90 ? 'error' : emp.kpiLoad >= 80 ? 'warning' : 'neutral'} className="text-xs">
                  {emp.kpiLoad}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
