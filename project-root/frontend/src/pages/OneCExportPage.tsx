import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { oneCApi, type OneCDocumentItem } from '@/features/integrations/api/onec';

export default function OneCExportPage() {
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<OneCDocumentItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await oneCApi.getDocuments();
        setDocuments(
          data.map((d) => ({
            id: d.id,
            code: d.code || String(d.id),
            name: d.name || 'Без названия',
            type: d.type || '—',
            status: d.status || 'draft',
          }))
        );
      } catch (err: any) {
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          setError('Не удалось загрузить список документов');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const toggleDoc = (id: number) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedDocs.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      const { data } = await oneCApi.exportDocuments(selectedDocs);
      const blob = new Blob(
        [data.xml_content || JSON.stringify(data.json_content, null, 2)],
        { type: 'application/xml;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1c_export_${data.export_id}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Не удалось выполнить экспорт');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/integrations" className="p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Экспорт в 1С</h1>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Выберите документы для экспорта</h2>
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Loader2 size={16} className="animate-spin mr-2" /> Загрузка документов...
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                Нет документов для экспорта
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: selectedDocs.includes(doc.id) ? 'var(--accent-engineering-bg, #e0f2fe)' : 'var(--bg-surface)',
                    borderColor: selectedDocs.includes(doc.id) ? 'var(--accent-engineering)' : 'var(--border-default)',
                  }}
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded border" style={{ borderColor: 'var(--border-default)' }}>
                    {selectedDocs.includes(doc.id) && <CheckCircle size={14} style={{ color: 'var(--accent-engineering)' }} />}
                  </div>
                  <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{doc.code}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{doc.name}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>{doc.type}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={selectedDocs.length === 0 || exporting || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50 inline-flex items-center gap-2"
            style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}
          >
            {exporting && <Loader2 size={14} className="animate-spin" />}
            <Download size={14} />
            {exporting ? 'Экспорт...' : `Экспортировать ${selectedDocs.length} док.`}
          </button>
        </div>
      </div>
    </div>
  );
}
