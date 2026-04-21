import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments } from '../api/documents';
import type { Document } from '../types';
import { Search, Plus, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { Badge, Button, Input, Select } from '../components/ui';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

// --- Helper functions for Status Badge ---
const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  active: 'success',
  in_progress: 'info',
  completed: 'neutral',
  not_started: 'neutral',
  on_review: 'warning',
  approved: 'success',
  draft: 'neutral',
  archived: 'neutral',
  low: 'success',
  medium: 'warning',
  high: 'error',
  superseded: 'neutral',
};

const STATUS_BADGE_LABELS: Record<string, string> = {
  active: 'Активный',
  in_progress: 'В работе',
  completed: 'Завершён',
  not_started: 'Не начата',
  on_review: 'На проверке',
  approved: 'Утверждён',
  draft: 'Черновик',
  archived: 'Архив',
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  superseded: 'Замещен',
};

function mapStatusToBadgeVariant(status: string): BadgeVariant {
  return STATUS_BADGE_VARIANTS[status] || 'neutral';
}

function mapStatusToBadgeLabel(status: string): string {
  return STATUS_BADGE_LABELS[status] || status;
}
// -----------------------------------------------------------------------------------------

const MOCK_DOCS: Document[] = [
  {
    id: 1,
    code: 'НПЗ-КМ-001',
    title: 'Общий вид конструкций',
    project_id: 1,
    status: 'approved',
    doc_type: 'КМ',
    current_revision_id: 3,
  },
  {
    id: 2,
    code: 'НПЗ-КМ-002',
    title: 'Узлы сопряжения',
    project_id: 1,
    status: 'on_review',
    doc_type: 'КМ',
    current_revision_id: 5,
  },
  {
    id: 3,
    code: 'ЛЭП-ЭС-001',
    title: 'Схема электроснабжения',
    project_id: 2,
    status: 'draft',
    doc_type: 'ЭС',
    current_revision_id: null,
  },
  {
    id: 4,
    code: 'КОТ-ТМ-001',
    title: 'Тепломеханические решения',
    project_id: 3,
    status: 'in_progress',
    doc_type: 'ТМ',
    current_revision_id: 2,
  },
  {
    id: 5,
    code: 'НПЗ-АР-003',
    title: 'Архитектурные решения',
    project_id: 1,
    status: 'approved',
    doc_type: 'АР',
    current_revision_id: 7,
  },
  {
    id: 6,
    code: 'ЛЭП-ПС-002',
    title: 'План силовой сети',
    project_id: 2,
    status: 'on_review',
    doc_type: 'ПС',
    current_revision_id: 8,
  },
  {
    id: 7,
    code: 'НПЗ-КМ-003',
    title: 'Фундаменты',
    project_id: 1,
    status: 'draft',
    doc_type: 'КМ',
    current_revision_id: null,
  },
  {
    id: 8,
    code: 'КОТ-ОВ-002',
    title: 'Вентиляция',
    project_id: 3,
    status: 'in_progress',
    doc_type: 'ОВ',
    current_revision_id: 4,
  },
  {
    id: 9,
    code: 'ЛЭП-ЭС-003',
    title: 'Кабельный журнал',
    project_id: 2,
    status: 'approved',
    doc_type: 'ЭС',
    current_revision_id: 6,
  },
  {
    id: 10,
    code: 'НПЗ-ТХ-004',
    title: 'Технологическая схема',
    project_id: 1,
    status: 'on_review',
    doc_type: 'ТХ',
    current_revision_id: 9,
  },
];

const DOCUMENT_STATUS_OPTIONS = Object.keys(STATUS_BADGE_LABELS)
  .filter(
    (s) =>
      ![
        'low',
        'medium',
        'high',
        'active',
        'completed',
        'not_started',
        'in_progress',
      ].includes(s)
  )
  .map((status) => ({
    value: status,
    label: STATUS_BADGE_LABELS[status],
  }));

