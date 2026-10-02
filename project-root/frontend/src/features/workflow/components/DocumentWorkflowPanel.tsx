import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  GitBranch, Play, CheckCircle, XCircle, UserPlus, MessageSquare,
  Clock, AlertTriangle, PenLine,
} from 'lucide-react';
import { workflowApi, type WorkflowInstance, type WorkflowTemplate } from '../api/workflowApi';
import { getUsers } from '@/features/users/api/users';
import apiClient from '@/shared/api/client';
import type { User } from '@/types';

const INSTANCE_STATUS: Record<string, { label: string; color: string }> = {
  running: { label: 'В работе', color: '#3B82F6' },
  paused: { label: 'На доработке', color: '#D97706' },
  completed: { label: 'Завершён', color: '#4F7A4C' },
  cancelled: { label: 'Отменён', color: '#94A3B8' },
  draft: { label: 'Черновик', color: '#94A3B8' },
  failed: { label: 'Ошибка', color: '#DC2626' },
};

const STEP_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Ожидает', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  in_progress: { label: 'На согласовании', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  approved: { label: 'Согласовано', color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)' },
  rejected: { label: 'Отклонено', color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  delegated: { label: 'Делегировано', color: '#D97706', bg: 'rgba(217,119,6,0.15)' },
  skipped: { label: 'Пропущено', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
};

const APPROVAL_TYPE: Record<string, string> = {
  approve: 'Утверждение',
  approve_with_comments: 'Согласование с замечаниями',
  view_only: 'Просмотр',
};

type ActionKind = 'approve' | 'reject' | 'delegate' | 'comments' | null;

interface Props {
  documentId: number;
  documentName?: string;
  projectId?: number;
}

export const DocumentWorkflowPanel: React.FC<Props> = ({
  documentId,
  documentName,
  projectId,
}) => {
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [templateId, setTemplateId] = useState<number | ''>('');
  const [launchComment, setLaunchComment] = useState('');
  const [actionStepId, setActionStepId] = useState<number | null>(null);
  const [actionKind, setActionKind] = useState<ActionKind>(null);
  const [actionText, setActionText] = useState('');
  const [delegateTo, setDelegateTo] = useState<number | ''>('');
  const [returnToAuthor, setReturnToAuthor] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inst, tpls] = await Promise.all([
        workflowApi.getDocumentInstances(documentId),
        startOpen ? Promise.resolve(templates) : workflowApi.getTemplates(),
      ]);
      setInstances(inst);
      setTemplates(tpls);
    } catch {
      toast.error('Не удалось загрузить документооборот');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, startOpen]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (startOpen && users.length === 0) {
      getUsers().then(setUsers).catch(() => setUsers([]));
    }
  }, [startOpen, users.length]);

  useEffect(() => {
    if (actionKind === 'delegate' && users.length === 0) {
      getUsers().then(setUsers).catch(() => setUsers([]));
    }
  }, [actionKind, users.length]);

  const instance = instances[0] ?? null;
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;

  const start = async () => {
    if (!templateId) return;
    setBusy(true);
    try {
      await workflowApi.startWorkflow({
        template_id: Number(templateId),
        document_id: documentId,
        document_name: documentName,
        project_id: projectId,
        launch_comment: launchComment || undefined,
      });
      toast.success('Согласование по маршруту запущено');
      setStartOpen(false);
      setLaunchComment('');
      setTemplateId('');
      await load();
    } catch {
      /* toast об ошибке показал интерцептор */
    } finally {
      setBusy(false);
    }
  };

  const openComments = async (stepId: number) => {
    setActionStepId(stepId);
    setActionKind('comments');
    setActionText('');
    try {
      const res = await apiClient.get(`/workflows/steps/${stepId}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComments([]);
    }
  };

  const addComment = async () => {
    if (!actionStepId || !actionText.trim()) return;
    setBusy(true);
    try {
      await apiClient.post(`/workflows/steps/${actionStepId}/comments`, { text: actionText.trim() });
      setActionText('');
      await openComments(actionStepId);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const runAction = async () => {
    if (!actionStepId) return;
    setBusy(true);
    try {
      if (actionKind === 'approve') {
        await workflowApi.approveStep(actionStepId, actionText.trim() || undefined);
        toast.success('Шаг согласован');
      } else if (actionKind === 'reject') {
        if (!actionText.trim()) {
          toast.error('Укажите причину отклонения');
          return;
        }
        await workflowApi.rejectStep(actionStepId, actionText.trim(), returnToAuthor);
        toast.success(returnToAuthor ? 'Возвращено автору на доработку' : 'Возвращено на доработку');
      } else if (actionKind === 'delegate') {
        if (!delegateTo) {
          toast.error('Выберите, кому делегировать');
          return;
        }
        await workflowApi.delegateStep(actionStepId, Number(delegateTo), actionText.trim() || undefined);
        toast.success('Шаг делегирован');
      }
      setActionKind(null);
      setActionStepId(null);
      setActionText('');
      setDelegateTo('');
      await load();
    } catch {
      /* toast об ошибке показал интерцептор */
    } finally {
      setBusy(false);
    }
  };

  const openForm = (stepId: number, kind: Exclude<ActionKind, 'comments' | null>) => {
    setActionStepId(stepId);
    setActionKind(kind);
    setActionText('');
    setDelegateTo('');
    setReturnToAuthor(true);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm py-6" style={{ color: 'var(--text-tertiary)' }}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: 'var(--brand-iris)' }} />
        Загрузка документооборота…
      </div>
    );
  }

  // ── Нет активного маршрута — предлагаем запустить ──
  if (!instance) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <GitBranch size={14} style={{ color: 'var(--brand-iris)' }} />
                Согласование по маршруту не запущено
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Запустите готовый маршрут (например, «Стандартный»: Проектировщик → ГИП → Начальник отдела → РП) или
                используйте вкладку «Согласование» для быстрого режима без маршрута.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStartOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer shrink-0"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-default)', background: 'var(--bg-surface-2)' }}
            >
              <Play size={12} />
              {startOpen ? 'Скрыть' : 'Запустить маршрут'}
            </button>
          </div>

          {startOpen && (
            <div className="mt-4 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border-default)' }}>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Маршрут согласования</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-md border text-sm"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                >
                  <option value="">— выберите маршрут —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="space-y-1.5">
                  {selectedTemplate.description && (
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{selectedTemplate.description}</p>
                  )}
                  {selectedTemplate.steps_schema.map((s, i) => (
                    <div key={s.id ?? i} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0"
                        style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        · {APPROVAL_TYPE[s.approval_type] ?? s.approval_type}
                        {s.deadline_hours ? ` · до ${s.deadline_hours} ч` : ''}
                      </span>
                    </div>
                  ))}
                  {selectedTemplate.steps_schema.some((s) => !s.role && !(s.user_ids?.length)) && (
                    <p className="text-xs flex items-center gap-1" style={{ color: '#D97706' }}>
                      <AlertTriangle size={12} />
                      Для некоторых шагов не заданы исполнители — согласовать их сможет любой пользователь.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Комментарий к запуску (необязательно)</label>
                <textarea
                  value={launchComment}
                  onChange={(e) => setLaunchComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border text-sm resize-none"
                  style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  placeholder="Например: прошу согласовать компоновку до пятницы"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={start}
                  disabled={!templateId || busy}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer disabled:opacity-50"
                  style={{ color: '#fff', borderColor: 'var(--brand-iris)', background: 'var(--brand-iris)' }}
                >
                  <Play size={12} />
                  Запустить согласование
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Активный маршрут: цепочка шагов ──
  const instStatus = INSTANCE_STATUS[instance.status] ?? { label: instance.status, color: 'var(--text-secondary)' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <GitBranch size={14} style={{ color: 'var(--brand-iris)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{instance.template_name}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ color: instStatus.color, background: instStatus.color + '20', border: `1px solid ${instStatus.color}55` }}
          >
            {instStatus.label}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Запущено {instance.started_at ? new Date(instance.started_at).toLocaleString('ru-RU') : '—'}
          {instance.completed_at ? ` · завершено ${new Date(instance.completed_at).toLocaleString('ru-RU')}` : ''}
        </span>
      </div>

      {instance.launch_comment && (
        <p className="text-xs italic border-l-2 pl-2" style={{ color: 'var(--text-secondary)', borderColor: 'var(--brand-iris)' }}>
          {instance.launch_comment}
        </p>
      )}

      <div className="space-y-2">
        {instance.steps.map((step, idx) => {
          const st = STEP_STATUS[step.status] ?? STEP_STATUS.pending;
          const isCurrent = step.id === instance.current_step_id || step.status === 'in_progress';
          const showActions = step.status === 'in_progress' && instance.status !== 'completed';
          return (
            <div key={step.id} className="rounded-lg border p-3" style={{ borderColor: isCurrent ? st.color + '66' : 'var(--border-default)' }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={step.status === 'approved' ? { background: st.bg, color: st.color } : { background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
                >
                  {step.status === 'approved' ? <CheckCircle size={13} /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{step.step_name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                    {step.is_delegated && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ color: '#D97706', background: 'rgba(217,119,6,0.15)' }}>
                        Делегировано
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {APPROVAL_TYPE[step.approval_type] ?? step.approval_type}
                    {step.deadline_hours ? ` · лимит ${step.deadline_hours} ч` : ''}
                    {step.deadline && step.status === 'in_progress' && (
                      <span
                        style={{ color: new Date(step.deadline) < new Date() ? '#DC2626' : undefined }}
                        className="inline-flex items-center gap-1 ml-1"
                      >
                        <Clock size={11} />
                        до {new Date(step.deadline).toLocaleString('ru-RU')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {step.assigned_users.length > 0 ? (
                      step.assigned_users.map((u) => (
                        <span
                          key={u.id}
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                        >
                          {u.full_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs flex items-center gap-1" style={{ color: '#D97706' }}>
                        <AlertTriangle size={11} /> Исполнители не назначены
                      </span>
                    )}
                    {step.signed_at && (
                      <span className="text-xs inline-flex items-center gap-1" style={{ color: '#4F7A4C' }}>
                        <PenLine size={11} /> Подписано {new Date(step.signed_at).toLocaleString('ru-RU')}
                      </span>
                    )}
                    {(step.comments_count ?? 0) > 0 && (
                      <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                        <MessageSquare size={11} /> {step.comments_count}
                      </span>
                    )}
                  </div>

                  {showActions && (
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openForm(step.id, 'approve')}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md cursor-pointer"
                        style={{ color: '#4F7A4C', background: 'rgba(79,122,76,0.12)', border: '1px solid rgba(79,122,76,0.4)' }}
                      >
                        <CheckCircle size={12} /> Согласовать
                      </button>
                      <button
                        type="button"
                        onClick={() => openForm(step.id, 'reject')}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md cursor-pointer"
                        style={{ color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.35)' }}
                      >
                        <XCircle size={12} /> Отклонить
                      </button>
                      <button
                        type="button"
                        onClick={() => openForm(step.id, 'delegate')}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md cursor-pointer"
                        style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
                      >
                        <UserPlus size={12} /> Делегировать
                      </button>
                      <button
                        type="button"
                        onClick={() => openComments(step.id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md cursor-pointer"
                        style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
                      >
                        <MessageSquare size={12} /> Комментарии
                      </button>
                    </div>
                  )}

                  {/* Инлайн-форма действия */}
                  {actionStepId === step.id && actionKind && (
                    <div className="mt-2.5 p-2.5 rounded-md space-y-2" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                      {actionKind === 'comments' ? (
                        <>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {comments.length === 0 && (
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Комментариев нет</p>
                            )}
                            {comments.map((c) => (
                              <div key={c.id} className="text-xs">
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{c.user_name}</span>
                                <span style={{ color: 'var(--text-tertiary)' }}> · {new Date(c.created_at).toLocaleString('ru-RU')}</span>
                                <div style={{ color: 'var(--text-secondary)' }}>{c.text}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={actionText}
                              onChange={(e) => setActionText(e.target.value)}
                              placeholder="Добавить комментарий…"
                              className="flex-1 px-2.5 py-1.5 rounded-md border text-xs"
                              style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                            />
                            <button
                              type="button"
                              onClick={addComment}
                              disabled={busy || !actionText.trim()}
                              className="text-xs px-2.5 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
                              style={{ color: '#fff', background: 'var(--brand-iris)', border: '1px solid var(--brand-iris)' }}
                            >
                              Отправить
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {actionKind === 'delegate' && (
                            <select
                              value={delegateTo}
                              onChange={(e) => setDelegateTo(e.target.value ? Number(e.target.value) : '')}
                              className="w-full px-2.5 py-1.5 rounded-md border text-xs"
                              style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                            >
                              <option value="">— кому делегировать —</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.full_name || u.username || u.email}</option>
                              ))}
                            </select>
                          )}
                          {actionKind === 'reject' && (
                            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <input
                                type="checkbox"
                                checked={returnToAuthor}
                                onChange={(e) => setReturnToAuthor(e.target.checked)}
                              />
                              Вернуть автору маршрута (иначе — на доработку текущему шагу)
                            </label>
                          )}
                          <textarea
                            value={actionText}
                            onChange={(e) => setActionText(e.target.value)}
                            rows={2}
                            placeholder={
                              actionKind === 'approve' ? 'Комментарий к согласованию (необязательно)'
                              : actionKind === 'reject' ? 'Причина отклонения (обязательно)'
                              : 'Причина делегирования (необязательно)'
                            }
                            className="w-full px-2.5 py-1.5 rounded-md border text-xs resize-none"
                            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setActionKind(null); setActionStepId(null); }}
                              className="text-xs px-2.5 py-1.5 rounded-md cursor-pointer"
                              style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                            >
                              Отмена
                            </button>
                            <button
                              type="button"
                              onClick={runAction}
                              disabled={busy}
                              className="text-xs px-2.5 py-1.5 rounded-md cursor-pointer disabled:opacity-50"
                              style={{ color: '#fff', background: 'var(--brand-iris)', border: '1px solid var(--brand-iris)' }}
                            >
                              Подтвердить
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {instance.status === 'completed' && (
        <div className="p-2.5 rounded-lg text-sm font-medium" style={{ background: 'rgba(79,122,76,0.12)', color: '#4F7A4C' }}>
          Маршрут пройден — все этапы согласованы.
        </div>
      )}
    </div>
  );
};
