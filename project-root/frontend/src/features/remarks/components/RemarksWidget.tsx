import React, { useEffect, useState } from 'react';
import { MessageSquareWarning, ArrowRight } from 'lucide-react';
import { useRemarksStore } from '@/stores/remarksStore';
import { RemarkPriority, RemarkStatus } from '@/types/remarks';

export interface RemarksWidgetProps {
  isDark?: boolean;
}

const priorityColors: Record<RemarkPriority, string> = {
  critical: '#DC2626',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

const statusLabels: Record<RemarkStatus, string> = {
  new: 'Новое',
  in_progress: 'В работе',
  resolved: 'Решено',
  rejected: 'Отклонено',
  deferred: 'Отложено',
  closed: 'Закрыто',
};

const priorityLabels: Record<RemarkPriority, string> = {
  critical: 'Критичный',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export const RemarksWidget: React.FC<RemarksWidgetProps> = ({ isDark: _isDark = false }) => {
  const { remarks, isLoading, fetchRemarks } = useRemarksStore();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchRemarks({ page: 1, page_size: 10 });
  }, [fetchRemarks]);

  const displayedRemarks = showAll ? remarks : remarks.slice(0, 3);

  const handleNavigate = () => {
    window.open('/remarks', '_blank');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center h-8 w-8 rounded-lg"
            style={{ background: 'rgba(220, 38, 38, 0.12)' }}
          >
            <MessageSquareWarning size={16} style={{ color: '#DC2626' }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Замечания
          </h3>
        </div>
        {remarks.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {remarks.length} всего
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</span>
        </div>
      )}

      {/* List */}
      {!isLoading && displayedRemarks.length > 0 && (
        <div className="space-y-2">
          {displayedRemarks.map((remark) => (
            <button
              key={remark.id}
              onClick={handleNavigate}
              className="w-full text-left p-2.5 rounded-lg border hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: priorityColors[remark.priority] }}
                />
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: `${priorityColors[remark.priority]}15`, color: priorityColors[remark.priority] }}>
                  {priorityLabels[remark.priority]}
                </span>
                <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                  {statusLabels[remark.status]}
                </span>
              </div>
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {remark.title}
              </p>
              {remark.project_name && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {remark.project_name}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Show more / Navigate */}
      {!isLoading && remarks.length > 3 && (
        <button
          onClick={showAll ? handleNavigate : () => setShowAll(true)}
          className="w-full text-center py-2 mt-2 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: '#DC2626' }}
        >
          {showAll ? (
            <span className="flex items-center justify-center gap-1">
              Все замечания <ArrowRight size={12} />
            </span>
          ) : (
            `Ещё ${remarks.length - 3} замечаний`
          )}
        </button>
      )}

      {/* Empty state */}
      {!isLoading && remarks.length === 0 && (
        <div className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Нет замечаний
        </div>
      )}
    </div>
  );
};
