import { useState } from 'react';
import { DocumentItem } from '@/api/documents';
import { Card, Button } from '@/components/ui';
import StatusBadge from '@/components/StatusBadge';

// -------------------------------------------------------------------------
// ВРЕМЕННО: мок-данные документов до подключения бэкенда
// -------------------------------------------------------------------------

const STATUS_BADGE_LABELS: Record<string, string> = {
  approved: 'Утверждён',
  on_review: 'На согласовании',
  draft: 'Черновик',
  in_progress: 'В работе',
};

function statusLabel(status: string) {
  return STATUS_BADGE_LABELS[status] || status;
}
// -----------------------------------------------------------------------------------------

const MOCK_DOCS: DocumentItem[] = [
  { id: 1, number: 'НПЗ-КМ-001', name: 'Общий вид конструкций', code: 'НПЗ-КМ-001', title: 'Общий вид конструкций', project_id: 1, status: 'approved', doc_type: 'КМ', current_revision_id: 3 },
  { id: 2, number: 'НПЗ-КМ-002', name: 'Узлы сопряжения', code: 'НПЗ-КМ-002', title: 'Узлы сопряжения', project_id: 1, status: 'on_review', doc_type: 'КМ', current_revision_id: 5 },
  { id: 3, number: 'ЛЭП-ЭС-001', name: 'Схема электроснабжения', code: 'ЛЭП-ЭС-001', title: 'Схема электроснабжения', project_id: 2, status: 'draft', doc_type: 'ЭС', current_revision_id: null },
  { id: 4, number: 'КОТ-ТМ-001', name: 'Тепломеханические решения', code: 'КОТ-ТМ-001', title: 'Тепломеханические решения', project_id: 3, status: 'in_progress', doc_type: 'ТМ', current_revision_id: 2 },
  { id: 5, number: 'НПЗ-АР-003', name: 'Архитектурные решения', code: 'НПЗ-АР-003', title: 'Архитектурные решения', project_id: 1, status: 'approved', doc_type: 'АР', current_revision_id: 7 },
  { id: 6, number: 'ЛЭП-ПС-002', name: 'План силовой сети', code: 'ЛЭП-ПС-002', title: 'План силовой сети', project_id: 2, status: 'on_review', doc_type: 'ПС', current_revision_id: 8 },
  { id: 7, number: 'НПЗ-КМ-003', name: 'Фундаменты', code: 'НПЗ-КМ-003', title: 'Фундаменты', project_id: 1, status: 'draft', doc_type: 'КМ', current_revision_id: null },
  { id: 8, number: 'КОТ-ОВ-002', name: 'Вентиляция', code: 'КОТ-ОВ-002', title: 'Вентиляция', project_id: 3, status: 'in_progress', doc_type: 'ОВ', current_revision_id: 4 },
  { id: 9, number: 'ЛЭП-ЭС-003', name: 'Кабельный журнал', code: 'ЛЭП-ЭС-003', title: 'Кабельный журнал', project_id: 2, status: 'approved', doc_type: 'ЭС', current_revision_id: 6 },
  { id: 10, number: 'НПЗ-ТХ-004', name: 'Технологическая схема', code: 'НПЗ-ТХ-004', title: 'Технологическая схема', project_id: 1, status: 'on_review', doc_type: 'ТХ', current_revision_id: 9 },
];

const DOCUMENT_STATUS_OPTIONS = Object.keys(STATUS_BADGE_LABELS)
  .map((key) => ({ value: key, label: STATUS_BADGE_LABELS[key] }));

export default function DocumentsPage() {
  const [docs] = useState<DocumentItem[]>(MOCK_DOCS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = docs.filter((d) => {
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.code?.toLowerCase().includes(q) ||
      d.title?.toLowerCase().includes(q) ||
      d.doc_type.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Документы</h2>
        <Button onClick={() => alert('Создание документа — в разработке')}>
          + Новый документ
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Поиск по коду / названию / типу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Все статусы</option>
          {DOCUMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => (
          <Card
            key={doc.id}
            className="p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{doc.code}</span>
              <StatusBadge status={doc.status} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{doc.title}</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>Тип: {doc.doc_type}</p>
              <p>Статус: {statusLabel(doc.status)}</p>
              {doc.current_revision_id !== null && (
                <p>Ревизия: {doc.current_revision_id}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Документы не найдены
        </div>
      )}
    </div>
  );
}
