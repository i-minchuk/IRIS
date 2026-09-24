import { useState, useEffect } from 'react';
import { ProjectDocument } from '../types/production';
import { getDocuments } from '@/features/documents/api/documents';

/** Статусы backend-документов → статусы трекера документов производства. */
const STATUS_MAP: Record<string, ProjectDocument['status']> = {
  draft: 'draft',
  in_review: 'in_review',
  crs_pending: 'in_review',
  review: 'in_review',
  approved: 'approved',
  crs_approved: 'approved',
  confirmed: 'approved',
  sent: 'sent',
  in_production: 'in_production',
  rejected: 'rejected',
  overdue: 'overdue',
};

/** Типы документов (doc_type) → типы производственного трекера. */
function mapDocType(value?: string): ProjectDocument['type'] {
  const v = (value || '').toLowerCase();
  if (v.includes('spec') || v.includes('спец')) return 'spec';
  if (v.includes('draw') || v.includes('черт')) return 'drawing';
  if (v === 'rd' || v === 'рд') return 'rd';
  if (v === 'kd' || v === 'кд' || v === 'tk' || v === 'тк') return 'kd';
  if (v.includes('test') || v.includes('испыт')) return 'test_program';
  if (v.includes('protocol') || v.includes('протокол')) return 'protocol';
  return 'other';
}

export function useDocuments(projectIds: string[] = []) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getDocuments({ page_size: 100 });
        const list = (Array.isArray(data) ? data : ((data as any)?.items ?? [])) as any[];
        const transformed: ProjectDocument[] = list.map((d) => ({
          id: String(d.id),
          projectId: String(d.project_id),
          type: mapDocType(d.doc_type),
          number: d.number || d.code || String(d.id),
          name: d.name || d.title || 'Документ',
          status: STATUS_MAP[(d.status || '').toLowerCase()] ?? 'draft',
          responsible: '—',
          plannedReady: d.created_at || '',
          actualReady: undefined,
          remarks: [],
          approvers: [],
          history: [],
          comments: [],
        }));
        // Мок-фолбэк удалён: при пустом списке — честный empty-state
        setDocuments(transformed);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить документы');
        console.error(err);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectIds.join(',')]);

  const addComment = (docId: string, author: string, text: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id !== docId) return d;
      return {
        ...d,
        comments: [
          ...(d.comments || []),
          { id: `c-${Date.now()}`, author, text, createdAt: new Date().toISOString() },
        ],
      };
    }));
  };

  return { documents, loading, error, addComment };
}
