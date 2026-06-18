import React from 'react';
import { AlertTriangle, CheckCircle, Info, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { useDocumentAnalysis } from '@/features/ai/hooks/useDocumentAnalysis';

interface DocumentAnalysisPanelProps {
  documentId: string;
}

const severityConfig = {
  critical: { icon: ShieldAlert, color: 'var(--error)', bg: 'var(--error-bg, #fef2f2)', label: 'Критично' },
  warning: { icon: AlertTriangle, color: 'var(--warning, #f59e0b)', bg: 'var(--warning-bg, #fffbeb)', label: 'Предупреждение' },
  info: { icon: Info, color: 'var(--info, #3b82f6)', bg: 'var(--info-bg, #eff6ff)', label: 'Информация' },
};

export const DocumentAnalysisPanel: React.FC<DocumentAnalysisPanelProps> = ({ documentId }) => {
  const { result, loading, analyze } = useDocumentAnalysis();

  const scoreColor = (score: number) => {
    if (score >= 80) return 'var(--success, #22c55e)';
    if (score >= 50) return 'var(--warning, #f59e0b)';
    return 'var(--error)';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--accent-ai)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            AI-анализ документа
          </h3>
        </div>
        <button
          onClick={() => analyze(documentId)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 inline-flex items-center gap-1.5"
          style={{ backgroundColor: 'var(--accent-ai)', color: 'var(--text-inverse)' }}
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          {loading ? 'Анализ...' : 'Проанализировать'}
        </button>
      </div>

      {/* Score */}
      {result && (
        <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}>
          <div className="text-2xl font-bold" style={{ color: scoreColor(result.overall_score) }}>
            {result.overall_score}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            /100 баллов
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs">
            {result.critical_count > 0 && (
              <span style={{ color: 'var(--error)' }}>{result.critical_count} критичных</span>
            )}
            {result.warning_count > 0 && (
              <span style={{ color: 'var(--warning, #f59e0b)' }}>{result.warning_count} предупреждений</span>
            )}
            {result.info_count > 0 && (
              <span style={{ color: 'var(--info, #3b82f6)' }}>{result.info_count} замечаний</span>
            )}
            {result.critical_count === 0 && result.warning_count === 0 && result.info_count === 0 && (
              <span className="flex items-center gap-1" style={{ color: 'var(--success, #22c55e)' }}>
                <CheckCircle size={12} /> Проблем не найдено
              </span>
            )}
          </div>
        </div>
      )}

      {/* Findings */}
      {result?.findings && result.findings.length > 0 && (
        <div className="space-y-2">
          {result.findings.map((finding, index) => {
            const config = severityConfig[finding.severity] || severityConfig.info;
            const Icon = config.icon;
            return (
              <div
                key={index}
                className="p-3 rounded-lg border"
                style={{
                  borderColor: config.color,
                  backgroundColor: config.bg,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: config.color }} />
                  <span className="text-xs font-medium" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  {finding.category && (
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                      {finding.category}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {finding.description}
                </p>
                {finding.suggestion && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    💡 {finding.suggestion}
                  </p>
                )}
                {finding.rule && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    📋 {finding.rule}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Нажмите «Проанализировать» для AI-проверки документа
        </div>
      )}
    </div>
  );
};
