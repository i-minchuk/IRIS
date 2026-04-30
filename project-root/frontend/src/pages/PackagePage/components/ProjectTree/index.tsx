import React, { useState, useMemo } from 'react';
import { Project, Document } from '../../types/package';
import { DOC_STATUS_COLORS } from '../../constants/docStatusColors';

interface Props {
  projects: Project[];
  selectedProject: Project | null;
  selectedDocument: Document | null;
  onSelectProject: (p: Project) => void;
  onSelectDocument: (d: Document) => void;
}

export const ProjectTree: React.FC<Props> = ({
  projects,
  selectedProject,
  selectedDocument,
  onSelectProject,
  onSelectDocument,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['proj-001']));
  const [search, setSearch] = useState('');

  const toggle = (id: string) => {
    setExpanded((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const lowerSearch = search.toLowerCase();
    return projects
      .map((project) => ({
        ...project,
        documents: project.documents.filter(
          (doc) =>
            doc.name.toLowerCase().includes(lowerSearch) ||
            doc.responsible.toLowerCase().includes(lowerSearch)
        ),
      }))
      .filter((project) => {
        const matchesProject =
          project.name.toLowerCase().includes(lowerSearch) ||
          project.code.toLowerCase().includes(lowerSearch) ||
          project.customer.toLowerCase().includes(lowerSearch);
        return matchesProject || project.documents.length > 0;
      });
  }, [projects, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Поиск */}
      <div className="p-2">
        <input
          type="text"
          placeholder="🔍 Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 bg-[#0f172a] border border-[#475569] rounded text-xs text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6]"
        />
      </div>

      {/* Проекты */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filteredProjects.length === 0 ? (
          <div className="text-center text-[#64748b] text-xs py-8">
            Ничего не найдено
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = expanded.has(project.id);
            const isSelected = selectedProject?.id === project.id;

            return (
              <div key={project.id} className="mb-2">
                {/* Заголовок проекта */}
                <button
                  onClick={() => {
                    toggle(project.id);
                    onSelectProject(project);
                  }}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors ${
                    isSelected
                      ? 'bg-[#1e3a5f] border border-[#3b82f6]'
                      : 'bg-[#1e293b] border border-[#475569]'
                  }`}
                >
                  <span className="text-[#3b82f6] text-xs">{isExpanded ? '▼' : '▶'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#93c5fd] truncate">{project.name}</div>
                    <div className="text-[10px] text-[#64748b]">
                      {project.code} | {project.customer}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748b]">{project.documents.length}</span>
                </button>

                {/* Документы проекта */}
                {isExpanded && (
                  <div className="ml-3 mt-1 space-y-1">
                    {project.documents.map((doc) => {
                      const sc = DOC_STATUS_COLORS[doc.status];
                      const isDocSelected = selectedDocument?.id === doc.id;

                      return (
                        <button
                          key={doc.id}
                          onClick={() => onSelectDocument(doc)}
                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-all ${
                            isDocSelected
                              ? 'ring-1 ring-[#3b82f6] bg-[#0f172a]'
                              : 'bg-[#0f172a]'
                          }`}
                          style={{ borderLeft: `3px solid ${sc.bg}` }}
                        >
                          {/* Индикатор статуса */}
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sc.bg }}
                          />

                          <div className="flex-1 min-w-0">
                            <div
                              className="text-[11px] font-bold truncate"
                              style={{
                                color: doc.status === 'deleted' ? '#FFFFFF' : sc.text,
                              }}
                            >
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-[#64748b]">
                              Рев.{doc.revision} | {doc.responsible}
                            </div>
                          </div>

                          {doc.hasRemarks && <span className="text-[10px]">⚠️</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
