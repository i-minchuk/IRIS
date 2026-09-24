// SRM / Procurement types

export type SupplierStatus = 'draft' | 'verification' | 'approved' | 'active' | 'suspended' | 'blacklisted' | 'archived';
export type SupplierType = 'manufacturer' | 'distributor' | 'contractor' | 'service_provider' | 'customer';
export type SupplierCategory = 'materials' | 'equipment' | 'services' | 'subcontractors' | 'supply';

export interface Supplier {
  id: number;
  name: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  type: SupplierType;
  category: SupplierCategory;
  status: SupplierStatus;
  rating: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  website?: string;
  verified_by_legal: boolean;
  verified_by_accountant: boolean;
  created_at: string;
  updated_at: string;
}

/** Заказчик — отдельное хранилище (srm_customers), поля совпадают с поставщиком. */
export type Customer = Supplier;

export type PurchaseRequestStatus = 'draft' | 'submitted' | 'manager_review' | 'director_review' | 'approved' | 'rejected' | 'rfq_sent' | 'quotation_received' | 'comparison' | 'po_issued' | 'completed';

export interface PurchaseRequest {
  id: number;
  number?: string;
  title: string;
  description: string;
  project_id: number;
  project_name: string;
  status: PurchaseRequestStatus;
  requester: string;
  amount: number;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  deadline: string;
}

export type ContractStatus = 'draft' | 'legal_review' | 'negotiation' | 'approved' | 'signed' | 'active' | 'completed' | 'terminated';

export interface Contract {
  id: number;
  number: string;
  title: string;
  supplier_id: number;
  supplier_name: string;
  status: ContractStatus;
  amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  project_id: number;
  project_name: string;
  attachment_name?: string;
  attachment_stored?: string;
}

export type OrderStatus = 'draft' | 'submitted' | 'confirmed' | 'in_production' | 'shipped' | 'in_transit' | 'customs' | 'delivered' | 'inspection' | 'accepted' | 'rejected' | 'completed';

export interface PurchaseOrder {
  id: number;
  number: string;
  contract_id: number;
  supplier_name: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  order_date: string;
  delivery_date: string;
  project_id: number;
  project_name: string;
}

export type InvoiceStatus = 'received' | 'verified' | 'approved' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: number;
  number: string;
  supplier_name: string;
  contract_id: number;
  order_id?: number;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date?: string;
}
