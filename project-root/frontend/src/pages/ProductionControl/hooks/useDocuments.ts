import { useState, useEffect } from 'react';
import { ProjectDocument, DocumentRemark, DocumentApprover } from '../types/production';
import { getDocuments } from '@/features/documents/api/documents';

const RESPONSIBLES = ['Иванов А.С.', 'Петров В.К.', 'Сидорова Е.М.', 'Козлов Д.А.', 'Новикова И.П.'];
const APPROVERS = [
  { name: 'Петров В.К.', role: 'ГИП' },
  { name: 'Сидорова Е.М.', role: 'Нормоконтролер' },
  { name: 'Козлов Д.А.', role: 'Технический директор' },
];

function generateMockDocuments(projectIds: string[]): ProjectDocument[] {
  const docTypes: ProjectDocument['type'][] = ['drawing', 'kd', 'spec', 'rd', 'test_program'];
  const statuses: ProjectDocument['status'][] = ['draft', 'in_review', 'approved', 'sent', 'overdue', 'rejected', 'in_production'];
  const docs: ProjectDocument[] = [];

  projectIds.forEach((projectId, pIdx) => {
    const baseSeed = pIdx * 100;
    for (let i = 0; i < 5; i++) {
      const id = `${projectId}-doc-${i}`;
      const type = docTypes[(baseSeed + i) % docTypes.length];
      const status = statuses[(baseSeed + i * 3) % statuses.length];
      const planned = new Date();
      planned.setDate(planned.getDate() + ((baseSeed + i * 7) % 30) - 15);
      const actual = new Date(planned);
      actual.setDate(actual.getDate() + ((baseSeed + i * 5) % 10) - 5);

      const approvers: DocumentApprover[] = APPROVERS.map((a, idx) => ({
        ...a,
        status: idx < ((baseSeed + i) % 3) ? 'approved' : idx === ((baseSeed + i) % 3) && status === 'in_review' ? 'pending' : 'pending',
      }));

      const currentApprover = status === 'in_review'
        ? approvers.find(a => a.status === 'pending')?.name
        : status === 'approved'
          ? 'Согласовано'
          : undefined;

      const remarks: DocumentRemark[] = [];
      if (status === 'in_review' || status === 'rejected' || (baseSeed + i) % 4 === 0) {
        remarks.push({
          id: `${id}-r1`,
          author: 'Петров В.К.',
          role: 'ГИП',
          text: 'Уточнить размеры примыкания к колонне и указать допуски.',
          status: (baseSeed + i) % 2 === 0 ? 'open' : 'resolved',
          createdAt: new Date(Date.now() - 86400000 * ((baseSeed + i) % 5 + 1)).toISOString(),
        });
      }

      docs.push({
        id,
        projectId,
        type,
        number: `${type.toUpperCase()}-${String(baseSeed + i + 1).padStart(3, '0')}`,
        name: `${type === 'drawing' ? 'Чертёж' : type === 'kd' ? 'Комплект КД' : type === 'spec' ? 'Спецификация' : type === 'rd' ? 'Проектная документация' : 'Программа испытаний'} ${projectId}-${i + 1}`,
        status,
        responsible: RESPONSIBLES[(baseSeed + i) % RESPONSIBLES.length],
        currentApprover,
        plannedReady: planned.toISOString().split('T')[0],
        actualReady: actual.toISOString().split('T')[0],
        remarks,
        approvers,
        history: [
          { date: planned.toISOString().split('T')[0], action: 'Создание', user: RESPONSIBLES[(baseSeed + i) % RESPONSIBLES.length] },
          { date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], action: 'Отправка на согласование', user: 'Автор' },
        ],
        comments: [],
      });
    }
  });

  return docs;
}

export function useDocuments(projectIds: string[] = []) {
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
          actualReady: d.created_at || '',
          remarks: [],
          approvers: [],
          history: [],
          comments: [],
        }));
        setDocuments(transformed.length ? transformed : generateMockDocuments(projectIds));
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить документы');
        console.error(err);
        setDocuments(generateMockDocuments(projectIds));
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
