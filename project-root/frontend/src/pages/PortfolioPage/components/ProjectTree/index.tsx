// src/pages/PortfolioPage/components/ProjectTree/index.tsx
import React from 'react';
import { Project, Document } from '../../types/portfolio';
import { StatusBadge } from '../StatusBadge';

interface ProjectTreeProps {
  projects: Project[];
  selectedProject: Project | null;
  selectedDocument: Document | null;
  onSelectProject: (project: Project) => void;
  onSelectDocument: (document: Document) => void;
}

export const ProjectTree: React.FC<ProjectTreeProps> = ({
  projects,
  selectedProject,
  selectedDocument,
  onSelectProject,
  onSelectDocument,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      <div className="px-4 py-3 border-b border-[#334155]">
        <h2 className="text-lg font-semibold text-[#e2e8f0]">Проекты</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {projects.map((project) => (
          <div key={project.id} className="border-b border-[#334155]">
            <button
              onClick={() => onSelectProject(project)}
              className={`w-full px-4 py-3 text-left hover:bg-[#1e293b] transition-colors ${
                selectedProject?.id === project.id ? 'bg-[#1e293b]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#e2e8f0] truncate">
                  {project.name}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    project.status === 'active'
                      ? 'bg-green-500'
                      : project.status === 'completed'
                      ? 'bg-blue-500'
                      : 'bg-yellow-500'
                  }`}
                />
              </div>
            </button>
            
            {selectedProject?.id === project.id && (
              <div className="bg-[#1e293b]">
                {project.documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className={`w-full px-4 py-2 text-left hover:bg-[#334155] transition-colors border-l-2 ${
                      selectedDocument?.id === doc.id
                        ? 'bg-[#334155] border-[#4F7A4C]'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#cbd5e1] truncate">
                        {doc.name}
                      </span>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
