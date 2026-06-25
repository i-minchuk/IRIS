import { useState, useEffect } from 'react';
import { workflowApi, type WorkflowInstance, type WorkflowStep, type WorkflowSignature } from '@/features/workflow/api/workflowApi';
import { Button, Badge } from '@/components/ui';
import { FileCheck, X, ArrowRight, ShieldCheck, Loader2, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowPanelProps {
  instanceId: number;
  onClose?: () => void;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ instanceId, onClose }) => {
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [signatures, setSignatures] = useState<Record<number, WorkflowSignature[]>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await workflowApi.getInstance(instanceId);
      setInstance(data);
      // Load signatures for completed steps
      const sigs: Record<number, WorkflowSignature[]> = {};
      for (const step of data.steps) {
        if (step.status === 'approved' || step.signed_by) {
          try {
            sigs[step.id] = await workflowApi.getStepSignatures(step.id);
          } catch {
            sigs[step.id] = [];
          }
        }
      }
      setSignatures(sigs);
    } catch (err: any) {
      toast.error('Не удалось загрузить маршрут согласования');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [instanceId]);

  const handleSign = async (step: WorkflowStep) => {
    setActing(step.id);
    try {
      const result = await workflowApi.signStep(step.id, {
        comment: 'Подписано электронной подписью',
        ip_address: undefined,
        user_agent: navigator.userAgent,
      });
      toast.success(result.workflow_completed ? 'Маршрут завершён!' : 'Этап подписан и согласован');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при подписании');
    } finally {
      setActing(null);
    }
  };

  const handleApprove = async (step: WorkflowStep) => {
    setActing(step.id);
    try {
      await workflowApi.approveStep(step.id);
      toast.success('Этап согласован');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при согласовании');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (step: WorkflowStep) => {
    const reason = prompt('Укажите причину отказа:');
    if (!reason) return;
    setActing(step.id);
    try {
      await workflowApi.rejectStep(step.id, reason);
      toast.success('Этап отклонён');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при отклонении');
    } finally {
      setActing(null);
    }
  };

  const stepStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'in_progress': return 'warning';
      case 'delegated': return 'info';
      default: return 'neutral';
    }
  };

  const stepStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Согласовано';
      case 'rejected': return 'Отклонено';
      case 'in_progress': return 'В работе';
      case 'pending': return 'Ожидание';
      case 'delegated': return 'Делегировано';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm text-[var(--text-secondary)]">Загрузка маршрута...</span>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm text-[var(--text-muted)]">Маршрут не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">{instance.template_name}</h3>
          <p className="text-xs text-[var(--text-muted)]">Документ: {instance.document_name || '—'}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {instance.steps.map((step, idx) => {
          const isCurrent = instance.current_step_id === step.id;
          const stepSigs = signatures[step.id] || [];
          const canAct = step.status === 'in_progress' || step.status === 'pending';

          return (
            <div
              key={step.id}
              className={`rounded-lg border p-3 transition-all ${
                isCurrent ? 'border-[var(--accent-engineering)] bg-[var(--bg-surface)]' : 'border-[var(--border-default)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-muted)]">{idx + 1}</span>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{step.step_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={stepStatusColor(step.status)} className="text-xs">
                        {stepStatusLabel(step.status)}
                      </Badge>
                      {step.approval_type === 'approve' && (
                        <span className="text-xs text-[var(--text-muted)]">Требуется подпись</span>
                      )}
                    </div>
                  </div>
                </div>

                {step.signed_by && step.signature_hash && (
                  <div className="flex items-center gap-1 text-xs text-[var(--success)]">
                    <ShieldCheck size={12} />
                    <span title={step.signature_hash}>Подписано</span>
                  </div>
                )}
              </div>

              {/* Assigned users */}
              {step.assigned_users.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {step.assigned_users.map((u) => (
                    <span
                      key={u.id}
                      className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
                    >
                      {u.full_name}
                    </span>
                  ))}
                </div>
              )}

              {/* Signatures list */}
              {stepSigs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {stepSigs.map((sig) => (
                    <div key={sig.id} className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Eye size={10} />
                      <span title={sig.signature_hash}>
                        {sig.user_name} · {new Date(sig.signed_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {isCurrent && canAct && (
                <div className="mt-3 flex items-center gap-2">
                  {step.approval_type === 'approve' ? (
                    <Button
                      variant="success"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => handleSign(step)}
                      disabled={acting === step.id}
                    >
                      {acting === step.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                      Подписать и согласовать
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => handleApprove(step)}
                      disabled={acting === step.id}
                    >
                      {acting === step.id ? <Loader2 size={12} className="animate-spin" /> : <FileCheck size={12} />}
                      Согласовать
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleReject(step)}
                    disabled={acting === step.id}
                  >
                    <X size={12} />
                    Отклонить
                  </Button>
                </div>
              )}

              {/* Connector arrow */}
              {idx < instance.steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight size={14} className="text-[var(--text-muted)] rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
