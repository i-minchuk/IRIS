import { Project, Remark } from '../types/package';

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Газопровод-2026',
    code: 'ГП-2026',
    customer: 'ООО «Газпром»',
    documents: [
      { id: 'doc-001', projectId: 'proj-001', name: 'РД-001-ГП', fileName: 'RD-001.pdf', type: 'pdf', status: 'approved', revision: 3, lastUpdated: '20.04.2026', hasRemarks: false, responsible: 'Иванов П.Д.', deadline: '2026-04-15', completedAt: '2026-04-10' },
      { id: 'doc-002', projectId: 'proj-001', name: 'КД-001-ГП', fileName: 'KD-001.dwg', type: 'dwg', status: 'in_progress', revision: 2, lastUpdated: '18.04.2026', hasRemarks: true, responsible: 'Новиков Д.С.', deadline: '2026-05-01', dependsOn: ['doc-001'] },
      { id: 'doc-003', projectId: 'proj-001', name: 'Спецификация-001', fileName: 'Spec-001.xlsx', type: 'xlsx', status: 'sent', revision: 1, lastUpdated: '15.04.2026', hasRemarks: false, responsible: 'Козлова Е.Н.', deadline: '2026-04-20', dependsOn: ['doc-002'] },
      { id: 'doc-004', projectId: 'proj-001', name: 'Протокол-001', fileName: 'Prot-001.pdf', type: 'pdf', status: 'remarks', revision: 1, lastUpdated: '19.04.2026', hasRemarks: true, responsible: 'Семенов Г.К.', deadline: '2026-04-25' },
      { id: 'doc-005', projectId: 'proj-001', name: 'Ведомость-001', fileName: 'Ved-001.xlsx', type: 'xlsx', status: 'deleted', revision: 0, lastUpdated: '10.04.2026', hasRemarks: false, responsible: 'Иванов П.Д.', deadline: '2026-04-10' },
      { id: 'doc-006', projectId: 'proj-001', name: 'Чертеж-001', fileName: 'Chert-001.dwg', type: 'dwg', status: 'cancelled', revision: 1, lastUpdated: '12.04.2026', hasRemarks: false, responsible: 'Новиков Д.С.', deadline: '2026-04-15' },
      { id: 'doc-007', projectId: 'proj-001', name: 'Расчет-001', fileName: 'Raschet-001.pdf', type: 'pdf', status: 'not_started', revision: 0, lastUpdated: '-', hasRemarks: false, responsible: 'Иванов П.Д.', deadline: '2026-05-15', dependsOn: ['doc-002', 'doc-003'] },
    ]
  },
  {
    id: 'proj-002',
    name: 'НПЗ Реконструкция',
    code: 'НПЗ-2026',
    customer: 'ПАО «Роснефть»',
    documents: [
      { id: 'doc-008', projectId: 'proj-002', name: 'КД-001-НПЗ', fileName: 'KD-001-NPZ.pdf', type: 'pdf', status: 'in_progress', revision: 1, lastUpdated: '22.04.2026', hasRemarks: false, responsible: 'Новиков Д.С.', deadline: '2026-05-10' },
      { id: 'doc-009', projectId: 'proj-002', name: 'Смета-001', fileName: 'Smeta-001.xlsx', type: 'xlsx', status: 'not_started', revision: 0, lastUpdated: '-', hasRemarks: false, responsible: 'Козлова Е.Н.', deadline: '2026-05-20', dependsOn: ['doc-008'] },
    ]
  },
  {
    id: 'proj-003',
    name: 'Мост через Волгу',
    code: 'МВ-2026',
    customer: 'ФКУ Упрдор',
    documents: [
      { id: 'doc-010', projectId: 'proj-003', name: 'РД-001-МВ', fileName: 'RD-001-MV.pdf', type: 'pdf', status: 'in_progress', revision: 1, lastUpdated: '25.04.2026', hasRemarks: true, responsible: 'Иванов П.Д.', deadline: '2026-05-15' },
    ]
  },
];

export const mockRemarks: Remark[] = [
  { id: 'rem-001', documentId: 'doc-002', author: { type: 'customer', name: 'ООО «Газпром»', color: '#ef4444' }, text: 'Требуется уточнить размеры фланцев по поз. 12-15', createdAt: '2026-04-18T14:30:00', status: 'open' },
  { id: 'rem-002', documentId: 'doc-002', author: { type: 'pdo', name: 'Иванов П.Д.', color: '#22c55e' }, text: 'Проверь соответствие ГОСТ 32569-2013', createdAt: '2026-04-19T09:15:00', status: 'fixed' },
  { id: 'rem-003', documentId: 'doc-004', author: { type: 'project_manager', name: 'Петрова А.М.', color: '#3b82f6' }, text: 'Согласовано с замечаниями. Отправляйте заказчику.', createdAt: '2026-04-19T11:45:00', status: 'info' },
  { id: 'rem-004', documentId: 'doc-010', author: { type: 'customer', name: 'ФКУ Упрдор', color: '#ef4444' }, text: 'Несоответствие толщины опорной плиты', createdAt: '2026-04-26T10:00:00', status: 'open' },
];
