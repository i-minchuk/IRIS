import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import type { ViewerProps } from './types';
import { ViewerShell } from './ViewerShell';
import styles from './viewer.module.css';

interface SheetData {
  name: string;
  rows: Array<Array<string | number | boolean | null>>;
}

const DEMO_SHEET: SheetData = {
  name: 'Лист1',
  rows: [
    ['Колонка 1', 'Колонка 2', 'Колонка 3', 'Колонка 4'],
    ['Значение 1-1', 'Значение 1-2', 10, 'Да'],
    ['Значение 2-1', 'Значение 2-2', 20, 'Нет'],
    ['Значение 3-1', 'Значение 3-2', 30, 'Да'],
    ['Значение 4-1', 'Значение 4-2', 40, 'Нет'],
    ['Значение 5-1', 'Значение 5-2', 50, 'Да'],
    ['Значение 6-1', 'Значение 6-2', 60, 'Нет'],
  ],
};

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

export const ExcelViewer: React.FC<ViewerProps> = ({
  file,
  fileUrl,
  fileName,
  mock = false,
}) => {
  const [sheets, setSheets] = useState<SheetData[]>([DEMO_SHEET]);
  const [activeSheet, setActiveSheet] = useState<string>(DEMO_SHEET.name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSource = Boolean(file || fileUrl);
  const isMockMode = mock || !hasSource;

  useEffect(() => {
    if (isMockMode) {
      setSheets([DEMO_SHEET]);
      setActiveSheet(DEMO_SHEET.name);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const buffer = file ? await file.arrayBuffer() : await fetch(fileUrl!).then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        });
        const wb = XLSX.read(buffer, { type: 'array' });
        if (cancelled) return;
        const parsed = workbookToSheets(wb);
        if (parsed.length === 0) {
          setError('В файле нет листов');
          setSheets([]);
          return;
        }
        setSheets(parsed);
        setActiveSheet(parsed[0].name);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Ошибка чтения Excel');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, fileUrl, isMockMode]);

  const current = useMemo(
    () => sheets.find((s) => s.name === activeSheet) ?? sheets[0],
    [sheets, activeSheet],
  );

  const handleDownload = useCallback(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } else if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.click();
    }
  }, [file, fileUrl, fileName]);

  const handleFileDrop = useCallback((_file: File) => {
    /* integration hook: delegate to workspace store if needed */
  }, []);

  const sheetNames = useMemo(() => sheets.map((s) => s.name), [sheets]);

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

  const errorActions = (file || fileUrl) ? (
    <button
      type="button"
      onClick={handleDownload}
      style={{
        background: 'var(--accent-engineering)',
        color: 'var(--text-inverse)',
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Скачать оригинал
    </button>
  ) : null;

  return (
    <ViewerShell
      file={file}
      fileUrl={fileUrl}
      fileName={fileName}
      fileType="excel"
      onFileDrop={handleFileDrop}
      onDownload={handleDownload}
      loading={isLoading}
      error={error}
      loadingText="Чтение Excel..."
      errorActions={errorActions}
      sheets={isMockMode ? undefined : sheetNames}
      activeSheet={activeSheet}
      onSheetChange={setActiveSheet}
    >
      <div className={styles.excelContainer}>
        {renderTable()}
        {current && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
            Лист «{current.name}» • строк: {Math.max(0, current.rows.length - 1)}
          </p>
        )}
      </div>
    </ViewerShell>
  );
};

export default ExcelViewer;
