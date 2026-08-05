import { useState, useMemo } from 'react';
import { FileText, Download, Printer, Play } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { IRISRecommendations } from '@/components/IRISRecommendations';

type ReportTemplate = 'projects' | 'tenders' | 'load' | 'finances' | 'employees' | 'documents';

interface ReportRow {
  id: string;
  name: string;
  status: string;
  date: string;
  value: number;
}

const TEMPLATE_LABELS: Record<ReportTemplate, string> = {
  projects: 'Проекты',
  tenders: 'Тендеры',
  load: 'Загрузка по отделам',
  employees: 'Загрузка по сотрудникам',
  finances: 'Финансы',
  documents: 'Отчёт по документам',
};

const REPORT_ACCENT = '#EC4899';

const MOCK_DATA: Record<ReportTemplate, ReportRow[]> = {
  projects: [
    { id: 'P-001', name: 'ТЭЦ-5 Реконструкция', status: 'Активен', date: '2026-05-01', value: 1250000 },
    { id: 'P-002', name: 'ЖК «Северный»', status: 'Завершён', date: '2026-04-15', value: 890000 },
    { id: 'P-003', name: 'Мост через Волгу', status: 'Активен', date: '2026-05-10', value: 3400000 },
    { id: 'P-004', name: 'АЭС-2 Блок 3', status: 'Приостановлен', date: '2026-03-20', value: 5600000 },
    { id: 'P-005', name: 'ТРЦ «Галерея»', status: 'Активен', date: '2026-05-22', value: 2100000 },
  ],
  tenders: [
    { id: 'T-101', name: 'Тендер ТЭЦ-5', status: 'Выигран', date: '2026-04-01', value: 1500000 },
    { id: 'T-102', name: 'Тендер ЖК Северный', status: 'Выигран', date: '2026-03-15', value: 950000 },
    { id: 'T-103', name: 'Тендер Мост Волга', status: 'В работе', date: '2026-05-05', value: 4200000 },
    { id: 'T-104', name: 'Тендер АЭС-2', status: 'Проигран', date: '2026-02-28', value: 5800000 },
  ],
  employees: [
    { id: 'E-001', name: 'Иванов А.П.', status: 'Перегруз', date: '2026-05-01', value: 112 },
    { id: 'E-002', name: 'Петрова М.С.', status: 'Норма', date: '2026-05-01', value: 88 },
    { id: 'E-003', name: 'Сидоров К.В.', status: 'Недогруз', date: '2026-05-01', value: 62 },
    { id: 'E-004', name: 'Козлова Е.А.', status: 'Норма', date: '2026-05-01', value: 95 },
    { id: 'E-005', name: 'Морозов Д.И.', status: 'Перегруз', date: '2026-05-01', value: 108 },
    { id: 'E-006', name: 'Новикова С.Р.', status: 'Норма', date: '2026-05-01', value: 91 },
    { id: 'E-007', name: 'Волков А.Н.', status: 'Недогруз', date: '2026-05-01', value: 55 },
    { id: 'E-008', name: 'Лебедева О.В.', status: 'Перегруз', date: '2026-05-01', value: 115 },
  ],
  load: [
    { id: 'L-201', name: 'Отдел КЖ', status: 'Перегруз', date: '2026-05-01', value: 120 },
    { id: 'L-202', name: 'Отдел АР', status: 'Норма', date: '2026-05-01', value: 85 },
    { id: 'L-203', name: 'Отдел ОВиК', status: 'Недогруз', date: '2026-05-01', value: 45 },
    { id: 'L-204', name: 'Отдел ЭОМ', status: 'Норма', date: '2026-05-01', value: 92 },
    { id: 'L-205', name: 'Отдел ТХ', status: 'Перегруз', date: '2026-05-01', value: 110 },
  ],
  finances: [
    { id: 'F-301', name: 'Выручка Q1', status: 'Закрыто', date: '2026-03-31', value: 4500000 },
    { id: 'F-302', name: 'Выручка Q2', status: 'В работе', date: '2026-06-30', value: 3200000 },
    { id: 'F-303', name: 'Расходы на ПО', status: 'Закрыто', date: '2026-04-15', value: 180000 },
    { id: 'F-304', name: 'ФОТ', status: 'В работе', date: '2026-05-31', value: 1200000 },
  ],
  documents: [
    { id: 'D-001', name: 'Пояснительная записка ТЭЦ-5', status: 'Утверждён', date: '2026-05-12', value: 142 },
    { id: 'D-002', name: 'Архитектурные решения ЖК «Северный»', status: 'На проверке', date: '2026-05-18', value: 86 },
    { id: 'D-003', name: 'Конструктив Мост через Волгу', status: 'В разработке', date: '2026-05-20', value: 215 },
    { id: 'D-004', name: 'Отопление и вентиляция АЭС-2', status: 'Утверждён', date: '2026-04-28', value: 98 },
    { id: 'D-005', name: 'Электроснабжение ТРЦ «Галерея»', status: 'Архив', date: '2026-03-15', value: 64 },
  ],
};

