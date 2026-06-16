import { Card } from '@/components/ui';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, User, FileText } from 'lucide-react';
import type { TenderDetail } from '@/features/tenders/types/tender-extended';

interface TenderOverviewTabProps {
  tender: TenderDetail['tender'];
  tasks: TenderDetail['tasks'];
  workflows: TenderDetail['workflows'];
}

export default function TenderOverviewTab({ tender, tasks, workflows }: TenderOverviewTabProps) {
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date) < new Date();
  });

  return (
    <div className="space-y-4">
      {/* Task summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Всего задач" value={tasks.length} color="#2563EB" />
        <StatCard label="В работе" value={pendingTasks.length} color="#D4AF37" />
        <StatCard label="Выполнено" value={completedTasks.length} color="#0C7205" />
        <StatCard label="Просрочено" value={overdueTasks.length} color={overdueTasks.length > 0 ? '#DC2626' : '#6B7280'} />
      </div>

      {/* Tasks list */}
      {tasks.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Задачи по тендеру</h3>
          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2 rounded-lg text-xs"
                style={{ background: 'var(--bg-surface-2)' }}
              >
                <div className="flex items-center gap-2">
                  <TaskStatusIcon status={task.status} />
                  <span style={{ color: 'var(--text-primary)' }}>{task.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  {task.assignee && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <User size={10} /> {task.assignee}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="flex items-center gap-1" style={{ color: overdueTasks.includes(task) ? '#DC2626' : 'var(--text-muted)' }}>
                      <Clock size={10} /> {new Date(task.due_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: task.priority === 'high' ? 'rgba(220,38,38,0.12)' : task.priority === 'medium' ? 'rgba(212,175,55,0.12)' : 'rgba(107,114,128,0.12)',
                      color: task.priority === 'high' ? '#DC2626' : task.priority === 'medium' ? '#D4AF37' : '#6B7280',
                    }}
                  >
                    {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Workflows */}
      {workflows.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Согласования</h3>
          <div className="space-y-3">
            {workflows.map(wf => (
              <div key={wf.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {wf.document_name || `Согласование №${wf.id}`}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: wf.status === 'completed' ? 'rgba(12,114,5,0.12)' : 'rgba(37,99,235,0.12)',
                      color: wf.status === 'completed' ? '#0C7205' : '#2563EB',
                    }}
                  >
                    {wf.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {wf.steps.map((step, i) => (
                    <div key={step.id} className="flex items-center gap-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: step.status === 'approved' ? '#0C7205' : step.status === 'in_progress' ? '#2563EB' : 'var(--bg-surface-2)',
                          color: step.status === 'approved' || step.status === 'in_progress' ? '#fff' : 'var(--text-muted)',
                          border: `1px solid ${step.status === 'approved' ? '#0C7205' : step.status === 'in_progress' ? '#2563EB' : 'var(--border-default)'}`,
                        }}
                      >
                        {i + 1}
                      </div>
                      {i < wf.steps.length - 1 && (
                        <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tender info grid */}
      <Card padding="md">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Параметры тендера</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <InfoRow label="Тип объекта" value={tender.project_type} />
          <InfoRow label="Объём" value={tender.volume ? `${tender.volume} ${tender.volume_unit}` : '—'} />
          <InfoRow label="Сложность" value={tender.complexity === 'low' ? 'Низкая' : tender.complexity === 'medium' ? 'Средняя' : 'Высокая'} />
          <InfoRow label="Площадка" value={tender.platform || '—'} />
          <InfoRow label="Регион" value={tender.region || '—'} />
          <InfoRow label="Стандарты" value={tender.standards?.join(', ') || '—'} />
          <InfoRow label="Себестоимость" value={tender.calculated_cost ? `₽ ${(tender.calculated_cost / 1e6).toFixed(1)} млн` : '—'} />
          <InfoRow label="Создан" value={tender.created_at ? new Date(tender.created_at).toLocaleDateString('ru-RU') : '—'} />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
      <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function TaskStatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle2 size={12} style={{ color: '#0C7205' }} />;
  if (status === 'in_progress') return <Clock size={12} style={{ color: '#2563EB' }} />;
  if (status === 'overdue') return <AlertTriangle size={12} style={{ color: '#DC2626' }} />;
  return <FileText size={12} style={{ color: 'var(--text-muted)' }} />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
