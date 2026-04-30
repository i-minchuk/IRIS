import React from 'react';
import { TimelineNode } from '../../types/package';
import { DOC_STATUS_COLORS } from '../../constants/docStatusColors';

interface Props {
  timeline: TimelineNode[];
}

export const DocumentTimeline: React.FC<Props> = ({ timeline }) => {
  if (timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#64748b] text-xs">
        Выберите проект для отображения динамики документов
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#0f172a]">
        <span className="text-xs font-bold text-[#94a3b8]">📊 ДИНАМИКА ДОКУМЕНТОВ ПО ПРОЕКТУ</span>
        <div className="flex gap-3 text-[10px] text-[#64748b]">
          <span>█ Выполнен</span>
          <span>░ В работе</span>
          <span className="text-[#ef4444]">⚠ Заблокирован</span>
          <span className="text-[#f59e0b]">→ Блокирует других</span>
        </div>
      </div>

      {/* График */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2 overflow-x-auto">
        {timeline.map((node, i) => {
          const sc = DOC_STATUS_COLORS[node.status];
          const isCompleted = node.status === 'approved' || node.status === 'sent';
          const width = isCompleted
            ? 120
            : Math.max(80, 120 * (1 - (new Date(node.deadline).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)));

          return (
            <div key={node.documentId} className="flex-shrink-0">
              {/* Стрелка зависимости */}
              {i > 0 && (
                <div className="flex items-center mb-1">
                  {node.isBlocked && (
                    <span className="text-[10px] text-[#ef4444] mr-1">⚠ Ждет</span>
                  )}
                  {timeline[i - 1].isBlocking && (
                    <span className="text-[10px] text-[#f59e0b] mr-1">→</span>
                  )}
                </div>
              )}

              {/* Карточка документа */}
              <div
                className="p-2 rounded-lg border relative"
                style={{
                  width: `${width}px`,
                  borderColor: node.isBlocked ? '#ef4444' : node.isBlocking ? '#f59e0b' : sc.bg,
                  backgroundColor: isCompleted ? sc.bg + '30' : '#1e293b',
                }}
              >
                {/* Индикатор статуса */}
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.bg }} />
                  <span className="text-[10px] font-bold truncate" style={{ color: sc.text }}>
                    {node.documentName}
                  </span>
                </div>

                {/* Прогресс-бар */}
                <div className="w-full h-1.5 bg-[#334155] rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: isCompleted ? '100%' : node.status === 'in_progress' ? '60%' : '10%',
                      backgroundColor: sc.bg,
                    }}
                  />
                </div>

                {/* Инфо */}
                <div className="flex justify-between text-[9px] text-[#64748b]">
                  <span>{node.responsible}</span>
                  <span>
                    {new Date(node.deadline).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>

                {/* Алерты */}
                {node.isBlocked && (
                  <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#ef4444] rounded text-[8px] text-white font-bold">
                    ЖДЕТ
                  </div>
                )}
                {node.isBlocking && !isCompleted && (
                  <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#f59e0b] rounded text-[8px] text-white font-bold">
                    ТОРОПИ
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
