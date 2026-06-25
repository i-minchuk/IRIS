import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';
import { ClipboardCheck, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { tenderExtendedApi } from '@/features/tenders/api/tenderExtended';
import type { DocumentChecklist } from '@/features/tenders/types/tender-extended';

interface TenderDocumentsTabProps {
  tenderId: number;
  existingDocuments: {
    id: number;
    number: string;
    name: string;
    doc_type: string;
    status: string;
    crs_code: string;
    created_at?: string;
  }[];
}

export default function TenderDocumentsTab({ tenderId, existingDocuments }: TenderDocumentsTabProps) {
  const [checklist, setChecklist] = useState<DocumentChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenderExtendedApi.getDocumentChecklist(tenderId);
      setChecklist(res);
    } catch {
      setChecklist(null);
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  const items = checklist?.items || [];
  const summary = checklist?.summary || { total: 0, required: 0, completed: 0, progress_pct: 0 };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${summary.progress_pct}%`,
              background: summary.progress_pct >= 80 ? '#0C7205' : summary.progress_pct >= 50 ? '#D4AF37' : '#DC2626',
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
          {summary.completed} / {summary.required} ({summary.progress_pct}%)
        </span>
      </div>

      {/* Checklist */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck size={14} style={{ color: '#2563EB' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Чеклист документов ({checklist?.project_type || 'KM'})
          </h3>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.code}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{
                background: item.status === 'done' ? 'rgba(12,114,5,0.04)' : 'var(--bg-surface-2)',
                border: `1px solid ${item.status === 'done' ? 'rgba(12,114,5,0.15)' : 'var(--border-default)'}`,
              }}
            >
              <div className="mt-0.5">
                {item.status === 'done' ? (
                  <CheckCircle2 size={14} style={{ color: '#0C7205' }} />
                ) : item.required ? (
                  <AlertTriangle size={14} style={{ color: '#DC2626' }} />
                ) : (
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                  <span className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>{item.code}</span>
                  {item.required && (
                    <span className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(220,38,38,0.12)', color: '#DC2626' }}>Обязательно</span>
                  )}
                </div>
                {item.documents.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {item.documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <FileText size={10} />
                        <span>{doc.number} — {doc.name}</span>
                        <span
                          className="px-1 py-0.5 rounded"
                          style={{
                            background: doc.status === 'approved' ? 'rgba(12,114,5,0.12)' : 'rgba(37,99,235,0.12)',
                            color: doc.status === 'approved' ? '#0C7205' : '#2563EB',
                          }}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.required ? 'Документ отсутствует — требуется создание' : 'Опционально'}
                  </div>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Нет данных о чеклисте
            </div>
          )}
        </div>
      </Card>

      {/* Existing documents */}
      {existingDocuments.length > 0 && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} style={{ color: '#6B5B95' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Существующие документы проекта</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['№', 'Название', 'Тип', 'Статус', 'CRS'].map(h => (
                    <th key={h} className="text-left px-2 py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {existingDocuments.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td className="px-2 py-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{doc.number}</td>
                    <td className="px-2 py-2" style={{ color: 'var(--text-primary)' }}>{doc.name}</td>
                    <td className="px-2 py-2" style={{ color: 'var(--text-secondary)' }}>{doc.doc_type}</td>
                    <td className="px-2 py-2">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: doc.status === 'approved' ? 'rgba(12,114,5,0.12)' : doc.status === 'review' ? 'rgba(212,175,55,0.12)' : 'rgba(37,99,235,0.12)',
                          color: doc.status === 'approved' ? '#0C7205' : doc.status === 'review' ? '#D4AF37' : '#2563EB',
                        }}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono" style={{ color: 'var(--text-muted)' }}>{doc.crs_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

