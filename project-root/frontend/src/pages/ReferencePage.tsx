import { useState, useMemo } from 'react';
import { Search, Plus, BookOpen, Hammer, FileCheck } from 'lucide-react';
import { Button, Card } from '@/components/ui';

interface ReferenceItem {
  id: string;
  name: string;
  code?: string;
  unit?: string;
  category?: string;
}

const MATERIALS: ReferenceItem[] = [
  { id: 'm1', name: 'Бетон В25', code: 'Б-25', unit: 'м³', category: 'Бетоны' },
  { id: 'm2', name: 'Арматура А500С Ø12', code: 'А500С-12', unit: 'п.м.', category: 'Арматура' },
  { id: 'm3', name: 'Арматура А500С Ø16', code: 'А500С-16', unit: 'п.м.', category: 'Арматура' },
  { id: 'm4', name: 'Цемент М500', code: 'Ц-М500', unit: 'т', category: 'Вяжущие' },
  { id: 'm5', name: 'Песок строительный', code: 'ПС', unit: 'м³', category: 'Заполнители' },
  { id: 'm6', name: 'Щебень фракции 5-20', code: 'Щ-5/20', unit: 'м³', category: 'Заполнители' },
];

const CONSTRUCTIONS: ReferenceItem[] = [
  { id: 'c1', name: 'Колонна железобетонная прямоугольная', code: 'КЖ-1', unit: 'шт', category: 'Колонны' },
  { id: 'c2', name: 'Балка железобетонная', code: 'КЖ-2', unit: 'шт', category: 'Балки' },
  { id: 'c3', name: 'Плита перекрытия пустотная', code: 'ПП-1', unit: 'шт', category: 'Плиты' },
  { id: 'c4', name: 'Фундамент ленточный', code: 'ФЛ-1', unit: 'м³', category: 'Фундаменты' },
  { id: 'c5', name: 'Свая забивная железобетонная', code: 'СЖ-1', unit: 'шт', category: 'Сваи' },
];

const STANDARDS: ReferenceItem[] = [
  { id: 's1', name: 'СП 70.13330.2012 Несущие и ограждающие конструкции', code: 'СП 70.13330.2012', category: 'СП' },
  { id: 's2', name: 'СНиП 52-01-2003 Бетонные и железобетонные конструкции', code: 'СНиП 52-01-2003', category: 'СНиП' },
  { id: 's3', name: 'ГОСТ 27751-2014 Надёжность строительных конструкций', code: 'ГОСТ 27751-2014', category: 'ГОСТ' },
  { id: 's4', name: 'СП 16.13330.2017 Стальные конструкции', code: 'СП 16.13330.2017', category: 'СП' },
  { id: 's5', name: 'ГОСТ 23118-99 Строительные конструкции из стали', code: 'ГОСТ 23118-99', category: 'ГОСТ' },
];

type TabKey = 'materials' | 'constructions' | 'standards';

const TABS: { key: TabKey; label: string; icon: React.ElementType; data: ReferenceItem[] }[] = [
  { key: 'materials', label: 'Материалы', icon: BookOpen, data: MATERIALS },
  { key: 'constructions', label: 'Конструкции', icon: Hammer, data: CONSTRUCTIONS },
  { key: 'standards', label: 'Нормативы', icon: FileCheck, data: STANDARDS },
];

const TAB_COLOR = '#14B8A6';

export default function ReferencePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('materials');
  const [searchQuery, setSearchQuery] = useState('');

  const currentData = useMemo(
    () => TABS.find((t) => t.key === activeTab)?.data ?? [],
    [activeTab]
  );

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
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen size={22} style={{ color: TAB_COLOR }} />
          <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>
            Справочники
          </h1>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />}>
          Добавить
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery('');
              }}
              className="relative px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
              style={{
                color: isActive ? TAB_COLOR : 'var(--text-secondary)',
                backgroundColor: isActive ? `${TAB_COLOR}26` : 'transparent',
              }}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full"
                  style={{ backgroundColor: TAB_COLOR, boxShadow: `0 0 8px ${TAB_COLOR}` }}
                />
              )}
            </button>
          );
        })}
      </div>

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
                    Ничего не найдено
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
    </div>
  );
}
