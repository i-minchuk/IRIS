import React from 'react';
import styles from './viewer.module.css';

interface Props {
  title: string;
  type: string;
  bgColor: string;
  accentColor?: string;
  children?: React.ReactNode;
  fileUrl?: string;
}

export const MockViewerBase: React.FC<Props> = ({
  title,
  type,
  bgColor,
  accentColor = '#6b7280',
  children,
  fileUrl,
}) => {
  return (
    <div className={styles.viewer} style={{ background: bgColor }}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>{title}</span>
        <span className={styles.toolbarType} style={{ backgroundColor: accentColor }}>
          {type}
        </span>
      </div>

      {/* Content */}
      <div className={styles.content}>{children}</div>

      {/* Footer */}
      <div className={styles.footer}>
        {fileUrl ? 'Режим просмотра' : 'Демо-режим'} • {type}
      </div>
    </div>
  );
};
