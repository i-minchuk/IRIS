import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectHealth, getEngineerSPI } from '../api/dashboard';
import { getProjectTasks } from '../api/tasks';
import type { ProjectHealth, Task, EngineerSPI } from '../types';
import StatusBadge from '../components/StatusBadge';
import SPIIndicator from '../components/SPIIndicator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, ListTodo, BarChart3, Shield } from 'lucide-react';

const MOCK_TASKS: Task[] = [
  {
    id: 1,
    project_id: 1,
    document_id: 1,
    task_type: 'design',
    title: 'КМ-001 Общий вид',
    status: 'completed',
    planned_start: '2026-03-01',
    planned_finish: '2026-03-10',
    planned_hours: 40,
    actual_hours: 38,
    percent_complete: 100,
    engineer: 'Иванов А.А.',
    is_critical: true,
    es: 0,
    ef: 7,
    ls: 0,
    lf: 7,
    slack: 0,
  },
  {
    id: 2,
    project_id: 1,
    document_id: 2,
    task_type: 'design',
    title: 'КМ-002 Узлы сопряжения',
    status: 'in_progress',
    planned_start: '2026-03-08',
    planned_finish: '2026-03-20',
    planned_hours: 48,
    actual_hours: 24,
    percent_complete: 50,
    engineer: 'Петров Б.В.',
    is_critical: true,
    es: 5,
    ef: 14,
    ls: 5,
    lf: 14,
    slack: 0,
  },
  {
    id: 3,
    project_id: 1,
    document_id: 1,
    task_type: 'review',
    title: 'КМ-001 Проверка',
    status: 'in_progress',
    planned_start: '2026-03-11',
    planned_finish: '2026-03-14',
    planned_hours: 8,
    actual_hours: 4,
    percent_complete: 50,
    engineer: 'Сидоров В.Г.',
    is_critical: true,
    es: 7,
    ef: 10,
    ls: 7,
    lf: 10,
    slack: 0,
  },
  {
    id: 4,
    project_id: 1,
    document_id: 3,
    task_type: 'design',
    title: 'ЭС-001 Электроснабжение',
    status: 'not_started',
    planned_start: '2026-03-15',
    planned_finish: '2026-03-25',
    planned_hours: 32,
    actual_hours: 0,
    percent_complete: 0,
    engineer: 'Козлов Д.И.',
    is_critical: false,
    es: 3,
    ef: 11,
    ls: 5,
    lf: 13,
    slack: 2,
  },
  {
    id: 5,
    project_id: 1,
    document_id: 2,
    task_type: 'review',
    title: 'КМ-002 Проверка',
    status: 'not_started',
    planned_start: '2026-03-21',
    planned_finish: '2026-03-24',
    planned_hours: 8,
    actual_hours: 0,
    percent_complete: 0,
    engineer: 'Сидоров В.Г.',
    is_critical: true,
    es: 14,
    ef: 17,
    ls: 14,
    lf: 17,
    slack: 0,
  },
  {
    id: 6,
    project_id: 1,
    document_id: 1,
    task_type: 'approval',
    title: 'КМ-001 Утверждение',
    status: 'not_started',
    planned_start: '2026-03-15',
    planned_finish: '2026-03-17',
    planned_hours: 4,
    actual_hours: 0,
    percent_complete: 0,
    engineer: 'Новиков Е.К.',
    is_critical: true,
    es: 10,
    ef: 12,
    ls: 10,
    lf: 12,
    slack: 0,
  },
];

const MOCK_HEALTH: ProjectHealth = {
  project: { id: 1, name: 'Модернизация НПЗ', code: 'PRJ-001' },
  spi: 0.92,
  total_tasks: 45,
  completed_tasks: 28,
  in_progress_tasks: 10,
  critical_tasks: 12,
  overdue_tasks: 3,
  risk_level: 'medium',
};

const MOCK_ENGINEERS: EngineerSPI[] = [
  { engineer: 'Иванов А.А.', total_tasks: 12, completed_tasks: 10, spi: 1.05 },
  { engineer: 'Петров Б.В.', total_tasks: 10, completed_tasks: 6, spi: 0.85 },
  { engineer: 'Сидоров В.Г.', total_tasks: 8, completed_tasks: 7, spi: 0.98 },
  { engineer: 'Козлов Д.И.', total_tasks: 8, completed_tasks: 3, spi: 0.72 },
  { engineer: 'Новиков Е.К.', total_tasks: 7, completed_tasks: 2, spi: 0.65 },
];

const TABS = [
  { id: 'overview', label: 'Обзор', icon: Activity },
  { id: 'tasks', label: 'Задачи', icon: ListTodo },
  { id: 'gantt', label: 'Диаграмма Ганта', icon: BarChart3 },
  { id: 'health', label: 'Здоровье проекта', icon: Shield },
] as const;

