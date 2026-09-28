import React, { useEffect, useState, useCallback } from 'react';
import mammoth from 'mammoth';
import type { ViewerProps } from './types';
import { ViewerShell } from './ViewerShell';
import styles from './viewer.module.css';

export const WordViewer: React.FC<ViewerProps> = ({
  file,
  fileUrl,
  fileName,
  mock = false,
  hideDownload = false,
  hideFileName = false,
}) => {
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasSource = Boolean(file || fileUrl);

  const handleZoomIn = useCallback(() => setScale((s) => Math.min(s + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(s - 0.25, 0.5)), []);
  const handleZoomReset = useCallback(() => setScale(1), []);

  // Ctrl + колесо / pinch — масштаб только документа, а не всей программы
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setScale((prev) => Math.min(3, Math.max(0.5, Number((prev + delta).toFixed(2)))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Ctrl +/-/0 — масштаб документа при фокусе на области просмотра
  const handleViewerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!e.ctrlKey) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setScale((s) => Math.min(s + 0.25, 3));
    } else if (e.key === '-') {
      e.preventDefault();
      setScale((s) => Math.max(s - 0.25, 0.5));
    } else if (e.key === '0') {
      e.preventDefault();
      setScale(1);
    }
  }, []);

  useEffect(() => {
    if (mock || !hasSource) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const buffer = file
          ? await file.arrayBuffer()
          : await fetch(fileUrl!).then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.arrayBuffer();
            });
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (cancelled) return;
        setHtml(result.value);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить Word');
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
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
      {fileUrl && (
        <a
          href={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'var(--bg-surface-2)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--border-default)',
            textDecoration: 'none',
          }}
        >
          Открыть в Google Docs
        </a>
      )}
    </div>
  ) : null;

  return (
    <ViewerShell
      file={file}
      fileUrl={fileUrl}
      fileName={fileName}
      fileType="word"
      onFileDrop={handleFileDrop}
      onDownload={hideDownload ? undefined : handleDownload}
      hideFileName={hideFileName}
      loading={isLoading}
      error={error}
      loadingText="Загрузка Word..."
      errorActions={errorActions}
      showZoom
      zoom={scale}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onZoomReset={handleZoomReset}
    >
      {mock || !hasSource ? (
        <div className={styles.wordContainer}>
          <div className={styles.wordContent}>
            <h1>{fileName}</h1>

            <h2>Введение</h2>
            <p>
              Это демонстрационный текст Word-документа. Здесь может быть описание проекта,
              техническая спецификация или любая другая документация.
            </p>

            <h2>Основные требования</h2>
            <p>Документ содержит основные разделы и требования к проекту.</p>
            <ul>
              <li>Пункт списка 1 - описание требования</li>
              <li>Пункт списка 2 - описание требования</li>
              <li>Пункт списка 3 - описание требования</li>
            </ul>

            <h2>Заключение</h2>
            <p>Документ подготовлен для согласования и утверждения.</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleViewerKeyDown}
          className={styles.wordContainer}
          style={{ zoom: scale, outline: 'none' }}
        >
          <div className={styles.wordContent} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </ViewerShell>
  );
};

export default WordViewer;
