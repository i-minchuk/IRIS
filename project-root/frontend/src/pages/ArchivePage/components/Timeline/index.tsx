// src/pages/ArchivePage/components/Timeline/index.tsx
import React from 'react';
import { TimelineEvent } from '../../types/archive';

interface TimelineProps {
  events: TimelineEvent[];
  onSelectEvent: (event: TimelineEvent) => void;
  isLoading?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ events, onSelectEvent, isLoading }) => {
  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: string; color: string; bg: string }> = {
      document: { icon: '📄', color: '#3b82f6', bg: '#1e3a5f' },
      revision: { icon: '🔄', color: '#6366f1', bg: '#1e1b4b' },
      remark: { icon: '💬', color: '#ef4444', bg: '#7f1d1d' },
      workflow: { icon: '✓', color: '#22c55e', bg: '#14532d' },
      file_upload: { icon: '📎', color: '#f59e0b', bg: '#78350f' },
      project_event: { icon: '📊', color: '#8b5cf6', bg: '#2e1065' },
      material: { icon: '🧱', color: '#06b6d4', bg: '#164e63' },
      construction: { icon: '🏗️', color: '#14b8a6', bg: '#134e4a' },
    };
    return configs[type] || { icon: '•', color: '#64748b', bg: '#334155' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#64748b]">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>Нет событий в архиве</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Вертикальная линия */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#334155]" />

      <div className="space-y-4">
        {events.map((event) => {
          const config = getTypeConfig(event.type);
          const date = new Date(event.occurred_at).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={event.id}
              className="relative pl-14 cursor-pointer group"
              onClick={() => onSelectEvent(event)}
            >
              {/* Точка на таймлайне */}
              <div
                className="absolute left-4 w-4 h-4 rounded-full border-2 border-[#1e293b] transform -translate-x-1/2 top-1"
                style={{ backgroundColor: config.color }}
              />

              {/* Карточка события */}
              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 hover:border-[#3b82f6] transition-colors">
                <div className="flex items-start gap-3">
                  {/* Иконка */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: config.bg }}
                  >
                    {config.icon}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#e2e8f0] truncate">
                        {event.title}
                      </h3>
                      {event.data.is_pinned && (
                        <span className="text-xs text-[#f59e0b]">📌</span>
                      )}
                    </div>
                    <p className="text-xs text-[#94a3b8] mb-2">{date}</p>
                    {event.author_name && (
                      <p className="text-xs text-[#64748b]">Автор: {event.author_name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
