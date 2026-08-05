import React, { lazy, Suspense, useMemo } from 'react';
import { detectType, type ViewerType } from './types';

// Lazy load viewers
const PDFViewer = lazy(() => import('./PDFViewer').then((m) => ({ default: m.PDFViewer })));
const ImageViewer = lazy(() => import('./ImageViewer').then((m) => ({ default: m.ImageViewer })));
const ExcelViewer = lazy(() => import('./ExcelViewer').then((m) => ({ default: m.ExcelViewer })));
const WordViewer = lazy(() => import('./WordViewer').then((m) => ({ default: m.WordViewer })));
const DWGViewer = lazy(() => import('./DWGViewer').then((m) => ({ default: m.DWGViewer })));
const CSVViewer = lazy(() => import('./CSVViewer').then((m) => ({ default: m.CSVViewer })));
const UnsupportedViewer = lazy(() => import('./UnsupportedViewer').then((m) => ({ default: m.UnsupportedViewer })));

interface ViewerContainerProps {
  /** Прямой File-объект — используется при автозагрузке / drag-and-drop */
  file?: File;
  /** URL файла (remote или blob) */
  fileUrl?: string;
  /** Имя файла (если не передан File, обязательно) */
  fileName?: string;
  /** Принудительный демо-режим */
  mock?: boolean;
}

// Loading fallback
const ViewerLoader: React.FC = () => (
  <div
    className="flex-1 flex items-center justify-center"
    style={{ backgroundColor: 'var(--bg-app)' }}
  >
    <div className="text-center">
      <div
        className="w-8 h-8 border-2 border-t-2 rounded-full animate-spin mx-auto mb-2"
        style={{
          borderColor: 'var(--border-default)',
          borderTopColor: 'var(--accent-engineering)',
        }}
      />
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
        Загрузка viewer...
      </p>
    </div>
  </div>
);

// Main ViewerContainer
export const ViewerContainer: React.FC<ViewerContainerProps> = ({
  file,
  fileName: fileNameProp,
  fileUrl: fileUrlProp,
  mock: mockProp,
}) => {
  const fileName = file?.name || fileNameProp || 'Документ';
  const fileUrl = fileUrlProp;
  const mock = mockProp ?? (!fileUrl && !file);
  const type: ViewerType = useMemo(() => detectType(fileName), [fileName]);

  return (
    <Suspense fallback={<ViewerLoader />}>
      {type === 'pdf' && (
        <PDFViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />
      )}
      {type === 'image' && (
        <ImageViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />
      )}
      {type === 'excel' && (
        <ExcelViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />
      )}
      {type === 'word' && (
        <WordViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />
      )}
      {type === 'dwg' && (
        <DWGViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />
      )}
      {type === 'csv' && (
        <CSVViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />
      )}
      {type === 'unsupported' && (
        <UnsupportedViewer file={file} fileUrl={fileUrl} fileName={fileName} mock={mock} />
      )}
    </Suspense>
  );
};

export default ViewerContainer;
