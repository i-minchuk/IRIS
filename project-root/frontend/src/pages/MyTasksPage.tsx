import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  GitBranch, CheckCircle, Clock, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { workflowApi, type MyTask } from '@/features/workflow/api/workflowApi';

const APPROVAL_TYPE: Record<string, string> = {
  approve: 'Утверждение',
  approve_with_comments: 'Согласование с замечаниями',
  view_only: 'Просмотр',
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await workflowApi.getMyTasks());
    } catch {
      toast.error('Не удалось загрузить задачи на согласование');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (onlyOverdue ? tasks.filter((t) => t.overdue_hours !== null) : tasks),
    [tasks, onlyOverdue]
  );

  const overdueCount = useMemo(
    () => tasks.filter((t) => t.overdue_hours !== null).length,
    [tasks]
  );

  return (
    <div className="w-full pt-2 pb-6 px-4 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <GitBranch size={18} style={{ color: 'var(--brand-iris)' }} />
            Мои задачи на согласование
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Документы, ожидающие вашего согласования по маршруту
            {overdueCount > 0 && (
              <span style={{ color: '#DC2626' }}>
                {' '}· {overdueCount} просрочено
              </span>
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
            className="cursor-pointer"
          />
          Только просроченные
        </label>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: 'var(--text-tertiary)' }}>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--brand-iris)' }} />
          Загрузка задач…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ border: '1px solid var(--border-default)' }}>
          <CheckCircle size={28} className="mx-auto mb-3" style={{ color: '#4F7A4C' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {onlyOverdue ? 'Просроченных задач нет' : 'Задач на согласование нет'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {onlyOverdue ? 'Все дедлайны выдержаны — отличная работа.' : 'Новые задачи появятся, когда документ попадёт к вам на этап согласования.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const overdue = t.overdue_hours !== null;
            const deadlineDate = t.deadline ? new Date(t.deadline) : null;
            return (
              <div
                key={t.step_id}
                className="rounded-xl p-4 flex items-center gap-4 flex-wrap transition-all hover:translate-y-[-1px]"
                style={{
                  background: 'var(--card-bg)',
                  border: `1px solid ${overdue ? 'rgba(220,38,38,0.4)' : 'var(--border-default)'}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={
                    overdue
                      ? { background: 'rgba(220,38,38,0.12)', color: '#DC2626' }
                      : { background: 'var(--bg-surface-2)', color: 'var(--brand-iris)' }
                  }
                >
                  {overdue ? <AlertTriangle size={16} /> : <GitBranch size={16} />}
                </div>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {t.document_name || 'Документ'}
                    </span>
                    {t.template_name && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'rgba(20,184,166,0.12)', color: '#14B8A6' }}
                      >
                        {t.template_name}
                      </span>
                    )}
                    {t.is_delegated && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: '#D97706', background: 'rgba(217,119,6,0.15)' }}
                      >
                        Делегировано
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Этап: {t.step_name} · {APPROVAL_TYPE[t.approval_type] ?? t.approval_type}
                    {t.assigned_at && ` · назначено ${new Date(t.assigned_at).toLocaleString('ru-RU')}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {deadlineDate && (
                    overdue ? (
                      <span
                        className="text-xs px-2 py-1 rounded-md font-medium inline-flex items-center gap-1"
                        style={{ color: '#DC2626', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.4)' }}
                      >
                        <AlertTriangle size={11} />
                        Просрочено на {t.overdue_hours} ч
                      </span>
                    ) : (
                      <span
                        className="text-xs px-2 py-1 rounded-md inline-flex items-center gap-1"
                        style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
                      >
                        <Clock size={11} />
                        До {deadlineDate.toLocaleString('ru-RU')}
                      </span>
                    )
                  )}
                  {t.document_id && (
                    <Link
                      to={`/documents/${t.document_id}?tab=workflow`}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors"
                      style={{ color: '#fff', background: 'var(--brand-iris)' }}
                    >
                      Открыть
                      <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
