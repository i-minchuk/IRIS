import React from 'react';
import type { ViewerProps } from './types';
import { MockViewerBase } from './MockViewerBase';
import styles from './viewer.module.css';

/**
 * UnsupportedViewer - fallback для неподдерживаемых форматов файлов
 */
export const UnsupportedViewer: React.FC<ViewerProps> = ({ fileUrl, fileName }) => {
  return (
    <MockViewerBase
      title={fileName}
      type="Неподдерживаемый"
      bgColor="#f3f4f6"
      accentColor="#6b7280"
      fileUrl={fileUrl}
    >
      <div className={styles.unsupportedContainer}>
        {/* Icon */}
        <div className={styles.unsupportedIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-tertiary)' }}>
            <path
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className={styles.unsupportedMessage}>
          Этот формат файла не поддерживается для предпросмотра
        </p>

        <div className={styles.unsupportedActions}>
          {fileUrl && (
            <a
              href={fileUrl}
              download={fileName}
              className={styles.unsupportedBtnPrimary}
            >
              Скачать файл
            </a>
          )}
        </div>

        <div className={styles.unsupportedInfo}>
          <strong>Поддерживаемые форматы:</strong>
          <ul>
            <li>PDF (.pdf)</li>
            <li>Изображения (.png, .jpg, .jpeg, .gif, .svg, .webp)</li>
            <li>Excel (.xlsx, .xls)</li>
            <li>Word (.docx, .doc)</li>
            <li>CSV (.csv)</li>
          </ul>
        </div>
      </div>
    </MockViewerBase>
  );
};

export default UnsupportedViewer;