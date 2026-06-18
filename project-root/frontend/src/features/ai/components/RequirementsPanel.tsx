import React from 'react';
import { Wrench, BookOpen, Ruler, Thermometer, Gauge, FileCheck, Loader2 } from 'lucide-react';
import { useExtractRequirements } from '@/features/ai/hooks/useExtractRequirements';

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

      {/* Requirements list */}
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
    </div>
  );
};
