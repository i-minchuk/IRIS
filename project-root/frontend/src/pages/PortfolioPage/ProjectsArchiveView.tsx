import { useCallback, useEffect, useState } from 'react';
import { Archive, FolderKanban, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  getProjects,
  unarchiveProject,
  type Project,
} from '@/features/projects/api/projects';

/**
 * Вкладка «Архив» портфеля: архивные проекты (не доведены до конца,
 * исключены из работы) с возможностью вернуть их в работу.
 */
export default function ProjectsArchiveView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getProjects();
      setProjects(list.filter(p => p.status === 'archived'));
    } catch {
      // ошибку показал интерцептор
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRestore = async (project: Project) => {
    setRestoringId(project.id);
    try {
      await unarchiveProject(project.id);
      toast.success(`Проект «${project.name}» возвращён в работу`);
      await load();
    } catch {
      // ошибку показал интерцептор
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Загрузка архива…
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}
        >
          <Archive size={22} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Архив пуст
        </p>
        <p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
          Проекты, которые не доведены до конца и исключены из работы,
          появятся здесь. Их данные сохраняются, и их можно вернуть в работу.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Архивных проектов: {projects.length}. Возврат в работу восстанавливает проект
        со всеми документами, этапами, комплектами и разделами.
      </p>
      {projects.map(project => (
        <div
          key={project.id}
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}
          >
            <FolderKanban size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {project.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                В архиве
              </span>
            </div>
            <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {project.code}
              {project.archived_at && (
                <> · архивирован {new Date(project.archived_at).toLocaleDateString('ru-RU')}</>
              )}
              {project.archive_reason && (
                <> · причина: <span style={{ color: 'var(--text-secondary)' }}>{project.archive_reason}</span></>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleRestore(project)}
            disabled={restoringId === project.id}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-opacity"
            style={{ background: '#8B5CF6', opacity: restoringId === project.id ? 0.6 : 1 }}
          >
            <RotateCcw size={12} />
            {restoringId === project.id ? 'Возврат…' : 'Вернуть в работу'}
          </button>
        </div>
      ))}
    </div>
  );
}
