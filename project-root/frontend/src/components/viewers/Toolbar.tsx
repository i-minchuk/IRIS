import React from 'react';
import type { ViewerType } from './types';

interface ToolbarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  disabled = false,
  title,
  children,
  variant = 'default',
}) => {
  const baseClasses = 'p-2 rounded-lg transition-all duration-200 flex items-center justify-center';
  const variantClasses = variant === 'primary'
    ? 'bg-accent-engineering text-text-inverse hover:opacity-90'
    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses}`}
      title={title}
    >
      {children}
    </button>
  );
};

interface ToolbarSeparatorProps {
  orientation?: 'vertical' | 'horizontal';
}

export const ToolbarSeparator: React.FC<ToolbarSeparatorProps> = ({ orientation = 'vertical' }) => (
  <div
    className={`bg-border-default ${orientation === 'vertical' ? 'w-px h-6 mx-1' : 'h-px w-full my-2'}`}
  />
);

interface ToolbarProps {
  fileName: string;
  fileType: ViewerType;
  onClose?: () => void;
  onDownload?: () => void;
  
  // Zoom controls (для PDF, Image)
  showZoom?: boolean;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  
  // Pagination (для PDF)
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onPageChange?: (page: number) => void;
  
  // Sheet tabs (для Excel)
  sheets?: string[];
  activeSheet?: string;
  onSheetChange?: (sheet: string) => void;
  
  // Custom actions
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  fileName,
  fileType,
  onClose,
  onDownload,
  showZoom = false,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPrevPage,
  onNextPage,
  onPageChange,
  sheets,
  activeSheet,
  onSheetChange,
  leftActions,
  rightActions,
}) => {
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value, 10);
    if (!isNaN(page) && onPageChange) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-bg-surface shrink-0 sticky top-0 z-10">
      {/* Left section: File info + left actions */}
      <div className="flex items-center gap-2 min-w-0">
        {leftActions}
        
        <span className="text-sm font-medium text-text-primary truncate" title={fileName}>
          {fileName}
        </span>
        
        <span className="text-xs px-2 py-0.5 rounded font-medium bg-bg-surface-2 text-text-tertiary uppercase">
          {fileType}
        </span>
      </div>

      {/* Center section: Controls */}
      <div className="flex items-center gap-1">
        {/* Zoom controls */}
        {showZoom && (
          <>
            <ToolbarButton onClick={onZoomOut} disabled={zoom <= 0.5} title="Уменьшить">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </ToolbarButton>
            
            <span className="text-xs font-medium px-2 text-text-primary min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <ToolbarButton onClick={onZoomIn} disabled={zoom >= 3.0} title="Увеличить">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </ToolbarButton>
            
            <ToolbarButton onClick={onZoomReset} title="Сбросить масштаб">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </ToolbarButton>
            
            <ToolbarSeparator />
          </>
        )}

        {/* Pagination controls */}
        {showPagination && (
          <>
            <ToolbarButton onClick={onPrevPage} disabled={currentPage <= 1} title="Предыдущая">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 8 12 15 6" />
              </svg>
            </ToolbarButton>
            
            <div className="flex items-center gap-1 text-xs text-text-primary">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={handlePageInputChange}
                className="w-12 px-1 py-0.5 text-center rounded border border-border-default bg-bg-surface-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-engineering"
              />
              <span className="text-text-tertiary">/ {totalPages}</span>
            </div>
            
            <ToolbarButton onClick={onNextPage} disabled={currentPage >= totalPages} title="Следующая">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 16 12 9 6" />
              </svg>
            </ToolbarButton>
            
            <ToolbarSeparator />
          </>
        )}

        {/* Sheet tabs */}
        {sheets && sheets.length > 0 && (
          <>
            <div className="flex items-center gap-1">
              {sheets.map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => onSheetChange?.(sheet)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    sheet === activeSheet
                      ? 'bg-accent-engineering text-text-inverse'
                      : 'bg-bg-surface-2 text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {sheet}
                </button>
              ))}
            </div>
            <ToolbarSeparator />
          </>
        )}
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-1">
        {rightActions}
        
        {onDownload && (
          <ToolbarButton onClick={onDownload} title="Скачать">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </ToolbarButton>
        )}
        
        {onClose && (
          <ToolbarButton onClick={onClose} title="Закрыть">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </ToolbarButton>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
