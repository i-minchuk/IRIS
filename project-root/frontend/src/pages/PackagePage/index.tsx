import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Project, Document, TimelineNode } from './types/package';
import { ProjectTree } from './components/ProjectTree';
import { DocumentViewer } from './components/DocumentViewer';
import { RemarksPanel } from './components/RemarksPanel';
import { DocumentTimeline } from './components/DocumentTimeline';
import { getProjects } from '@/api/projects';

export const PackagePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [remarks, setRemarks] = useState<import('./types/package').Remark[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        const transformed: Project[] = data.map((p) => ({
          id: String(p.id),
          name: p.name,
          code: p.code,
          customer: p.customer_name || '—',
          documents: [],
        }));
        setProjects(transformed);
        if (transformed.length > 0) {
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

  // Load remarks when document changes
  useEffect(() => {
    if (!selectedDocument) {
      setRemarks([]);
      return;
    }
    // In real implementation, fetch remarks from API
    // For now, empty state since no document-specific remarks API exists yet
    setRemarks([]);
  }, [selectedDocument]);

  // Формируем timeline для выбранного проекта
  const timeline = useMemo<TimelineNode[]>(() => {
    if (!selectedProject) return [];
    return selectedProject.documents.map(doc => ({
      documentId: doc.id,
      documentName: doc.name,
      status: doc.status,
      responsible: doc.responsible,
      deadline: doc.deadline,
      completedAt: doc.completedAt,
      dependsOn: doc.dependsOn,
      isBlocking: selectedProject.documents.some(d => d.dependsOn?.includes(doc.id) && d.status !== 'approved'),
      isBlocked: doc.dependsOn?.some(depId => {
        const dep = selectedProject.documents.find(d => d.id === depId);
        return dep && dep.status !== 'approved';
      }) || false,
    }));
  }, [selectedProject]);

  if (loading) {
    return (
      <div className="h-screen bg-[#0f172a] text-[#e2e8f0] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="animate-spin" size={20} />
          <span>Загрузка пакета документации...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#0f172a] text-[#e2e8f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#3b82f6] rounded-lg text-sm text-white hover:bg-[#2563eb]"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0f172a] text-[#e2e8f0] flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e293b] border-b border-[#334155]">
        <h1 className="text-lg font-bold">📦 ПАКЕТ ДОКУМЕНТАЦИИ</h1>
        <span className="text-xs text-[#94a3b8]">Все проекты в работе</span>
      </div>

      {/* Основная зона */}
      <div className="flex-1 flex overflow-hidden">
        {/* Левая колонка — Проекты */}
        <div className="w-[20%] border-r border-[#334155] overflow-y-auto">
          <ProjectTree
            projects={projects}
            selectedProject={selectedProject}
            selectedDocument={selectedDocument}
            onSelectProject={setSelectedProject}
            onSelectDocument={setSelectedDocument}
          />
        </div>

        {/* Центр — Просмотрщик */}
        <div className="w-[55%] border-r border-[#334155] flex flex-col">
          <DocumentViewer
            document={selectedDocument}
            project={selectedProject}
          />
        </div>

        {/* Правая колонка — Замечания */}
        <div className="w-[25%] overflow-y-auto">
          <RemarksPanel
            document={selectedDocument}
            remarks={remarks.filter(r => r.documentId === selectedDocument?.id)}
          />
        </div>
      </div>

      {/* Нижняя панель — График динамики */}
      <div className="h-[180px] bg-[#1e293b] border-t border-[#334155]">
        <DocumentTimeline timeline={timeline} />
      </div>
    </div>
  );
};
