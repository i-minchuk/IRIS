import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import type { ViewerProps } from './types';
import { VIEWER_CONFIGS } from './types';
import { MockViewerBase } from './MockViewerBase';
import styles from './viewer.module.css';

interface SheetData {
  name: string;
  rows: Array<Array<string | number | boolean | null>>;
}

const MOCK_SHEETS: SheetData[] = [
  {
    name: 'Sheet1',
    rows: [
      ['№', 'Позиция', 'Кол-во', 'Ед.', 'Масса, кг'],
      [1, 'Балка 20Б1', 12, 'шт', 248.4],
      [2, 'Швеллер 16П', 8, 'шт', 164.0],
      [3, 'Уголок 75×75×6', 24, 'шт', 98.7],
      [4, 'Лист 10мм', 5, 'м²', 392.5],
      [5, 'Труба круглая 108×4', 6, 'м', 61.6],
    ],
  },
  {
    name: 'Sheet2',
    rows: [
      ['Элемент', 'Марка', 'Стандарт'],
      ['Балка', 'С245', 'ГОСТ 27772'],
      ['Лист', 'С255', 'ГОСТ 27772'],
      ['Сварка', 'Э46', 'ГОСТ 9467'],
    ],
  },
];

async function fetchWorkbook(fileUrl: string): Promise<XLSX.WorkBook> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл (HTTP ${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return XLSX.read(buffer, { type: 'array' });
}

function workbookToSheets(wb: XLSX.WorkBook): SheetData[] {
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(ws, {
      header: 1,
      defval: '',
      raw: false,
    });
    return { name, rows };
  });
}

export const ExcelViewer: React.FC<ViewerProps> = ({ fileUrl, fileName, mock = false }) => {
  const config = VIEWER_CONFIGS.excel;
  const [sheets, setSheets] = useState<SheetData[]>(MOCK_SHEETS);
  const [activeSheet, setActiveSheet] = useState<string>(MOCK_SHEETS[0].name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMockMode = mock || !fileUrl;

  useEffect(() => {
    if (isMockMode) {
      setSheets(MOCK_SHEETS);
      setActiveSheet(MOCK_SHEETS[0].name);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchWorkbook(fileUrl!)
      .then((wb) => {
        if (cancelled) return;
        const parsed = workbookToSheets(wb);
        if (parsed.length === 0) {
          setError('В файле нет листов');
          setSheets([]);
          return;
        }
        setSheets(parsed);
        setActiveSheet(parsed[0].name);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Ошибка чтения Excel');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, isMockMode]);

  const current = useMemo(
    () => sheets.find((s) => s.name === activeSheet) ?? sheets[0],
    [sheets, activeSheet],
  );

  const handleDownload = useCallback(() => {
    if (!fileUrl) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.click();
  }, [fileUrl, fileName]);

  const renderTable = () => {
    if (!current || current.rows.length === 0) {
      return <p style={{ color: 'var(--text-secondary)' }}>Лист пуст</p>;
    }
    const [header, ...body] = current.rows;
    return (
      <table className={styles.excelTable}>
        <thead>
          <tr>
            {header.map((cell, idx) => (
              <th key={idx}>{String(cell ?? '')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{String(cell ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <MockViewerBase
      title={fileName}
      type={config.label}
      bgColor={config.bgColor}
      accentColor={config.accentColor}
      fileUrl={fileUrl}
    >
      <div className={styles.excelContainer}>
        {/* Sheet tabs */}
        <div className={styles.excelSheetTabs}>
          {sheets.map((s) => (
            <button
              key={s.name}
              type="button"
              className={`${styles.excelSheetTab} ${s.name === activeSheet ? styles.excelSheetTabActive : ''}`}
              onClick={() => setActiveSheet(s.name)}
            >
              {s.name}
            </button>
          ))}

          {fileUrl && !isMockMode && (
            <button
              type="button"
              onClick={handleDownload}
              className={styles.excelSheetTab}
              style={{ marginLeft: 'auto' }}
            >
              Скачать
            </button>
          )}
        </div>

        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span style={{ marginLeft: 12 }}>Чтение Excel...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className={styles.emptyState}>
            <p style={{ color: 'var(--error)' }}>Ошибка: {error}</p>
            {fileUrl && (
              <button
                type="button"
                onClick={handleDownload}
                style={{
                  background: 'var(--accent-engineering)',
                  color: 'var(--text-inverse)',
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  marginTop: 12,
                  cursor: 'pointer',
                }}
              >
                Скачать оригинал
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && renderTable()}

        {!isLoading && !error && current && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
            Лист «{current.name}» • строк: {Math.max(0, current.rows.length - 1)}
          </p>
        )}
      </div>
    </MockViewerBase>
  );
};

export default ExcelViewer;
