import type { ReactNode } from 'react';

export interface PageTab<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface PageTabsProps<T extends string> {
  tabs: PageTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  color?: string;
}

/**
 * Единый компонент таб-навигации для страниц.
 *
 * @example
 * <PageTabs
 *   tabs={[
 *     { key: 'registry', label: 'Реестр', icon: <FileText size={16} /> },
 *     { key: 'workflow', label: 'Согласования', icon: <ArrowRight size={16} /> },
 *   ]}
 *   active={tab}
 *   onChange={setTab}
 *   color="#4F7A4C"
 * />
 */
export function PageTabs<T extends string>({ tabs, active, onChange, color = '#4F7A4C' }: PageTabsProps<T>) {
  return (
    <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-divider)' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const label = tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
            style={{
              color: isActive ? color : 'var(--text-secondary)',
              backgroundColor: isActive ? `${color}26` : 'transparent',
            }}
          >
            {tab.icon}
            {label}
            {isActive && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
