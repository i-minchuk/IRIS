import { useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'done';

type ExcelColumn = {
  key: string;
  header: string;
  sample?: string;
};

type ExcelSheet = {
  name: string;
  columns: ExcelColumn[];
  rows: Record<string, string | number | null>[];
};

type MappingValue = string;

type CustomColumn = {
  id: string;
  name: string;
};

const TARGET_FIELDS = [
  { key: 'code', label: 'Код документа', required: true },
  { key: 'title', label: 'Наименование', required: true },
  { key: 'discipline', label: 'Дисциплина', required: false },
  { key: 'doc_type', label: 'Тип документа', required: false },
  { key: 'revision', label: 'Ревизия', required: false },
  { key: 'status', label: 'Статус', required: false },
] as const;

const MOCK_SHEETS: ExcelSheet[] = [
  {
    name: 'MDR',
    columns: [
      { key: 'A', header: 'Document Code', sample: 'NPP-KM-001' },
      { key: 'B', header: 'Document Title', sample: 'Общий вид конструкций' },
      { key: 'C', header: 'Discipline', sample: 'КМ' },
      { key: 'D', header: 'Type', sample: 'Чертеж' },
      { key: 'E', header: 'Revision', sample: 'B.1' },
      { key: 'F', header: 'Status', sample: 'approved' },
    ],
    rows: [
      {
        A: 'NPP-KM-001',
        B: 'Общий вид конструкций',
        C: 'КМ',
        D: 'Чертеж',
        E: 'B.1',
        F: 'approved',
      },
      {
        A: 'NPP-AR-014',
        B: 'План на отметке 0.000',
        C: 'АР',
        D: 'План',
        E: 'A.2',
        F: 'review',
      },
      {
        A: 'NPP-KJ-122',
        B: 'Схема армирования фундамента',
        C: 'КЖ',
        D: 'Схема',
        E: 'A.1',
        F: 'draft',
      },
    ],
  },
  {
    name: 'Register',
    columns: [
      { key: 'A', header: 'Code', sample: 'PUMP-001' },
      { key: 'B', header: 'Title', sample: 'Спецификация насосов' },
      { key: 'C', header: 'Rev', sample: '0' },
    ],
    rows: [
      { A: 'PUMP-001', B: 'Спецификация насосов', C: '0' },
      { A: 'PIPE-010', B: 'Ведомость трубопроводов', C: '1' },
    ],
  },
];

async function parseExcelFile(file: File): Promise<{ sheets: ExcelSheet[] }> {
  void file;
  return new Promise((resolve) => {

    setTimeout(() => {
      resolve({ sheets: MOCK_SHEETS });
    }, 700);
  });
}

export default function ImportExcel() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);

  const [sheets, setSheets] = useState<ExcelSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<ExcelSheet | null>(null);

  const [mappings, setMappings] = useState<Record<string, MappingValue>>({});
  const [customCols, setCustomCols] = useState<CustomColumn[]>([]);
  const [newCustomColName, setNewCustomColName] = useState('');

  const selectedColumns = selectedSheet?.columns ?? [];

  const mappedPreview = useMemo(() => {
    const selectedRowsData = selectedSheet?.rows ?? [];
    if (!selectedSheet) return [];

    return selectedRowsData.slice(0, 5).map((row) => {

      const result: Record<string, string | number | null> = {};

      Object.entries(mappings).forEach(([targetField, sourceColumnKey]) => {
        result[targetField] = row[sourceColumnKey] ?? null;
      });

      customCols.forEach((col) => {
        result[`custom:${col.id}`] = null;
      });

      return result;
    });
  }, [mappings, customCols, selectedSheet]);


  const requiredMissing = useMemo(() => {
    return TARGET_FIELDS
      .filter((field) => field.required)
      .some((field) => !mappings[field.key]);
  }, [mappings]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFilename(file.name);

    try {
      const result = await parseExcelFile(file);
      setSheets(result.sheets);
      setSelectedSheet(result.sheets[0] ?? null);
      setStep('mapping');
    } catch {
      setSheets(MOCK_SHEETS);
      setSelectedSheet(MOCK_SHEETS[0] ?? null);
      setStep('mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleMapChange = (targetKey: string, sourceKey: string) => {
    setMappings((prev) => ({
      ...prev,
      [targetKey]: sourceKey,
    }));
  };

  const handleAddCustomCol = () => {
    const name = newCustomColName.trim();
    if (!name) return;

    const newCol: CustomColumn = {
      id: `${Date.now()}`,
      name,
    };

    setCustomCols((prev) => [...prev, newCol]);
    setNewCustomColName('');
  };

  const handleRemoveCustomCol = (id: string) => {
    setCustomCols((prev) => prev.filter((col) => col.id !== id));
  };

  const handleImport = async () => {
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    setLoading(false);
    setStep('done');
  };

  const resetAll = () => {
    setStep('upload');
    setSheets([]);
    setSelectedSheet(null);
    setMappings({});
    setCustomCols([]);
    setFilename('');
    setNewCustomColName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Импорт Excel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Загрузка MDR / реестров документов, сопоставление колонок и предпросмотр перед импортом.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { key: 'upload', label: 'Загрузка' },
            { key: 'mapping', label: 'Сопоставление' },
            { key: 'preview', label: 'Предпросмотр' },
            { key: 'done', label: 'Готово' },
          ].map((item, index) => {
            const active =
              (step === item.key) ||
              (step === 'mapping' && item.key === 'upload') ||
              (step === 'preview' && (item.key === 'upload' || item.key === 'mapping')) ||
              (step === 'done');

            return (
              <div key={item.key} className="flex items-center gap-3">
                <div
                  className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold ${
                    active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={active ? 'font-medium text-gray-900' : 'text-gray-500'}>
                  {item.label}
                </span>
                {index < 3 ? <ArrowRight size={16} className="text-gray-300" /> : null}
              </div>
            );
          })}
        </div>
      </div>

      {step === 'upload' && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-primary-50 p-4 text-primary-600">
              <Upload size={28} />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">Загрузите Excel-файл</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Поддерживаются MDR, реестры и ведомости. После загрузки можно выбрать лист, сопоставить колонки
              и проверить данные перед импортом.
            </p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
              <FileSpreadsheet size={16} />
              {loading ? 'Обработка...' : 'Выбрать файл'}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
            </label>

            <button
              type="button"
              className="mt-3 text-sm text-primary-600 hover:text-primary-700"
              onClick={() => {
                setSheets(MOCK_SHEETS);
                setSelectedSheet(MOCK_SHEETS[0]);
                setFilename('MDR_GRS-5.xlsx');
                setStep('mapping');
              }}
            >
              Использовать демо-файл
            </button>
          </div>
        </div>
      )}

      {(step === 'mapping' || step === 'preview' || step === 'done') && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Файл</h3>
              <p className="mt-2 break-all text-sm font-medium text-gray-900">{filename || '—'}</p>

              <button
                type="button"
                className="mt-4 text-sm text-primary-600 hover:text-primary-700"
                onClick={resetAll}
              >
                Загрузить другой файл
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Листы</h3>
              <div className="mt-4 space-y-2">
                {sheets.map((sheet) => {
                  const isActive = selectedSheet?.name === sheet.name;

                  return (
                    <button
                      key={sheet.name}
                      type="button"
                      onClick={() => setSelectedSheet(sheet)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                        isActive
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{sheet.name}</span>
                      <span className="text-xs opacity-70">{sheet.rows.length} строк</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Пользовательские поля
              </h3>

              <div className="mt-4 flex gap-2">
                <input
                  value={newCustomColName}
                  onChange={(e) => setNewCustomColName(e.target.value)}
                  placeholder="Например: Зона, Блок, Подрядчик"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCol}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus size={16} />
                  Добавить
                </button>
              </div>

              {customCols.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {customCols.map((col) => (
                    <span
                      key={col.id}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {col.name}
                      <button type="button" onClick={() => handleRemoveCustomCol(col.id)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-400">Дополнительные поля пока не добавлены.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {step === 'mapping' && selectedSheet && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Сопоставление колонок</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Лист: <span className="font-medium text-gray-700">{selectedSheet.name}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={requiredMissing}
                    onClick={() => setStep('preview')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      requiredMissing
                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    Далее
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Поле системы
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Колонка Excel
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Пример
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {TARGET_FIELDS.map((field) => {
                        const mappedKey = mappings[field.key];
                        const mappedColumn = selectedColumns.find((col) => col.key === mappedKey);

                        return (
                          <tr key={field.key}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {field.label}
                                {field.required ? <span className="ml-1 text-red-500">*</span> : null}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={mappings[field.key] || ''}
                                onChange={(e) => handleMapChange(field.key, e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
                              >
                                <option value="">Не выбрано</option>
                                {selectedColumns.map((col) => (
                                  <option key={col.key} value={col.key}>
                                    {col.header}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {mappedColumn?.sample || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {requiredMissing ? (
                  <p className="mt-4 text-sm text-amber-600">
                    Заполни обязательные сопоставления: Код документа и Наименование.
                  </p>
                ) : null}
              </div>
            )}

            {(step === 'preview' || step === 'done') && selectedSheet && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Предпросмотр импорта</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Проверка первых строк перед загрузкой в систему.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {step !== 'done' && (
                      <button
                        type="button"
                        onClick={() => setStep('mapping')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <ArrowLeft size={16} />
                        Назад
                      </button>
                    )}

                    {step !== 'done' && (
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} />
                        {loading ? 'Импорт...' : 'Импортировать'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(mappedPreview[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {mappedPreview.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.entries(row).map(([key, value]) => (
                            <td key={key} className="px-4 py-3 text-sm text-gray-700">
                              {value === null ? '—' : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {step === 'done' ? (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-green-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800">Импорт завершён</h3>
                        <p className="mt-1 text-sm text-green-700">
                          Данные успешно подготовлены и загружены. Можешь начать новый импорт или перейти к реестру документов.
                        </p>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={resetAll}
                            className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
                          >
                            Новый импорт
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}