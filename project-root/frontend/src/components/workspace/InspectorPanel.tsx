import { User, MessageSquare, Pencil, Send, X, Save, ChevronLeft, Plus, Clock } from 'lucide-react';
import { useState } from 'react';

interface Remark {
  id: number;
  number: string;
  type: 'internal' | 'customer' | 'reviewer' | 'construction';
  text: string;
  status: 'open' | 'in-progress' | 'resolved' | 'rejected' | 'verification';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  author: string;
  assignee: string;
  date: string;
  dueDate: string;
  responses: RemarkResponse[];
  progressUpdates: ProgressUpdate[];
}

interface RemarkResponse {
  id: number;
  author: string;
  text: string;
  date: string;
  isOfficial: boolean;
}

interface ProgressUpdate {
  id: number;
  author: string;
  text: string;
  whatChanged: string;
  date: string;
}

interface InspectorPanelProps {
  documentId?: string;
  selectedRemark?: Remark | null;
  onSelectRemark: (remark: Remark | null) => void;
}

export default function InspectorPanel({ selectedRemark, onSelectRemark }: InspectorPanelProps) {
  const [newRemarkText, setNewRemarkText] = useState('');
  const [isAddingRemark, setIsAddingRemark] = useState(false);

  // Мок-данные замечаний
  const remarks: Remark[] = [
    {
      id: 1,
      number: 'Р-001',
      type: 'customer',
      text: 'Не указана толщина шва сварки на узле 3.4. Требуется уточнение согласно ЕСКД.',
      status: 'in-progress',
      priority: 'high',
      category: 'Конструкция',
      author: 'Иванов А.В.',
      assignee: 'Петров С.К.',
      date: '2025-01-10',
      dueDate: '2025-01-20',
      responses: [
        {
          id: 1,
          author: 'Петров С.К.',
          text: 'Указана в спецификации на листе 5, п. 2.3',
          date: '2025-01-11',
          isOfficial: true,
        },
      ],
      progressUpdates: [
        {
          id: 1,
          author: 'Петров С.К.',
          text: 'Добавлена ссылка на спецификацию',
          whatChanged: 'Добавлено примечание на листе 1 с ссылкой на спецификацию',
          date: '2025-01-12',
        },
      ],
    },
    {
      id: 2,
      number: 'Р-002',
      type: 'reviewer',
      text: 'Проверить соответствие нормам СНиП 2.03.01-84 для бетонных конструкций.',
      status: 'open',
      priority: 'medium',
      category: 'Нормативы',
      author: 'Сидоров В.М.',
      assignee: 'Иванов А.В.',
      date: '2025-01-08',
      dueDate: '2025-01-18',
      responses: [],
      progressUpdates: [],
    },
    {
      id: 3,
      number: 'Р-003',
      type: 'internal',
      text: 'Исправить опечатку в маркировке арматурных стержней.',
      status: 'resolved',
      priority: 'low',
      category: 'Документация',
      author: 'Кузнецов О.П.',
      assignee: 'Иванов А.В.',
      date: '2025-01-05',
      dueDate: '2025-01-15',
      responses: [],
      progressUpdates: [
        {
          id: 1,
          author: 'Иванов А.В.',
          text: 'Опечатка исправлена',
          whatChanged: 'Исправлена маркировка на листе 2, все стержни A500C',
          date: '2025-01-06',
        },
      ],
    },
  ];

  const openCount = remarks.filter((r) => r.status === 'open' || r.status === 'in-progress').length;

  // Если выбрано замечание - показываем детали
  if (selectedRemark) {
    return <RemarkDetail remark={selectedRemark} onBack={() => onSelectRemark(null)} />;
  }

  // Показываем список замечаний
  return (
    <aside
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-surface)' }}
      aria-label="Панель замечаний"
    >
      {/* Заголовок */}
      <div
        className="px-3 py-2 border-b flex items-center justify-between sticky top-0 z-10"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: 'var(--accent-engineering)' }} />
          <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            Замечания
          </h3>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: openCount > 0 ? 'var(--error)' : 'var(--success)',
            color: 'var(--text-inverse)',
          }}
        >
          {openCount} открытых
        </span>
      </div>

      {/* Кнопка добавления */}
      <div className="p-2">
        <button
          onClick={() => setIsAddingRemark(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-engineering)',
            color: 'var(--text-inverse)',
          }}
        >
          <Plus size={12} />
          Добавить замечание
        </button>

        {isAddingRemark && (
          <div className="mt-2 p-2 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
            <textarea
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              placeholder="Опишите замечание..."
              className="w-full px-2 py-1.5 text-xs rounded border resize-none focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setIsAddingRemark(false);
                  setNewRemarkText('');
                }}
                className="flex-1 px-2 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  // Здесь будет сохранение через API
                  setIsAddingRemark(false);
                  setNewRemarkText('');
                }}
                className="flex-1 px-2 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список замечаний */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5">
        {remarks.map((remark) => (
          <RemarkCard
            key={remark.id}
            remark={remark}
            onClick={() => onSelectRemark(remark)}
          />
        ))}
      </div>

      {/* Быстрые действия - внизу правой панели */}
      <div
        className="px-2 py-1.5 border-t flex items-center gap-1.5 flex-wrap shrink-0"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface-2)' }}
      >
        <QuickActionBtn label="Создать ревизию" size="sm" />
        <QuickActionBtn label="Согласование" size="sm" />
        <QuickActionBtn label="PDF" size="sm" />
        <QuickActionBtn label="На проверку" size="sm" variant="warning" />
      </div>
    </aside>
  );
}

