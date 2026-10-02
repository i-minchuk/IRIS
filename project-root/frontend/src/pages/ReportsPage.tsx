import { useState } from 'react';
import { FileText, Download, Printer, Play } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import apiClient from '@/shared/api/client';
import { DateInput } from '@/components/ui';

type ReportTemplate = 'projects' | 'tenders' | 'load' | 'finances' | 'documents' | 'remarks';

interface ReportResponse {
  template: string;
  columns: string[];
  rows: { columns: Record<string, string | number | null> }[];
  generated_at: string;
}

const TEMPLATE_LABELS: Record<ReportTemplate, string> = {
  projects: 'Проекты',
  tenders: 'Тендеры',
  load: 'Загрузка по отделам',
  finances: 'Финансы',
  documents: 'Документы',
  remarks: 'Замечания',
};

const REPORT_ACCENT = '#EC4899';

export default function ReportsPage() {
  const [template, setTemplate] = useState<ReportTemplate>('projects');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResponse | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post<ReportResponse>('/reports/generate', {
        template,
        from_date: startDate || null,
        to_date: endDate || null,
      });
      setReport(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Не удалось сформировать отчёт');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report || report.rows.length === 0) return;

    const data = report.rows.map((row) => {
      const obj: Record<string, string | number | null> = {};
      report.columns.forEach((col) => {
        obj[col] = row.columns[col] ?? '';
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт');
    XLSX.writeFile(
      wb,
      `report_${template}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await apiClient.post(
        '/reports/export?format=pdf',
        {
          template,
          from_date: startDate || null,
          to_date: endDate || null,
        },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${template}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      toast.error('Не удалось сформировать PDF');
    }
  };

  const resetReport = () => setReport(null);

  return (
    <>
      <style>
        {`
          @media print {
            body * { visibility: hidden !important; }
            .printable-report, .printable-report * { visibility: visible !important; }
            .printable-report {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
            }
            .printable-report table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            .printable-report th,
            .printable-report td {
              border: 1px solid #ccc !important;
              padding: 8px !important;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>
      <div className="w-full pt-2 pb-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
          Отчёты
        </h1>
      </div>

      <div className="rounded-xl border p-4 md:p-5 mb-6" style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Шаблон отчёта
            </label>
            <select
              value={template}
              onChange={(e) => { setTemplate(e.target.value as ReportTemplate); resetReport(); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none min-w-[180px]"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              {(Object.keys(TEMPLATE_LABELS) as ReportTemplate[]).map((key) => (
                <option key={key} value={key}>{TEMPLATE_LABELS[key]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Дата начала
            </label>
            <DateInput
              value={startDate}
              onChange={(v) => { setStartDate(v); resetReport(); }}
              className="min-w-[160px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Дата окончания
            </label>
            <DateInput
              value={endDate}
              onChange={(v) => { setEndDate(v); resetReport(); }}
              className="min-w-[160px]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
            style={{ background: REPORT_ACCENT, color: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DB2777'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = REPORT_ACCENT; }}
          >
            <Play size={16} /> {loading ? 'Формирование…' : 'Сгенерировать'}
          </button>
        </div>
      </div>

      {report && (
        <div className="printable-report rounded-xl border overflow-hidden" style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}>
          <div className="no-print flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {TEMPLATE_LABELS[template]} — {report.rows.length} записей
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--iris-border-subtle)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-border-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
              >
                <FileText size={14} /> Скачать PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={report.rows.length === 0}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--iris-border-subtle)' }}
                onMouseEnter={(e) => { if (report.rows.length > 0) { e.currentTarget.style.backgroundColor = 'var(--iris-border-subtle)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
              >
                <Download size={14} /> Экспорт Excel
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--iris-border-subtle)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-border-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
              >
                <Printer size={14} /> Печать
              </button>
            </div>
          </div>

          {report.rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Нет данных для выбранного периода
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--iris-bg-hover)' }}>
                    {report.columns.map((col) => (
                      <th key={col} className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-t transition-colors"
                      style={{
                        borderColor: 'var(--iris-border-subtle)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--iris-bg-hover)',
                      }}
                    >
                      {report.columns.map((col) => (
                        <td key={col} className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                          {row.columns[col] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!report && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={48} style={{ color: 'var(--iris-border-subtle)' }} className="mb-4" />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Выберите шаблон и период
          </p>
          <p className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
            Нажмите «Сгенерировать» для формирования отчёта
          </p>
        </div>
      )}
    </div>
    </>
  );
}
