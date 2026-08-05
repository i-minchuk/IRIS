import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { ViewerProps } from './types';
import { ViewerShell } from './ViewerShell';
import styles from './viewer.module.css';

const DEMO_ROWS = [
  ['Колонка 1', 'Колонка 2', 'Колонка 3', 'Колонка 4'],
  ['Значение 1-1', 'Значение 1-2', '10', 'Да'],
  ['Значение 2-1', 'Значение 2-2', '20', 'Нет'],
  ['Значение 3-1', 'Значение 3-2', '30', 'Да'],
  ['Значение 4-1', 'Значение 4-2', '40', 'Нет'],
  ['Значение 5-1', 'Значение 5-2', '50', 'Да'],
  ['Значение 6-1', 'Значение 6-2', '60', 'Нет'],
];

export const CSVViewer: React.FC<ViewerProps> = ({
  file,
  fileUrl,
  fileName,
  mock = false,
}) => {
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
  const hasSource = Boolean(file || fileUrl);

  const handleSort = (key: number) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      const cmp = String(aVal).localeCompare(String(bVal), 'ru');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortConfig]);

  useEffect(() => {
    if (mock || !hasSource) {
      setHeaders(DEMO_ROWS[0]);
      setRows(DEMO_ROWS.slice(1));
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const text = file
          ? await file.text()
          : await fetch(fileUrl!).then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.text();
            });
        if (cancelled) return;
        const lines = text.split('\n').filter((line) => line.trim());
        const data = lines.map((line) => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });

        if (data.length > 0) {
          setHeaders(data[0]);
          setRows(data.slice(1));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Ошибка чтения CSV');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, fileUrl, mock, hasSource]);

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
      Скачать
    </button>
  ) : null;

  return (
    <ViewerShell
      file={file}
      fileUrl={fileUrl}
      fileName={fileName}
      fileType="csv"
      onFileDrop={handleFileDrop}
      onDownload={handleDownload}
      loading={isLoading}
      error={error}
      loadingText="Загрузка CSV..."
      errorActions={errorActions}
    >
      <div className={styles.csvContainer}>
        <table className={styles.csvTable}>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort(i)}
                  title="Сортировать"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {header || `Колонка ${i + 1}`}
                    {sortConfig?.key === i && (
                      <span style={{ fontSize: '10px' }}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
          {sortedRows.length} строк
        </p>
      </div>
    </ViewerShell>
  );
};

export default CSVViewer;
