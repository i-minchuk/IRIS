import React from 'react';
import type { ToolbarProps } from './Toolbar';
import { Toolbar } from './Toolbar';
import { DragDropOverlay } from './DragDropOverlay';
import styles from './viewer.module.css';

interface ViewerShellProps extends ToolbarProps {
  file?: File;
  fileUrl?: string;
  onFileDrop?: (file: File) => void;
  loading?: boolean;
  error?: string | null;
  loadingText?: string;
  errorActions?: React.ReactNode;
  footerText?: string;
  children: React.ReactNode;
}

/**
 * ViewerShell — единая обёртка для всех viewer-компонентов.
 *
 * Обеспечивает:
 * - единый Toolbar (название, тип, зум, навигация, скачивание, кастомные действия);
 * - Drag-and-drop поверх всего viewer;
 * - состояния загрузки и ошибки;
 * - footer с режимом просмотра.
 */
export const ViewerShell: React.FC<ViewerShellProps> = ({
  file,
  fileUrl,
  onFileDrop,
  loading = false,
  error = null,
  loadingText = 'Загрузка...',
  errorActions,
  footerText,
  children,
  ...toolbarProps
}) => {
  const hasSource = Boolean(fileUrl || file);
  const resolvedFooterText =
    footerText ?? (hasSource ? 'Режим просмотра' : 'Демо-режим');

  return (
    <div className={styles.viewer}>
      <Toolbar {...toolbarProps} />

      <DragDropOverlay onFileDrop={onFileDrop}>
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span style={{ marginLeft: '12px' }}>{loadingText}</span>
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <p style={{ color: 'var(--error)', marginBottom: '12px' }}>
                {error}
              </p>
              {errorActions}
            </div>
          ) : (
            children
          )}
        </div>
      </DragDropOverlay>

      <div className={styles.footer}>
        {resolvedFooterText} • {toolbarProps.fileType.toUpperCase()}
      </div>
    </div>
  );
};

export default ViewerShell;
