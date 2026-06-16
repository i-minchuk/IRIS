import client from '@/shared/api/client';
import type {
  TenderDetail,
  TeamAvailability,
  ProductionCapacity,
  DocumentChecklist,
  ProcurementStatus,
  ReferenceLibrary,
} from '../types/tender-extended';

export const tenderExtendedApi = {
  /** Full tender detail with project, tasks, documents, workflows */
  async getDetail(tenderId: number): Promise<TenderDetail> {
    const { data } = await client.get(`/tenders/${tenderId}/detail`);
    return data;
  },

  /** Team availability analysis */
  async getTeamAvailability(tenderId: number): Promise<TeamAvailability> {
    const { data } = await client.get(`/tenders/${tenderId}/team-availability`);
    return data;
  },

  /** Production capacity / work centers load */
  async getProductionCapacity(tenderId: number): Promise<ProductionCapacity> {
    const { data } = await client.get(`/tenders/${tenderId}/production-capacity`);
    return data;
  },

  /** Document checklist with status */
  async getDocumentChecklist(tenderId: number): Promise<DocumentChecklist> {
    const { data } = await client.get(`/tenders/${tenderId}/document-checklist`);
    return data;
  },

  /** Procurement / delivery status */
  async getProcurementStatus(tenderId: number): Promise<ProcurementStatus> {
    const { data } = await client.get(`/tenders/${tenderId}/procurement-status`);
    return data;
  },

  /** Reference library — similar past tenders */
  async getReferences(tenderId: number): Promise<ReferenceLibrary> {
    const { data } = await client.get(`/tenders/${tenderId}/references`);
    return data;
  },
};
