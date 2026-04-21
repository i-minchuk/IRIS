import React, { useCallback, useState } from 'react';
import type { DragEvent } from 'react';
import { detectType } from './types';

interface DragDropOverlayProps {
  onFileDrop: (file: File) => void;
  children: React.ReactNode;
  accept?: string[];
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  onFileDrop,
  children,
  // accept зарезервирован для будущей валидации MIME-типов на drop
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'file' | 'invalid'>('file');

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // detectType всегда возвращает известный тип (fallback 'pdf'),
      // поэтому считаем любой drop валидным
      detectType(files[0].name);
      setDragType('file');
    }

    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Проверяем, что уходим действительно с области, а не на дочерний элемент
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
    }
  }, [onFileDrop]);

  return (
    <div
      className="relative w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {/* Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-accent-engineering/10 backdrop-blur-sm border-2 border-dashed border-accent-engineering">
          <div className="text-center p-8 bg-bg-surface rounded-xl shadow-xl">
            {dragType === 'file' ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-engineering/20 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-engineering">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Отпустите файл
                </h3>
                <p className="text-sm text-text-secondary">
                  Файл будет открыт для просмотра
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-error">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Неподдерживаемый формат
                </h3>
                <p className="text-sm text-text-secondary">
                  Пожалуйста, выберите файл PDF, изображения, Excel, Word или CSV
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropOverlay;
