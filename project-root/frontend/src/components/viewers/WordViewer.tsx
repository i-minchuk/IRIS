import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import type { ViewerProps } from './types';
import { VIEWER_CONFIGS } from './types';
import { MockViewerBase } from './MockViewerBase';
import styles from './viewer.module.css';

export const WordViewer: React.FC<ViewerProps> = ({ fileUrl, fileName, mock = false }) => {
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = VIEWER_CONFIGS.word;

  useEffect(() => {
    if (!fileUrl || mock) return;

    setIsLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => {
        setHtml(result.value);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [fileUrl, mock]);

  // Mock mode
  if (mock || !fileUrl) {
    return (
      <MockViewerBase
        title={fileName}
        type={config.label}
        bgColor={config.bgColor}
        accentColor={config.accentColor}
        fileUrl={fileUrl}
      >
        <div className={styles.wordContainer}>
          <div className={styles.wordContent}>
            <h1>{fileName}</h1>
            
            <h2>Введение</h2>
            <p>
              Это демонстрационный текст Word-документа. Здесь может быть описание проекта,
              техническая спецификация или любая другая документация.
            </p>
            
            <h2>Основные требования</h2>
            <p>
              Документ содержит основные разделы и требования к проекту.
            </p>
            <ul>
              <li>Пункт списка 1 - описание требования</li>
              <li>Пункт списка 2 - описание требования</li>
              <li>Пункт списка 3 - описание требования</li>
            </ul>

            <h2>Заключение</h2>
            <p>
              Документ подготовлен для согласования и утверждения.
            </p>
          </div>
        </div>
      </MockViewerBase>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <MockViewerBase
        title={fileName}
        type={config.label}
        bgColor={config.bgColor}
        accentColor={config.accentColor}
        fileUrl={fileUrl}
      >
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span style={{ marginLeft: '12px' }}>Загрузка Word...</span>
        </div>
      </MockViewerBase>
    );
  }

  // Error state
  if (error) {
    return (
      <MockViewerBase
        title={fileName}
        type={config.label}
        bgColor={config.bgColor}
        accentColor={config.accentColor}
        fileUrl={fileUrl}
      >
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Не удалось загрузить документ напрямую.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            Для просмотра используйте: Microsoft Word, Google Docs или Office Online.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href={fileUrl}
              download={fileName}
              style={{
                background: 'var(--accent-engineering)',
                color: 'var(--text-inverse)',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Скачать
            </a>
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
          </div>
        </div>
      </MockViewerBase>
    );
  }

  // Real Word rendering
  return (
    <MockViewerBase
      title={fileName}
      type={config.label}
      bgColor={config.bgColor}
      accentColor={config.accentColor}
      fileUrl={fileUrl}
    >
      <div className={styles.wordContainer}>
        <div className={styles.wordContent} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </MockViewerBase>
  );
};

export default WordViewer;
