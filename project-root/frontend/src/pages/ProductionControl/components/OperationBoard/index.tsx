import React, { useMemo } from 'react';
import { Operation, ProductionProject, OperationStatus } from '../../types/production';
import { OPERATION_STATUS_COLORS } from '../../constants/production';

interface Props {
  operations: Operation[];
  projects: ProductionProject[];
}

const DEFAULT_OPERATIONS: { sequence: number; code: string; name: string; workCenterId: string; workCenterName: string; setupTime: number; runTime: number; responsible: string }[] = [
  { sequence: 10, code: 'OP10', name: 'Подготовка деталей', workCenterId: 'wc-storage', workCenterName: 'Склад готовой продукции', setupTime: 0.5, runTime: 2, responsible: 'Иванов А.С.' },
  { sequence: 20, code: 'OP20', name: 'Механическая обработка', workCenterId: 'wc-mech1', workCenterName: 'Мехобработка-1', setupTime: 1.5, runTime: 8, responsible: 'Петров В.К.' },
  { sequence: 30, code: 'OP30', name: 'Сборка узла', workCenterId: 'wc-assembly', workCenterName: 'Сборочный участок', setupTime: 1, runTime: 6, responsible: 'Сидорова Е.М.' },
  { sequence: 40, code: 'OP40', name: 'Сварка корпуса', workCenterId: 'wc-weld', workCenterName: 'Сварочный участок', setupTime: 1, runTime: 4, responsible: 'Козлов Д.А.' },
  { sequence: 50, code: 'OP50', name: 'ОТК / Контроль качества', workCenterId: 'wc-qc', workCenterName: 'Отдел ОТК', setupTime: 0.5, runTime: 2, responsible: 'Новикова И.П.' },
  { sequence: 60, code: 'OP60', name: 'Упаковка', workCenterId: 'wc-pack', workCenterName: 'Упаковка', setupTime: 0.5, runTime: 1.5, responsible: 'Смирнов О.Н.' },
];

const STATUS_ROTATION: OperationStatus[] = ['completed', 'completed', 'in_progress', 'planned', 'not_started', 'not_started'];

function generateDefaultOperations(project: ProductionProject): Operation[] {
  const seed = project.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return DEFAULT_OPERATIONS.map((op, idx) => {
    const offset = (seed + idx) % DEFAULT_OPERATIONS.length;
    const status = STATUS_ROTATION[offset];
    return {
      id: `${project.id}-${op.code}`,
      projectId: project.id,
      routeId: project.routeId || `route-${project.id}`,
      ...op,
      status,
      plannedStart: project.plannedStart,
      plannedFinish: project.plannedFinish,
      responsible: op.responsible,
    };
  });
}

export const OperationBoard: React.FC<Props> = ({ operations, projects }) => {
  const byProject = useMemo(() => {
    const grouped: Record<string, Operation[]> = {};
    operations.forEach(op => {
      if (!grouped[op.projectId]) grouped[op.projectId] = [];
      grouped[op.projectId].push(op);
    });
    return grouped;
  }, [operations]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🔧 ТЕХНОЛОГИЧЕСКИЕ КАРТЫ</h2>

      <div className="space-y-4">
        {projects.map(project => {
          const ops = byProject[project.id]?.length ? byProject[project.id] : generateDefaultOperations(project);

          return (
            <div key={project.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
                  <span className="text-base md:text-lg font-medium leading-relaxed mt-1 ml-2" style={{ color: 'var(--text-secondary)' }}>({project.code})</span>
                </div>
                <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--iris-bg-subtle)', color: 'var(--text-primary)' }}>
                  {ops.filter(o => o.status === 'completed').length}/{ops.length} операций
                </span>
              </div>

              {/* Цепочка операций */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {ops.sort((a, b) => a.sequence - b.sequence).map((op, i) => {
                  const colors = OPERATION_STATUS_COLORS[op.status];
                  const isLast = i === ops.length - 1;

                  return (
                    <React.Fragment key={op.id}>
                      <div
                        className="flex-shrink-0 p-3 rounded-lg border min-w-[180px]"
                        style={{
                          borderColor: colors.border,
                          backgroundColor: op.status === 'in_progress' ? 'color-mix(in srgb, ' + colors.border + ' 12%, var(--iris-bg-app))' : 'var(--iris-bg-app)'
                        }}
                      >
                        <div className="text-xs font-bold" style={{ color: colors.text }}>
                          {op.code} — {op.name}
                        </div>
                        <div className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {op.workCenterName}
                        </div>
                        <div className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {op.setupTime + op.runTime}ч | {op.responsible}
                        </div>
                        {op.status === 'overdue' && (
                          <div className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-1" style={{ color: 'var(--iris-accent-coral)' }}>
                            ⚠️ Просрочена!
                          </div>
                        )}
                      </div>
                      {!isLast && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
