import { useMemo, useRef, useState } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importTenders, type TenderImportRow } from '../api/tenders';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}

/** Поля импорта и возможные названия колонок в Excel (рус/англ). */
const FIELD_META: Record<string, { label: string; required?: boolean; aliases: string[] }> = {
  name: { label: 'Название', required: true, aliases: ['название', 'наименование', 'name', 'title', 'объект', 'заказ'] },
  customer_name: { label: 'Заказчик', aliases: ['заказчик', 'customer', 'customer_name', 'заказчик/площадка'] },
  project_type: { label: 'Тип проекта', aliases: ['тип проекта', 'тип', 'project type', 'project_type'] },
  volume: { label: 'Объём', aliases: ['объём', 'объем', 'volume'] },
  volume_unit: { label: 'Ед. изм.', aliases: ['ед.', 'единица', 'unit', 'ед. изм.'] },
  nmc: { label: 'НМЦ', aliases: ['нмц', 'начальная цена', 'nmc', 'стартовая цена', 'цена заказчика'] },
  our_price: { label: 'Наша цена', aliases: ['наша цена', 'our price', 'our_price'] },
  stage: { label: 'Стадия', aliases: ['стадия', 'stage', 'этап'] },
  deadline: { label: 'Срок / дедлайн', aliases: ['срок', 'дедлайн', 'deadline', 'дата подачи', 'окончание'] },
  region: { label: 'Регион', aliases: ['регион', 'region'] },
  platform: { label: 'Площадка', aliases: ['площадка', 'platform', 'платформа'] },
  responsible_name: { label: 'Ответственный', aliases: ['ответственный', 'responsible', 'руководитель', 'ответственный (фио)'] },
};

const STAGE_ALIASES: Record<string, string> = {
  'новый': 'new', 'квалификация': 'qualification', 'подготовка': 'preparation',
  'согласование': 'approval', 'подан': 'submitted', 'аукцион': 'auction',
  'ожидание': 'waiting', 'выигран': 'won', 'проигран': 'lost', 'договор': 'contract',
};

type Row = Record<string, string | number | Date | null>;

function cleanHeader(h: unknown): string {
  return String(h ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function guessMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const [field, meta] of Object.entries(FIELD_META)) {
    const idx = headers.findIndex((h) => meta.aliases.includes(h));
    if (idx >= 0) mapping[field] = String(idx);
  }
  return mapping;
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/\s|₽|руб/gi, '').replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function toDateString(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const dM = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (dM) return `${dM[3]}-${dM[2].padStart(2, '0')}-${dM[1].padStart(2, '0')}`;
  return null;
}

function toStage(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  const s = String(v).trim().toLowerCase();
  if (s in STAGE_ALIASES) return STAGE_ALIASES[s];
  const allowed = ['new', 'qualification', 'preparation', 'approval', 'submitted', 'auction', 'waiting', 'won', 'lost', 'contract'];
  return allowed.includes(s) ? s : undefined;
}

