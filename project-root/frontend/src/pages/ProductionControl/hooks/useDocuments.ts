import { useState, useEffect } from 'react';
import { ProjectDocument } from '../types/production';
import { getDocuments } from '@/features/documents/api/documents';

export function useDocuments(projectIds: string[] = []) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getDocuments();
        const list = (Array.isArray(data) ? data : ((data as any)?.items ?? [])) as any[];
        const transformed: ProjectDocument[] = list.map((d) => ({
          id: String(d.id),
          projectId: String(d.project_id),
          type: (d.doc_type?.includes('spec') ? 'spec' : d.doc_type?.includes('draw') ? 'drawing' : 'other') as ProjectDocument['type'],
          number: d.number || d.code || String(d.id),
          name: d.name || d.title || 'Документ',
          status: (d.status === 'approved' ? 'approved' : d.status === 'in_review' ? 'in_review' : 'draft') as ProjectDocument['status'],
          responsible: '—',
          plannedReady: d.created_at || '',
          actualReady: d.created_at || '',
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
