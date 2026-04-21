import React, { useState } from 'react';

interface TabProps {
  label: string;
  icon?: React.ElementType;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabProps[];
  initialTab?: string;
}

export default function Tabs({ tabs, initialTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(
    initialTab || (tabs.length > 0 ? tabs[0].label : '')
  );

  return (
    <div className="w-full">
      <div
        className="border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <nav
          className="-mb-px flex flex-wrap gap-2 px-6 pt-2"
          aria-label="Tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;

            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                type="button"
                className="inline-flex items-center gap-2 rounded-t-xl border px-4 py-3 text-sm font-medium transition-all duration-150"
                style={{
                  borderColor: isActive
                    ? 'color-mix(in srgb, var(--brand-iris) 45%, var(--border-default))'
                    : 'transparent',
                  background: isActive
                    ? 'linear-gradient(180deg, color-mix(in srgb, var(--brand-iris) 14%, var(--bg-surface-2)), var(--bg-surface))'
                    : 'transparent',
                  color: isActive ? 'var(--brand-iris)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'inset 0 -2px 0 var(--brand-iris)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-2)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon ? <tab.icon size={16} /> : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="py-6">
        {tabs.find((tab) => tab.label === activeTab)?.content}
      </div>
    </div>
  );
}