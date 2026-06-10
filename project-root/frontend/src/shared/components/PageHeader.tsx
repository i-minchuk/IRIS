import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Единый заголовок страницы с подзаголовком и слотом для кнопок.
 *
 * @example
 * <PageHeader
 *   title="Документы и согласования"
 *   subtitle="Управление проектной документацией"
 *   actions={
 *     <>
 *       <button>Создать</button>
 *       <button>Импорт</button>
 *     </>
 *   }
 * />
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
