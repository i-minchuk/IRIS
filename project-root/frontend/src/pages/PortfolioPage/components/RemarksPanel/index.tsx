// src/pages/PortfolioPage/components/RemarksPanel/index.tsx
import React from 'react';
import { Document, Remark } from '../../types/portfolio';
// import { AUTHOR_COLORS } from '../../constants/statusColors'; // TODO: использовать для цветов авторов

interface RemarksPanelProps {
  document: Document | null;
}

export const RemarksPanel: React.FC<RemarksPanelProps> = ({ document }) => {
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
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        <p className="text-lg">Выберите документ для просмотра замечаний</p>
      </div>
    );
  }

  if (!document.hasRemarks) {
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg">Нет замечаний</p>
      </div>
    );
  }

  // Mock data - в реальности будет из API
  const remarks: Remark[] = [
    {
      id: 'rem-1',
      documentId: document.id,
      author: {
        type: 'customer',
        name: 'Иванов А.С.',
        color: '#ef4444',
      },
      text: 'Не соответствует ГОСТ 21.101-2020. Требуется исправить рамки и основные надписи.',
      createdAt: '2026-04-25T11:00:00Z',
      status: 'open',
      replies: [
        {
          id: 'rep-1',
          author: 'Петров В.М.',
          text: 'Исправлю до конца дня',
          date: '2026-04-25T12:30:00Z',
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#334155]">
        <h2 className="text-lg font-semibold text-[#e2e8f0]">
          Замечания ({remarks.length})
        </h2>
      </div>

      {/* Remarks list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {remarks.map((remark) => (
          <div
            key={remark.id}
            className="bg-[#1e293b] rounded-lg p-4 border border-[#334155]"
          >
            {/* Author info */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: remark.author.color }}
              />
              <span className="text-sm font-medium text-[#e2e8f0]">
                {remark.author.name}
              </span>
              <span className="text-xs text-[#94a3b8]">
                {new Date(remark.createdAt).toLocaleString('ru-RU')}
              </span>
            </div>

            {/* Remark text */}
            <p className="text-[#cbd5e1] text-sm mb-3">{remark.text}</p>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  remark.status === 'open'
                    ? 'bg-orange-500/20 text-orange-400'
                    : remark.status === 'fixed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {remark.status === 'open'
                  ? 'Открыто'
                  : remark.status === 'fixed'
                  ? 'Исправлено'
                  : remark.status === 'rejected'
                  ? 'Отклонено'
                  : 'Инфо'}
              </span>
            </div>

            {/* Replies */}
            {remark.replies && remark.replies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#334155] space-y-2">
                {remark.replies.map((reply) => (
                  <div key={reply.id} className="text-sm">
                    <span className="font-medium text-[#e2e8f0]">
                      {reply.author}:
                    </span>
                    <span className="text-[#cbd5e1] ml-2">{reply.text}</span>
                    <span className="text-xs text-[#94a3b8] ml-2">
                      {new Date(reply.date).toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add remark button */}
      <div className="p-4 border-t border-[#334155]">
        <button className="w-full px-4 py-2 bg-[#4F7A4C] hover:bg-[#3d6b41] text-white rounded-lg font-medium transition-colors">
          Добавить замечание
        </button>
      </div>
    </div>
  );
};
