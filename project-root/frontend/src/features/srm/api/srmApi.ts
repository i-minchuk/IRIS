import apiClient from '@/shared/api/client';
import type { Supplier, PurchaseRequest, Contract, PurchaseOrder, Invoice } from '@/types/srm';

/** Ответы backend /srm/* совпадают с типами из @/types/srm,
 * но date-поля могут прийти null — нормализуем в ''. */
interface PurchaseRequestApiItem extends Omit<PurchaseRequest, 'deadline'> {
  deadline: string | null;
}
interface ContractApiItem extends Omit<Contract, 'start_date' | 'end_date'> {
  start_date: string | null;
  end_date: string | null;
}
interface PurchaseOrderApiItem extends Omit<PurchaseOrder, 'order_date' | 'delivery_date'> {
  order_date: string | null;
  delivery_date: string | null;
}
interface InvoiceApiItem extends Omit<Invoice, 'issue_date' | 'due_date' | 'paid_date'> {
  issue_date: string | null;
  due_date: string | null;
  paid_date?: string | null;
}

export type SupplierCreatePayload = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type SupplierUpdatePayload = Partial<SupplierCreatePayload>;
export type PurchaseRequestCreatePayload = Omit<PurchaseRequest, 'id' | 'created_at'>;
export type PurchaseRequestUpdatePayload = Partial<PurchaseRequestCreatePayload>;
export type ContractCreatePayload = Omit<Contract, 'id'>;
export type ContractUpdatePayload = Partial<ContractCreatePayload>;
export type PurchaseOrderCreatePayload = Omit<PurchaseOrder, 'id'>;
export type PurchaseOrderUpdatePayload = Partial<PurchaseOrderCreatePayload>;
export type InvoiceCreatePayload = Omit<Invoice, 'id'>;
export type InvoiceUpdatePayload = Partial<InvoiceCreatePayload>;

function mapToRequest(item: PurchaseRequestApiItem): PurchaseRequest {
  return { ...item, deadline: item.deadline ?? '' };
}

function mapToContract(item: ContractApiItem): Contract {
  return { ...item, start_date: item.start_date ?? '', end_date: item.end_date ?? '' };
}

function mapToOrder(item: PurchaseOrderApiItem): PurchaseOrder {
  return { ...item, order_date: item.order_date ?? '', delivery_date: item.delivery_date ?? '' };
}

function mapToInvoice(item: InvoiceApiItem): Invoice {
  return {
    ...item,
    issue_date: item.issue_date ?? '',
    due_date: item.due_date ?? '',
    paid_date: item.paid_date ?? undefined,
  };
}

// ---------- Suppliers ----------

export async function getSuppliers(): Promise<Supplier[]> {
  const { data } = await apiClient.get<Supplier[]>('/srm/suppliers');
  return data;
}

export async function getSupplier(id: number): Promise<Supplier> {
  const { data } = await apiClient.get<Supplier>(`/srm/suppliers/${id}`);
  return data;
}

export async function createSupplier(payload: SupplierCreatePayload): Promise<Supplier> {
  const { data } = await apiClient.post<Supplier>('/srm/suppliers', payload);
  return data;
}

export async function updateSupplier(id: number, payload: SupplierUpdatePayload): Promise<Supplier> {
  const { data } = await apiClient.patch<Supplier>(`/srm/suppliers/${id}`, payload);
  return data;
}

export async function deleteSupplier(id: number): Promise<void> {
  await apiClient.delete(`/srm/suppliers/${id}`);
}

// ---------- Purchase Requests ----------

export async function getPurchaseRequests(): Promise<PurchaseRequest[]> {
  const { data } = await apiClient.get<PurchaseRequestApiItem[]>('/srm/purchase-requests');
  return data.map(mapToRequest);
}

export async function getPurchaseRequest(id: number): Promise<PurchaseRequest> {
  const { data } = await apiClient.get<PurchaseRequestApiItem>(`/srm/purchase-requests/${id}`);
  return mapToRequest(data);
}

export async function createPurchaseRequest(payload: PurchaseRequestCreatePayload): Promise<PurchaseRequest> {
  const { data } = await apiClient.post<PurchaseRequestApiItem>('/srm/purchase-requests', payload);
  return mapToRequest(data);
}

export async function updatePurchaseRequest(id: number, payload: PurchaseRequestUpdatePayload): Promise<PurchaseRequest> {
  const { data } = await apiClient.patch<PurchaseRequestApiItem>(`/srm/purchase-requests/${id}`, payload);
  return mapToRequest(data);
}

export async function deletePurchaseRequest(id: number): Promise<void> {
  await apiClient.delete(`/srm/purchase-requests/${id}`);
}

// ---------- Contracts ----------

export async function getContracts(): Promise<Contract[]> {
  const { data } = await apiClient.get<ContractApiItem[]>('/srm/contracts');
  return data.map(mapToContract);
}

export async function getContract(id: number): Promise<Contract> {
  const { data } = await apiClient.get<ContractApiItem>(`/srm/contracts/${id}`);
  return mapToContract(data);
}

export async function createContract(payload: ContractCreatePayload): Promise<Contract> {
  const { data } = await apiClient.post<ContractApiItem>('/srm/contracts', payload);
  return mapToContract(data);
}

export async function updateContract(id: number, payload: ContractUpdatePayload): Promise<Contract> {
  const { data } = await apiClient.patch<ContractApiItem>(`/srm/contracts/${id}`, payload);
  return mapToContract(data);
}

export async function deleteContract(id: number): Promise<void> {
  await apiClient.delete(`/srm/contracts/${id}`);
}

// ---------- Orders ----------

export async function getOrders(): Promise<PurchaseOrder[]> {
  const { data } = await apiClient.get<PurchaseOrderApiItem[]>('/srm/orders');
  return data.map(mapToOrder);
}

export async function getOrder(id: number): Promise<PurchaseOrder> {
  const { data } = await apiClient.get<PurchaseOrderApiItem>(`/srm/orders/${id}`);
  return mapToOrder(data);
}

export async function createOrder(payload: PurchaseOrderCreatePayload): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrderApiItem>('/srm/orders', payload);
  return mapToOrder(data);
}

export async function updateOrder(id: number, payload: PurchaseOrderUpdatePayload): Promise<PurchaseOrder> {
  const { data } = await apiClient.patch<PurchaseOrderApiItem>(`/srm/orders/${id}`, payload);
  return mapToOrder(data);
}

export async function deleteOrder(id: number): Promise<void> {
  await apiClient.delete(`/srm/orders/${id}`);
}

// ---------- Invoices ----------

export async function getInvoices(): Promise<Invoice[]> {
  const { data } = await apiClient.get<InvoiceApiItem[]>('/srm/invoices');
  return data.map(mapToInvoice);
}

export async function getInvoice(id: number): Promise<Invoice> {
  const { data } = await apiClient.get<InvoiceApiItem>(`/srm/invoices/${id}`);
  return mapToInvoice(data);
}

export async function createInvoice(payload: InvoiceCreatePayload): Promise<Invoice> {
  const { data } = await apiClient.post<InvoiceApiItem>('/srm/invoices', payload);
  return mapToInvoice(data);
}

export async function updateInvoice(id: number, payload: InvoiceUpdatePayload): Promise<Invoice> {
  const { data } = await apiClient.patch<InvoiceApiItem>(`/srm/invoices/${id}`, payload);
  return mapToInvoice(data);
}

export async function deleteInvoice(id: number): Promise<void> {
  await apiClient.delete(`/srm/invoices/${id}`);
}
