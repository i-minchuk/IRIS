// src/pages/ProjectPortfolioPage/components/ProjectDetail/index.tsx
import React from 'react';
import { Project } from '../../types/project';
import { PROJECT_STATUS_CONFIG, PROJECT_PRIORITY_CONFIG } from '../../constants/projectStatuses';

interface Props {
  project: Project;
  onBack: () => void;
}

export const ProjectDetail: React.FC<Props> = ({ project, onBack }) => {
  const status = PROJECT_STATUS_CONFIG[project.status];
  const priority = PROJECT_PRIORITY_CONFIG[project.priority];
  const budgetUsed = (project.spentBudget / project.plannedBudget * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full">
      {/* Шапка */}
      <div className="flex items-start gap-4 px-6 py-4 bg-[#1e293b] border-b border-[#334155]">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#334155] rounded-lg text-sm font-bold text-[#e2e8f0] hover:bg-[#475569]"
        >
          ← Назад
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-[#e2e8f0]">{project.name}</h2>
            <span
              className="px-3 py-1 rounded-md text-sm font-bold"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.icon} {status.label}
            </span>
            <span
              className="px-3 py-1 rounded-md text-sm font-bold"
              style={{ backgroundColor: priority.bg, color: priority.color }}
            >
              {priority.label}
            </span>
          </div>
          <div className="text-sm text-[#94a3b8]">{project.description}</div>
        </div>
        <div className="flex gap-2">
          {project.tenderId && (
            <button className="px-4 py-2 bg-[#3b82f6] rounded-lg text-sm font-bold text-white">
              → К тендеру
            </button>
          )}
          <button className="px-4 py-2 bg-[#f59e0b] rounded-lg text-sm font-bold text-white">
            ✎ Редактировать
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="grid grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <InfoBlock title="👤 ЗАКАЗЧИК" items={[
              { label: 'Организация', value: project.customer },
              { label: 'Руководитель проекта', value: project.projectManager },
              { label: 'Тендерный менеджер', value: project.tenderManager || '—' },
            ]} />

            <InfoBlock title="💰 БЮДЖЕТ" items={[
              { label: 'Контракт', value: `${project.contractSum} млн ₽` },
              { label: 'Потрачено', value: `${project.spentBudget} млн ₽ (${budgetUsed}%)` },
              { label: 'Остаток', value: `${project.plannedBudget - project.spentBudget} млн ₽` },
            ]} />

            {/* Прогресс */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
              <h3 className="text-sm font-bold text-[#94a3b8] mb-3">📊 ПРОГРЕСС</h3>
              <div className="text-3xl font-bold text-[#e2e8f0] mb-2">{project.progressPercent}%</div>
              <div className="w-full h-3 bg-[#334155] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project.progressPercent}%`,
                    backgroundColor: project.progressPercent > 80
                      ? '#22c55e'
                      : project.progressPercent > 50
                      ? '#f59e0b'
                      : '#ef4444'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Сроки и документы */}
          <div className="space-y-4">
            <InfoBlock title="📅 СРОКИ" items={[
              { label: 'Начало', value: new Date(project.startDate).toLocaleDateString('ru-RU') },
              { label: 'Дедлайн', value: new Date(project.deadline).toLocaleDateString('ru-RU') },
              { label: 'Завершение', value: project.completionDate
                ? new Date(project.completionDate).toLocaleDateString('ru-RU')
                : '—' },
            ]} />

            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
              <h3 className="text-sm font-bold text-[#94a3b8] mb-3">📄 ДОКУМЕНТЫ ({project.documents.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {project.documents.length > 0 ? (
                  project.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2 bg-[#0f172a] rounded">
                      <div className={`w-2 h-2 rounded-full ${
                        doc.status === 'approved' ? 'bg-[#22c55e]' :
                        doc.status === 'sent' ? 'bg-[#3b82f6]' :
                        doc.status === 'in_review' ? 'bg-[#f59e0b]' :
                        'bg-[#64748b]'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm text-[#e2e8f0]">{doc.name}</div>
                        <div className="text-xs text-[#94a3b8]">
                          {doc.responsible} | до {new Date(doc.deadline).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <span className="text-xs text-[#94a3b8]">{doc.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#64748b] text-center py-4">
                    Нет документов
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Команда и активность */}
          <div className="space-y-4">
            <InfoBlock title="👥 КОМАНДА" items={[
              { label: 'Инженеры', value: project.engineers.join(', ') || '—' },
            ]} />

            {/* История */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
              <h3 className="text-sm font-bold text-[#94a3b8] mb-3">📋 ИСТОРИЯ</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#334155]" />
                  <span className="text-xs text-[#94a3b8]">Создан</span>
                  <span className="text-xs text-[#e2e8f0] ml-auto">
                    {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-xs text-[#94a3b8]">Обновлен</span>
                  <span className="text-xs text-[#e2e8f0] ml-auto">
                    {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
              <h3 className="text-sm font-bold text-[#94a3b8] mb-3">⚡ БЫСТРЫЕ ДЕЙСТВИЯ</h3>
              <div className="space-y-2">
                <button className="w-full py-2 bg-[#3b82f6] rounded-lg text-sm font-bold text-white hover:bg-[#2563eb]">
                  📦 Сформировать пакет документов
                </button>
                <button className="w-full py-2 bg-[#22c55e] rounded-lg text-sm font-bold text-white hover:bg-[#16a34a]">
                  📤 Отправить заказчику
                </button>
                <button className="w-full py-2 bg-[#f59e0b] rounded-lg text-sm font-bold text-white hover:bg-[#d97706]">
                  📊 Отчет о прогрессе
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoBlock: React.FC<{ title: string; items: { label: string; value: string }[] }> = ({ title, items }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
    <h3 className="text-sm font-bold text-[#94a3b8] mb-3">{title}</h3>
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label}>
          <span className="text-xs text-[#94a3b8]">{item.label}:</span>
          <div className="text-sm text-[#e2e8f0]">{item.value}</div>
        </div>
      ))}
    </div>
  </div>
);
