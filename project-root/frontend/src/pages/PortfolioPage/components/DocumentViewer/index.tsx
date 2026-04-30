// src/pages/PortfolioPage/components/DocumentViewer/index.tsx
import React from 'react';
import { Document, Project } from '../../types/portfolio';
import { StatusBadge } from '../StatusBadge';

interface DocumentViewerProps {
  document: Document | null;
  project: Project | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  project,
}) => {
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0f172a] text-[#64748b]">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg">Выберите документ для просмотра</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#334155]">
        <h2 className="text-xl font-semibold text-[#e2e8f0] mb-2">
          {document.name}
        </h2>
        <div className="flex items-center gap-4 text-sm text-[#94a3b8]">
          <span>Проект: {project?.name}</span>
          <span>Ревизия: {document.revision}</span>
          <span>Тип: {document.type.toUpperCase()}</span>
        </div>
      </div>

      {/* Status */}
      <div className="px-6 py-3 border-b border-[#334155] bg-[#1e293b]">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#94a3b8]">Статус:</span>
          <StatusBadge status={document.status} size="md" />
          {document.hasRemarks && (
            <span className="flex items-center gap-1 text-sm text-orange-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
              </svg>
              Есть замечания
            </span>
          )}
        </div>
      </div>

      {/* File Info */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-[#1e293b] rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-3">
            Информация о файле
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Имя файла:</span>
              <span className="text-[#e2e8f0]">{document.fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Последнее обновление:</span>
              <span className="text-[#e2e8f0]">
                {new Date(document.lastUpdated).toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
        </div>

        {/* Preview placeholder */}
        <div className="border-2 border-dashed border-[#334155] rounded-lg h-64 flex items-center justify-center text-[#64748b]">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Предпросмотр документа</p>
          </div>
        </div>
      </div>
    </div>
  );
};
