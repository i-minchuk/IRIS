import React, { useState } from 'react';
import { Project, Document } from '../../types/package';
import { DOC_STATUS_COLORS } from '../../constants/docStatusColors';

interface Props {
  document: Document | null;
  project: Project | null;
}

export const DocumentViewer: React.FC<Props> = ({ document, project }) => {
  const [zoom, setZoom] = useState(100);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#64748b]">
        <div className="text-4xl mb-3">📄</div>
        <div className="text-sm font-bold">ВЫБЕРИТЕ ДОКУМЕНТ</div>
        <button className="mt-3 px-4 py-2 bg-[#3b82f6] rounded-lg text-sm font-bold text-white">
          + Создать документ
        </button>
      </div>
    );
  }

  const sc = DOC_STATUS_COLORS[document.status];

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#334155]">
        <span className="text-lg">📄</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-[#e2e8f0]">{document.name}</div>
          <div className="text-[10px] text-[#94a3b8]">
            Ревизия {document.revision} | {document.lastUpdated} | {project?.name}
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-bold"
          style={{ backgroundColor: sc.bg, color: sc.text }}
        >
          {sc.label}
        </span>
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2 px-4 py-2 bg-[#1e293b]">
        <button className="px-3 py-1.5 bg-[#3b82f6] rounded text-xs font-bold text-white hover:bg-[#2563eb]">
          + Создать ревизию
        </button>
        <button className="px-3 py-1.5 bg-[#22c55e] rounded text-xs font-bold text-white hover:bg-[#16a34a]">
          + Отправить на согласование
        </button>
        <button className="px-3 py-1.5 bg-[#f59e0b] rounded text-xs font-bold text-white hover:bg-[#d97706]">
          + Отправить заказчику
        </button>
        <button className="px-3 py-1.5 bg-[#64748b] rounded text-xs font-bold text-white ml-auto hover:bg-[#475569]">
          ⬇ Скачать
        </button>
      </div>

      {/* Зона просмотра */}
      <div className="flex-1 bg-[#1e293b] m-3 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-[#475569]">
          <div className="text-5xl mb-3">📄</div>
          <div className="text-sm font-bold">{document.fileName}</div>
          <div className="text-xs mt-1">Просмотрщик документа</div>
        </div>
      </div>

      {/* Инструменты */}
      <div className="flex items-center justify-center gap-3 px-4 py-2">
        <button
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
          className="w-8 h-8 rounded-full bg-[#334155] text-white text-xs font-bold"
        >
          -
        </button>
        <span className="text-xs text-[#94a3b8] w-10 text-center">{zoom}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(200, z + 10))}
          className="w-8 h-8 rounded-full bg-[#334155] text-white text-xs font-bold"
        >
          +
        </button>
        <button className="w-8 h-8 rounded-full bg-[#334155] text-white text-xs">⟲</button>
        <button className="w-8 h-8 rounded-full bg-[#334155] text-white text-xs">⬇</button>
      </div>
    </div>
  );
};
