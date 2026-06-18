import React from 'react';
import { AlertTriangle, GitMerge, ArrowRight, ShieldAlert } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import type { Problem, BpmnNode } from './types';

interface ProblemsPanelProps {
  problems: Problem[];
  nodes: BpmnNode[];
  onSelectTask: (id: string) => void;
}

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({ problems, nodes, onSelectTask }) => {
  const crit = problems.filter((p) => p.severity === 'crit');
  const warn = problems.filter((p) => p.severity === 'warn');

  const ProblemCard: React.FC<{ problem: Problem }> = ({ problem }) => {
    const taskNames = problem.tasks.map((id) => nodes.find((n) => n.id === id)?.label || id).join(', ');
    return (
      <Card className="p-3 transition-shadow hover:shadow-sm">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {problem.severity === 'crit' ? (
              <ShieldAlert size={16} className="text-red-500" />
            ) : (
              <AlertTriangle size={16} className="text-amber-500" />
            )}
            <h5 className="text-sm font-semibold text-[var(--iris-text-primary)]">{problem.title}</h5>
          </div>
          <Badge variant={problem.severity === 'crit' ? 'error' : 'warning'} className="text-[10px]">
            {problem.severity === 'crit' ? 'критично' : 'значимо'}
          </Badge>
        </div>
        <p className="mb-2 text-xs text-[var(--iris-text-secondary)]">{problem.description}</p>
        <div className="mb-3 rounded-md bg-[var(--iris-bg-surface)] p-2 text-xs text-[var(--iris-text-secondary)]">
          <span className="font-medium text-[var(--iris-text-primary)]">Рекомендация:</span> {problem.recommendation}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[var(--iris-text-muted)]">
            <GitMerge size={10} /> {taskNames}
          </div>
          <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={() => onSelectTask(problem.tasks[0])}>
            К задаче <ArrowRight size={12} />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-600">
            <ShieldAlert size={16} /> Критичные проблемы ({crit.length})
          </h4>
          <div className="space-y-2">
            {crit.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-600">
            <AlertTriangle size={16} /> Значимые риски ({warn.length})
          </h4>
          <div className="space-y-2">
            {warn.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        </div>
      </div>

      <Card className="p-3">
        <h4 className="mb-2 text-sm font-bold text-[var(--iris-text-primary)]">Приоритетные действия</h4>
        <ol className="list-decimal space-y-1 pl-4 text-xs text-[var(--iris-text-secondary)]">
          <li>Снять перегруз с главного инженера: распределить ТЗ на Савельева К.Р. или ввести 2-го инженера.</li>
          <li>Сократить сроки поставки: локализовать ключевые позиции, ввести резервирование компонентов.</li>
          <li>Устранить двойной учёт BOM через единую PDM/PLM-систему.</li>
          <li>Внедрить промежуточный контроль после электромонтажа для повышения процента сдачи с первого раза.</li>
        </ol>
      </Card>
    </div>
  );
};
