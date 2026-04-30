// src/pages/PortfolioPage/mocks/data.ts
// import { Project, Document, Remark } from '../types/portfolio'; // Используется только Project и Remark
import { Project, Remark } from '../types/portfolio';

/**
 * Mock-данные для разработки страницы Портфель проектов
 */

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Тестовый проект TP-001',
    status: 'active',
    documents: [
      {
        id: 'doc-1',
        name: 'Чертеж генерального плана',
        fileName: 'GP-001.svg',
        type: 'svg',
        status: 'in_progress',
        revision: 3,
        lastUpdated: '2026-04-25T10:30:00Z',
        hasRemarks: true,
        projectId: '1',
      },
      {
        id: 'doc-2',
        name: 'Спецификация оборудования',
        fileName: 'SPEC-001.xlsx',
        type: 'xlsx',
        status: 'sent',
        revision: 2,
        lastUpdated: '2026-04-24T14:20:00Z',
        hasRemarks: false,
        projectId: '1',
      },
      {
        id: 'doc-3',
        name: 'Пояснительная записка',
        fileName: 'PZ-001.pdf',
        type: 'pdf',
        status: 'accepted',
        revision: 5,
        lastUpdated: '2026-04-23T09:15:00Z',
        hasRemarks: false,
        projectId: '1',
      },
    ],
  },
  {
    id: '2',
    name: 'Проект разработки ИИ-ассистента',
    status: 'active',
    documents: [
      {
        id: 'doc-4',
        name: 'Техническое задание',
        fileName: 'TZ-AI-001.doc',
        type: 'doc',
        status: 'remarks',
        revision: 1,
        lastUpdated: '2026-04-26T08:00:00Z',
        hasRemarks: true,
        projectId: '2',
      },
      {
        id: 'doc-5',
        name: 'Архитектура системы',
        fileName: 'ARCH-001.png',
        type: 'png',
        status: 'not_started',
        revision: 0,
        lastUpdated: '2026-04-26T08:00:00Z',
        hasRemarks: false,
        projectId: '2',
      },
    ],
  },
  {
    id: '3',
    name: 'Система управления документами',
    status: 'completed',
    documents: [
      {
        id: 'doc-6',
        name: 'Руководство пользователя',
        fileName: 'MANUAL-001.pdf',
        type: 'pdf',
        status: 'accepted',
        revision: 10,
        lastUpdated: '2026-04-20T16:45:00Z',
        hasRemarks: false,
        projectId: '3',
      },
      {
        id: 'doc-7',
        name: 'Исключенный документ',
        fileName: 'OLD-001.dwg',
        type: 'dwg',
        status: 'excluded',
        revision: 1,
        lastUpdated: '2026-04-15T11:30:00Z',
        hasRemarks: false,
        projectId: '3',
      },
    ],
  },
];

export const mockRemarks: Remark[] = [
  {
    id: 'rem-1',
    documentId: 'doc-1',
    author: {
      type: 'customer',
      name: 'Иванов А.С.',
      color: '#ef4444',
    },
    text: 'Не соответствует ГОСТ 21.101-2020. Требуется исправить рамки и основные надписи.',
    createdAt: '2026-04-25T11:00:00Z',
    status: 'open',
    replies: [
      {
        id: 'rep-1',
        author: 'Петров В.М.',
        text: 'Исправлю до конца дня',
        date: '2026-04-25T12:30:00Z',
      },
    ],
  },
  {
    id: 'rem-2',
    documentId: 'doc-1',
    author: {
      type: 'pdo',
      name: 'Сидорова Е.К.',
      color: '#22c55e',
    },
    text: 'Проверить масштаб на листе А1',
    createdAt: '2026-04-25T14:15:00Z',
    status: 'open',
  },
  {
    id: 'rem-3',
    documentId: 'doc-4',
    author: {
      type: 'project_manager',
      name: 'Кузнецов Д.А.',
      color: '#3b82f6',
    },
    text: 'Добавить раздел по безопасности',
    createdAt: '2026-04-26T09:00:00Z',
    status: 'open',
    replies: [],
  },
];