const DISCIPLINE_OPTIONS = [
  { value: 'КМ', label: 'Конструкции металлические' },
  { value: 'ЭС', label: 'Электроснабжение' },
  { value: 'ТМ', label: 'Тепломеханика' },
  { value: 'АР', label: 'Архитектурные решения' },
  { value: 'ПС', label: 'Проект силовых сетей' },
  { value: 'ОВ', label: 'Отопление и вентиляция' },
  { value: 'ТХ', label: 'Технологические решения' },
  { value: 'ВК', label: 'Водоснабжение и канализация' },
  { value: '', label: 'Все дисциплины' }, // reset
];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
];

type SortKey = 'code' | 'title' | 'doc_type' | 'status';

export default function Documents() {
  const [allDocs, setAllDocs] = useState<Document[]>(MOCK_DOCS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [sortBy, setSortBy] = useState<SortKey | null>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(
    ITEMS_PER_PAGE_OPTIONS[0].value
  );
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);

  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const docs = await getDocuments({ search: searchQuery || undefined })
      setAllDocs(docs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const filteredDocs = useMemo(() => {
    let filtered = allDocs;

    if (searchQuery) {
      filtered = filtered.filter(
        (d) =>
          d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((d) => d.status === filterStatus);
    }

    if (filterDiscipline) {
      filtered = filtered.filter((d) => d.discipline === filterDiscipline);
    }

    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return filtered;
  }, [allDocs, searchQuery, filterStatus, filterDiscipline, sortBy, sortOrder]);

  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * Number(itemsPerPage);
    const endIndex = startIndex + Number(itemsPerPage);
    return filteredDocs.slice(startIndex, endIndex);
  }, [filteredDocs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDocs.length / Number(itemsPerPage));

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDocuments(paginatedDocs.map((doc) => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleSelectDocument = (docId: number) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const isAllSelected =
    paginatedDocs.length > 0 &&
    selectedDocuments.length === paginatedDocs.length;

  return (
    <div className="space-y-6">
      {/* HEADER AND ACTIONS */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Документы
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Управление документами проекта
          </p>
        </div>
        <Button onClick={() => navigate('/documents/new')} size="sm">
          <Plus size={16} className="mr-2" /> Добавить документ
        </Button>
      </div>

      {/* FILTERS AND SEARCH */}
      <div
        className="rounded-2xl border px-4 py-4 md:px-5 md:py-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Input
              label="Поиск"
              placeholder="Код или название..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="col-span-full pl-10 lg:col-span-1"
            />
            <Search
              className="absolute left-3 top-9 h-4 w-4"
              style={{ color: 'var(--text-tertiary)' }}
            />
          </div>
          <Select
            label="Статус"
            options={[{ value: '', label: 'Все статусы' }, ...DOCUMENT_STATUS_OPTIONS]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
          <Select
            label="Дисциплина"
            options={DISCIPLINE_OPTIONS}
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
          />
          <div className="flex items-end justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setFilterDiscipline('');
                setSortBy('code');
                setSortOrder('asc');
                setCurrentPage(1);
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        </div>
      </div>

      {/* DOCUMENTS TABLE */}
      <div
        className="rounded-2xl border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: 'var(--bg-surface-2)' }}
            >
              <tr>
                <th className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-[var(--border-default)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    onChange={handleSelectAll}
                    checked={isAllSelected}
                  />
                </th>
                <TableHeader
                  sortKey="code"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Код
                </TableHeader>
                <TableHeader
                  sortKey="title"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Название
                </TableHeader>
                <TableHeader
                  sortKey="doc_type"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Тип
                </TableHeader>
                <TableHeader
                  sortKey="status"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Статус
                </TableHeader>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: Number(itemsPerPage) }).map((_, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: 'var(--bg-surface-2)' }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div
                        className="h-4 w-24 rounded"
                        style={{ backgroundColor: 'var(--bg-surface-2)' }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div
                        className="h-4 w-48 rounded"
                        style={{ backgroundColor: 'var(--bg-surface-2)' }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div
                        className="h-4 w-16 rounded"
                        style={{ backgroundColor: 'var(--bg-surface-2)' }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div
                        className="h-4 w-20 rounded"
                        style={{ backgroundColor: 'var(--bg-surface-2)' }}
                      />
                    </td>
                  </tr>
                ))
              ) : paginatedDocs.length > 0 ? (
                paginatedDocs.map((d) => (
                  <tr
                    key={d.id}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderTop: '1px solid var(--border-light)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'var(--bg-surface-2)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        'transparent';
                    }}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-[var(--border-default)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        checked={selectedDocuments.includes(d.id)}
                        onChange={() => handleSelectDocument(d.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td
                      className="whitespace-nowrap px-6 py-4 text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={() => navigate(`/documents/workspace/${d.project_id || 1}`)}
                    >
                      {d.code}
                    </td>
                    <td
                      className="whitespace-nowrap px-6 py-4 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                      onClick={() => navigate(`/documents/workspace/${d.project_id || 1}`)}
                    >
                      {d.title}
                    </td>
                    <td
                      className="whitespace-nowrap px-6 py-4 text-sm"
                      style={{ color: 'var(--text-tertiary)' }}
                      onClick={() => navigate(`/documents/workspace/${d.project_id || 1}`)}
                    >
                      {d.doc_type || '—'}
                    </td>
                    <td
                      className="whitespace-nowrap px-6 py-4"
                      onClick={() => navigate(`/documents/workspace/${d.project_id || 1}`)}
                    >
                      <Badge variant={mapStatusToBadgeVariant(d.status)}>
                        {mapStatusToBadgeLabel(d.status)}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Info size={32} strokeWidth={1} />
                      <p>Документы не найдены</p>
                      <p className="text-sm">
                        Попробуйте изменить фильтры или добавить новый документ.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3"
                  style={{
                    borderTop: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface-2)',
                  }}
                >
                  <nav
                    className="flex items-center justify-between"
                    aria-label="Пагинация документов"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="rounded-md px-3 py-1.5 text-sm transition-colors"
                        style={{
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          opacity: currentPage === 1 ? 0.5 : 1,
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        }}
                        aria-label="Предыдущая страница"
                      >
                        Назад
                      </button>
                      <span
                        className="min-w-[140px] px-4 py-1.5 text-center text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                        aria-current="page"
                      >
                        Страница {currentPage} из {totalPages || 1}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="rounded-md px-3 py-1.5 text-sm transition-colors"
                        style={{
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          opacity:
                            currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
                          cursor:
                            currentPage === totalPages || totalPages === 0
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                        aria-label="Следующая страница"
                      >
                        Вперёд
                      </button>
                    </div>

                    <Select
                      options={ITEMS_PER_PAGE_OPTIONS}
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-24"
                      label=""
                    />
                  </nav>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedDocuments.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg p-4 shadow-xl"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <p className="text-sm font-medium">
            Выбрано: {selectedDocuments.length}
          </p>
          <Button variant="secondary" size="sm">
            Изменить статус
          </Button>
          <Button variant="danger" size="sm">
            Удалить
          </Button>
        </div>
      )}
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
  sortKey: SortKey;
  currentSortBy: SortKey | null;
  currentSortOrder: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}

function TableHeader({
  children,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
}: TableHeaderProps) {
  const isSorted = currentSortBy === sortKey;
  const isAsc = isSorted && currentSortOrder === 'asc';
  const isDesc = isSorted && currentSortOrder === 'desc';

  return (
    <th
      className="cursor-pointer select-none px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors"
      style={{ color: 'var(--text-tertiary)' }}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        {children}
        <span className="flex flex-col">
          <ChevronUp
            size={12}
            style={{
              color: isAsc ? 'var(--primary)' : 'var(--border-default)',
            }}
          />
          <ChevronDown
            size={12}
            className="-mt-1"
            style={{
              color: isDesc ? 'var(--primary)' : 'var(--border-default)',
            }}
          />
        </span>
      </div>
    </th>
  );
}