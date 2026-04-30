// src/pages/PortfolioPage/index.tsx
import React, { useState } from 'react';
import { ProjectTree } from './components/ProjectTree';
import { DocumentViewer } from './components/DocumentViewer';
import { RemarksPanel } from './components/RemarksPanel';
// import { StatusBadge } from './components/StatusBadge'; // TODO: добавить в UI
// import { FileUploader } from './components/FileUploader'; // TODO: добавить в UI
// import { ExcelImporter } from './components/ExcelImporter'; // TODO: добавить в UI
import { Project, Document } from './types/portfolio';
import { mockProjects } from './mocks/data';
// import { mockRemarks } from './mocks/data'; // TODO: использовать для замечаний

export const PortfolioPage: React.FC = () => {
  const [projects] = useState<Project[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  // const [showUploader, setShowUploader] = useState(false); // TODO: добавить UI

  // const handleFileUpload = (files: File[]) => {
  //   console.log('Uploaded files:', files);
  //   // TODO: Реализовать загрузку файлов
  //   // setShowUploader(false);
  // };

  // const handleImport = (data: any[]) => {
  //   console.log('Imported data:', data);
  //   // TODO: Реализовать импорт из Excel
  // };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedDocument(null);
  };

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
