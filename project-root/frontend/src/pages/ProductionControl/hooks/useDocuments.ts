import { useState, useEffect } from 'react';
import { ProjectDocument } from '../types/production';
import { getDocuments } from '@/api/documents';

export function useDocuments() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getDocuments();
        const transformed: ProjectDocument[] = data.map((d) => ({
          id: String(d.id),
          projectId: String(d.project_id),
          type: (d.doc_type?.includes('spec') ? 'spec' : d.doc_type?.includes('draw') ? 'drawing' : 'other') as ProjectDocument['type'],
          number: d.number || d.code || String(d.id),
          name: d.name || d.title || 'Документ',
          status: (d.status === 'approved' ? 'approved' : d.status === 'in_review' ? 'in_review' : 'draft') as ProjectDocument['status'],
          responsible: '—',
          plannedReady: d.created_at || '',
        }));
        setDocuments(transformed);
      } catch (err) {
        setError('Не удалось загрузить документы');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { documents, loading, error };
}
