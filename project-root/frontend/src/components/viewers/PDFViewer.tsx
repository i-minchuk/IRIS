import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite специальный импорт: бандлер сам положит worker рядом с билдом
// и вернёт его URL. Работает и в dev, и в production.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ViewerProps } from './types';
import { ViewerShell } from './ViewerShell';
import styles from './viewer.module.css';

// Настройка worker для PDF.js v5 (использует .mjs, не .js)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface RenderedPage {
  pageNum: number;
  canvas: HTMLCanvasElement;
}

export const PDFViewer: React.FC<ViewerProps> = ({
  file,
  fileUrl,
  fileName,
  mock = false,
  hideDownload = false,
  hideFileName = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [renderedPages, setRenderedPages] = useState<Map<number, RenderedPage>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const hasSource = Boolean(file || fileUrl);

  // Загрузка PDF документа (из File или URL)
  useEffect(() => {
    if (mock || !hasSource) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        let source: string | Uint8Array;
        if (file) {
          const buffer = await file.arrayBuffer();
          source = new Uint8Array(buffer);
        } else {
          source = fileUrl!;
        }
        const loadingTask = pdfjsLib.getDocument(source as any);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setRenderedPages(new Map());
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Не удалось загрузить PDF');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, fileUrl, mock, hasSource]);

  // Рендеринг текущей страницы + буфер (prev/next)
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !containerRef.current) return;

    try {
      const cached = renderedPages.get(pageNum);
      if (cached) return;

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport,
      } as any).promise;

      setRenderedPages((prev) => new Map(prev).set(pageNum, { pageNum, canvas }));
    } catch (err) {
      console.error(`Ошибка рендеринга страницы ${pageNum}:`, err);
    }
  }, [pdfDoc, scale, renderedPages]);

  // Рендеринг текущей страницы и буфера
  useEffect(() => {
    if (!pdfDoc) return;

    renderPage(currentPage);
    if (currentPage > 1) renderPage(currentPage - 1);
    if (currentPage < totalPages) renderPage(currentPage + 1);
  }, [pdfDoc, currentPage, totalPages, renderPage]);

  // Очистка кэша при изменении масштаба
  useEffect(() => {
    setRenderedPages(new Map());
  }, [scale]);

  const handleZoomIn = useCallback(() => setScale((prev) => Math.min(prev + 0.25, 3.0)), []);
  const handleZoomOut = useCallback(() => setScale((prev) => Math.max(prev - 0.25, 0.5)), []);
  const handleZoomReset = useCallback(() => setScale(1.0), []);
  const handlePrevPage = useCallback(() => setCurrentPage((prev) => Math.max(prev - 1, 1)), []);
  const handleNextPage = useCallback(
    () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
    [totalPages],
  );
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
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

  // Куда прокрутить область просмотра после смены страницы
  const pendingScrollRef = useRef<'top' | 'bottom' | null>(null);

  // Сброс/установка прокрутки после того, как новая страница отрисована
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (pendingScrollRef.current === 'bottom') {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTop = 0;
    }
    pendingScrollRef.current = null;
  }, [currentPage]);

  // Скролл колесом: вертикальный, горизонтальный (Shift), автопереход между страницами.
  // Нативный непассивный listener — React-обработчик onWheel пассивный и не даёт preventDefault.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Жест pinch-to-zoom браузера не трогаем
      if (e.ctrlKey) return;
      e.preventDefault();

      const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

      // Shift + колесо — горизонтальный скролл
      if (e.shiftKey) {
        el.scrollLeft += step;
        return;
      }

      el.scrollTop += step;

      // Доскроллили до конца страницы — переходим на следующую
      if (step > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        if (currentPage < totalPages) {
          pendingScrollRef.current = 'top';
          setCurrentPage((p) => Math.min(p + 1, totalPages));
        }
      } else if (step < 0 && el.scrollTop <= 0 && currentPage > 1) {
        // Доскроллили до начала — возвращаемся на предыдущую (в конец её)
        pendingScrollRef.current = 'bottom';
        setCurrentPage((p) => Math.max(p - 1, 1));
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [currentPage, totalPages]);

  const mockContent = useMemo(
    () => (
      <div className={styles.pdfContainer}>
        <div
          className={styles.pdfPage}
          style={{
            width: '595px',
            height: '842px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>{fileName}</h1>
          <div style={{ flex: 1 }}>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: '12px',
                  background: '#e5e5e5',
                  marginBottom: '8px',
                  borderRadius: '2px',
                  width: `${100 - (i % 3) * 15}%`,
                }}
              />
            ))}
            <div
              style={{
                height: '150px',
                background: '#f5f5f5',
                margin: '20px 0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              Изображение
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: '12px',
                  background: '#e5e5e5',
                  marginBottom: '8px',
                  borderRadius: '2px',
                  width: `${90 - i * 10}%`,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: 'auto' }}>Стр. 1 из ~5</div>
        </div>
      </div>
    ),
    [fileName],
  );

  const currentPageData = renderedPages.get(currentPage);

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
      Скачать файл
    </button>
  ) : null;

  return (
    <ViewerShell
      file={file}
      fileUrl={fileUrl}
      fileName={fileName}
      fileType="pdf"
      onFileDrop={handleFileDrop}
      onDownload={hideDownload ? undefined : handleDownload}
      hideFileName={hideFileName}
      loading={isLoading}
      error={error}
      loadingText="Загрузка PDF..."
      errorActions={errorActions}
      showZoom
      zoom={scale}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onZoomReset={handleZoomReset}
      showPagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPrevPage={handlePrevPage}
      onNextPage={handleNextPage}
      onPageChange={handlePageChange}
    >
      {mock || !hasSource ? (
        mockContent
      ) : (
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            backgroundColor: '#525659',
            display: 'flex',
            position: 'relative',
          }}
        >
          {currentPageData ? (
            <canvas
              ref={(el) => {
                if (el && currentPageData) {
                  el.width = currentPageData.canvas.width;
                  el.height = currentPageData.canvas.height;
                  const ctx = el.getContext('2d');
                  if (ctx) ctx.drawImage(currentPageData.canvas, 0, 0);
                }
              }}
              className={styles.pdfPage}
              style={{ margin: 'auto', flexShrink: 0, display: 'block' }}
            />
          ) : (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span style={{ marginLeft: '12px' }}>Рендеринг...</span>
            </div>
          )}
          {/* Незаметная памятка о скролле */}
          <div
            style={{
              position: 'absolute',
              right: 10,
              bottom: 8,
              fontSize: 11,
              lineHeight: 1.3,
              color: 'rgba(255, 255, 255, 0.55)',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '2px 8px',
              borderRadius: 6,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Shift + колесо — прокрутка вбок
          </div>
        </div>
      )}
    </ViewerShell>
  );
};

export default PDFViewer;
