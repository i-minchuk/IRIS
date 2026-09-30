import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageTabs } from '@/shared/components/PageTabs';
import { FileCheck, Library, Phone } from 'lucide-react';
import GlossaryPanel from './ReferencePage/GlossaryPanel';
import StandardsPanel from './ReferencePage/StandardsPanel';
import ContactsPage from '@/pages/ContactsPage';

type TabKey = 'standards' | 'glossary' | 'contacts';

const TABS = [
  { key: 'contacts' as TabKey, label: 'Контакты', icon: <Phone size={16} />, color: '#14B8A6' },
  { key: 'standards' as TabKey, label: 'Нормативы', icon: <FileCheck size={16} />, color: '#14B8A6' },
  { key: 'glossary' as TabKey, label: 'Глоссарий терминов', icon: <Library size={16} />, color: '#14B8A6' },
];

export default function ReferencePage() {
  const [activeTab, setActiveTab] = useTabState<TabKey>('iris_reference_tab', 'standards');
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep link: ?tab=contacts (пункт меню «Справочники» открывает нужную вкладку)
  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey | null;
    if (tab && TABS.some((t) => t.key === tab)) {
      setActiveTab(tab);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setActiveTab, setSearchParams]);

  return (
    <div className="w-full pt-2 pb-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>
            Справочники
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Нормативы, термины и контакты сотрудников
          </p>
        </div>
      </div>

      <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} color="#14B8A6" />

      {/* Content */}
      {activeTab === 'contacts' && <ContactsPage />}
      {activeTab === 'glossary' && <GlossaryPanel />}
      {activeTab === 'standards' && <StandardsPanel />}
    </div>
  );
}
