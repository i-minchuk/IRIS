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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Зависимости и Гантт</h2>
          <div className="flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setView('gantt')}
              className={`px-3 py-1 text-xs font-medium ${view === 'gantt' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              📊 Гантт
            </button>
            <button
              onClick={() => setView('graph')}
              className={`px-3 py-1 text-xs font-medium border-l border-gray-300 dark:border-gray-600 ${view === 'graph' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              🕸️ Граф
            </button>
          </div>
        </div>
        <select
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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

      {loading && <div className="text-sm text-gray-500 dark:text-gray-400 shrink-0">Загрузка…</div>}

      {!loading && projectId && (
        <div className="flex-1 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-0">
          {nodes.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Выберите проект для просмотра
        </div>
      )}
    </div>
  );
};
