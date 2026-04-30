import React from 'react';
import { RemarkListItem, RemarkPriority } from '@/types/remarks';

interface RemarksKanbanProps {
  remarks: RemarkListItem[];
  priorityColors: Record<RemarkPriority, string>;
}

const columns = [
  { id: 'new', label: 'Новые', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'В работе', color: 'bg-yellow-500' },
  { id: 'resolved', label: 'Решённые', color: 'bg-green-500' },
  { id: 'rejected', label: 'Отклонённые', color: 'bg-red-500' },
  { id: 'deferred', label: 'Отложенные', color: 'bg-gray-500' },
];

export const RemarksKanban: React.FC<RemarksKanbanProps> = ({
  remarks,
  priorityColors,
}) => {
  const getRemarksByStatus = (status: string) => {
    return remarks.filter(r => r.status === status);
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnRemarks = getRemarksByStatus(column.id);

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80 bg-[#1e293b] rounded-lg flex flex-col"
          >
            <div className={`px-4 py-3 rounded-t-lg ${column.color} text-white`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{column.label}</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                  {columnRemarks.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {columnRemarks.length === 0 ? (
                <div className="text-center py-8 text-[#64748b] text-xs">
                  Нет замечаний
                </div>
              ) : (
                columnRemarks.map((remark) => (
                  <div
                    key={remark.id}
                    className="bg-[#0f172a] rounded-lg p-3 border border-[#334155] hover:border-[#3b82f6] transition-colors"
                  >
                    <div className={`h-1 rounded-t-lg mb-2 ${priorityColors[remark.priority]}`}></div>
                    <h4 className="text-sm text-[#e2e8f0] font-medium line-clamp-2 mb-2">
                      {remark.title}
                    </h4>
                    <span className="inline-block px-2 py-0.5 bg-[#334155] text-[#94a3b8] rounded text-xs mb-2">
                      {remark.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-[#64748b]">
                        <span>👤 {remark.author_name.split(' ')[0]}</span>
                      </div>
                      {remark.assignee_name && (
                        <div className="flex items-center gap-1 text-xs text-[#3b82f6]">
                          <span>✅ {remark.assignee_name.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>
                    {remark.due_date && (
                      <div className="mt-2 text-xs text-[#64748b]">
                        📅 {remark.due_date}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