export default function ImportTendersModal({ isOpen, onClose, onDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
      if (json.length < 2) {
        setError('Файл пустой: нужна строка заголовков и хотя бы одна строка данных');
        return;
      }
      const hdrs = (json[0] || []).map(cleanHeader);
      setHeaders(hdrs);
      setRows(
        json.slice(1)
          .filter((r) => (r || []).some((c) => c !== '' && c != null))
          .map((r) => {
            const rec: Row = {};
            hdrs.forEach((_, i) => {
              const v = (r || [])[i];
              rec[String(i)] = v === '' ? null : (v as string | number | Date);
            });
            return rec;
          }),
      );
      setMapping(guessMapping(hdrs));
      setFileName(file.name);
    } catch {
      setError('Не удалось прочитать файл. Поддерживаются .xlsx, .xls, .csv');
    }
  };

  const buildPayload = (): TenderImportRow[] =>
    rows.map((r) => {
      const get = (field: string) => {
        const idx = mapping[field];
        return idx != null ? r[idx] : null;
      };
      const name = String(get('name') ?? '').trim();
      return {
        name,
        customer_name: String(get('customer_name') ?? '').trim() || undefined,
        project_type: String(get('project_type') ?? '').trim() || undefined,
        volume: toNumber(get('volume')),
        volume_unit: String(get('volume_unit') ?? '').trim() || undefined,
        nmc: toNumber(get('nmc')),
        our_price: toNumber(get('our_price')),
        stage: toStage(get('stage')),
        deadline: toDateString(get('deadline')),
        region: String(get('region') ?? '').trim() || undefined,
        platform: String(get('platform') ?? '').trim() || undefined,
        responsible_name: String(get('responsible_name') ?? '').trim() || undefined,
      };
    });

  const validCount = useMemo(
    () => buildPayload().filter((r) => r.name).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, mapping],
  );

  const handleImport = async () => {
    const payload = buildPayload().filter((r) => r.name);
    if (!payload.length) {
      setError('Нет ни одной строки с названием');
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const res = await importTenders(payload);
      setResult({ created: res.created, skipped: res.skipped });
      onDone();
    } catch {
      setError('Импорт не удался. Проверьте формат данных и попробуйте снова');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setFileName('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-3xl rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-subtle)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileSpreadsheet className="h-4 w-4" />
            Импорт тендеров из Excel
          </h2>
          <button onClick={handleClose} className="p-1 rounded cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />

        {!rows.length ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed px-4 py-10 text-sm cursor-pointer transition-colors"
            style={{ borderColor: 'var(--iris-border-subtle)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--iris-accent-cyan)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--iris-border-subtle)'; }}
          >
            <Upload className="h-6 w-6 mx-auto mb-2" />
            Выберите файл Excel (.xlsx, .xls, .csv)
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Колонки: название (обяз.), заказчик, тип проекта, объём, НМЦ, наша цена, стадия, срок, регион, площадка, ответственный
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>
                Файл: <b style={{ color: 'var(--text-secondary)' }}>{fileName}</b> · строк: {rows.length}
              </span>
              <button onClick={() => fileRef.current?.click()} className="underline cursor-pointer" style={{ color: 'var(--iris-accent-cyan)' }}>
                Выбрать другой файл
              </button>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Сопоставление колонок
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(FIELD_META).map(([field, meta]) => (
                  <label key={field} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {meta.label}
                    {meta.required && <span style={{ color: 'var(--iris-accent-coral)' }}> *</span>}
                    <select
                      value={mapping[field] ?? ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                      className="mt-0.5 w-full rounded-md px-2 py-1 text-xs"
                      style={{ background: 'var(--iris-bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--iris-border-subtle)' }}
                    >
                      <option value="">— не импортировать —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={String(i)}>
                          {h || `Колонка ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4 overflow-x-auto">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Предпросмотр (первые {previewRows.length} строк)
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--iris-border-subtle)' }}>
                    {Object.entries(FIELD_META)
                      .filter(([f]) => mapping[f] != null)
                      .map(([f, meta]) => (
                        <th key={f} className="text-left py-1.5 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                          {meta.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--iris-border-subtle)' }}>
                      {Object.keys(FIELD_META)
                        .filter((f) => mapping[f] != null)
                        .map((f) => {
                          const v = r[mapping[f]];
                          return (
                            <td key={f} className="py-1.5 px-2" style={{ color: 'var(--text-primary)' }}>
                              {v instanceof Date ? v.toLocaleDateString('ru-RU') : (v ?? '—') as string | number}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {error && (
          <div className="mb-3 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--iris-status-bg-coral)', color: 'var(--iris-accent-coral)' }}>
            {error}
          </div>
        )}
        {result && (
          <div className="mb-3 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--iris-status-bg-cyan, rgba(28,184,187,0.1))', color: 'var(--iris-accent-cyan)' }}>
            Импортировано: {result.created}{result.skipped > 0 ? ` · пропущено (без названия): ${result.skipped}` : ''}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            style={{ background: 'var(--iris-bg-subtle)', color: 'var(--text-secondary)' }}
          >
            {result ? 'Закрыть' : 'Отмена'}
          </button>
          {rows.length > 0 && !result && (
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--iris-accent-cyan)', color: 'var(--iris-text-inverse)' }}
            >
              {importing ? 'Импорт…' : `Импортировать (${validCount})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
