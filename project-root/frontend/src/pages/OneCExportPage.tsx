import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle, Loader2 } from 'lucide-react';

export default function OneCExportPage() {
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);

  const mockDocs = [
    { id: 1, code: 'КМ-001', name: 'Комплект чертежей металлоконструкций', type: 'КМ', status: 'approved' },
    { id: 2, code: 'АР-002', name: 'Архитектурные решения фасада', type: 'АР', status: 'review' },
    { id: 3, code: 'ОВ-003', name: 'Вентиляция и кондиционирование', type: 'ОВ', status: 'approved' },
  ];

  const toggleDoc = (id: number) => {
    setSelectedDocs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
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
          <div className="space-y-2">
            {mockDocs.map(doc => (
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
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleExport}
            disabled={selectedDocs.length === 0 || exporting}
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
