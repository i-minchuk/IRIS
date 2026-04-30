import { CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react';
import type { TenderTask } from '../types/tender';

interface Props {
  tasks: TenderTask[];
}

const STATUS_META = {
  todo: { icon: Circle, label: 'К выполнению', color: 'var(--text-muted)' },
  in_progress: { icon: Clock, label: 'В работе', color: 'var(--iris-accent-blue)' },
  done: { icon: CheckCircle2, label: 'Выполнено', color: 'var(--iris-accent-cyan)' },
  overdue: { icon: AlertTriangle, label: 'Просрочено', color: 'var(--iris-accent-coral)' },
};

const PRIORITY_META = {
  low: { label: 'Низкий', color: 'var(--text-muted)' },
  medium: { label: 'Средний', color: 'var(--iris-accent-amber)' },
  high: { label: 'Высокий', color: 'var(--iris-accent-coral)' },
};

export function TenderTaskPanel({ tasks }: Props) {
  const sorted = [...tasks].sort((a, b) => {
    const pa = a.status === 'overdue' ? 0 : a.priority === 'high' ? 1 : a.priority === 'medium' ? 2 : 3;
    const pb = b.status === 'overdue' ? 0 : b.priority === 'high' ? 1 : b.priority === 'medium' ? 2 : 3;
    return pa - pb;
  });

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Задачи по заказам
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {tasks.filter((t) => t.status !== 'done').length} активных
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((task) => {
          const st = STATUS_META[task.status];
          const pr = PRIORITY_META[task.priority];
          const StatusIcon = st.icon;

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-lg border p-3 transition-all"
              style={{
                borderColor: task.status === 'overdue' ? 'var(--iris-accent-coral)' : 'var(--iris-border-subtle)',
                background: task.status === 'overdue' ? 'var(--iris-status-bg-coral)' : 'var(--iris-bg-subtle)',
              }}
            >
              <StatusIcon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: st.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {task.title}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {task.assignee}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: pr.color, background: `${pr.color}15` }}>
                    {pr.label}
                  </span>
                  <span className="text-[10px]" style={{ color: task.status === 'overdue' ? 'var(--iris-accent-coral)' : 'var(--text-muted)' }}>
                    до {task.due_date}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Нет активных задач
        </div>
      )}
    </div>
  );
}
