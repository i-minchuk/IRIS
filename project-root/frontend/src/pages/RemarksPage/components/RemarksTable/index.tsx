import React from 'react';
import { RemarkListItem, RemarkPriority, RemarkStatus } from '@/types/remarks';

interface RemarksTableProps {
  remarks: RemarkListItem[];
  selectedRemarks: Set<string>;
  setSelectedRemarks: React.Dispatch<React.SetStateAction<Set<string>>>;
  priorityColors: Record<RemarkPriority, string>;
  statusColors: Record<RemarkStatus, string>;
  getPriorityIcon: (priority: RemarkPriority) => string;
}

export const RemarksTable: React.FC<RemarksTableProps> = ({
  remarks,
  selectedRemarks,
  setSelectedRemarks,
  priorityColors,
  statusColors,
  getPriorityIcon,
}) => {
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedRemarks);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRemarks(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedRemarks.size === remarks.length) {
      setSelectedRemarks(new Set());
    } else {
      setSelectedRemarks(new Set(remarks.map(r => r.id)));
    }
  };

  if (remarks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[#64748b]">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm font-bold">Замечаний не найдено</div>
          <div className="text-xs mt-2">Создайте новое замечание или измените фильтры</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#0f172a] border-b border-[#334155]">
          <tr>
            <th className="px-3 py-2 text-left">
              <input
                type="checkbox"
                checked={selectedRemarks.size === remarks.length}
                onChange={toggleSelectAll}
                className="rounded bg-[#334155] border-[#475569]"
              />
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">ID</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Приоритет</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Статус</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Название</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Категория</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Автор</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Назначено</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Дедлайн</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-[#94a3b8]">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]">
          {remarks.map((remark) => (
            <tr key={remark.id} className="hover:bg-[#0f172a] transition-colors">
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedRemarks.has(remark.id)}
                  onChange={() => toggleSelect(remark.id)}
                  className="rounded bg-[#334155] border-[#475569]"
                />
              </td>
              <td className="px-3 py-3 text-xs font-mono text-[#64748b]">
                {remark.id.slice(0, 8)}
              </td>
              <td className="px-3 py-3">
                <span className="flex items-center gap-1 text-xs">
                  <span className={priorityColors[remark.priority]}>{getPriorityIcon(remark.priority)}</span>
                </span>
              </td>
              <td className="px-3 py-3">
                <span className={`px-2 py-0.5 rounded text-xs ${statusColors[remark.status]}`}>
                  {remark.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-3 py-3 text-sm text-[#e2e8f0]">
                {remark.title}
              </td>
              <td className="px-3 py-3 text-xs text-[#94a3b8]">
                {remark.category.replace('_', ' ')}
              </td>
              <td className="px-3 py-3 text-xs text-[#94a3b8]">
                {remark.author_name}
              </td>
              <td className="px-3 py-3 text-xs text-[#94a3b8]">
                {remark.assignee_name || '—'}
              </td>
              <td className="px-3 py-3 text-xs text-[#94a3b8]">
                {remark.due_date ? (
                  <span className={new Date(remark.due_date) < new Date() ? 'text-red-400 font-bold' : ''}>
                    {remark.due_date}
                  </span>
                ) : '—'}
              </td>
              <td className="px-3 py-3">
                <button className="text-[#3b82f6] hover:text-[#2563eb] text-xs">
                  ✏️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
