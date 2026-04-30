import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { TaskStatistics } from '../types';

interface TaskStatisticsPanelProps {
  statistics: TaskStatistics;
}

export const TaskStatisticsPanel: React.FC<TaskStatisticsPanelProps> = ({ statistics }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: '#6b7280',
      in_progress: '#3b82f6',
      on_hold: '#f59e0b',
      done: '#10b981',
      cancelled: '#ef4444',
      review: '#8b5cf6',
      approval: '#ec4899',
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#6b7280',
      normal: '#3b82f6',
      high: '#f59e0b',
      critical: '#ef4444',
    };
    return colors[priority] || '#6b7280';
  };

  return (
    <div className="px-4 sm:px-6 py-3 border-b flex flex-wrap gap-4"
      style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}
    >
      {/* Общие показатели */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--iris-accent-blue)', boxShadow: '0 0 8px var(--iris-glow-blue)' }}
        >
          <CheckCircle size={16} color="#ffffff" />
        </div>
        <div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Всего задач</div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{statistics.total}</div>
        </div>
      </div>

      {/* Просроченные */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--iris-accent-red)', boxShadow: '0 0 8px var(--iris-glow-red)' }}
        >
          <AlertCircle size={16} color="#ffffff" />
        </div>
        <div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Просрочено</div>
          <div className="text-lg font-bold" style={{ color: 'var(--iris-accent-red)' }}>{statistics.overdueCount}</div>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>({statistics.overduePercentage.toFixed(1)}%)</div>
      </div>

      {/* По статусам */}
      <div className="flex items-center gap-2 ml-4 border-l pl-4" style={{ borderColor: 'var(--iris-border-subtle)' }}>
        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>По статусам:</div>
        {Object.entries(statistics.byStatus).map(([status, count]) => (
          <div key={status} className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{ background: getStatusColor(status) + '20' }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: getStatusColor(status) }} />
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{count}</span>
          </div>
        ))}
      </div>

      {/* По приоритетам */}
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Критичных:</div>
        {Object.entries(statistics.byPriority).map(([priority, count]) => {
          if (priority === 'critical' || priority === 'high') {
            return (
              <div key={priority} className="flex items-center gap-1.5 px-2 py-1 rounded"
                style={{ background: getPriorityColor(priority) + '20' }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: getPriorityColor(priority) }} />
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{count}</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* ТОП исполнителей */}
      {statistics.assigneeLoad.length > 0 && (
        <div className="flex items-center gap-2 ml-4 border-l pl-4" style={{ borderColor: 'var(--iris-border-subtle)' }}>
          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Загрузка:</div>
          {statistics.assigneeLoad.slice(0, 3).map((load, index) => (
            <div key={load.assigneeId} className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ 
                background: load.overdueCount > 0 ? 'var(--iris-accent-red)' + '20' : 'var(--iris-bg-app)',
              }}
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {index + 1}. {load.taskCount}
                {load.overdueCount > 0 && <span style={{ color: 'var(--iris-accent-red)' }}> (+{load.overdueCount})</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
