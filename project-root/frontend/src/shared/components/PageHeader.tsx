import type { ReactNode } from 'react';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Единый заголовок страницы. Title скрыт визуально (дублирует пункт меню),
 * subtitle отображается крупным шрифтом как основной описательный текст.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        {title && <h1 className="sr-only">{title}</h1>}
        {subtitle && (
          <p className="text-base md:text-lg font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
