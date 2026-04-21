import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Компонент навигационной цепочки (хлебные крошки)
 * Показывает путь пользователя по каскаду: Проекты → Документы → Документ → Замечания
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6" aria-label="Навигация">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={item.label} className="flex items-center gap-2">
            {/* Разделитель (не для первого элемента) */}
            {index > 0 && (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            
            {/* Ссылка или текущий элемент */}
            {isLast ? (
              <span className="font-medium text-[var(--text-base)]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href || '#'}
                className="hover:text-[var(--primary)] transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
