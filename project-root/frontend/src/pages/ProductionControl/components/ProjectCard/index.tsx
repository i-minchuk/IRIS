import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { ProductionProject, Operation, ProjectDocument, MTOItem } from '../../types/production';
import { STAGE_CONFIG } from '../../constants/production';

interface Props {
  project: ProductionProject | null;
  operations: Operation[];
  documents: ProjectDocument[];
  mtoItems: MTOItem[];
}

export const ProjectCard: React.FC<Props> = ({ project, operations, documents, mtoItems }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6" style={{ color: 'var(--text-muted)' }}>
        <div className="text-4xl mb-4">📋</div>
        <div className="text-sm font-bold">ВЫБЕРИТЕ ПРОЕКТ</div>
        <div className="text-xs mt-2">Или найдите по номеру/заказчику</div>
      </div>
    );
  }

  const stage = STAGE_CONFIG[project.stage];
  const projectOps = operations.filter(o => o.projectId === project.id);
  const projectDocs = documents.filter(d => d.projectId === project.id);
  const projectMTO = mtoItems.filter(m => m.projectId === project.id);

  const completedOps = projectOps.filter(o => o.status === 'completed').length;
  const overdueDocs = projectDocs.filter(d => d.status === 'overdue');
  const readyMTO = projectMTO.filter(m => m.status === 'in_stock').length;

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="pb-3" style={{ borderBottom: '1px solid var(--iris-border-subtle)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{stage.icon}</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{project.code} | 👤 {project.customer}</div>
        <div
          className="mt-2 px-3 py-1 rounded text-xs font-bold inline-block"
          style={{ backgroundColor: isDark ? stage.bg : stage.bgLight, color: stage.color }}
        >
          {stage.label}
        </div>
      </div>

      {/* Быстрый статус для телефона */}
      <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)' }}>
        <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>📞 ДЛЯ ОТВЕТА ЗАКАЗЧИКУ</h3>
        <div className="space-y-2 text-sm">
          <div style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Стадия:</span> {stage.label}
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Готовность:</span> {project.progressPercent}%
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Сейчас:</span> {project.currentOperation || '—'}
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Участок:</span> {project.currentWorkCenter || '—'}
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Следующий этап:</span> {project.nextMilestone || '—'}
          </div>
          <div style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Дата:</span> {project.nextMilestoneDate ? new Date(project.nextMilestoneDate).toLocaleDateString('ru-RU') : '—'}
          </div>
        </div>
      </div>

      {/* Прогресс */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span>Прогресс проекта</span>
          <span>{project.progressPercent}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--iris-border-subtle)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${project.progressPercent}%`,
              backgroundColor: project.progressPercent > 80 ? 'var(--iris-accent-green)' :
                              project.progressPercent > 50 ? 'var(--iris-accent-amber)' : 'var(--iris-accent-coral)'
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>Крит. путь: {project.criticalPathDays} дн.</span>
          <span>Дедлайн: {new Date(project.plannedFinish).toLocaleDateString('ru-RU')}</span>
        </div>
      </div>

      {/* Операции */}
      <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)' }}>
        <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
          🔧 ОПЕРАЦИИ ({completedOps}/{projectOps.length})
        </h3>
        <div className="space-y-1">
          {projectOps.slice(0, 5).map(op => (
            <div key={op.id} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor:
                  op.status === 'completed' ? 'var(--iris-accent-green)' :
                  op.status === 'in_progress' ? 'var(--iris-accent-cyan)' :
                  op.status === 'overdue' ? 'var(--iris-accent-coral)' :
                  'var(--text-muted)'
              }} />
              <span style={{ color: 'var(--text-primary)' }}>{op.code}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{op.name}</span>
              <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>{op.workCenterName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Документы */}
      <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)' }}>
        <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
          📄 ДОКУМЕНТЫ {overdueDocs.length > 0 && <span style={{ color: 'var(--iris-accent-coral)' }}>({overdueDocs.length} просрочено)</span>}
        </h3>
        <div className="space-y-1">
          {projectDocs.map(doc => (
            <div key={doc.id} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor:
                  doc.status === 'approved' ? 'var(--iris-accent-green)' :
                  doc.status === 'overdue' ? 'var(--iris-accent-coral)' :
                  'var(--iris-accent-amber)'
              }} />
              <span style={{ color: doc.status === 'overdue' ? 'var(--iris-accent-coral)' : 'var(--text-primary)' }}>
                {doc.number}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* МТО */}
      {projectMTO.length > 0 && (
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)' }}>
          <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
            🛒 МТО ({readyMTO}/{projectMTO.length} на складе)
          </h3>
          <div className="space-y-1">
            {projectMTO.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor:
                    m.status === 'in_stock' ? 'var(--iris-accent-green)' :
                    m.status === 'delivered' ? 'var(--iris-accent-cyan)' :
                    'var(--iris-accent-amber)'
                }} />
                <span style={{ color: 'var(--text-primary)' }}>{m.itemName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Быстрые действия */}
      <div className="space-y-2">
        <button className="w-full py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: 'var(--iris-accent-cyan)', color: '#ffffff' }}>
          📞 Сформировать ответ заказчику
        </button>
        <button className="w-full py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: 'var(--iris-bg-subtle)', color: 'var(--text-primary)' }}>
          📊 Отчёт о прогрессе
        </button>
      </div>
    </div>
  );
};
