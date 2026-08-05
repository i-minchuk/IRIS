import React, { useState, useEffect, useCallback } from 'react';
import type { ViewerProps } from './types';
import { ViewerShell } from './ViewerShell';
import styles from './viewer.module.css';

export const ImageViewer: React.FC<ViewerProps> = ({
  file,
  fileUrl,
  fileName,
  mock = false,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const hasSource = Boolean(file || fileUrl);

  useEffect(() => {
    if (mock || !hasSource) return;

    setIsLoading(true);
    setError(null);

    let objectUrl: string | undefined;
    const img = new Image();
    img.onload = () => {
      setImageUrl(objectUrl || fileUrl!);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError('Не удалось загрузить изображение');
      setIsLoading(false);
    };

    if (file) {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } else {
      img.src = fileUrl!;
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, fileUrl, mock, hasSource]);

  const handleZoomIn = useCallback(() => setScale((s) => Math.min(s + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setScale((s) => Math.max(s - 0.25, 0.25)), []);
  const handleZoomReset = useCallback(() => setScale(1), []);

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
      Скачать файл
    </button>
  ) : null;

  return (
    <ViewerShell
      file={file}
      fileUrl={fileUrl}
      fileName={fileName}
      fileType="image"
      onFileDrop={handleFileDrop}
      onDownload={handleDownload}
      loading={isLoading}
      error={error}
      loadingText="Загрузка изображения..."
      errorActions={errorActions}
      showZoom
      zoom={scale}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onZoomReset={handleZoomReset}
    >
      {mock || !hasSource ? (
        <div className={styles.imageContainer}>
          <div
            style={{
              width: '300px',
              height: '200px',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
            }}
          >
            🖼️
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{fileName}</p>
        </div>
      ) : (
        <div className={styles.imageContainer} style={{ backgroundColor: '#1a1a1a' }}>
          <img
            src={imageUrl}
            alt={fileName}
            style={{ maxWidth: `${scale * 100}%`, maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      )}
    </ViewerShell>
  );
};

export default ImageViewer;
