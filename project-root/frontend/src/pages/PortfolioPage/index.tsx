// src/pages/PortfolioPage/index.tsx
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ProjectTree } from './components/ProjectTree';
import { DocumentViewer } from './components/DocumentViewer';
import { RemarksPanel } from './components/RemarksPanel';
import { Project, Document } from './types/portfolio';
import { getProjects } from '@/api/projects';

export const PortfolioPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        // Transform API projects to PortfolioPage Project format
        const transformed: Project[] = data.map((p) => ({
          id: String(p.id),
          name: p.name,
          status: p.status === 'completed' ? 'completed' : p.status === 'on_hold' ? 'on_hold' : 'active',
          documents: [], // Documents loaded separately or on demand
        }));
        setProjects(transformed);
        if (transformed.length > 0 && !selectedProject) {
          setSelectedProject(transformed[0]);
        }
      } catch (err) {
        setError('Не удалось загрузить проекты');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0f172a] text-[#e2e8f0] items-center justify-center">
        <div className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="animate-spin" size={20} />
          <span>Загрузка проектов...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[#0f172a] text-[#e2e8f0] items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#4F7A4C] rounded-lg text-sm text-white hover:bg-[#3d6b41]"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#e2e8f0]">
      {/* Левая колонка - 25% */}
      <div className="w-1/4 border-r border-[#334155] overflow-hidden">
        <ProjectTree
          projects={projects}
          selectedProject={selectedProject}
          selectedDocument={selectedDocument}
          onSelectProject={handleSelectProject}
          onSelectDocument={setSelectedDocument}
        />
      </div>

      {/* Центральная колонка - 50% */}
      <div className="w-1/2 border-r border-[#334155] overflow-hidden">
        <DocumentViewer
          document={selectedDocument}
          project={selectedProject}
        />
      </div>

      {/* Правая колонка - 25% */}
      <div className="w-1/4 overflow-hidden">
        <RemarksPanel document={selectedDocument} />
      </div>
    </div>
  );
};
