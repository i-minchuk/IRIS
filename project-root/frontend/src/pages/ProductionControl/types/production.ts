// ===== СТАДИИ ПРОИЗВОДСТВЕННОГО ЦИКЛА =====
export type ProductionStage =
  | 'design'           // Проектирование (РД)
  | 'kd_development'   // Разработка КД
  | 'kd_approval'      // Согласование КД
  | 'specification'    // Спецификация на закупку → МТО
  | 'procurement'      // Закупка (МТО в работе)
  | 'material_ready'   // Материал на складе
  | 'production_prep'  // Подготовка производства
  | 'production'       // Производство (операции)
  | 'qc'               // ОТК / контроль качества
  | 'testing'          // Испытания
  | 'packaging'        // Упаковка
  | 'shipment_ready'   // Готов к отгрузке
  | 'shipped';         // Отгружен

// ===== СТАТУС ОПЕРАЦИИ =====
export type OperationStatus =
  | 'not_started'
  | 'planned'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'overdue'
  | 'scrap';

// ===== ПРОЕКТ =====
export interface ProductionProject {
  id: string;
  code: string;                    // Номер заказа/проекта
  name: string;                    // Наименование изделия
  customer: string;                // Заказчик
  stage: ProductionStage;          // Текущая стадия
  status: 'on_track' | 'at_risk' | 'delayed' | 'stopped';

  // Сроки
  plannedStart: string;            // Плановый запуск в производство
  plannedFinish: string;           // Плановая готовность
  forecastFinish: string;          // Прогнозная (с учётом задержек)
  actualStart?: string;            // Фактический запуск

  // Прогресс
  progressPercent: number;         // % готовности (по операциям)
  criticalPathDays: number;        // Дней до завершения крит. пути

  // Финансы
  contractSum: number;             // Сумма контракта (млн ₽)

  // Связи
  routeId: string;                 // ID технологического маршрута
  tenderId?: string;               // ID тендера (если из тендера)

  // Текущее состояние для ответа по телефону
  currentOperation?: string;       // Что сейчас делается
  currentWorkCenter?: string;      // На каком участке
  nextMilestone?: string;          // Следующий веха
  nextMilestoneDate?: string;      // Дата следующей вехи

  createdAt: string;
  updatedAt: string;
}

// ===== ТЕХНОЛОГИЧЕСКАЯ КАРТА / ОПЕРАЦИЯ =====
export interface Operation {
  id: string;
  projectId: string;
  routeId: string;

  sequence: number;                // № операции (10, 20, 30...)
  code: string;                    // Код операции (OP10)
  name: string;                    // Наименование

  workCenterId: string;            // Участок/цех
  workCenterName: string;          // Название участка

  // Время
  setupTime: number;               // Время наладки, ч
  runTime: number;                 // Время обработки, ч
  plannedStart: string;
  plannedFinish: string;
  actualStart?: string;
  actualFinish?: string;

  status: OperationStatus;
  responsible: string;             // Мастер/бригада

  // Связанные документы
  drawingId?: string;              // Чертёж
  tkId?: string;                   // Технологическая карта

  notes?: string;                  // Комментарии, причины отклонений
}

// ===== УЧАСТОК / РАБОЧИЙ ЦЕНТР =====
export interface WorkCenter {
  id: string;
  code: string;                    // Код (МО-01, СВ-02)
  name: string;                    // Название (Мехобработка-1)
  department: string;              // Цех/отдел

  capacity: number;                // Мощность, нормо-ч/сутки
  plannedLoad: number;             // Запланировано часов
  actualLoad: number;              // Фактически загружено
  utilization: number;             // % загрузки

  activeProjects: number;          // Сколько проектов в работе
  overdueOperations: number;       // Просроченных операций
}

// ===== ДОКУМЕНТ ПО ПРОЕКТУ =====
export interface ProjectDocument {
  id: string;
  projectId: string;

  type: 'rd' | 'kd' | 'spec' | 'drawing' | 'test_program' | 'protocol' | 'other';
  number: string;                  // Номер документа
  name: string;                    // Наименование

  status: 'draft' | 'in_review' | 'approved' | 'sent' | 'overdue' | 'rejected';
  responsible: string;             // Кто готовит

  plannedReady: string;            // Плановая готовность
  actualReady?: string;            // Фактическая

  relatedOperationId?: string;     // К какой операции относится
}

// ===== МТО / ЗАКУПКИ =====
export interface MTOItem {
  id: string;
  projectId: string;

  specificationId: string;         // ID спецификации
  itemName: string;                // Наименование материала/комплектующей
  quantity: number;                // Количество

  status: 'spec_draft' | 'spec_submitted' | 'in_procurement' | 'ordered' | 'delivered' | 'in_stock';

  submittedToMTO?: string;         // Дата подачи в МТО
  plannedDelivery?: string;        // Плановая поставка
  actualDelivery?: string;         // Фактическая

  supplier?: string;               // Поставщик
}
