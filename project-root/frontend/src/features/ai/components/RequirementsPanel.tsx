import React, { useEffect, useRef, useState } from 'react';
import {
  Wrench,
  BookOpen,
  Ruler,
  Thermometer,
  Gauge,
  FileCheck,
  Loader2,
  CheckCircle,
  XCircle,
  X,
  ClipboardCheck,
  Upload,
} from 'lucide-react';
import { useExtractRequirements } from '@/features/ai/hooks/useExtractRequirements';
import { useComplianceCheck } from '@/features/ai/hooks/useComplianceCheck';
import { extractRequirementsFile } from '@/features/ai/api/aiApi';
import { getDocumentStandards, type StandardRequirement } from '@/features/documents/api/documents';
import { toast } from 'sonner';

const typeIcons: Record<string, React.ReactNode> = {
  gost: <BookOpen size={14} />,
  material: <Wrench size={14} />,
  dimension: <Ruler size={14} />,
  pressure: <Gauge size={14} />,
  temperature: <Thermometer size={14} />,
  other: <FileCheck size={14} />,
};

const typeLabels: Record<string, string> = {
  gost: 'ГОСТ/Стандарт',
  material: 'Материал',
  dimension: 'Размер',
  pressure: 'Давление',
  temperature: 'Температура',
  other: 'Другое',
};

interface RequirementsPanelProps {
  documentId: string;
}

export const RequirementsPanel: React.FC<RequirementsPanelProps> = ({ documentId }) => {
  const { result, loading, extract } = useExtractRequirements();
  const { result: complianceResult, loading: complianceLoading, runCheck, clear: clearCompliance } = useComplianceCheck();
  const [manualRequirements, setManualRequirements] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [standardRequirements, setStandardRequirements] = useState<StandardRequirement[]>([]);
  const [standardsLoading, setStandardsLoading] = useState(false);

  useEffect(() => {
    const numericId = Number(documentId);
    if (!numericId) return;
    setStandardsLoading(true);
    getDocumentStandards(numericId)
      .then(setStandardRequirements)
      .catch(() => setStandardRequirements([]))
      .finally(() => setStandardsLoading(false));
  }, [documentId]);

  const handleCheck = async () => {
    await runCheck(documentId, manualRequirements);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    clearCompliance();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.docx') && !lower.endsWith('.pdf')) {
      toast.error('Поддерживаются только файлы .docx и .pdf');
      return;
    }

    setUploadLoading(true);
    try {
      const response = await extractRequirementsFile(file);
      setManualRequirements(response.text);
      toast.success(`Требования извлечены из «${response.file_name}». Нажмите «Проверить соответствие» для анализа.`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка загрузки файла требований');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Технические требования
        </h3>
        <button
          onClick={() => extract(documentId)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 inline-flex items-center gap-1.5"
          style={{ backgroundColor: 'var(--accent-ai)', color: 'var(--text-inverse)' }}
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          {loading ? 'Извлечение...' : 'Извлечь AI'}
        </button>
      </div>

      {/* Manual requirements input */}
      <div
        className="rounded-lg border p-3 space-y-3"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            <ClipboardCheck size={14} style={{ color: 'var(--accent-engineering)' }} />
            Загрузить требования вручную
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            {uploadLoading && <Loader2 size={12} className="animate-spin" />}
            <Upload size={12} />
            {uploadLoading ? 'Загрузка...' : 'Загрузить файл (.docx, .pdf)'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <textarea
          value={manualRequirements}
          onChange={(e) => setManualRequirements(e.target.value)}
          placeholder="Вставьте или введите список требований для проверки соответствия документа..."
          rows={5}
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-opacity-50 resize-none"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-surface)',
            '--tw-ring-color': 'var(--accent-ai)',
          } as React.CSSProperties}
        />
        <div className="flex justify-end">
          <button
            onClick={handleCheck}
            disabled={complianceLoading || !manualRequirements.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}
          >
            {complianceLoading && <Loader2 size={12} className="animate-spin" />}
            {complianceLoading ? 'Проверка...' : 'Проверить соответствие'}
          </button>
        </div>
      </div>

      {/* Standards requirements */}
      {standardsLoading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={16} className="animate-spin" /> Загрузка требований из нормативов…
        </div>
      ) : standardRequirements.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Требования из нормативов
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-muted)' }}>
              {standardRequirements.length}
            </span>
          </div>
          <div className="space-y-2">
            {standardRequirements.map((req, index) => (
              <div
                key={`std-${index}`}
                className="flex items-start gap-2 p-3 rounded-lg border"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}
              >
                <div className="mt-0.5" style={{ color: 'var(--accent-engineering)' }}>
                  {typeIcons[req.type] || typeIcons.other}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: 'var(--accent-engineering)' }}>
                      {typeLabels[req.type] || req.type}
                    </span>
                    {req.standard_name && (
                      <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {req.standard_code || req.standard_name}
                      </span>
                    )}
                    {req.section && (
                      <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {req.section}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {req.value}
                  </div>
                  {req.description && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {req.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-t" style={{ borderColor: 'var(--border-default)' }} />

      {/* Extracted requirements list */}
      {result?.requirements && result.requirements.length > 0 ? (
        <div className="space-y-2">
          {result.requirements.map((req, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 rounded-lg border"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}
            >
              <div className="mt-0.5" style={{ color: 'var(--accent-engineering)' }}>
                {typeIcons[req.type] || typeIcons.other}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-engineering)' }}>
                    {typeLabels[req.type] || req.type}
                  </span>
                  {req.section && (
                    <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {req.section}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {req.value}
                </div>
                {req.description && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {req.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              AI анализирует документ...
            </div>
          ) : (
            'Нажмите «Извлечь AI» для автоматического извлечения требований'
          )}
        </div>
      )}

      {/* Compliance result modal */}
      {showModal && complianceResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-xl border shadow-lg overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {complianceResult.compliant ? (
                  <CheckCircle size={16} style={{ color: 'var(--status-success, #22c55e)' }} />
                ) : (
                  <XCircle size={16} style={{ color: 'var(--status-error, #ef4444)' }} />
                )}
                Результат проверки соответствия
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-md hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {complianceResult.compliant ? (
                <div
                  className="rounded-lg p-4 text-center text-sm font-medium"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--status-success, #22c55e)' }}
                >
                  Все требования соблюдены
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Найдены несоответствия:
                  </div>
                  {complianceResult.findings.map((finding, index) => (
                    <div
                      key={index}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: 'var(--border-default)',
                        backgroundColor: 'var(--bg-surface-2)',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        {finding.status === 'ok' ? (
                          <CheckCircle size={14} className="mt-0.5" style={{ color: 'var(--status-success, #22c55e)' }} />
                        ) : (
                          <XCircle size={14} className="mt-0.5" style={{ color: 'var(--status-error, #ef4444)' }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {finding.requirement}
                          </div>
                          <div className="text-xs mt-1" style={{ color: finding.status === 'ok' ? 'var(--status-success, #22c55e)' : 'var(--status-error, #ef4444)' }}>
                            {finding.status === 'ok' ? 'Соответствует' : `Не соответствует: ${finding.comment}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              className="flex justify-end px-4 py-3 border-t"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}
            >
              <button
                onClick={closeModal}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