function formatValue(template: ReportTemplate, value: number): string {
  if (template === 'load' || template === 'employees') return `${value}%`;
  if (template === 'documents') return `${value} стр.`;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
}

function toCSV(rows: ReportRow[], template: ReportTemplate): string {
  let valueHeader: string;
  if (template === 'load' || template === 'employees') valueHeader = 'Загрузка (%)';
  else if (template === 'documents') valueHeader = 'Объём (стр.)';
  else valueHeader = 'Сумма (₽)';
  const header = ['ID', 'Название', 'Статус', 'Дата', valueHeader];
  const lines = rows.map((r) => [
    r.id,
    `"${r.name.replace(/"/g, '""')}"`,
    r.status,
    r.date,
    String(r.value),
  ]);
  return [header.join(';'), ...lines.map((l) => l.join(';'))].join('\n');
}

export default function ReportsPage() {
  const [template, setTemplate] = useState<ReportTemplate>('projects');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generated, setGenerated] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';

  const data = useMemo(() => {
    if (!generated) return [];
    let rows = MOCK_DATA[template];
    if (startDate) {
      rows = rows.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      rows = rows.filter((r) => r.date <= endDate);
    }
    return rows;
  }, [generated, template, startDate, endDate]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    const csv = toCSV(data, template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${template}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full pt-2 pb-6 px-4">
      <IRISRecommendations page="reports" isDark={isDark} />
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
              onChange={(e) => { setTemplate(e.target.value as ReportTemplate); setGenerated(false); }}
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setGenerated(false); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-base md:text-lg font-medium leading-relaxed mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
              Дата окончания
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setGenerated(false); }}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            onClick={() => setGenerated(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: REPORT_ACCENT, color: '#FFFFFF' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DB2777'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = REPORT_ACCENT; }}
          >
            <Play size={16} /> Сгенерировать
          </button>
        </div>
      </div>

      {generated && (
        <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {TEMPLATE_LABELS[template]} — {data.length} записей
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={data.length === 0}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--iris-border-subtle)' }}
                onMouseEnter={(e) => { if (data.length > 0) { e.currentTarget.style.backgroundColor = 'var(--iris-border-subtle)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
              >
                <Download size={14} /> Экспорт CSV
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

          {data.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Нет данных для выбранного периода
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--iris-bg-hover)' }}>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>ID</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Название</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Статус</th>
                    <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Дата</th>
                    <th className="text-right px-4 py-2.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {template === 'load' || template === 'employees'
                        ? 'Загрузка'
                        : template === 'documents'
                        ? 'Объём'
                        : 'Сумма'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="border-t transition-colors"
                      style={{
                        borderColor: 'var(--iris-border-subtle)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--iris-bg-hover)',
                      }}
                    >
                      <td className="px-4 py-2.5 font-mono text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{row.id}</td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>{row.name}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background:
                              row.status === 'Активен' || row.status === 'Выигран' || row.status === 'Норма' || row.status === 'Утверждён'
                                ? 'rgba(79, 122, 76, 0.15)'
                                : row.status === 'Завершён' || row.status === 'Закрыто' || row.status === 'Архив'
                                ? 'rgba(107, 114, 128, 0.15)'
                                : row.status === 'Приостановлен' || row.status === 'Проигран' || row.status === 'Перегруз'
                                ? 'rgba(255, 107, 107, 0.15)'
                                : 'rgba(20, 184, 166, 0.15)',
                            color:
                              row.status === 'Активен' || row.status === 'Выигран' || row.status === 'Норма' || row.status === 'Утверждён'
                                ? '#4F7A4C'
                                : row.status === 'Завершён' || row.status === 'Закрыто' || row.status === 'Архив'
                                ? '#6B7280'
                                : row.status === 'Приостановлен' || row.status === 'Проигран' || row.status === 'Перегруз'
                                ? '#FF6B6B'
                                : '#14B8A6',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{row.date}</td>
                      <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                        {formatValue(template, row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!generated && (
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
  );
}
