import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch, Clock, AlertTriangle, CheckCircle, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  workflowApi,
  type DeadlineOverview,
  type DeadlineOverviewRow,
} from '@/features/workflow/api/workflowApi';

interface Props {
  isDark: boolean;
}

export function WorkflowDeadlineWidget({ isDark }: Props) {
  const [data, setData] = useState<DeadlineOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await workflowApi.getDeadlineOverview());
      setError(null);
    } catch (e: any) {
      setError(e?.response?.status === 403 ? null : 'Не удалось загрузить контроль дедлайнов');
      setData(null);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 120_000);
    return () => clearInterval(timer);
  }, [load]);

  if (error || !data) return null;

  const visibleRows: DeadlineOverviewRow[] = expanded ? data.rows : data.rows.slice(0, 5);

  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ background: 'rgba(14, 165, 233, 0.12)' }}>
            <GitBranch size={16} style={{ color: '#0EA5E9' }} />
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Контроль дедлайнов согласования
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {data.overdue > 0 && (
            <span
              className="text-sm px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}
              title="Просроченных шагов"
            >
              {data.overdue}
            </span>
          )}
          <span
            className="text-sm px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(14,165,233,0.12)', color: '#0EA5E9' }}
            title="Всего шагов на согласовании с лимитом времени"
          >
            {data.total}
          </span>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm py-3" style={{ color: '#4F7A4C' }}>
          <CheckCircle size={14} />
          Нет активных согласований с лимитом времени
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {visibleRows.map((r) => {
              const overdue = r.overdue_hours !== null;
              return (
                <div
                  key={r.step_id}
                  className="flex items-start gap-2.5 p-2 rounded-lg transition-colors"
                  style={{ background: 'transparent', borderLeft: `3px solid ${overdue ? '#DC2626' : '#0EA5E9'}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {r.document_name || 'Документ'}
                      </span>
                      {r.document_id && (
                        <Link
                          to={`/documents/${r.document_id}?tab=workflow`}
                          className="shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                          title="Открыть документооборот"
                        >
                          <ExternalLink size={11} />
                        </Link>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {r.step_name}
                      {r.assignees.length > 0 && (
                        <>
                          {' · '}
                          {r.assignees.map((a, idx) => {
                            const p = data.punctuality?.[String(a.id)];
                            return (
                              <span key={a.id}>
                                {idx > 0 && ', '}
                                {a.full_name}
                                {p && (p.on_time > 0 || p.late > 0) && (
                                  <span
                                    className="ml-1 inline-flex items-center gap-1 align-middle"
                                    title={`Согласовано в срок: ${p.on_time}, с просрочкой: ${p.late}, отправлено в срок: ${p.sent_on_time}`}
                                  >
                                    <span style={{ color: '#10B981' }}>
                                      <CheckCircle size={10} />
                                      {p.on_time}
                                    </span>
                                    {p.late > 0 && (
                                      <span style={{ color: '#DC2626' }}>
                                        <AlertTriangle size={10} />
                                        {p.late}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </>
                      )}
                      {r.assignees.length === 0 && <> · исполнители не назначены</>}
                    </div>
                  </div>
                  {overdue ? (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 inline-flex items-center gap-1"
                      style={{ color: '#DC2626', background: 'rgba(220,38,38,0.12)' }}
                    >
                      <AlertTriangle size={10} />
                      +{r.overdue_hours} ч
                    </span>
                  ) : (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1"
                      style={{ color: 'var(--text-secondary)', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                    >
                      <Clock size={10} />
                      осталось {r.hours_left} ч
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {data.rows.length > 5 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-md cursor-pointer transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            >
              {expanded ? <><ChevronUp size={12} /> Свернуть</> : <><ChevronDown size={12} /> Показать все ({data.rows.length})</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}
