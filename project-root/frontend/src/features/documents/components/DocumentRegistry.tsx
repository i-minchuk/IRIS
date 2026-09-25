import React, { useCallback, useEffect, useState } from 'react';
import {
  getDocumentsList,
  updateDocument,
  excludeDocument,
  restoreDocument,
  type DocumentItem,
} from '@/features/documents/api/documents';
import Button from '@/components/ui/Button';

/** Статусы документа — как выпадающий список в ячейке Excel */
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'draft', label: 'Проект' },
  { value: 'in_review', label: 'На проверке' },
  { value: 'crs_pending', label: 'На согласовании' },
  { value: 'crs_approved', label: 'Согласован' },
  { value: 'approved', label: 'Принят' },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

/** Цвет строки по статусу — как заливка в Excel */
const rowClass = (doc: DocumentItem): string => {
  if (doc.is_deleted) {
    // Исключённые из работы — чёрная заливка, белый текст
    return 'bg-black text-white';
  }
  switch (doc.status) {
    case 'approved':
      return 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200';
    case 'crs_approved':
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'in_review':
      return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200';
    case 'crs_pending':
      return 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200';
    default:
      return 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU');
};

interface Props {
  projectId: number;
}

export const DocumentRegistry: React.FC<Props> = ({ projectId }) => {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDocumentsList({
        project_id: projectId,
        include_deleted: showDeleted,
        page: 1,
        page_size: 100,
      });
      setDocs(res.items);
    } catch {
      setError('Не удалось загрузить реестр документов');
    } finally {
      setLoading(false);
    }
  }, [projectId, showDeleted]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = async (doc: DocumentItem, status: string) => {
    // Оптимистичное обновление + повторная загрузка при ошибке
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status } : d)));
    try {
      await updateDocument(doc.id, { status });
    } catch {
      setError('Не удалось сохранить статус');
      await load();
    }
  };

  const handleExclude = async (doc: DocumentItem) => {
    const reason = window.prompt(`Причина исключения документа «${doc.number}» (необязательно):`) ?? undefined;
    try {
      await excludeDocument(doc.id, reason || undefined);
      await load();
    } catch {
      setError('Не удалось исключить документ');
    }
  };

  const handleRestore = async (doc: DocumentItem) => {
    try {
      await restoreDocument(doc.id);
      await load();
    } catch {
      setError('Не удалось вернуть документ в работу');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 select-none">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          Показать исключённые (чёрная заливка)
        </label>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {docs.length} док.
        </span>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-[calc(100vh-16rem)]">
        <table className="min-w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 text-xs uppercase">
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700 w-10">№</th>
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700">Номер документа</th>
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700">Название</th>
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700 w-16">Тип</th>
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700 w-44">Статус</th>
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700 w-14">CRS</th>
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700 w-28">Создан</th>
              <th className="px-2 py-2 text-left font-medium border-b border-gray-200 dark:border-gray-700 w-36">Действия</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, idx) => {
              const deleted = !!doc.is_deleted;
              return (
                <tr
                  key={doc.id}
                  className={`${rowClass(doc)} border-b border-gray-200/60 dark:border-gray-700/60 transition-colors`}
                  title={deleted && doc.delete_reason ? `Причина исключения: ${doc.delete_reason}` : undefined}
                >
                  <td className="px-2 py-1.5 text-xs opacity-70">{idx + 1}</td>
                  <td className="px-2 py-1.5 font-medium whitespace-nowrap">{doc.number}</td>
                  <td className="px-2 py-1.5 max-w-md truncate" title={doc.name}>{doc.name}</td>
                  <td className="px-2 py-1.5 text-xs">{doc.doc_type}</td>
                  <td className="px-2 py-1.5">
                    {deleted ? (
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Исключён{doc.delete_reason ? ` · ${doc.delete_reason}` : ''}
                      </span>
                    ) : (
                      <select
                        value={doc.status}
                        onChange={(e) => void handleStatusChange(doc, e.target.value)}
                        className="w-full rounded border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-xs font-bold">{doc.crs_code || '—'}</td>
                  <td className="px-2 py-1.5 text-xs whitespace-nowrap">{formatDate(doc.created_at)}</td>
                  <td className="px-2 py-1.5">
                    {deleted ? (
                      <Button size="sm" variant="outline" onClick={() => void handleRestore(doc)}>
                        Вернуть в работу
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => void handleExclude(doc)}>
                        Исключить
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && docs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  Нет документов в проекте
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && (
          <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Загрузка…</p>
        )}
      </div>

      {/* Легенда цветов — как в Excel */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium">Легенда:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-200 border border-green-400" /> Принят / согласован
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-400" /> На проверке
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-black border border-gray-600" /> Исключён из работы
        </span>
      </div>
    </div>
  );
};

export { STATUS_LABELS };
