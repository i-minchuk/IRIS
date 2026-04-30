import React, { useState } from 'react';
import { Document, Remark } from '../../types/package';
import { AUTHOR_LABELS } from '../../constants/docStatusColors';

interface Props {
  document: Document | null;
  remarks: Remark[];
}

export const RemarksPanel: React.FC<Props> = ({ document, remarks }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newType, setNewType] = useState<'customer' | 'internal'>('internal');

  const docRemarks = document ? remarks.filter((r) => r.documentId === document.id) : [];

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#64748b] p-4">
        <div className="text-3xl mb-2">💬</div>
        <div className="text-xs font-bold">ВЫБЕРИТЕ ДОКУМЕНТ</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <div className="p-2 bg-[#7f1d1d]">
        <div className="text-xs font-bold text-[#fca5a5]">💬 ЗАМЕЧАНИЯ ({docRemarks.length})</div>
      </div>

      {/* Кнопка добавления */}
      <div className="p-2">
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-1.5 bg-[#dc2626] rounded text-xs font-bold text-white"
        >
          + Добавить замечание
        </button>
      </div>

      {/* Форма добавления */}
      {isAdding && (
        <div className="mx-2 mb-2 p-2 bg-[#0f172a] border border-dashed border-[#475569] rounded">
          <div className="text-xs font-bold text-[#e2e8f0] mb-2">✏️ Новое замечание</div>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 text-[10px] text-[#e2e8f0]">
              <input
                type="radio"
                checked={newType === 'customer'}
                onChange={() => setNewType('customer')}
              />{' '}
              Заказчик
            </label>
            <label className="flex items-center gap-1 text-[10px] text-[#e2e8f0]">
              <input
                type="radio"
                checked={newType === 'internal'}
                onChange={() => setNewType('internal')}
              />{' '}
              Внутреннее
            </label>
          </div>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Текст замечания..."
            rows={3}
            className="w-full px-2 py-1 bg-[#1e293b] border border-[#475569] rounded text-xs text-[#e2e8f0] resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setNewText('');
              }}
              className="flex-1 py-1 bg-[#22c55e] rounded text-xs font-bold text-white"
            >
              ✓ Добавить
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewText('');
              }}
              className="flex-1 py-1 bg-[#64748b] rounded text-xs font-bold text-white"
            >
              ✗ Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список замечаний */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2">
        {docRemarks.map((remark) => {
          const statusColor =
            remark.status === 'open'
              ? '#fbbf24'
              : remark.status === 'fixed'
                ? '#4ade80'
                : remark.status === 'rejected'
                  ? '#f87171'
                  : '#60a5fa';

          return (
            <div
              key={remark.id}
              className="p-2 rounded-lg border"
              style={{
                borderColor: remark.author.color,
                backgroundColor:
                  remark.status === 'open'
                    ? '#450a0a'
                    : remark.status === 'fixed'
                      ? '#064e3b'
                      : '#1e3a5f',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: remark.author.color }}
                >
                  {AUTHOR_LABELS[remark.author.type][0]}
                </div>
                <span className="text-[10px] font-bold" style={{ color: remark.author.color }}>
                  {remark.author.name}
                </span>
                <span className="text-[10px] text-[#64748b] ml-auto">
                  {new Date(remark.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div
                className="text-xs mb-2"
                style={{
                  color: remark.status === 'open' ? '#fdbaba' : '#bbf7d0',
                }}
              >
                {remark.text}
              </div>

              {remark.status !== 'info' && (
                <div className="flex gap-1">
                  <button className="px-2 py-0.5 bg-[#15803d] rounded text-[10px] text-white">
                    ✓
                  </button>
                  <button className="px-2 py-0.5 bg-[#991b1b] rounded text-[10px] text-white">
                    ✗
                  </button>
                  <button className="px-2 py-0.5 bg-[#334155] rounded text-[10px] text-white">
                    💬
                  </button>
                </div>
              )}

              <div className="text-[10px] mt-1" style={{ color: statusColor }}>
                {remark.status === 'open'
                  ? '🟡 Не исправлено'
                  : remark.status === 'fixed'
                    ? '🟢 Исправлено'
                    : '🔵 Информационное'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
