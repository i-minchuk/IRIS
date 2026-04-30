import React, { useMemo } from 'react';
import { ProjectDocument, ProductionProject } from '../../types/production';

interface Props {
  documents: ProjectDocument[];
  projects: ProductionProject[];
}

export const DocumentTracker: React.FC<Props> = ({ documents, projects }) => {
  const byProject = useMemo(() => {
    const grouped: Record<string, ProjectDocument[]> = {};
    documents.forEach(d => {
      if (!grouped[d.projectId]) grouped[d.projectId] = [];
      grouped[d.projectId].push(d);
    });
    return grouped;
  }, [documents]);

  const overdueDocs = documents.filter(d => d.status === 'overdue');

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>📄 ДОКУМЕНТЫ ПО ПРОЕКТАМ</h2>

      {/* Алерты */}
      {overdueDocs.length > 0 && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--iris-accent-coral) 12%, var(--iris-bg-surface))', border: '1px solid var(--iris-accent-coral)' }}>
          <div className="text-sm font-bold mb-2" style={{ color: 'var(--iris-accent-coral)' }}>
            ⚠️ ПРОСРОЧЕННЫЕ ДОКУМЕНТЫ ({overdueDocs.length})
          </div>
          <div className="space-y-1">
            {overdueDocs.map(d => {
              const p = projects.find(pr => pr.id === d.projectId);
              return (
                <div key={d.id} className="flex items-center gap-3 text-xs">
                  <span className="font-bold" style={{ color: 'var(--iris-accent-coral)' }}>{d.number}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{p?.name}</span>
                  <span className="ml-auto" style={{ color: 'var(--iris-accent-coral)' }}>Просрочено!</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* По проектам */}
      <div className="space-y-3">
        {projects.map(project => {
          const docs = byProject[project.id] || [];
          const approved = docs.filter(d => d.status === 'approved').length;
          const total = docs.length;

          return (
            <div key={project.id} className="rounded-lg p-4" style={{ backgroundColor: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Готово: {approved}/{total}
                </span>
              </div>

              <div className="space-y-1">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 text-xs p-2 rounded" style={{ backgroundColor: 'var(--iris-bg-app)' }}>
                    <div className="w-2 h-2 rounded-full" style={{
                      backgroundColor:
                        doc.status === 'approved' ? 'var(--iris-accent-green)' :
                        doc.status === 'in_review' ? 'var(--iris-accent-amber)' :
                        doc.status === 'overdue' ? 'var(--iris-accent-coral)' :
                        'var(--text-muted)'
                    }} />
                    <span style={{ color: 'var(--text-primary)' }}>{doc.number}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{doc.name}</span>
                    <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>{doc.responsible}</span>
                    <span style={{ color: doc.status === 'overdue' ? 'var(--iris-accent-coral)' : 'var(--text-secondary)' }}>
                      {doc.plannedReady}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
