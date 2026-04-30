// src/pages/PortfolioPage/types/portfolio.ts
/**
 * Интерфейсы для страницы Портфель проектов
 */

export type DocumentStatus =
  | 'customer_deleted'
  | 'in_progress'
  | 'sent'
  | 'accepted'
  | 'remarks'
  | 'excluded'
  | 'not_started';

export type AuthorType = 'customer' | 'pdo' | 'project_manager' | 'tender' | 'otk';

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  documents: Document[];
}

export interface Document {
  id: string;
  name: string;
  fileName: string;
  type: 'svg' | 'dwg' | 'png' | 'pdf' | 'doc' | 'md' | 'xlsx' | 'xls';
  status: DocumentStatus;
  revision: number;
  lastUpdated: string;
  hasRemarks: boolean;
  fileUrl?: string;
  projectId: string;
}

export interface Remark {
  id: string;
  documentId: string;
  author: {
    type: AuthorType;
    name: string;
    color: string;
  };
  text: string;
  createdAt: string;
  status: 'open' | 'fixed' | 'rejected' | 'info';
  replies?: Reply[];
}

export interface Reply {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface StatusColor {
  bg: string;
  text: string;
  opacity: number;
  label: string;
}
