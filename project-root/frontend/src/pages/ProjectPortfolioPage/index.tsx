// src/pages/ProjectPortfolioPage/index.tsx
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ProjectPipeline } from './components/ProjectPipeline';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectForm } from './components/ProjectForm';
import { ProjectAnalytics } from './components/ProjectAnalytics';
import { Project, ProjectStats } from './types/project';
import { getProjects } from '@/api/projects';

type ViewMode = 'pipeline' | 'list' | 'detail' | 'form' | 'analytics';

export const ProjectPortfolioPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    completed: 0,
    totalSum: 0,
    avgProgress: 0,
    overdue: 0,
    atRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        const transformed: Project[] = data.map((p) => ({
          id: String(p.id),
          name: p.name,
          customer: p.customer_name || '—',
          description: '',
          status: (p.status === 'active' ? 'production' : p.status === 'completed' ? 'completed' : 'design') as Project['status'],
          priority: 'medium' as Project['priority'],
          contractSum: 0,
          spentBudget: 0,
          plannedBudget: 0,
          startDate: p.created_at || '',
          deadline: p.created_at || '',
          projectManager: '—',
          engineers: [],
          documents: [],
          progressPercent: 0,
          createdAt: p.created_at || '',
          updatedAt: p.created_at || '',
        }));
        setProjects(transformed);

        // Compute stats from real data
        const active = transformed.filter((p) => p.status !== 'completed').length;
        const completed = transformed.filter((p) => p.status === 'completed').length;
        setStats({
          total: transformed.length,
          active,
          completed,
          totalSum: 0,
          avgProgress: transformed.length > 0
            ? Math.round(transformed.reduce((sum, p) => sum + p.progressPercent, 0) / transformed.length)
            : 0,
          overdue: 0,
          atRisk: 0,
        });
      } catch (err) {
        setError('Не удалось загрузить проекты');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#0f172a] text-[#e2e8f0] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="animate-spin" size={20} />
          <span>Загрузка проектов...</span>
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
