import { FileText, FileClock, FileCheck, AlertTriangle } from 'lucide-react';
import type { DocumentsByProjectData } from '../api/analytics';

interface DocumentKanbanProps {
  data: DocumentsByProjectData | null;
  loading?: boolean;
}

const STATUS_META = [
  { key: 'draft', label: 'ЧЕРН', icon: FileText, color: '#8892A8', glow: 'rgba(136,146,168,0.15)', bg: 'rgba(136,146,168,0.08)' },
  { key: 'in_review', label: 'СОГЛ', icon: FileClock, color: '#FFAA00', glow: 'rgba(255,170,0,0.15)', bg: 'rgba(255,170,0,0.08)' },
  { key: 'approved', label: 'УТВ', icon: FileCheck, color: '#00F0FF', glow: 'rgba(0,240,255,0.15)', bg: 'rgba(0,240,255,0.08)' },
];

export function DocumentKanban({ data, loading }: DocumentKanbanProps) {
  const projects = data?.projects ?? [];

  if (loading) {
    return (
      <div className="rounded-xl p-4 sm:p-6 neon-card">
        <div className="mb-4 h-6 w-56 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 sm:p-6 neon-card">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" style={{ color: '#2979FF' }} />
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Документооборот по проектам
        </h3>
      </div>

      {/* Projects grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.project_id}
            className="rounded-lg border p-3 transition-all duration-200 hover:border-[#2979FF]/20"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            {/* Project title */}
            <div className="mb-2 text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
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
                    className="flex flex-col items-center gap-0.5 rounded-md border py-2 transition-all duration-200 hover:brightness-110"
                    style={{
                      background: status.bg,
                      borderColor: status.glow.replace('0.15', '0.2'),
                      color: status.color,
                    }}
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
              <div
                className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1"
                style={{ background: 'rgba(255,0,85,0.08)' }}
              >
                <AlertTriangle className="h-3 w-3" style={{ color: '#FF0055' }} />
                <span className="text-[11px] font-medium" style={{ color: '#FF0055' }}>
                  Просрочено: {project.overdue}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 border-t pt-3 text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#8892A8' }} /> Черновик
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#FFAA00' }} /> На согласовании
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#00F0FF' }} /> Утверждено
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#FF0055' }} /> Просрочено
        </span>
      </div>

      {projects.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed p-8 text-center text-sm" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
          Нет данных по документам
        </div>
      )}
    </div>
  );
}
