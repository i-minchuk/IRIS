export type DocumentStatus =
  | 'not_started'      // Не брали в работу
  | 'in_progress'      // В работе
  | 'sent'             // Отправлено заказчику
  | 'approved'         // Утверждено заказчиком
  | 'remarks'          // Замечания по документу
  | 'deleted'          // Удаленный документ
  | 'cancelled';       // Аннулированные

export type AuthorType = 'customer' | 'pdo' | 'project_manager' | 'tender' | 'otk';

export interface Project {
  id: string;
  name: string;
  code: string;
  customer: string;
  documents: Document[];
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  fileName: string;
  type: 'pdf' | 'dwg' | 'png' | 'doc' | 'xlsx' | 'md';
  status: DocumentStatus;
  revision: number;
  lastUpdated: string;
  hasRemarks: boolean;
  fileUrl?: string;
  responsible: string;        // Кто ведет документ
  deadline: string;             // Срок сдачи
  dependsOn?: string[];         // ID документов, от которых зависит
  completedAt?: string;        // Когда выполнен
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
  replies?: { id: string; author: string; text: string; date: string }[];
}

export interface TimelineNode {
  documentId: string;
  documentName: string;
  status: DocumentStatus;
  responsible: string;
  deadline: string;
  completedAt?: string;
  dependsOn?: string[];
  isBlocking: boolean;          // Блокирует другие документы
  isBlocked: boolean;           // Заблокирован ожиданием
}
