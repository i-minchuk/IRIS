import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Gavel, ShoppingCart, FolderKanban, PackageOpen,
} from 'lucide-react';
// Card removed — unused

/* ─── Lazy tab contents ─── */
import TendersPage from '@/pages/TendersPage';
import SuppliersPage from '@/pages/srm/Suppliers';
import PurchaseRequestsPage from '@/pages/srm/PurchaseRequests';
import ContractsPage from '@/pages/srm/Contracts';
import OrdersPage from '@/pages/srm/Orders';
import InvoicesPage from '@/pages/srm/Invoices';
import ProjectPortfolioPage from '@/pages/ProjectPortfolioPage';
import PackagePage from '@/pages/PackagePage';

/* ─── SRM Sub-tabs ─── */
const SRM_TABS = [
  { id: 'suppliers', label: 'Поставщики' },
  { id: 'purchase-requests', label: 'Заявки на закупку' },
  { id: 'contracts', label: 'Договоры' },
  { id: 'orders', label: 'Заказы' },
  { id: 'invoices', label: 'Счета' },
];

/* ─── Main tabs ─── */
const MAIN_TABS = [
  { id: 'tenders' as const, label: 'Тендеры', icon: <Gavel size={16} /> },
  { id: 'srm' as const, label: 'SRM / Закупки', icon: <ShoppingCart size={16} /> },
  { id: 'projects' as const, label: 'Портфель проектов', icon: <FolderKanban size={16} /> },
  { id: 'package' as const, label: 'Пакет документации', icon: <PackageOpen size={16} /> },
];

type MainTab = 'tenders' | 'srm' | 'projects' | 'package';
type SRMTab = 'suppliers' | 'purchase-requests' | 'contracts' | 'orders' | 'invoices';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MainTab>('tenders');
  const [srmTab, setSrmTab] = useState<SRMTab>('suppliers');

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Портфель заказов</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Тендеры, закупки, проекты и документация
          </p>
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 mb-6 border-b pb-1" style={{ borderColor: 'var(--border-default)' }}>
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all"
            style={{
              color: activeTab === tab.id ? 'var(--brand-iris)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-iris)' : '2px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'tenders' && <TendersPage />}

      {activeTab === 'srm' && (
        <div className="space-y-4">
          {/* SRM sub-tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {SRM_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSrmTab(tab.id as SRMTab)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{
                  backgroundColor: srmTab === tab.id ? 'var(--brand-iris)' : 'var(--bg-surface-2)',
                  color: srmTab === tab.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {srmTab === 'suppliers' && <SuppliersPage />}
          {srmTab === 'purchase-requests' && <PurchaseRequestsPage />}
          {srmTab === 'contracts' && <ContractsPage />}
          {srmTab === 'orders' && <OrdersPage />}
          {srmTab === 'invoices' && <InvoicesPage />}
        </div>
      )}

      {activeTab === 'projects' && <ProjectPortfolioPage />}

      {activeTab === 'package' && <PackagePage />}
    </div>
  );
}
