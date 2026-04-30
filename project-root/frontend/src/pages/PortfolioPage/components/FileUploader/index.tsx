// src/pages/PortfolioPage/components/FileUploader/index.tsx
import React, { useCallback, useState } from 'react';

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // в байтах
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUpload,
  acceptedTypes = ['.svg', '.dwg', '.png', '.pdf', '.doc', '.md', '.xlsx', '.xls'],
  maxSize = 50 * 1024 * 1024, // 50MB
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedTypes.includes(extension) && file.size <= maxSize;
      });

      if (files.length > 0) {
        onFileUpload(files);
      }
    },
    [onFileUpload, acceptedTypes, maxSize]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFileUpload(files);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-[#4F7A4C] bg-[#1e293b]'
          : 'border-[#334155] hover:border-[#4F7A4C]'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-[#64748b]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-[#e2e8f0] font-medium mb-1">
          {isDragging ? 'Отпустите файл' : 'Перетащите файлы сюда'}
        </p>
        <p className="text-[#94a3b8] text-sm mb-4">
          или нажмите для выбора
        </p>
        <p className="text-[#64748b] text-xs">
          {acceptedTypes.join(', ')} до {maxSize / (1024 * 1024)}MB
        </p>
      </label>
    </div>
  );
};
