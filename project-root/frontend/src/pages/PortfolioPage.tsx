import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowLeft, Gavel, ShoppingCart, FolderKanban, HardHat, FileText,
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

/* ─── SRM Sub-tabs ─── */
const SRM_TABS = [
  { id: 'suppliers' as const, label: 'Поставщики' },
  { id: 'purchase-requests' as const, label: 'Заявки на закупку' },
  { id: 'contracts' as const, label: 'Договоры' },
  { id: 'orders' as const, label: 'Заказы' },
  { id: 'invoices' as const, label: 'Счета' },
];

/* ─── Main tabs ─── */
// Same violet accent as the "Портфель заказов" nav item in Layout.tsx
const PORTFOLIO_ACCENT = '#7C3AED';
const PORTFOLIO_ACCENT_SOFT = 'rgba(124, 58, 237, 0.15)';
const PORTFOLIO_ACCENT_GLOW = 'rgba(124, 58, 237, 0.13)';
const PORTFOLIO_ICON_GLOW = 'rgba(124, 58, 237, 0.55)';

const MAIN_TABS = [
  { id: 'tenders' as const, label: 'Тендеры', shortLabel: 'Тендеры', icon: <Gavel size={16} /> },
  { id: 'projects' as const, label: 'Проекты', shortLabel: 'Проекты', icon: <FolderKanban size={16} /> },
  { id: 'solutions' as const, label: 'Типовые решения', shortLabel: 'Типовые', icon: <HardHat size={16} /> },
  { id: 'templates' as const, label: 'Шаблоны', shortLabel: 'Шаблоны', icon: <FileText size={16} /> },
  { id: 'srm' as const, label: 'SRM / Закупки', shortLabel: 'SRM', icon: <ShoppingCart size={16} /> },
];

type MainTab = 'tenders' | 'projects' | 'solutions' | 'templates' | 'srm';
type SRMTab = 'suppliers' | 'purchase-requests' | 'contracts' | 'orders' | 'invoices';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useTabState<MainTab>('iris_portfolio_tab', 'tenders');
  const [srmTab, setSrmTab] = useTabState<SRMTab>('iris_portfolio_srm_tab', 'suppliers');

  // Sync with URL query params
  const tabParam = searchParams.get('tab') as MainTab | null;
  const srmTabParam = searchParams.get('srm_tab') as SRMTab | null;

  useEffect(() => {
    if (tabParam && MAIN_TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
    if (srmTabParam && SRM_TABS.some(t => t.id === srmTabParam)) {
      setSrmTab(srmTabParam);
    }
  }, [tabParam, srmTabParam]);

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
          const isActive = activeTab === tab.id;
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
      {activeTab === 'tenders' && <TendersPage />}
      {activeTab === 'projects' && <ProjectsView />}
      {activeTab === 'solutions' && <SolutionsView />}
      {activeTab === 'templates' && <TemplatesView />}

      {activeTab === 'srm' && (
        <div className="space-y-4">
          {/* SRM sub-tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {SRM_TABS.map((tab) => {
              const isSrmActive = srmTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSrmTab(tab.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                  style={{
                    backgroundColor: isSrmActive ? PORTFOLIO_ACCENT_SOFT : 'var(--bg-surface-2)',
                    color: isSrmActive ? PORTFOLIO_ACCENT : 'var(--text-secondary)',
                    border: isSrmActive ? `2px solid ${PORTFOLIO_ACCENT}` : '2px solid transparent',
                    boxShadow: isSrmActive ? `0 0 8px ${PORTFOLIO_ACCENT_GLOW}` : 'none',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          {srmTab === 'suppliers' && <SuppliersPage />}
          {srmTab === 'purchase-requests' && <PurchaseRequestsPage />}
          {srmTab === 'contracts' && <ContractsPage />}
          {srmTab === 'orders' && <OrdersPage />}
          {srmTab === 'invoices' && <InvoicesPage />}
        </div>
      )}
    </div>
  );
}
