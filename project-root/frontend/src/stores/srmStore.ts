import { create } from 'zustand';
import type {
  Supplier, PurchaseRequest, Contract, PurchaseOrder, Invoice,
  SupplierStatus, PurchaseRequestStatus, ContractStatus, OrderStatus, InvoiceStatus
} from '@/types/srm';
import { mockSuppliers, mockPurchaseRequests, mockContracts, mockOrders, mockInvoices } from '@/api/mocks/srm';

interface SRMState {
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  contracts: Contract[];
  orders: PurchaseOrder[];
  invoices: Invoice[];

  // Supplier actions
  getSuppliersByStatus: (status: SupplierStatus) => Supplier[];
  getSuppliersByCategory: (category: string) => Supplier[];
  getActiveSuppliers: () => Supplier[];
  getTopSuppliers: (limit: number) => Supplier[];

  // Purchase request actions
  getRequestsByStatus: (status: PurchaseRequestStatus) => PurchaseRequest[];
  getRequestsByProject: (projectId: number) => PurchaseRequest[];

  // Contract actions
  getContractsByStatus: (status: ContractStatus) => Contract[];
  getActiveContracts: () => Contract[];

  // Order actions
  getOrdersByStatus: (status: OrderStatus) => PurchaseOrder[];

  // Invoice actions
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getOverdueInvoices: () => Invoice[];
  getTotalPayable: () => number;

  // Stats
  getSRMStats: () => {
    totalSuppliers: number;
    activeSuppliers: number;
    totalContracts: number;
    activeContracts: number;
    totalOrders: number;
    totalInvoices: number;
    overdueInvoices: number;
    totalPayable: number;
  };
}

export const useSRMStore = create<SRMState>((_set, get) => ({
  suppliers: mockSuppliers,
  purchaseRequests: mockPurchaseRequests,
  contracts: mockContracts,
  orders: mockOrders,
  invoices: mockInvoices,

  getSuppliersByStatus: (status) => get().suppliers.filter(s => s.status === status),
  getSuppliersByCategory: (category) => get().suppliers.filter(s => s.category === category),
  getActiveSuppliers: () => get().suppliers.filter(s => s.status === 'active'),
  getTopSuppliers: (limit) => [...get().suppliers]
    .filter(s => s.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit),

  getRequestsByStatus: (status) => get().purchaseRequests.filter(r => r.status === status),
  getRequestsByProject: (projectId) => get().purchaseRequests.filter(r => r.project_id === projectId),

  getContractsByStatus: (status) => get().contracts.filter(c => c.status === status),
  getActiveContracts: () => get().contracts.filter(c => c.status === 'active'),

  getOrdersByStatus: (status) => get().orders.filter(o => o.status === status),

  getInvoicesByStatus: (status) => get().invoices.filter(i => i.status === status),
  getOverdueInvoices: () => get().invoices.filter(i => i.status === 'overdue'),
  getTotalPayable: () => get().invoices
    .filter(i => ['received', 'verified', 'approved', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + i.amount, 0),

  getSRMStats: () => {
    const state = get();
    return {
      totalSuppliers: state.suppliers.length,
      activeSuppliers: state.suppliers.filter(s => s.status === 'active').length,
      totalContracts: state.contracts.length,
      activeContracts: state.contracts.filter(c => c.status === 'active').length,
      totalOrders: state.orders.length,
      totalInvoices: state.invoices.length,
      overdueInvoices: state.invoices.filter(i => i.status === 'overdue').length,
      totalPayable: state.getTotalPayable(),
    };
  },
}));