export default function ProjectDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState<string>('overview');
  const [health, setHealth] = useState<ProjectHealth>(MOCK_HEALTH);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [engineers, setEngineers] = useState<EngineerSPI[]>(MOCK_ENGINEERS);

  useEffect(() => {
    if (id) {
      const pid = Number(id);
      getProjectHealth(pid).then(setHealth).catch(() => {});
      getProjectTasks(pid).then(setTasks).catch(() => {});
      getEngineerSPI(pid).then(setEngineers).catch(() => {});
    }
  }, [id]);

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{health.project.name}</h1>
            <p className="text-gray-500">{health.project.code}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">SPI проекта</div>
              <SPIIndicator value={health.spi} />
            </div>
            <StatusBadge status={health.risk_level} />
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="SPI"
            value={health.spi?.toFixed(2) || '—'}
            color={
              health.risk_level === 'low'
                ? 'green'
                : health.risk_level === 'medium'
                ? 'yellow'
                : 'red'
            }
          />
          <MetricCard label="Всего задач" value={String(health.total_tasks)} color="blue" />
          <MetricCard label="Завершено" value={String(health.completed_tasks)} color="green" />
          <MetricCard label="Просрочено" value={String(health.overdue_tasks)} color="red" />
        </div>
      )}

      {tab === 'tasks' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Задача
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Тип
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Исполнитель
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Прогресс
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Резерв
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  className={`hover:bg-gray-50 ${t.is_critical ? 'border-l-4 border-red-500' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-sm">{t.title}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.task_type || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.engineer || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary-600 h-1.5 rounded-full"
                          style={{ width: `${t.percent_complete}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{t.percent_complete}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {t.slack !== null && t.slack !== undefined ? `${t.slack} дн.` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'gantt' && <GanttChart tasks={tasks} />}

      {tab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold mb-4">SPI по инженерам</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engineers}>
                <XAxis dataKey="engineer" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1.5]} />
                <Tooltip />
                <Bar dataKey="spi" name="SPI">
                  {engineers.map((e, i) => (
                    <Cell
                      key={i}
                      fill={
                        e.spi && e.spi >= 0.95
                          ? 'var(--success)'
                          : e.spi && e.spi >= 0.8
                          ? 'var(--warning)'
                          : 'var(--error)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-bg-card rounded-xl shadow-sm p-6">
            <h2 className="font-semibold mb-3">Критические задачи в зоне риска</h2>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.is_critical && t.status !== 'completed')
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-4 py-2 bg-error-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-error-800">{t.title}</span>
                    <span className="text-xs text-error-600">
                      {t.engineer} — резерв: {t.slack ?? 0} дн.
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Gantt Chart Component ===== */
function GanttChart({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <div className="text-text-muted text-center py-12">Нет задач для отображения</div>;
  }

  const minES = Math.min(...tasks.map((t) => t.es ?? 0));
  const maxEF = Math.max(...tasks.map((t) => t.ef ?? 1));
  const totalDays = Math.max(maxEF - minES, 1);
  const dayWidth = 40;
  const rowHeight = 36;
  const labelWidth = 220;

  const days = Array.from({ length: totalDays + 1 }, (_, i) => minES + i);

  return (
    <div className="bg-bg-card rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Диаграмма Ганта</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 bg-error rounded inline-block" />
            Критический путь
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 bg-primary-500 rounded inline-block" />
            Обычная задача
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-3 bg-success rounded inline-block" />
            Завершена
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <div style={{ minWidth: labelWidth + totalDays * dayWidth + dayWidth }}>
          <div className="flex border-b bg-bg-page sticky top-0">
            <div
              className="flex-shrink-0 px-3 py-2 text-xs font-medium text-text-muted border-r"
              style={{ width: labelWidth }}
            >
              Задача
            </div>

            {days.map((day, i) => (
              <div
                key={`day-${day}-${i}`}
                className="text-center text-[10px] text-text-muted py-2 border-r"
                style={{ width: dayWidth }}
              >
                День {day}
              </div>
            ))}
          </div>

          {tasks.map((t) => {
            const es = (t.es ?? 0) - minES;
            const ef = (t.ef ?? 1) - minES;
            const duration = Math.max(ef - es, 0.5);
            const barColor =
              t.status === 'completed'
                ? 'var(--success)'
                : t.is_critical
                ? 'var(--error)'
                : 'var(--primary)';
            const progressWidth = t.percent_complete ?? 0;

            return (
              <div
                key={t.id}
                className="flex items-center border-b hover:bg-bg-page"
                style={{ height: rowHeight }}
              >
                <div
                  className="flex-shrink-0 px-3 text-xs truncate border-r flex items-center gap-1"
                  style={{ width: labelWidth }}
                >
                  {t.is_critical && (
                    <span className="w-1.5 h-1.5 bg-error rounded-full flex-shrink-0" />
                  )}
                  <span className="truncate">{t.title}</span>
                </div>

                <div className="relative flex-1" style={{ height: rowHeight }}>
                  {days.map((day, i) => (
                    <div
                      key={`grid-${day}-${i}`}
                      className="absolute top-0 bottom-0 border-r border-border-light"
                      style={{ left: i * dayWidth, width: dayWidth }}
                    />
                  ))}

                  <div
                    className="absolute top-1.5 rounded shadow-sm"
                    style={{
                      left: es * dayWidth + 2,
                      width: Math.max(duration * dayWidth - 4, 12),
                      height: rowHeight - 12,
                      backgroundColor: barColor,
                      opacity: 0.85,
                    }}
                  >
                    <div
                      className="absolute top-0 bottom-0 rounded opacity-30 bg-white"
                      style={{
                        left: `${progressWidth}%`,
                        right: 0,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">
                      {progressWidth > 0 ? `${progressWidth}%` : ''}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-info-50 text-info-700',
    green: 'bg-success-50 text-success-700',
    yellow: 'bg-warning-50 text-warning-700',
    red: 'bg-error-50 text-error-700',
  };

  return (
    <div className={`rounded-xl p-5 ${colors[color] || colors.blue}`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}