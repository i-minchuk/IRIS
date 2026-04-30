// src/pages/ProjectPortfolioPage/types/project.ts
/**
 * Типы для страницы Портфель проектов
 */

export type ProjectStatus =
  | 'initiation'      // Инициация
  | 'design'          // Проектирование
  | 'documentation'   // Документация
  | 'approval'        // Согласование
  | 'procurement'     // Закупки
  | 'production'      // Производство
  | 'delivery'        // Поставка
  | 'installation'    // Монтаж
  | 'commissioning'   // Пусконаладка
  | 'completed';      // Завершен

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  customer: string;           // Заказчик
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  
  // Финансы
  contractSum: number;        // Сумма контракта (млн ₽)
  spentBudget: number;        // Потрачено
  plannedBudget: number;      // Плановый бюджет
  
  // Сроки
  startDate: string;          // Дата начала
  deadline: string;           // Дедлайн
  completionDate?: string;    // Дата завершения
  
  // Исполнители
  projectManager: string;     // Руководитель проекта
  engineers: string[];        // Инженеры
  tenderManager?: string;     // Тендерный менеджер (кто выиграл)
  
  // Документы
  documents: ProjectDocument[];
  
  // Прогресс
  progressPercent: number;    // % выполнения
  
  // Связь с тендером
  tenderId?: string;         // ID тендера (если из тендера)
  
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'kd' | 'rd' | 'estimate' | 'contract' | 'report' | 'other';
  status: 'draft' | 'in_review' | 'approved' | 'sent' | 'accepted';
  responsible: string;
  deadline: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  totalSum: number;           // Сумма всех контрактов
  avgProgress: number;        // Средний прогресс
  overdue: number;            // Просроченных
  atRisk: number;            // В риске
}
