import React, { useState, useEffect } from 'react';
import { useWorkflow } from '@/features/workflow/hooks/useWorkflow';
import { CheckCircle, XCircle, MessageSquare, Clock, FileText, Loader2 } from 'lucide-react';

export const WorkflowPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'active' | 'my_tasks'>('active');
  const {
    activeInstances,
    myTasks,
    templates,
    loading,
    fetchActive,
    fetchMyTasks,
    fetchTemplates,
    approveStep,
    rejectStep,
  } = useWorkflow();

  useEffect(() => {
    if (activeTab === 'active') fetchActive();
    if (activeTab === 'my_tasks') fetchMyTasks();
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab, fetchActive, fetchMyTasks, fetchTemplates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершён';
      case 'rejected': return 'Отклонён';
      case 'pending': return 'Ожидание';
      default: return status;
    }
  };

  return (
    <div className="h-[calc(100vh-var(--iris-header-height)-80px)] flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Маршруты согласования</h1>
      </div>

      {/* Табы */}
      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={activeTab === 'active' ? { backgroundColor: 'var(--accent-engineering)' } : { color: 'var(--text-secondary)' }}
        >
          Активные ({activeInstances.length})
        </button>
        <button
          onClick={() => setActiveTab('my_tasks')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'my_tasks'
              ? 'text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={activeTab === 'my_tasks' ? { backgroundColor: 'var(--accent-engineering)' } : { color: 'var(--text-secondary)' }}
        >
          Мои задачи ({myTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-white'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={activeTab === 'templates' ? { backgroundColor: 'var(--accent-engineering)' } : { color: 'var(--text-secondary)' }}
        >
          Шаблоны ({templates.length})
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: 'var(--bg-app)' }}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-engineering)' }} />
            <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка...</span>
          </div>
        )}

        {!loading && activeTab === 'active' && (
          <div className="space-y-3">
            {activeInstances.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Нет активных маршрутов</p>
                <p className="text-xs mt-1">Запущенные процессы согласования появятся здесь</p>
              </div>
            ) : (
              activeInstances.map((instance) => (
                <WorkflowInstanceCard
                  key={instance.id}
                  instance={instance}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'my_tasks' && (
          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Нет задач на согласование</p>
                <p className="text-xs mt-1">Задачи, требующие вашего участия, появятся здесь</p>
              </div>
            ) : (
              myTasks.map((instance) => (
                <WorkflowInstanceCard
                  key={instance.id}
                  instance={instance}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  onApprove={approveStep}
                  onReject={rejectStep}
                  showActions
                />
              ))
            )}
          </div>
        )}

        {!loading && activeTab === 'templates' && (
          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Нет шаблонов</p>
                <p className="text-xs mt-1">Шаблоны маршрутов согласования появятся здесь</p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border p-4"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{template.name}</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{template.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${template.is_default ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {template.is_default ? 'По умолчанию' : 'Кастомный'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {template.steps_schema?.length || 0} шагов
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface WorkflowInstanceCardProps {
  instance: import('@/features/workflow/api/workflowApi').WorkflowInstance;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  showActions?: boolean;
  onApprove?: (stepId: number, comment?: string) => Promise<void>;
  onReject?: (stepId: number, reason: string) => Promise<void>;
}

function WorkflowInstanceCard({ instance, getStatusColor, getStatusLabel, showActions, onApprove, onReject }: WorkflowInstanceCardProps) {
  const [comment, setComment] = useState('');
  const currentStep = instance.steps?.find((s) => s.status === 'pending' || s.status === 'in_progress');

  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {instance.document_name || `Документ #${instance.document_id}`}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(instance.status)}`}>
              {getStatusLabel(instance.status)}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Шаблон: {instance.template_name}
          </p>
          {instance.launch_comment && (
            <p className="text-xs mt-1 italic" style={{ color: 'var(--text-tertiary)' }}>
              «{instance.launch_comment}»
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <Clock className="w-3 h-3" />
          {instance.started_at ? new Date(instance.started_at).toLocaleDateString('ru-RU') : '—'}
        </div>
      </div>

      {/* Steps progress */}
      {instance.steps && instance.steps.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1">
            {instance.steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.status === 'approved'
                      ? 'bg-green-500 text-white'
                      : step.status === 'rejected'
                      ? 'bg-red-500 text-white'
                      : step.status === 'pending' || step.status === 'in_progress'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                  title={step.step_name}
                >
                  {step.status === 'approved' ? '✓' : step.status === 'rejected' ? '✕' : idx + 1}
                </div>
                {idx < instance.steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      step.status === 'approved' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {instance.steps.map((step) => (
              <span key={step.id} className="text-[10px] truncate max-w-[80px]" style={{ color: 'var(--text-tertiary)' }}>
                {step.step_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current step details */}
      {currentStep && (
        <div className="mt-3 p-2 rounded" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              Текущий шаг: {currentStep.step_name}
            </span>
            {currentStep.deadline && (
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                <Clock className="w-3 h-3" />
                {new Date(currentStep.deadline).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
          {currentStep.assigned_users && currentStep.assigned_users.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Исполнители: {currentStep.assigned_users.map((u) => u.full_name).join(', ')}
            </p>
          )}
          {currentStep.comments_count > 0 && (
            <span className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-tertiary)' }}>
              <MessageSquare className="w-3 h-3" />
              {currentStep.comments_count} комментариев
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && currentStep && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Комментарий (опционально)"
            className="w-full px-3 py-1.5 text-xs rounded border"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => onApprove?.(currentStep.id, comment || undefined)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-3 h-3" />
              Согласовать
            </button>
            <button
              onClick={() => onReject?.(currentStep.id, comment || 'Отклонено')}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-3 h-3" />
              Отклонить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
