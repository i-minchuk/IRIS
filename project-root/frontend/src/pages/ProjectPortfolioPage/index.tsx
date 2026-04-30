// src/pages/ProjectPortfolioPage/index.tsx
import React, { useState } from 'react';
import { ProjectPipeline } from './components/ProjectPipeline';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectForm } from './components/ProjectForm';
import { ProjectAnalytics } from './components/ProjectAnalytics';
import { Project, ProjectStats } from './types/project';
import { mockProjects, mockStats } from './mocks/projectData';

type ViewMode = 'pipeline' | 'list' | 'detail' | 'form' | 'analytics';

export const ProjectPortfolioPage: React.FC = () => {
  const [projects] = useState<Project[]>(mockProjects);
  const [stats] = useState<ProjectStats>(mockStats);
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="h-screen bg-[#0f172a] text-[#e2e8f0]">
      {/* Шапка */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b] border-b border-[#334155]">
        <div>
          <h1 className="text-xl font-bold text-[#e2e8f0]">📁 ПОРТФЕЛЬ ПРОЕКТОВ</h1>
          <p className="text-sm text-[#94a3b8]">Управление проектной деятельностью</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              viewMode === 'analytics'
                ? 'bg-[#8b5cf6] text-white'
                : 'bg-[#334155] text-[#e2e8f0] hover:bg-[#475569]'
            }`}
          >
            📊 Аналитика
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              viewMode === 'pipeline'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#334155] text-[#e2e8f0] hover:bg-[#475569]'
            }`}
          >
            🎯 Pipeline
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              viewMode === 'list'
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#334155] text-[#e2e8f0] hover:bg-[#475569]'
            }`}
          >
            📋 Список
          </button>
          <button
            onClick={() => {
              setSelectedProject(null);
              setViewMode('form');
            }}
            className="px-4 py-2 bg-[#22c55e] rounded-lg text-sm font-bold text-white hover:bg-[#16a34a]"
          >
            + Новый проект
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="h-[calc(100vh-80px)] overflow-hidden">
        {viewMode === 'pipeline' && (
          <ProjectPipeline
            projects={projects}
            onSelect={(p) => {
              setSelectedProject(p);
              setViewMode('detail');
            }}
          />
        )}
        {viewMode === 'list' && (
          <ProjectList
            projects={projects}
            onSelect={(p) => {
              setSelectedProject(p);
              setViewMode('detail');
            }}
          />
        )}
        {viewMode === 'detail' && selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onBack={() => setViewMode('pipeline')}
          />
        )}
        {viewMode === 'form' && (
          <ProjectForm
            project={selectedProject}
            onSave={() => setViewMode('pipeline')}
            onCancel={() => setViewMode('pipeline')}
          />
        )}
        {viewMode === 'analytics' && (
          <ProjectAnalytics stats={stats} projects={projects} />
        )}
      </div>
    </div>
  );
};
