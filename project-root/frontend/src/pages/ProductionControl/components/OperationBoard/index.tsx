import React, { useMemo } from 'react';
import { Operation, ProductionProject } from '../../types/production';
import { OPERATION_STATUS_COLORS } from '../../constants/production';

interface Props {
  operations: Operation[];
  projects: ProductionProject[];
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
        {projects.filter(p => p.stage === 'production' || p.stage === 'production_prep').map(project => {
          const ops = byProject[project.id] || [];

          return (
            <div key={project.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>({project.code})</span>
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
                        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {op.workCenterName}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {op.setupTime + op.runTime}ч | {op.responsible}
                        </div>
                        {op.status === 'overdue' && (
                          <div className="text-xs mt-1" style={{ color: 'var(--iris-accent-coral)' }}>
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
