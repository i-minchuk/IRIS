import React from 'react';
import type { Remark } from '@/api/documents';

interface Props {
  remarks: Remark[];
  onSelect?: (remark: Remark) => void;
}

const severityDot: Record<string, string> = {
  critical: '🔴',
  major: '🟠',
  minor: '🟡',
  note: '⚪',
};

const statusBadge: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved_pending: 'bg-amber-100 text-amber-700',
  resolved_confirmed: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
};

export const RemarkDataview: React.FC<Props> = ({ remarks, onSelect }) => {
  if (!remarks.length) {
    return <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Нет замечаний по выбранным фильтрам</div>;
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-400 dark:text-gray-500 text-xs">
            <th className="pb-2 pr-3 font-medium">ID</th>
            <th className="pb-2 pr-3 font-medium">Дата</th>
            <th className="pb-2 pr-3 font-medium">Тип</th>
            <th className="pb-2 pr-3 font-medium">Содержание</th>
            <th className="pb-2 pr-3 font-medium">Документ</th>
            <th className="pb-2 pr-3 font-medium">Статус</th>
            <th className="pb-2 pr-3 font-medium">Теги</th>
          </tr>
        </thead>
        <tbody>
          {remarks.map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect?.(r)}
              className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 font-mono">P-{r.id}</td>
              <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : '—'}
              </td>
              <td className="py-2 pr-3 whitespace-nowrap">
                <span className="text-xs">
                  {severityDot[r.severity] || '⚪'} {r.remark_type}
                </span>
              </td>
              <td className="py-2 pr-3">
                <div className="font-medium text-gray-800 dark:text-gray-200">{r.title}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[240px]">{(r as any).description || ''}</div>
              </td>
              <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {(r as any).document_number || '—'}
              </td>
              <td className="py-2 pr-3">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBadge[r.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                  {r.status}
                </span>
              </td>
              <td className="py-2 pr-3">
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">#{r.severity}</span>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">#{r.remark_type}</span>
                  {r.category && r.category !== 'other' && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">#{r.category}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
