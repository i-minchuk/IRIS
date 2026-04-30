// src/pages/PortfolioPage/components/StatusBadge/index.tsx
import React from 'react';
import { DocumentStatus } from '../../types/portfolio';
import { DOCUMENT_STATUS_COLORS } from '../../constants/statusColors';

interface StatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const colors = DOCUMENT_STATUS_COLORS[status];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        opacity: colors.opacity,
      }}
      title={colors.label}
    >
      {colors.label}
    </span>
  );
};
