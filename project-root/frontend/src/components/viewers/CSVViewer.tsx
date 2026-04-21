import React, { useEffect, useState, useMemo } from 'react';
import type { ViewerProps } from './types';
import { VIEWER_CONFIGS } from './types';
import { MockViewerBase } from './MockViewerBase';
import styles from './viewer.module.css';

export const CSVViewer: React.FC<ViewerProps> = ({ fileUrl, fileName, mock = false }) => {
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'asc' | 'desc' } | null>(null);
  const config = VIEWER_CONFIGS.csv;

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
    if (!fileUrl || mock) return;

    setIsLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((r) => r.text())
      .then((text) => {
        const lines = text.split('\n').filter((line) => line.trim());
        const data = lines.map((line) => {
          // Simple CSV parsing (handles basic cases)
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
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [fileUrl, mock]);

  // Mock mode
  if (mock || !fileUrl) {
    return (
      <MockViewerBase
        title={fileName}
        type={config.label}
        bgColor={config.bgColor}
        accentColor={config.accentColor}
        fileUrl={fileUrl}
      >
        <div className={styles.csvContainer}>
          <table className={styles.csvTable}>
            <thead>
              <tr>
                <th>Колонка 1</th>
                <th>Колонка 2</th>
                <th>Колонка 3</th>
                <th>Колонка 4</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, rowIdx) => (
                <tr key={rowIdx}>
                  <td>Значение {rowIdx + 1}-1</td>
                  <td>Значение {rowIdx + 1}-2</td>
                  <td>{(rowIdx + 1) * 10}</td>
                  <td>{rowIdx % 2 === 0 ? 'Да' : 'Нет'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
            6 строк
          </p>
        </div>
      </MockViewerBase>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <MockViewerBase
        title={fileName}
        type={config.label}
        bgColor={config.bgColor}
        accentColor={config.accentColor}
        fileUrl={fileUrl}
      >
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span style={{ marginLeft: '12px' }}>Загрузка CSV...</span>
        </div>
      </MockViewerBase>
    );
  }

  // Error state
  if (error) {
    return (
      <MockViewerBase
        title={fileName}
        type={config.label}
        bgColor={config.bgColor}
        accentColor={config.accentColor}
        fileUrl={fileUrl}
      >
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--error)' }}>Ошибка: {error}</p>
          <a
            href={fileUrl}
            download={fileName}
            style={{
              background: 'var(--accent-engineering)',
              color: 'var(--text-inverse)',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              marginTop: '12px',
              display: 'inline-block',
            }}
          >
            Скачать
          </a>
        </div>
      </MockViewerBase>
    );
  }

  // Real CSV rendering
  return (
    <MockViewerBase
      title={fileName}
      type={config.label}
      bgColor={config.bgColor}
      accentColor={config.accentColor}
      fileUrl={fileUrl}
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

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
          {sortedRows.length} строк
        </p>
      </div>
    </MockViewerBase>
  );
};

export default CSVViewer;
