import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageTabs } from '@/shared/components/PageTabs';
import { Search, Plus, BookOpen, Hammer, FileCheck, Library, Phone } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import GlossaryPanel from './ReferencePage/GlossaryPanel';
import ContactsPage from '@/pages/ContactsPage';

interface ReferenceItem {
  id: string;
  name: string;
  code?: string;
  unit?: string;
  category?: string;
}

type TabKey = 'materials' | 'constructions' | 'standards' | 'glossary' | 'contacts';

const TABS = [
  { key: 'materials' as TabKey, label: 'Материалы', icon: <BookOpen size={16} />, color: '#14B8A6' },
  { key: 'constructions' as TabKey, label: 'Конструкции', icon: <Hammer size={16} />, color: '#14B8A6' },
  { key: 'standards' as TabKey, label: 'Нормативы', icon: <FileCheck size={16} />, color: '#14B8A6' },
  { key: 'glossary' as TabKey, label: 'Глоссарий терминов', icon: <Library size={16} />, color: '#14B8A6' },
  { key: 'contacts' as TabKey, label: 'Контакты', icon: <Phone size={16} />, color: '#14B8A6' },
];

export default function ReferencePage() {
  const [activeTab, setActiveTab] = useTabState<TabKey>('iris_reference_tab', 'materials');
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Deep link: ?tab=contacts (пункт меню «Справочники» открывает нужную вкладку)
  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey | null;
    if (tab && TABS.some((t) => t.key === tab)) {
      setActiveTab(tab);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setActiveTab, setSearchParams]);

  // Backend-источника для справочников материалов/конструкций/нормативов нет — показываем пустое состояние
  const currentData = useMemo<ReferenceItem[]>(() => [], []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return currentData;
    const q = searchQuery.toLowerCase();
    return currentData.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.code?.toLowerCase().includes(q) ?? false)
    );
  }, [currentData, searchQuery]);

  return (
    <div className="w-full pt-2 pb-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
            Справочники
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Материалы, конструкции, нормативы, термины и контакты сотрудников
          </p>
        </div>
        {activeTab !== 'contacts' && (
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Добавить
          </Button>
        )}
      </div>

      <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} color="#14B8A6" />

      {/* Content */}
      {activeTab === 'contacts' ? (
        <ContactsPage />
      ) : activeTab === 'glossary' ? (
        <GlossaryPanel />
      ) : (
        <>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg max-w-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или коду..."
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border-default)' }}>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                      Код
                    </th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                      Наименование
                    </th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                      Категория
                    </th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                      Ед. изм.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        {searchQuery.trim() ? 'Ничего не найдено' : 'Справочник пуст'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid var(--iris-border-subtle)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--iris-bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {item.code || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {item.category || '—'}
                        </td>
                        <td className="px-4 py-3 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {item.unit || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
