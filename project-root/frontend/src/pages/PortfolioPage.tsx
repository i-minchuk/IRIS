import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowLeft, Gavel, ShoppingCart, FolderKanban, FileSignature,
} from 'lucide-react';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageHeader } from '@/shared/components/PageHeader';

/* ─── Lazy tab contents ─── */
import TendersPage from '@/pages/TendersPage';
import SuppliersPage from '@/pages/srm/Suppliers';
import PurchaseRequestsPage from '@/pages/srm/PurchaseRequests';
import ContractsPage from '@/pages/srm/Contracts';
import OrdersPage from '@/pages/srm/Orders';
import InvoicesPage from '@/pages/srm/Invoices';
import TenderDetailPage from '@/features/tenders/pages/TenderDetailPage';
import { ProjectsView, SolutionsView, TemplatesView } from '@/pages/ProjectsPage';

/* ─── Tender Sub-tabs ─── */
const TENDER_TABS = [
  { id: 'customers' as const, label: 'Заказчики' },
  { id: 'tenders' as const, label: 'Тендеры' },
  { id: 'solutions' as const, label: 'Типовые решения' },
  { id: 'templates' as const, label: 'Шаблоны' },
];

/* ─── SRM Sub-tabs ─── */
const SRM_TABS = [
  { id: 'suppliers' as const, label: 'Поставщики' },
  { id: 'invoices' as const, label: 'Счета' },
  { id: 'purchase-requests' as const, label: 'Заявки на закупку' },
  { id: 'orders' as const, label: 'Заказы' },
];

/* ─── Main tabs ─── */
// Same violet accent as the "Портфель заказов" nav item in Layout.tsx
const PORTFOLIO_ACCENT = '#7C3AED';
const PORTFOLIO_ACCENT_SOFT = 'rgba(124, 58, 237, 0.15)';
const PORTFOLIO_ACCENT_GLOW = 'rgba(124, 58, 237, 0.13)';
const PORTFOLIO_ICON_GLOW = 'rgba(124, 58, 237, 0.55)';

const MAIN_TABS = [
  { id: 'tenders' as const, label: 'Тендеры', shortLabel: 'Тендеры', icon: <Gavel size={16} /> },
  { id: 'contracts' as const, label: 'Договоры', shortLabel: 'Договоры', icon: <FileSignature size={16} /> },
  { id: 'projects' as const, label: 'Проекты', shortLabel: 'Проекты', icon: <FolderKanban size={16} /> },
  { id: 'srm' as const, label: 'Закупка/МТО', shortLabel: 'Закупка', icon: <ShoppingCart size={16} /> },
];

type MainTab = 'tenders' | 'contracts' | 'projects' | 'srm';
type TenderTab = 'tenders' | 'customers' | 'solutions' | 'templates';
type SRMTab = 'suppliers' | 'purchase-requests' | 'orders' | 'invoices';

