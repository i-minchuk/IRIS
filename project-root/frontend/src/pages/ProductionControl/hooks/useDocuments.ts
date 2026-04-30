import { useState, useEffect } from 'react';
import { ProjectDocument } from '../types/production';
import { mockDocuments } from '../mocks/productionData';

export function useDocuments() {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 300));
      setDocuments(mockDocuments);
      setLoading(false);
    };
    load();
  }, []);

  return { documents, loading };
}
