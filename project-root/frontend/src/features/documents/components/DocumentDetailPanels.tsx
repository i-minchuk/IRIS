import React from 'react';
import type { DocumentDetail } from '@/api/documents';

interface Props {
  doc: DocumentDetail;
}

export const DocumentDetailPanels: React.FC<Props> = ({ doc }) => {
  const openRemarks = doc.remarks?.filter((r) => r.status !== 'closed' && r.status !== 'resolved_confirmed').length || 0;
  const totalRevisions = doc.revisions?.length || 0;

  return (
    <div className="grid grid-cols-4 gap-3 mt-3">
      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Свойства</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          <div>Тип: <span className="font-medium">{doc.doc_type}</span></div>
          <div>Автор: <span className="font-medium">{doc.author_id}</span></div>
          <div>CRS: <span className="font-medium">{doc.crs_code || '—'}</span></div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Замечания</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          <div>Открытых: <span className={`font-medium ${openRemarks > 0 ? 'text-red-600' : ''}`}>{openRemarks}</span></div>
          <div>Всего: <span className="font-medium">{doc.remarks?.length || 0}</span></div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Ревизии</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          <div>Количество: <span className="font-medium">{totalRevisions}</span></div>
          <div>Текущая: <span className="font-medium">{doc.current_revision_id ? `Rev ${doc.current_revision_id}` : '—'}</span></div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold">Согласование</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          <div>Статус: <span className="font-medium">{doc.status}</span></div>
          <div>CRS: <span className="font-medium">{doc.crs_code ? `Код ${doc.crs_code}` : 'Ожидание'}</span></div>
        </div>
      </div>
    </div>
  );
};
