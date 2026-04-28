import { FileText, FileClock, FileCheck, AlertTriangle } from 'lucide-react';
import type { DocumentsByProjectData } from '../api/analytics';

interface DocumentKanbanProps {
  data: DocumentsByProjectData | null;
  loading?: boolean;
}

const STATUS_META = [
  { key: 'draft', label: 'ЧЕРН', icon: FileText, bg: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
  { key: 'in_review', label: 'СОГЛ', icon: FileClock, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/40' },
  { key: 'approved', label: 'УТВ', icon: FileCheck, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/40' },
];

export function DocumentKanban({ data, loading }: DocumentKanbanProps) {
  const projects = data?.projects ?? [];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
        <div className="mb-4 h-6 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
          Документооборот по проектам
        </h3>
      </div>

      {/* Projects grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.project_id}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            {/* Project title */}
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
              {project.project_name}
            </div>

            {/* Status blocks */}
            <div className="grid grid-cols-3 gap-1.5">
              {STATUS_META.map((status) => {
                const Icon = status.icon;
                const count = (project as unknown as Record<string, number>)[status.key] ?? 0;
                return (
                  <button
                    key={status.key}
                    className={[
                      'flex flex-col items-center gap-0.5 rounded-md border py-2 transition-colors hover:brightness-95',
                      status.bg,
                      status.border,
                    ].join(' ')}
                  >
                    <Icon className="h-3.5 w-3.5 opacity-70" />
                    <span className="text-xs font-bold">{count}</span>
                    <span className="text-[9px] font-medium opacity-70">{status.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Overdue */}
            {project.overdue > 0 && (
              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 dark:bg-rose-900/15">
                <AlertTriangle className="h-3 w-3 text-rose-500" />
                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  Просрочено: {project.overdue}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" /> Черновик
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> На согласовании
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Утверждено
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Просрочено
        </span>
      </div>

      {projects.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          Нет данных по документам
        </div>
      )}
    </div>
  );
}
