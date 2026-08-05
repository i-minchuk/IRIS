import React, { useCallback } from 'react';
import type { ViewerProps } from './types';
import { ViewerShell } from './ViewerShell';
import styles from './viewer.module.css';

export const DWGViewer: React.FC<ViewerProps> = ({
  file,
  fileUrl,
  fileName,
  mock: _mock = false,
}) => {
  const hasSource = Boolean(file || fileUrl);

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

  return (
    <ViewerShell
      file={file}
      fileUrl={fileUrl}
      fileName={fileName}
      fileType="dwg"
      onFileDrop={handleFileDrop}
      onDownload={hasSource ? handleDownload : undefined}
    >
      <div className={styles.dwgContainer}>
        {/* CAD placeholder */}
        <div className={styles.dwgPlaceholder}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--warning)' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <polyline points="21 15 16 10 5 21" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <p className={styles.dwgMessage}>CAD-формат требует специализированного просмотрщика</p>

        <div className={styles.dwgActions}>
          {hasSource && (
            <button
              type="button"
              onClick={handleDownload}
              className={`${styles.dwgBtn} ${styles.dwgBtnPrimary}`}
            >
              Скачать файл
            </button>
          )}
          <a
            href="https://viewer.autodesk.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.dwgBtn} ${styles.dwgBtnSecondary}`}
          >
            Autodesk Viewer
          </a>
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '12px',
            background: 'var(--bg-surface-2)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            maxWidth: '400px',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Для просмотра DWG:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '16px' }}>
            <li>AutoCAD или AutoCAD Web</li>
            <li>Autodesk Forge Viewer (онлайн)</li>
            <li>LibreCAD (бесплатный)</li>
            <li>QCAD</li>
          </ul>
        </div>
      </div>
    </ViewerShell>
  );
};

export default DWGViewer;
