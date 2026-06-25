import type { ReactNode } from 'react';

export interface PageTab<T extends string> {
  key: T;
  label: string;
  icon?: ReactNode;
  count?: number;
  color?: string;
}

interface PageTabsProps<T extends string> {
  tabs: PageTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  color?: string;
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Единый компонент таб-навигации для страниц.
 * Округлые вкладки с цветной обводкой в активном состоянии.
 *
 * @example
 * <PageTabs
 *   tabs={[
 *     { key: 'registry', label: 'Реестр', icon: <FileText size={16} />, color: '#4F7A4C' },
 *     { key: 'workflow', label: 'Документооборот', icon: <GitBranch size={16} />, color: '#D4AF37' },
 *   ]}
 *   active={tab}
 *   onChange={setTab}
 * />
 */
export function PageTabs<T extends string>({ tabs, active, onChange, color = '#4F7A4C' }: PageTabsProps<T>) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const label = tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label;
        const tabColor = tab.color ?? color;
        const softBg = hexToRgba(tabColor, 0.15);
        const softGlow = hexToRgba(tabColor, 0.25);
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
            style={{
              color: isActive ? tabColor : 'var(--text-secondary)',
              backgroundColor: isActive ? softBg : 'var(--bg-surface-2)',
              border: isActive ? `2px solid ${tabColor}` : '2px solid transparent',
              boxShadow: isActive ? `0 0 8px ${softGlow}` : 'none',
            }}
          >
            {tab.icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}
