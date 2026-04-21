import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Vite специальный импорт: бандлер сам положит worker рядом с билдом
// и вернёт его URL. Работает и в dev, и в production.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ViewerProps } from './types';
import { VIEWER_CONFIGS } from './types';
import { MockViewerBase } from './MockViewerBase';
import { Toolbar } from './Toolbar';
import { DragDropOverlay } from './DragDropOverlay';
import styles from './viewer.module.css';

// Настройка worker для PDF.js v5 (использует .mjs, не .js)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface RenderedPage {
  pageNum: number;
  canvas: HTMLCanvasElement;
}

export const PDFViewer: React.FC<ViewerProps> = ({ fileUrl, fileName, mock = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [renderedPages, setRenderedPages] = useState<Map<number, RenderedPage>>(new Map());

  const containerRef = useRef<HTMLDivElement>(null);
  const config = VIEWER_CONFIGS.pdf;

  // Загрузка PDF документа
  useEffect(() => {
    if (!fileUrl || mock) return;

    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [fileUrl, mock]);

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

      setRenderedPages(prev => new Map(prev).set(pageNum, { pageNum, canvas }));
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

  const handleZoomIn = useCallback(() => setScale(prev => Math.min(prev + 0.25, 3.0)), []);
  const handleZoomOut = useCallback(() => setScale(prev => Math.max(prev - 0.25, 0.5)), []);
  const handleZoomReset = useCallback(() => setScale(1.0), []);
  const handlePrevPage = useCallback(() => setCurrentPage(prev => Math.max(prev - 1, 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage(prev => Math.min(prev + 1, totalPages)), [totalPages]);
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const handleDownload = useCallback(() => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  }, [fileUrl, fileName]);

  // Для on-drop внутри уже открытого viewer можно принять новый файл через workspace store.
  // Сейчас — no-op, чтобы не перезагружать страницу.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileDrop = useCallback((_file: File) => {
    /* integration hook: delegate to workspace store if needed */
  }, []);

  // Mock mode
  if (mock || !fileUrl) {
    return (
      <DragDropOverlay onFileDrop={handleFileDrop}>
        <Toolbar
          fileName={fileName}
          fileType="pdf"
          showZoom
          zoom={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          showPagination
          currentPage={1}
          totalPages={5}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onPageChange={handlePageChange}
          onDownload={handleDownload}
        />
        <div className={styles.content}>
          <MockViewerBase title={fileName} type={config.label} bgColor={config.bgColor} accentColor={config.accentColor} fileUrl={fileUrl}>
            <div className={styles.pdfContainer}>
              <div className={styles.pdfPage} style={{ width: '595px', height: '842px', padding: '40px', display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>{fileName}</h1>
                <div style={{ flex: 1 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ height: '12px', background: '#e5e5e5', marginBottom: '8px', borderRadius: '2px', width: `${100 - (i % 3) * 15}%` }} />
                  ))}
                  <div style={{ height: '150px', background: '#f5f5f5', margin: '20px 0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Изображение</div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ height: '12px', background: '#e5e5e5', marginBottom: '8px', borderRadius: '2px', width: `${90 - i * 10}%` }} />
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: 'auto' }}>Стр. 1 из ~5</div>
              </div>
            </div>
          </MockViewerBase>
        </div>
      </DragDropOverlay>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <MockViewerBase title={fileName} type={config.label} bgColor={config.bgColor} accentColor={config.accentColor} fileUrl={fileUrl}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span style={{ marginLeft: '12px' }}>Загрузка PDF...</span>
        </div>
      </MockViewerBase>
    );
  }

  // Error state
  if (error) {
    return (
      <MockViewerBase title={fileName} type={config.label} bgColor={config.bgColor} accentColor={config.accentColor} fileUrl={fileUrl}>
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--error)', marginBottom: '12px' }}>Ошибка: {error}</p>
          {fileUrl && (
            <a href={fileUrl} download={fileName} style={{ background: 'var(--accent-engineering)', color: 'var(--text-inverse)', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none' }}>Скачать файл</a>
          )}
        </div>
      </MockViewerBase>
    );
  }

  // Real PDF rendering
  const currentPageData = renderedPages.get(currentPage);

  return (
    <DragDropOverlay onFileDrop={handleFileDrop}>
      <Toolbar
        fileName={fileName}
        fileType="pdf"
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
        onDownload={handleDownload}
      />
      <div ref={containerRef} className={styles.content} style={{ backgroundColor: '#525659' }}>
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
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', objectFit: 'contain' }}
          />
        ) : (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span style={{ marginLeft: '12px' }}>Рендеринг...</span>
          </div>
        )}
      </div>
    </DragDropOverlay>
  );
};

export default PDFViewer;
