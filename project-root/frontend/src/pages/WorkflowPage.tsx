import { useState } from 'react';
import { ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';

export function WorkflowPage() {
  const [tab, setTab] = useState<'remarks' | 'tasks'>('remarks');

  const remarks = [
    { id: 1, title: 'Несоответствие размеров фланца', status: 'open', priority: 'high' },
    { id: 2, title: 'Отсутствует подпись проверяющего', status: 'resolved', priority: 'medium' },
    { id: 3, title: 'Уточнить материал уплотнения', status: 'open', priority: 'low' },
  ];

  const tasks = [
    { id: 1, title: 'Согласовать КМД с заказчиком', status: 'in_progress' },
    { id: 2, title: 'Подготовить спецификацию арматуры', status: 'pending' },
    { id: 3, title: 'Проверить протокол испытаний', status: 'completed' },
  ];

  return (
    <div className="p-6 bg-[#1E2230] min-h-screen">
      <h1 className="text-2xl font-bold text-neon-yellow mb-4">Документооборот</h1>

      <div className="flex gap-4 mb-6 border-b border-[#2F3654]">
        <button
          onClick={() => setTab('remarks')}
          className={`pb-3 px-2 font-medium transition-colors ${
            tab === 'remarks'
              ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]'
              : 'text-[#94A3B8] hover:text-[#E8ECF1]'
          }`}
        >
          Замечания ({remarks.length})
        </button>
        <button
          onClick={() => setTab('tasks')}
          className={`pb-3 px-2 font-medium transition-colors ${
            tab === 'tasks'
              ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]'
              : 'text-[#94A3B8] hover:text-[#E8ECF1]'
          }`}
        >
          Задачи ({tasks.length})
        </button>
      </div>

      {tab === 'remarks' && (
        <div className="space-y-3">
          {remarks.map((remark) => (
            <div
              key={remark.id}
              className="bg-[#2A3042] neon-yellow rounded-xl p-4 flex items-start gap-3"
            >
              {remark.status === 'resolved' ? (
                <CheckCircle size={20} className="text-green-400 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-amber-400 mt-0.5" />
              )}
              <div>
                <h3 className="font-medium text-[#E8ECF1]">{remark.title}</h3>
                <p className="text-sm text-[#94A3B8]">
                  Статус: {remark.status === 'open' ? 'Открыто' : 'Закрыто'} | Приоритет:{' '}
                  {remark.priority === 'high' ? 'Высокий' : remark.priority === 'medium' ? 'Средний' : 'Низкий'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#2A3042] neon-yellow rounded-xl p-4 flex items-start gap-3"
            >
              <ClipboardList size={20} className="text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-[#E8ECF1]">{task.title}</h3>
                <p className="text-sm text-[#94A3B8]">
                  Статус:{' '}
                  {task.status === 'completed'
                    ? 'Выполнено'
                    : task.status === 'in_progress'
                    ? 'В работе'
                    : 'В ожидании'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
