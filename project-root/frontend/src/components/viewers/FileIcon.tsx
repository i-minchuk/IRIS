import { useMemo } from 'react';

interface FileIconProps {
  fileName: string;
  size?: number;
}

/**
 * FileIcon - иконка файла на основе расширения
 */
export function FileIcon({ fileName, size = 20 }: FileIconProps) {
  const extension = useMemo(() => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }, [fileName]);

  const color = useMemo(() => {
    switch (extension) {
      case 'pdf':
        return '#dc2626';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return '#16a34a';
      case 'doc':
      case 'docx':
        return '#18559B';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'svg':
      case 'tiff':
      case 'gif':
        return '#7c3aed';
      case 'dwg':
      case 'dxf':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }, [extension]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: color }}
    >
      <path
        d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14 2V8H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {extension && (
        <text
          x="12"
          y="17"
          textAnchor="middle"
          fontSize="5"
          fontWeight="bold"
          fill="currentColor"
        >
          {extension.toUpperCase().slice(0, 3)}
        </text>
      )}
    </svg>
  );
}
