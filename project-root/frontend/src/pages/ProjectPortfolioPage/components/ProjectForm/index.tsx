// src/pages/ProjectPortfolioPage/components/ProjectForm/index.tsx
import React, { useState } from 'react';
import { Project, ProjectStatus, ProjectPriority } from '../../types/project';
import { PROJECT_STATUS_CONFIG } from '../../constants/projectStatuses';
import { PROJECT_PRIORITY_CONFIG } from '../../constants/projectStatuses';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Отправка данных на бэкенд
    console.log('Form data:', formData);
    onSave();
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto bg-[#1e293b] rounded-lg border border-[#334155] p-6">
        <h1 className="text-2xl font-bold text-[#e2e8f0] mb-6">
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-[#334155] text-[#e2e8f0] rounded-lg hover:bg-[#475569] transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors"
            >
              {project ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
