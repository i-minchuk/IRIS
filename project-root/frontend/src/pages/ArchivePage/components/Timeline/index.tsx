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
      document: { icon: '📄', color: 'var(--iris-accent-blue)', bg: 'var(--iris-accent-blue-light)' },
      revision: { icon: '🔄', color: 'var(--iris-accent-indigo)', bg: 'var(--iris-accent-indigo-light)' },
      remark: { icon: '💬', color: 'var(--iris-accent-red)', bg: 'var(--iris-accent-red-light)' },
      workflow: { icon: '✓', color: 'var(--iris-accent-green)', bg: 'var(--iris-accent-green-light)' },
      file_upload: { icon: '📎', color: 'var(--iris-accent-orange)', bg: 'var(--iris-accent-orange-light)' },
      project_event: { icon: '📊', color: 'var(--iris-accent-purple)', bg: 'var(--iris-accent-purple-light)' },
      material: { icon: '🧱', color: 'var(--iris-accent-sky)', bg: 'var(--iris-accent-sky-light)' },
      construction: { icon: '🏗️', color: 'var(--iris-accent-teal)', bg: 'var(--iris-accent-teal-light)' },
    };
    return configs[type] || { icon: '•', color: 'var(--iris-text-muted)', bg: 'var(--iris-bg-surface-elevated)' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--iris-accent-blue)' }} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--iris-text-muted)' }}>
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
      <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: 'var(--iris-border-default)' }} />

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
                className="absolute left-4 w-4 h-4 rounded-full border-2 transform -translate-x-1/2 top-1"
                style={{ backgroundColor: config.color, borderColor: 'var(--iris-bg-app)' }}
              />

              {/* Карточка события */}
              <div
                className="rounded-lg p-4 transition-colors"
                style={{
                  background: 'var(--iris-bg-surface)',
                  border: '1px solid var(--iris-border-default)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--iris-accent-blue)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--iris-border-default)';
                }}
              >
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
                      <h3 className="text-sm font-bold truncate" style={{ color: 'var(--iris-text-primary)' }}>
                        {event.title}
                      </h3>
                      {event.data.is_pinned && (
                        <span className="text-xs" style={{ color: 'var(--iris-accent-orange)' }}>📌</span>
                      )}
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--iris-text-secondary)' }}>{date}</p>
                    {event.author_name && (
                      <p className="text-xs" style={{ color: 'var(--iris-text-muted)' }}>Автор: {event.author_name}</p>
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
