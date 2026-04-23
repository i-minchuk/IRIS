import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DependencyGraph } from '../components/DependencyGraph';
import { GanttChart } from '../components/GanttChart';
import { dependenciesApi, type DocumentNode, type DependencyEdge } from '../api/dependencies';
import { projectsApi, type Project } from '@/features/projects/api/projects';

export const DependencyGraphPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = Number(searchParams.get('project_id')) || undefined;
  const [projects, setProjects] = useState<Project[]>([]);
  const [nodes, setNodes] = useState<DocumentNode[]>([]);
  const [edges, setEdges] = useState<DependencyEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'graph' | 'gantt'>('gantt');

  useEffect(() => {
    projectsApi.list().then((res: { data: Project[] }) => setProjects(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    dependenciesApi
      .getGraph(projectId)
      .then((res: { data: { nodes: DocumentNode[]; edges: DependencyEdge[] } }) => {
        setNodes(res.data.nodes);
        setEdges(res.data.edges);
      })
      .catch((err: { response?: { data?: { detail?: string } } }) => setError(err.response?.data?.detail || 'Ошибка загрузки графа'))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Зависимости и Гантт</h2>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('gantt')}
              className={`px-3 py-1 text-xs font-medium ${view === 'gantt' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              📊 Гантт
            </button>
            <button
              onClick={() => setView('graph')}
              className={`px-3 py-1 text-xs font-medium border-l border-gray-300 ${view === 'graph' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              🕸️ Граф
            </button>
          </div>
        </div>
        <select
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          value={projectId || ''}
          onChange={(e) => {
            const id = e.target.value;
            window.history.replaceState(null, '', id ? `?project_id=${id}` : '?');
            window.location.reload();
          }}
        >
          <option value="">Выберите проект</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 shrink-0">{error}</div>}

      {loading && <div className="text-sm text-gray-500 shrink-0">Загрузка…</div>}

      {!loading && projectId && (
        <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white min-h-0">
          {nodes.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Нет документов для отображения
            </div>
          ) : view === 'graph' ? (
            <DependencyGraph nodes={nodes} edges={edges} />
          ) : (
            <GanttChart nodes={nodes} edges={edges} />
          )}
        </div>
      )}

      {!projectId && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Выберите проект для просмотра
        </div>
      )}
    </div>
  );
};
