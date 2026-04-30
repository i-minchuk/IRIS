import React, { useState, useMemo } from 'react';
import { Project, Document, TimelineNode } from './types/package';
import { mockProjects, mockRemarks } from './mocks/packageData';
import { ProjectTree } from './components/ProjectTree';
import { DocumentViewer } from './components/DocumentViewer';
import { RemarksPanel } from './components/RemarksPanel';
import { DocumentTimeline } from './components/DocumentTimeline';

export const PackagePage: React.FC = () => {
  const [projects] = useState<Project[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(mockProjects[0]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(mockProjects[0]?.documents[1] || null);
  const [remarks] = useState(mockRemarks);

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