// Карточка замечания в списке
function RemarkCard({ remark, onClick }: { remark: Remark; onClick: () => void }) {
  const getStatusBadge = () => {
    switch (remark.status) {
      case 'open':
        return { label: 'Открыто', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'in-progress':
        return { label: 'В работе', color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'verification':
        return { label: 'На проверке', color: 'var(--warning)', bg: 'rgba(251, 191, 36, 0.1)' };
      case 'resolved':
        return { label: 'Решено', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' };
      case 'rejected':
        return { label: 'Отклонено', color: 'var(--text-tertiary)', bg: 'rgba(100, 116, 139, 0.1)' };
      default:
        return { label: remark.status, color: 'var(--border-default)', bg: 'transparent' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'var(--error)';
      case 'high':
        return 'var(--warning)';
      case 'medium':
        return 'var(--info)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'internal':
        return 'Внутреннее';
      case 'customer':
        return 'Заказчик';
      case 'reviewer':
        return 'Проверяющий';
      case 'construction':
        return 'Стройка';
      default:
        return type;
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div
      onClick={onClick}
      className="p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
      style={{
        borderColor: remark.status === 'open' || remark.status === 'in-progress' ? 'var(--error)' : 'var(--border-default)',
        backgroundColor: remark.status === 'open' || remark.status === 'in-progress' ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {remark.number}
          </span>
          <span
            className="text-[9px] px-1 py-0.5 rounded border"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-tertiary)',
            }}
          >
            {getTypeLabel(remark.type)}
          </span>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: getPriorityColor(remark.priority) }}
            title={`Приоритет: ${remark.priority}`}
          />
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
          style={{
            backgroundColor: statusBadge.bg,
            color: statusBadge.color,
          }}
        >
          {statusBadge.label}
        </span>
      </div>

      <p className="text-xs mb-1.5 leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
        {remark.text}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          <User size={10} />
          <span>Исп: {remark.assignee.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          <Clock size={10} />
          <span>{new Date(remark.dueDate).toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    </div>
  );
}

// Детальный просмотр замечания
function RemarkDetail({ remark, onBack }: { remark: Remark; onBack: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(remark.text);
  const [newResponse, setNewResponse] = useState('');
  const [whatChanged, setWhatChanged] = useState('');
  const [showProgressUpdate, setShowProgressUpdate] = useState(false);

  const getStatusBadge = () => {
    switch (remark.status) {
      case 'open':
        return { label: 'Открыто', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--error)' };
      case 'in-progress':
        return { label: 'В работе', color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.1)', border: 'var(--info)' };
      case 'verification':
        return { label: 'На проверке', color: 'var(--warning)', bg: 'rgba(251, 191, 36, 0.1)', border: 'var(--warning)' };
      case 'resolved':
        return { label: 'Решено', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)', border: 'var(--success)' };
      case 'rejected':
        return { label: 'Отклонено', color: 'var(--text-tertiary)', bg: 'rgba(100, 116, 139, 0.1)', border: 'var(--text-tertiary)' };
      default:
        return { label: remark.status, color: 'var(--border-default)', bg: 'transparent', border: 'var(--border-default)' };
    }
  };

  const getStatusOptions = () => [
    { value: 'open', label: 'Открыто', color: 'var(--error)' },
    { value: 'in-progress', label: 'В работе', color: 'var(--info)' },
    { value: 'verification', label: 'На проверке', color: 'var(--warning)' },
    { value: 'resolved', label: 'Решено', color: 'var(--success)' },
    { value: 'rejected', label: 'Отклонено', color: 'var(--text-tertiary)' },
  ];

  const statusBadge = getStatusBadge();
  const statusOptions = getStatusOptions();

  const handleSave = () => {
    // Здесь будет API вызов для сохранения
    setEditMode(false);
  };

  const handleSendResponse = () => {
    // Здесь будет API вызов для отправки ответа
    setNewResponse('');
  };

  const handleSaveProgress = () => {
    // Здесь будет API вызов для сохранения прогресса
    setShowProgressUpdate(false);
    setWhatChanged('');
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Заголовок с навигацией */}
      <div
        className="px-3 py-2 border-b flex items-center gap-2 sticky top-0 z-10"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: 'var(--accent-engineering)' }} />
          <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {remark.number}
          </h3>
        </div>
        <div className="flex-1" />
        {editMode ? (
          <button
            onClick={() => setEditMode(false)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Статус и приоритет */}
        <div className="flex items-center justify-between">
          <select
            value={remark.status}
            className="px-2 py-1 rounded text-xs font-medium border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: statusBadge.bg,
              borderColor: statusBadge.border,
              color: statusBadge.color,
            }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                {opt.label}
              </option>
            ))}
          </select>

          <span
            className="text-[10px] px-2 py-1 rounded border"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-tertiary)',
            }}
          >
            {remark.category}
          </span>
        </div>

        {/* Текст замечания */}
        <div>
          <h4
            className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Описание
          </h4>

          {editMode ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded border resize-none focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                rows={4}
              />
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}
              >
                <Save size={12} />
                Сохранить
              </button>
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {remark.text}
            </p>
          )}
        </div>

        {/* Информация */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <InfoRow label="Автор" value={remark.author} />
          <InfoRow label="Исполнитель" value={remark.assignee} />
          <InfoRow label="Дата" value={new Date(remark.date).toLocaleDateString('ru-RU')} />
          <InfoRow label="Срок" value={new Date(remark.dueDate).toLocaleDateString('ru-RU')} />
        </div>

        {/* Что исправлено */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Что исправлено
            </h4>
            <button
              onClick={() => setShowProgressUpdate(!showProgressUpdate)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            >
              <Plus size={10} />
              Добавить
            </button>
          </div>

          {showProgressUpdate && (
            <div className="mb-2 p-2 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)' }}>
              <textarea
                value={whatChanged}
                onChange={(e) => setWhatChanged(e.target.value)}
                placeholder="Опишите, что было исправлено..."
                className="w-full px-2 py-1.5 text-xs rounded border resize-none focus:outline-none focus:ring-2 mb-2"
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                rows={3}
              />
              <button
                onClick={handleSaveProgress}
                className="w-full px-2 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: 'var(--accent-engineering)', color: 'var(--text-inverse)' }}
              >
                Сохранить обновление
              </button>
            </div>
          )}

          {remark.progressUpdates.length > 0 ? (
            <div className="space-y-2">
              {remark.progressUpdates.map((update) => (
                <div
                  key={update.id}
                  className="p-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--bg-surface-2)',
                    borderColor: 'var(--border-default)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {update.author}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(update.date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {update.text}
                  </p>
                  {update.whatChanged && (
                    <div
                      className="text-xs p-1.5 rounded"
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: 'var(--success)',
                      }}
                    >
                      <strong>Исправлено:</strong> {update.whatChanged}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Пока нет обновлений по прогрессу
            </p>
          )}
        </div>

        {/* Что осталось сделать */}
        <div>
          <h4
            className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Остаток работ
          </h4>
          <div
            className="p-2 rounded-lg border text-xs"
            style={{
              backgroundColor: remark.status === 'open' || remark.status === 'in-progress' ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-surface-2)',
              borderColor: remark.status === 'open' || remark.status === 'in-progress' ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-default)',
            }}
          >
            {remark.status === 'open' && <span style={{ color: 'var(--error)' }}>Требует ответа и исправлений</span>}
            {remark.status === 'in-progress' && <span style={{ color: 'var(--info)' }}>В процессе исправления</span>}
            {remark.status === 'verification' && <span style={{ color: 'var(--warning)' }}>Ждёт повторной проверки</span>}
            {remark.status === 'resolved' && <span style={{ color: 'var(--success)' }}>Готово к закрытию</span>}
            {remark.status === 'rejected' && <span style={{ color: 'var(--text-tertiary)' }}>Отклонено, требуется переоценка</span>}
          </div>
        </div>

        {/* Ответы / обсуждение */}
        <div>
          <h4
            className="text-[10px] font-semibold uppercase tracking-wide mb-1.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Обсуждение ({remark.responses.length})
          </h4>

          <div className="space-y-2">
            {remark.responses.map((response) => (
              <div
                key={response.id}
                className="p-2 rounded-lg border"
                style={{
                  backgroundColor: response.isOfficial ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-surface-2)',
                  borderColor: response.isOfficial ? 'var(--info)' : 'var(--border-default)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {response.author}
                    </span>
                    {response.isOfficial && (
                      <span
                        className="text-[9px] px-1 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--info)',
                          color: 'var(--text-inverse)',
                        }}
                      >
                        Официально
                      </span>
                    )}
                  </div>
                  <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(response.date).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                  {response.text}
                </p>
              </div>
            ))}
          </div>

          {/* Форма ответа */}
          <div className="mt-2 flex gap-2">
            <textarea
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="Написать ответ..."
              className="flex-1 px-2 py-1.5 text-xs rounded border resize-none focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              rows={2}
            />
            <button
              onClick={handleSendResponse}
              disabled={!newResponse.trim()}
              className="p-1.5 rounded transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-engineering)',
                color: 'var(--text-inverse)',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

interface QuickActionBtnProps {
  label: string;
  variant?: 'primary' | 'warning';
  size?: 'sm' | 'md';
}

function QuickActionBtn({ label, variant = 'primary', size = 'md' }: QuickActionBtnProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent-approvals) 92%, white 8%), var(--accent-approvals))',
          color: '#1a1a1a',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: 'var(--accent-engineering)',
          color: 'var(--text-inverse)',
          borderColor: 'transparent',
        };
    }
  };

  const sizeStyles = size === 'sm'
    ? { padding: '2px 6px', fontSize: '10px' }
    : { padding: '6px 10px', fontSize: '12px' };

  const variantStyles = getVariantStyles();

  return (
    <button
      className="rounded transition-all whitespace-nowrap"
      style={{ ...variantStyles, ...sizeStyles }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = 'brightness(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      {label}
    </button>
  );
}

