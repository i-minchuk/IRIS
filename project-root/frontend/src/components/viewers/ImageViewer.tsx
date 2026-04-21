import React, { useState, useEffect, useCallback } from 'react';
import type { ViewerProps } from './types';
import { VIEWER_CONFIGS } from './types';
import { MockViewerBase } from './MockViewerBase';
import { Toolbar } from './Toolbar';
import { DragDropOverlay } from './DragDropOverlay';
import styles from './viewer.module.css';

export const ImageViewer: React.FC<ViewerProps> = ({ fileUrl, fileName, mock = false }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const config = VIEWER_CONFIGS.image;

  useEffect(() => {
    if (!fileUrl || mock) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
      setImageUrl(fileUrl);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError('Не удалось загрузить изображение');
      setIsLoading(false);
    };
    img.src = fileUrl;
  }, [fileUrl, mock]);

  const handleZoomIn = useCallback(() => setScale(s => Math.min(s + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setScale(s => Math.max(s - 0.25, 0.25)), []);
  const handleZoomReset = useCallback(() => setScale(1), []);

  const handleDownload = useCallback(() => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  }, [fileUrl, fileName]);

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
          fileType="image"
          showZoom
          zoom={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onDownload={handleDownload}
        />
        <div className={styles.content}>
          <MockViewerBase title={fileName} type={config.label} bgColor={config.bgColor} accentColor={config.accentColor} fileUrl={fileUrl}>
            <div className={styles.imageContainer}>
              <div style={{ width: '300px', height: '200px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🖼️</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{fileName}</p>
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
          <span style={{ marginLeft: '12px' }}>Загрузка изображения...</span>
        </div>
      </MockViewerBase>
    );
  }

  // Error state
  if (error) {
    return (
      <MockViewerBase title={fileName} type={config.label} bgColor={config.bgColor} accentColor={config.accentColor} fileUrl={fileUrl}>
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--error)' }}>{error}</p>
          <a href={fileUrl} download={fileName} style={{ background: 'var(--accent-engineering)', color: 'var(--text-inverse)', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', marginTop: '12px', display: 'inline-block' }}>Скачать</a>
        </div>
      </MockViewerBase>
    );
  }

  // Real image rendering
  return (
    <DragDropOverlay onFileDrop={handleFileDrop}>
      <Toolbar
        fileName={fileName}
        fileType="image"
        showZoom
        zoom={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onDownload={handleDownload}
      />
      <div className={styles.content} style={{ backgroundColor: '#1a1a1a' }}>
        <div className={styles.imageContainer}>
          <img src={imageUrl} alt={fileName} style={{ maxWidth: `${scale * 100}%`, maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      </div>
    </DragDropOverlay>
  );
};

export default ImageViewer;
