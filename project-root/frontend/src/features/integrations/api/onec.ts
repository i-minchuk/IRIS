import client from "@/shared/api/client";

export interface OneCDocumentItem {
  id: number;
  code: string;
  name: string;
  type: string;
  status: string;
}

export interface OneCExportResult {
  export_id: string;
  format: string;
  version: string;
  items_count: number;
  xml_content: string | null;
  json_content: Record<string, unknown> | null;
  generated_at: string;
}

export const oneCApi = {
  exportDocuments: (documentIds: number[]) =>
    client.post<OneCExportResult>("/1c/export-batch", documentIds),

  exportSingleDocument: (documentId: number, includeContent = false) =>
    client.post<OneCExportResult>("/1c/export-documents", {
      document_id: documentId,
      include_content: includeContent,
    }),

  getDocuments: () => client.get<OneCDocumentItem[]>("/documents"),
};
