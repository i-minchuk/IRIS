import { useState, useEffect } from 'react';
import { MTOItem } from '../types/production';
import { getPurchaseRequests, getOrders } from '@/features/srm/api/srmApi';
import type { PurchaseRequest, PurchaseOrder } from '@/types/srm';

/** Маппинг статусов заявки на закупку → статус МТО. */
const requestStatusMap: Record<PurchaseRequest['status'], MTOItem['status'] | null> = {
  draft: 'spec_draft',
  submitted: 'spec_submitted',
  manager_review: 'spec_submitted',
  director_review: 'spec_submitted',
  approved: 'in_procurement',
  rfq_sent: 'in_procurement',
  quotation_received: 'in_procurement',
  comparison: 'in_procurement',
  po_issued: 'ordered',
  completed: 'in_stock',
  rejected: null,
};

/** Маппинг статусов заказа поставщику → статус МТО. */
const orderStatusMap: Record<PurchaseOrder['status'], MTOItem['status'] | null> = {
  draft: 'in_procurement',
  submitted: 'ordered',
  confirmed: 'ordered',
  in_production: 'ordered',
  shipped: 'ordered',
  in_transit: 'ordered',
  customs: 'ordered',
  delivered: 'delivered',
  inspection: 'delivered',
  accepted: 'in_stock',
  completed: 'in_stock',
  rejected: null,
};

/** Позиции МТО строятся из реальных заявок на закупку и заказов (модуль SRM). */
export function useMtoItems() {
  const [mtoItems, setMtoItems] = useState<MTOItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [requests, orders] = await Promise.all([getPurchaseRequests(), getOrders()]);

        const items: MTOItem[] = [];

        requests.forEach((r) => {
          const status = requestStatusMap[r.status];
          if (!status) return;
          items.push({
            id: `pr-${r.id}`,
            projectId: String(r.project_id),
            specificationId: r.number || `ЗП-${r.id}`,
            itemName: r.title,
            quantity: 1,
            status,
            submittedToMTO: r.created_at,
            plannedDelivery: r.deadline || undefined,
            actualDelivery: status === 'in_stock' ? r.deadline || undefined : undefined,
          });
        });

        orders.forEach((o) => {
          const status = orderStatusMap[o.status];
          if (!status) return;
          items.push({
            id: `po-${o.id}`,
            projectId: String(o.project_id),
            specificationId: o.number || `ЗК-${o.id}`,
            itemName: `Заказ ${o.number || o.id} — ${o.supplier_name}`,
            quantity: 1,
            status,
            plannedDelivery: o.delivery_date || undefined,
            actualDelivery:
              status === 'delivered' || status === 'in_stock' ? o.delivery_date || undefined : undefined,
            supplier: o.supplier_name,
          });
        });

        setMtoItems(items);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить данные МТО');
        console.error(err);
        setMtoItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { mtoItems, loading, error };
}
