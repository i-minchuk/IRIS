import React, { useState, useEffect } from 'react';
import { MessageSquareWarning, Plus, Download, Filter } from 'lucide-react';
import { useRemarksStore } from '@/stores/remarksStore';
import { RemarkPriority, RemarkStatus } from '@/types/remarks';
import { RemarksFilters } from './components/RemarksFilters';
import { RemarksTable } from './components/RemarksTable';
import { RemarksKanban } from './components/RemarksKanban';
import { RemarkModal } from './components/RemarkModal';
import { RemarksStatistics } from './components/RemarksStatistics';

type ViewMode = 'table' | 'kanban' | 'stats';

export const RemarksPage: React.FC = () => {
  const {
    remarks,
    statistics,
    tags,
    isLoading,
    error,
    fetchRemarks,
    fetchStatistics,
    fetchTags,
    createRemark,
  } = useRemarksStore();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRemarks();
    fetchStatistics();
    fetchTags();
  }, []);

  const handleCreateRemark = async (data: Parameters<typeof createRemark>[0]) => {
    try {
      await createRemark(data);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create remark:', err);
    }
  };

  const priorityColors: Record<RemarkPriority, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const statusColors: Record<RemarkStatus, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    deferred: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    closed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const getPriorityIcon = (priority: RemarkPriority) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
    }
  };

  return (
    <div className="h-screen bg-[#0f172a] text-[#e2e8f0] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e293b] border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <MessageSquareWarning className="w-6 h-6 text-[#FF4D6D]" />
          <div>
            <h1 className="text-lg font-bold">Замечания</h1>
            <p className="text-xs text-[#64748b]">
              Централизованный учёт и контроль замечаний
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statistics && (
            <div className="flex items-center gap-3 mr-4">
              <span className="text-xs text-[#64748b]">
                Всего: <span className="text-[#e2e8f0] font-bold">{statistics.total}</span>
              </span>
              {statistics.overdue_count > 0 && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                  Просрочено: {statistics.overdue_count}
                </span>
              )}
              {statistics.my_open_count > 0 && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                  Мои: {statistics.my_open_count}
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#334155] rounded text-xs font-medium hover:bg-[#475569] transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Фильтры
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-[#334155] rounded text-xs font-medium hover:bg-[#475569] transition-colors">
            <Download className="w-3.5 h-3.5" />
            Экспорт
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#FF4D6D] rounded text-xs font-bold text-white hover:bg-[#ff3355] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Новое замечание
          </button>
        </div>
      </div>

      {/* View mode tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#334155] bg-[#1e293b]">
        <button
          onClick={() => setViewMode('table')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            viewMode === 'table'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Таблица
        </button>
        <button
          onClick={() => setViewMode('kanban')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            viewMode === 'kanban'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Kanban
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            viewMode === 'stats'
              ? 'bg-[#3b82f6] text-white'
              : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
        >
          Статистика
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="px-4 py-3 bg-[#1e293b] border-b border-[#334155]">
          <RemarksFilters />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-400 mb-2">Ошибка: {error}</div>
              <button
                onClick={() => fetchRemarks()}
                className="px-3 py-1 bg-[#3b82f6] rounded text-xs text-white"
              >
                Повторить
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && viewMode === 'table' && (
          <RemarksTable
            remarks={remarks}
            selectedRemarks={selectedRemarks}
            setSelectedRemarks={setSelectedRemarks}
            priorityColors={priorityColors}
            statusColors={statusColors}
            getPriorityIcon={getPriorityIcon}
          />
        )}

        {!isLoading && !error && viewMode === 'kanban' && (
          <RemarksKanban
            remarks={remarks}
            priorityColors={priorityColors}
          />
        )}

        {!isLoading && !error && viewMode === 'stats' && (
          <RemarksStatistics statistics={statistics} />
        )}
      </div>

      {/* Create remark modal */}
      <RemarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRemark}
        tags={tags}
      />
    </div>
  );
};
