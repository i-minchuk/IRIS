// src/pages/ProjectPortfolioPage/components/ProjectForm/index.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Project, ProjectStatus, ProjectPriority } from '../../types/project';
import { PROJECT_STATUS_CONFIG } from '../../constants/projectStatuses';
import { PROJECT_PRIORITY_CONFIG } from '../../constants/projectStatuses';
import { createProject } from '@/api/projects';

interface ProjectFormProps {
  project?: Project | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    customer: project?.customer || '',
    description: project?.description || '',
    status: project?.status || 'initiation' as ProjectStatus,
    priority: project?.priority || 'medium' as ProjectPriority,
    contractSum: project?.contractSum || 0,
    spentBudget: project?.spentBudget || 0,
    plannedBudget: project?.plannedBudget || 0,
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    deadline: project?.deadline || '',
    projectManager: project?.projectManager || '',
    engineers: project?.engineers || [],
    tenderManager: project?.tenderManager || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.deadline && formData.startDate && formData.deadline <= formData.startDate) {
      setError('Дедлайн должен быть позже даты начала');
      return;
    }

    setLoading(true);
    try {
      if (!project) {
        await createProject({
          name: formData.name,
          code: formData.name.slice(0, 3).toUpperCase() + '-' + Date.now(),
          customer_name: formData.customer,
          contract_number: '',
          stage: 'draft',
          status: 'draft',
        });
      }
      onSave();
    } catch (err: any) {
      const status = err?.response?.status;
      let message = 'Не удалось сохранить проект';
      if (status === 400) message = 'Ошибка в данных';
      else if (status === 403) message = 'Доступ запрещён';
      else if (status === 404) message = 'Не найдено';
      else if (status === 422) message = 'Ошибка валидации';
      else if (status >= 500) message = 'Ошибка сервера';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto bg-[#1e293b] rounded-lg border border-[#334155] p-6">
        <h1 className="sr-only sr-only">
          {project ? 'Редактирование проекта' : 'Новый проект'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">Основная информация</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Название проекта *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Заказчик *
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#94a3b8] mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Статус *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as ProjectStatus })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                  required
                >
                  {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Приоритет *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as ProjectPriority })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                  required
                >
                  {Object.entries(PROJECT_PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">Финансы</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Сумма контракта (млн ₽)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.contractSum}
                  onChange={(e) =>
                    setFormData({ ...formData, contractSum: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Потрачено (млн ₽)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.spentBudget}
                  onChange={(e) =>
                    setFormData({ ...formData, spentBudget: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Плановый бюджет (млн ₽)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.plannedBudget}
                  onChange={(e) =>
                    setFormData({ ...formData, plannedBudget: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">Сроки</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Дата начала *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Дедлайн *
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#e2e8f0]">Команда</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Руководитель проекта *
                </label>
                <input
                  type="text"
                  value={formData.projectManager}
                  onChange={(e) =>
                    setFormData({ ...formData, projectManager: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#94a3b8] mb-1">
                  Тендерный менеджер
                </label>
                <input
                  type="text"
                  value={formData.tenderManager}
                  onChange={(e) =>
                    setFormData({ ...formData, tenderManager: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 bg-[#334155] text-[#e2e8f0] rounded-lg hover:bg-[#475569] transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : project ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
