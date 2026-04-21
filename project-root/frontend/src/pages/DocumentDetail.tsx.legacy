import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument } from '../api/documents';
import type { DocumentDetail as DocDetail } from '../types';
import { FileText, Download, Info, GitFork, ListTodo, History, Plus } from 'lucide-react';
import { Badge, Button, Card, Tabs } from '../components/ui';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'leaders'
  | 'engineering'
  | 'production'
  | 'docs'
  | 'approvals'
  | 'audit';

function mapStatusToBadgeVariant(status?: string): BadgeVariant {
  switch (status) {
    case 'approved':
    case 'completed':
      return 'success';
    case 'review':
    case 'in_progress':
    case 'pending':
      return 'warning';
    case 'rejected':
    case 'overdue':
      return 'error';
    case 'superseded':
    case 'draft':
      return 'neutral';
    default:
      return 'info';
  }
}

function mapStatusToBadgeLabel(status?: string) {
  switch (status) {
    case 'approved':
      return 'Утвержден';
    case 'completed':
      return 'Завершен';
    case 'review':
      return 'На проверке';
    case 'in_progress':
      return 'В работе';
    case 'pending':
      return 'Ожидает';
    case 'rejected':
      return 'Отклонен';
    case 'superseded':
      return 'Заменен';
    case 'draft':
      return 'Черновик';
    case 'overdue':
      return 'Просрочен';
    default:
      return status || 'Неизвестно';
  }
}

const MOCK_DOC = {
  id: 1,
  code: 'НПЗ-КМ-001',
  title: 'Общий вид конструкций',
  project_id: 1,
  status: 'approved',
  doc_type: 'КМ',
  current_revision_id: 3,
  discipline: 'КМ',
  created_at: '2026-01-15T10:00:00Z',
  revisions: [
    {
      id: 1,
      revision_index: 'A.1',
      revision_letter: 'A',
      revision_number: 1,
      status: 'superseded',
      file_path: '/files/rev1.pdf',
      change_log: 'Первая версия',
      created_by: 1,
      created_at: '2026-01-20T10:00:00Z',
      approved_by: 2,
      approved_at: '2026-01-25T10:00:00Z',
    },
    {
      id: 2,
      revision_index: 'A.2',
      revision_letter: 'A',
      revision_number: 2,
      status: 'superseded',
      file_path: '/files/rev2.pdf',
      change_log: 'Незначительные правки',
      created_by: 1,
      created_at: '2026-02-10T10:00:00Z',
      approved_by: 2,
      approved_at: '2026-02-15T10:00:00Z',
    },
    {
      id: 3,
      revision_index: 'B.1',
      revision_letter: 'B',
      revision_number: 1,
      status: 'approved',
      file_path: '/files/rev3.pdf',
      change_log: 'Изменения по замечаниям экспертизы',
      created_by: 1,
      created_at: '2026-03-05T10:00:00Z',
      approved_by: 2,
      approved_at: '2026-03-10T10:00:00Z',
    },
  ],
} as unknown as DocDetail;

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<DocDetail | null>(MOCK_DOC);

  useEffect(() => {
    if (id) {
      getDocument(Number(id)).then(setDoc).catch(() => {});
    }
  }, [id]);

  if (!doc) {
    return (
      <Card className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
        <div className="h-4 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-48 mt-6 bg-gray-200 rounded" />
      </Card>
    );
  }

  const currentRevision = doc.revisions?.find((r) => r.id === doc.current_revision_id) || null;

  const tabs = [
    {
      label: 'Обзор',
      icon: Info,
      content: (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Наименование</p>
              <p className="font-medium text-gray-900">{doc.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Дисциплина</p>
              <p className="font-medium text-gray-900">{doc.discipline || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Создан</p>
              <p className="font-medium text-gray-900">
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ru-RU') : '—'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Текущий статус</p>
              <Badge variant={mapStatusToBadgeVariant(doc.status)}>
                {mapStatusToBadgeLabel(doc.status)}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Текущая ревизия</p>
              <p className="font-medium text-gray-900">{currentRevision?.revision_index || '—'}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: 'Ревизии',
      icon: GitFork,
      content: (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Версия
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Индекс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Создана
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Утверждена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Описание изменений
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {doc.revisions?.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {r.revision_letter}.{r.revision_number}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {r.revision_index}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge variant={mapStatusToBadgeVariant(r.status)}>
                      {mapStatusToBadgeLabel(r.status)}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {r.approved_at ? new Date(r.approved_at).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="max-w-xs px-6 py-4 text-sm text-gray-500">
                    {r.change_log || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {r.file_path ? (
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 text-primary-600 hover:text-primary-700">
                        <Download size={14} />
                        Скачать
                      </Button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      label: 'Задачи',
      icon: ListTodo,
      content: (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
          <ListTodo size={32} strokeWidth={1} />
          <p>Нет связанных задач</p>
          <Button variant="ghost" size="sm">
            <Plus size={16} className="mr-1" />
            Добавить задачу
          </Button>
        </div>
      ),
    },
    {
      label: 'Журнал изменений',
      icon: History,
      content: (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
          <History size={32} strokeWidth={1} />
          <p>Журнал изменений пуст</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <FileText size={24} className="text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">{doc.code}</h1>
            <Badge variant={mapStatusToBadgeVariant(doc.status)}>
              {mapStatusToBadgeLabel(doc.status)}
            </Badge>
          </div>
          <p className="text-lg text-gray-600">{doc.title}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button>
            <Plus size={16} className="mr-2" />
            Создать ревизию
          </Button>

          {currentRevision?.file_path ? (
            <Button variant="outline">
              <Download size={16} className="mr-2" />
              Скачать текущую
            </Button>
          ) : null}
        </div>
      </Card>

      <Card padding="none">
        <Tabs tabs={tabs} />
      </Card>
    </div>
  );
}