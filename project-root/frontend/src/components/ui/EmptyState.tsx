import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={48} style={{ color: 'var(--iris-border-subtle)' }} className="mb-4" />
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </p>
      {description && (
        <p className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
