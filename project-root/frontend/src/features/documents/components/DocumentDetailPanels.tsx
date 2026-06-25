import React, { useState } from 'react';
import type { DocumentDetail } from '@/features/documents/api/documents';
import type { RemarkListItem } from '@/types/remarks';
import { classifyDocument } from '@/features/documents/api/documents';

interface Props {
  doc: DocumentDetail;
  remarks?: RemarkListItem[];
}

const CLOSED_STATUSES = new Set(['closed', 'resolved', 'rejected']);

export const DocumentDetailPanels: React.FC<Props> = ({ doc, remarks = [] }) => {
  const openRemarks = remarks.filter((r) => !CLOSED_STATUSES.has(r.status)).length;
  const totalRevisions = doc.revisions?.length || 0;
  const [classifying, setClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string; confidence: number } | null>(
    doc.ai_classified_type ? { type: doc.ai_classified_type, confidence: doc.ai_confidence || 0 } : null
  );

  const handleClassify = async () => {
    setClassifying(true);
    try {
      const res = await classifyDocument(doc.id);
      setAiResult({ type: res.type, confidence: res.confidence });
    } catch {
      // ignore
    } finally {
      setClassifying(false);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mt-3">
      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold">Свойства</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          <div>Тип: <span className="font-medium">{doc.doc_type}</span></div>
          <div>Автор: <span className="font-medium">{doc.author_id}</span></div>
          <div>CRS: <span className="font-medium">{doc.crs_code || '—'}</span></div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold">Замечания</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          <div>Открытых: <span className={`font-medium ${openRemarks > 0 ? 'text-red-600' : ''}`}>{openRemarks}</span></div>
          <div>Всего: <span className="font-medium">{remarks.length}</span></div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold">Ревизии</div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          <div>Количество: <span className="font-medium">{totalRevisions}</span></div>
          <div>Текущая: <span className="font-medium">{doc.current_revision_id ? `Rev ${doc.current_revision_id}` : '—'}</span></div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
        <div className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold flex justify-between items-center">
          <span>AI Классификация</span>
          <button
            onClick={handleClassify}
            disabled={classifying}
            className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
            title="Запустить AI-классификацию"
          >
            {classifying ? '…' : '▶'}
          </button>
        </div>
        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
          {aiResult ? (
            <>
              <div>Тип: <span className="font-medium">{aiResult.type}</span></div>
              <div>Уверенность: <span className="font-medium">{(aiResult.confidence * 100).toFixed(0)}%</span></div>
            </>
          ) : (
            <div className="text-gray-400 dark:text-gray-500">Не классифицирован</div>
          )}
        </div>
      </div>
    </div>
  );
};
