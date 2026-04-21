import React, { lazy, Suspense } from 'react';
import { detectType, type ViewerType } from './types';

// Lazy load viewers
const PDFViewer = lazy(() => import('./PDFViewer').then(m => ({ default: m.PDFViewer })));
const ImageViewer = lazy(() => import('./ImageViewer').then(m => ({ default: m.ImageViewer })));
const ExcelViewer = lazy(() => import('./ExcelViewer').then(m => ({ default: m.ExcelViewer })));
const WordViewer = lazy(() => import('./WordViewer').then(m => ({ default: m.WordViewer })));
const DWGViewer = lazy(() => import('./DWGViewer').then(m => ({ default: m.DWGViewer })));
const CSVViewer = lazy(() => import('./CSVViewer').then(m => ({ default: m.CSVViewer })));
const UnsupportedViewer = lazy(() => import('./UnsupportedViewer').then(m => ({ default: m.UnsupportedViewer })));

interface LegacyProps {
  file?: File;
}

interface NewProps {
  fileName?: string;
  fileUrl?: string;
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
export const ViewerContainer: React.FC<LegacyProps | NewProps> = (props) => {
  // Detect if using legacy or new props
  const isLegacy = 'file' in props && props.file;

  let fileUrl: string | undefined;
  let fileName: string;
  let mock: boolean;
  let type: ViewerType;

  if (isLegacy) {
    // Legacy mode: file object
    const file = (props as LegacyProps).file;
    fileUrl = file ? URL.createObjectURL(file) : undefined;
    fileName = file?.name || 'Документ';
    mock = !file;
    type = detectType(fileName);
  } else {
    // New mode: fileUrl, fileName, mock
    const newProps = props as NewProps;
    fileUrl = newProps.fileUrl;
    fileName = newProps.fileName || 'Документ';
    mock = newProps.mock ?? !fileUrl;
    type = detectType(fileName);
  }

  return (
    <Suspense fallback={<ViewerLoader />}>
      {type === 'pdf' && <PDFViewer fileUrl={fileUrl} fileName={fileName} mock={mock} />}
      {type === 'image' && <ImageViewer fileUrl={fileUrl} fileName={fileName} mock={mock} />}
      {type === 'excel' && <ExcelViewer fileUrl={fileUrl} fileName={fileName} mock={mock} />}
      {type === 'word' && <WordViewer fileUrl={fileUrl} fileName={fileName} mock={mock} />}
      {type === 'dwg' && <DWGViewer fileUrl={fileUrl} fileName={fileName} mock={mock} />}
      {type === 'csv' && <CSVViewer fileUrl={fileUrl} fileName={fileName} mock={mock} />}
      {type === 'unsupported' && <UnsupportedViewer fileName={fileName} fileUrl={fileUrl} />}
    </Suspense>
  );
};

export default ViewerContainer;
