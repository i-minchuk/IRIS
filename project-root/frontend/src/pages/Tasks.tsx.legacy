import { useEffect, useState } from 'react';
import { getTodayTasks } from '../api/tasks';
import type { Task } from '../types';
import StatusBadge from '../components/StatusBadge';
import { Clock, AlertCircle, } from 'lucide-react';

const MOCK_TASKS: Task[] = [
  { id: 1, project_id: 1, document_id: 1, task_type: 'design', title: 'Разработка КМ-001', status: 'in_progress', planned_start: '2026-03-20', planned_finish: '2026-03-28', planned_hours: 40, actual_hours: 24, percent_complete: 60, engineer: 'Иванов А.А.', is_critical: true, es: 0, ef: 5, ls: 0, lf: 5, slack: 0 },
  { id: 2, project_id: 1, document_id: 2, task_type: 'review', title: 'Проверка КМ-002', status: 'not_started', planned_start: '2026-03-25', planned_finish: '2026-03-27', planned_hours: 8, actual_hours: 0, percent_complete: 0, engineer: 'Петров Б.В.', is_critical: false, es: 5, ef: 7, ls: 6, lf: 8, slack: 1 },
  { id: 3, project_id: 2, document_id: 3, task_type: 'design', title: 'Схема ЭС-001', status: 'in_progress', planned_start: '2026-03-18', planned_finish: '2026-03-26', planned_hours: 32, actual_hours: 28, percent_complete: 85, engineer: 'Сидоров В.Г.', is_critical: true, es: 0, ef: 8, ls: 0, lf: 8, slack: 0 },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

  useEffect(() => {
    getTodayTasks().then(setTasks).catch(() => {});
  }, []);

  const criticalTasks = tasks.filter(t => t.is_critical);
  const otherTasks = tasks.filter(t => !t.is_critical);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Задачи</h1>

      {criticalTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2 mb-3">
            <AlertCircle size={20} /> Критические задачи
          </h2>
          <div className="space-y-3">
            {criticalTasks.map(t => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Clock size={20} className="text-gray-500" /> Все задачи
        </h2>
        <div className="space-y-3">
          {otherTasks.map(t => (
            <TaskCard key={t.id} task={t} />
          ))}
          {otherTasks.length === 0 && (
            <div className="text-gray-400 text-center py-8">Нет задач на сегодня</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${task.is_critical ? 'border-red-500' : 'border-primary-500'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">{task.title}</h3>
          <StatusBadge status={task.status} />
          {task.is_critical && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Критический путь</span>}
        </div>
        <span className="text-sm text-gray-500">{task.engineer || 'Не назначен'}</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-gray-500">
        <span>Срок: {task.planned_start} — {task.planned_finish}</span>
        <span>Часы: {task.actual_hours}/{task.planned_hours}ч</span>
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-1.5">
            <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${task.percent_complete}%` }} />
          </div>
          <span>{task.percent_complete}%</span>
        </div>
        {task.slack !== null && <span className="text-gray-400">Резерв: {task.slack}д</span>}
      </div>
    </div>
  );
}
