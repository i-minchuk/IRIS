import React from 'react';
import type { ViewerProps } from './types';
import { VIEWER_CONFIGS } from './types';
import { MockViewerBase } from './MockViewerBase';
import styles from './viewer.module.css';

export const DWGViewer: React.FC<ViewerProps> = ({ fileUrl, fileName, mock: _mock = false }) => {
  const config = VIEWER_CONFIGS.dwg;

  return (
    <MockViewerBase
      title={fileName}
      type={config.label}
      bgColor={config.bgColor}
      accentColor={config.accentColor}
      fileUrl={fileUrl}
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

        <p className={styles.dwgMessage}>
          CAD-формат требует специализированного просмотрщика
        </p>

        <div className={styles.dwgActions}>
          {fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              className={`${styles.dwgBtn} ${styles.dwgBtnPrimary}`}
            >
              Скачать файл
            </a>
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
    </MockViewerBase>
  );
};

export default DWGViewer;