/** Строка подвкладок — единый стиль для «Тендеров» и «Закупки». */
function SubTabs<T extends string>({ tabs, active, onChange }: {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: isActive ? PORTFOLIO_ACCENT_SOFT : 'var(--bg-surface-2)',
              color: isActive ? PORTFOLIO_ACCENT : 'var(--text-secondary)',
              border: isActive ? `2px solid ${PORTFOLIO_ACCENT}` : '2px solid transparent',
              boxShadow: isActive ? `0 0 8px ${PORTFOLIO_ACCENT_GLOW}` : 'none',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useTabState<MainTab>('iris_portfolio_tab', 'tenders');
  const [tenderTab, setTenderTab] = useTabState<TenderTab>('iris_portfolio_tender_tab', 'tenders');
  const [srmTab, setSrmTab] = useTabState<SRMTab>('iris_portfolio_srm_tab', 'suppliers');
  // Защита от устаревших значений в localStorage (solutions/templates как главные вкладки, srm_tab='contracts')
  const currentTab: MainTab = MAIN_TABS.some(t => t.id === activeTab) ? activeTab : 'tenders';
  const activeTenderTab: TenderTab = TENDER_TABS.some(t => t.id === tenderTab) ? tenderTab : 'tenders';
  const activeSrmTab: SRMTab = SRM_TABS.some(t => t.id === srmTab) ? srmTab : 'suppliers';

  // Sync with URL query params
  const tabParam = searchParams.get('tab');
  const tenderTabParam = searchParams.get('tender_tab') as TenderTab | null;
  const srmTabParam = searchParams.get('srm_tab') as SRMTab | null;

  useEffect(() => {
    // legacy: ?tab=solutions / ?tab=templates переехали в подвкладки «Тендеров»
    if (tabParam === 'solutions' || tabParam === 'templates') {
      setActiveTab('tenders');
      setTenderTab(tabParam);
    } else if (tabParam && MAIN_TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam as MainTab);
    }
    if (tenderTabParam && TENDER_TABS.some(t => t.id === tenderTabParam)) {
      setTenderTab(tenderTabParam);
    }
    if (srmTabParam && SRM_TABS.some(t => t.id === srmTabParam)) {
      setSrmTab(srmTabParam);
    }
  }, [tabParam, tenderTabParam, srmTabParam]);

  // Check if tender detail view is requested via query param
  const tenderId = searchParams.get('tender');

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    // Clear tender detail when switching tabs
    if (tenderId) {
      setSearchParams({});
    }
  };

  // If tender detail is requested, show it
  if (tenderId) {
    return <TenderDetailPage />;
  }

  return (
    <div className="w-full pt-2 pb-6 px-4">
      <PageHeader
        title="Портфель заказов"
        subtitle="Тендеры, закупки, проекты и документация"
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <ArrowLeft size={18} />
          </button>
        }
      />

      {/* IRIS Recommendations */}
      <div className="mb-6">
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 mb-6 border-b pb-1" style={{ borderColor: 'var(--border-default)' }}>
        {MAIN_TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              title={tab.label}
              className="flex items-center gap-2 px-2 lg:px-3 xl:px-4 py-2 text-sm font-medium rounded-t-lg transition-all"
              style={{
                color: isActive ? PORTFOLIO_ACCENT : 'var(--text-secondary)',
                backgroundColor: isActive ? PORTFOLIO_ACCENT_SOFT : 'transparent',
                borderBottom: isActive ? `2px solid ${PORTFOLIO_ACCENT}` : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ color: isActive ? PORTFOLIO_ACCENT : 'var(--text-muted)', filter: isActive ? `drop-shadow(0 0 4px ${PORTFOLIO_ICON_GLOW})` : 'none' }}>
                {tab.icon}
              </span>
              {/* <1024px: только иконка; 1024–1535px: короткая подпись; ≥1536px: полная */}
              <span className="hidden lg:inline-block 2xl:hidden">{tab.shortLabel}</span>
              <span className="hidden 2xl:inline-block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {currentTab === 'tenders' && (
        <div className="space-y-4">
          <SubTabs tabs={TENDER_TABS} active={activeTenderTab} onChange={setTenderTab} />
          {activeTenderTab === 'tenders' && <TendersPage />}
          {activeTenderTab === 'customers' && <SuppliersPage variant="customer" />}
          {activeTenderTab === 'solutions' && <SolutionsView />}
          {activeTenderTab === 'templates' && <TemplatesView />}
        </div>
      )}
      {currentTab === 'contracts' && <ContractsPage />}
      {currentTab === 'projects' && <ProjectsView />}

      {currentTab === 'srm' && (
        <div className="space-y-4">
          <SubTabs tabs={SRM_TABS} active={activeSrmTab} onChange={setSrmTab} />
          {activeSrmTab === 'suppliers' && <SuppliersPage />}
          {activeSrmTab === 'purchase-requests' && <PurchaseRequestsPage />}
          {activeSrmTab === 'orders' && <OrdersPage />}
          {activeSrmTab === 'invoices' && <InvoicesPage />}
        </div>
      )}
    </div>
  );
}
