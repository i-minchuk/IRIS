import React, { useEffect, useState } from 'react';
import { getAllRemarks, type Remark } from '@/api/documents';
import { RemarkFilters, type ActiveFilter } from '../components/RemarkFilters';
import { RemarkDataview } from '../components/RemarkDataview';

export const RemarksPage: React.FC = () => {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [filtered, setFiltered] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null);

  useEffect(() => {
    setLoading(true);
    getAllRemarks()
      .then((data) => {
        setRemarks(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeFilters.length === 0) {
      setFiltered(remarks);
      return;
    }
    const result = remarks.filter((r) =>
      activeFilters.every((f) => (r as any)[f.key] === f.value)
    );
    setFiltered(result);
  }, [activeFilters, remarks]);

  const toggleFilter = (filter: ActiveFilter) => {
    setActiveFilters((prev) => {
      const exists = prev.some((f) => f.key === filter.key && f.value === filter.value);
      if (exists) {
        return prev.filter((f) => !(f.key === filter.key && f.value === filter.value));
      }
      // Only one filter per key allowed (radio behavior within same key)
      const withoutSameKey = prev.filter((f) => f.key !== filter.key);
      return [...withoutSameKey, filter];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Замечания</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Найдено: <span className="font-medium">{filtered.length}</span> из {remarks.length}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar: Filters */}
        <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <RemarkFilters
            activeFilters={activeFilters}
            onToggle={toggleFilter}
            onClear={() => setActiveFilters([])}
          />
        </div>

        {/* Main: Dataview */}
        <div className="col-span-9 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          {loading && <div className="text-sm text-gray-500 dark:text-gray-400">Загрузка…</div>}
          {!loading && <RemarkDataview remarks={filtered} onSelect={setSelectedRemark} />}
        </div>
      </div>

      {/* Selected remark detail (backlinks style) */}
      {selectedRemark && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{selectedRemark.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{(selectedRemark as any).description || ''}</p>
            </div>
            <button onClick={() => setSelectedRemark(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
            <div>
              <span className="text-gray-400 dark:text-gray-500">Документ:</span>{' '}
              <a href={`/documents?doc=${selectedRemark.document_id}`} className="text-blue-600 hover:underline">
                {(selectedRemark as any).document_number || selectedRemark.document_id}
              </a>
            </div>
            <div>
              <span className="text-gray-400 dark:text-gray-500">Автор:</span>{' '}
              {(selectedRemark as any).source_author_id || '—'}
            </div>
            <div>
              <span className="text-gray-400 dark:text-gray-500">Дедлайн:</span>{' '}
              {selectedRemark.deadline ? new Date(selectedRemark.deadline).toLocaleDateString('ru-RU') : '—'}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Связи: ← Документ #{(selectedRemark as any).document_number} | Проект #{(selectedRemark as any).project_id}
          </div>
        </div>
      )}
    </div>
  );
};
