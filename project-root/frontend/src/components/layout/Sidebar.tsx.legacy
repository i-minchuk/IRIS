import { useState } from 'react';
import type { ReactNode } from 'react';

interface SidebarItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface SidebarProps {
  title?: string;
  items?: SidebarItem[];
}

export default function Sidebar({ title = 'Навигация', items = [] }: SidebarProps) {
  const [activeKey, setActiveKey] = useState(items[0]?.key ?? '');

  return (
    <aside
      className="w-full rounded-xl border p-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h2>

      <nav className="space-y-1">
        {items.map((item) => {
          const active = item.key === activeKey;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm"
              style={{
                backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {item.icon ? <span>{item.icon}</span> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}