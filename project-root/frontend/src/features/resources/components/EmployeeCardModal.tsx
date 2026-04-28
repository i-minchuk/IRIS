import { X } from 'lucide-react';
import type { HeatmapEmployee } from '../api/resources';

interface EmployeeCardModalProps {
  employee: HeatmapEmployee | null;
  onClose: () => void;
}

const mockDailyLoad = [65, 78, 82, 90, 45, 0, 0]; // Mon-Sun
const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const EmployeeCardModal: React.FC<EmployeeCardModalProps> = ({
  employee,
  onClose,
}) => {
  if (!employee) return null;

  const maxLoad = Math.max(...mockDailyLoad, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative rounded-2xl shadow-xl w-full max-w-md p-5 neon-card">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          {employee.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Текущая загрузка: {employee.load}%
        </p>

        {/* Daily load bars */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
            Загрузка по дням
          </div>
          <div className="flex items-end gap-2 h-28">
            {mockDailyLoad.map((load, idx) => {
              const height = `${(load / maxLoad) * 100}%`;
              const color =
                load >= 90
                  ? 'bg-rose-500'
                  : load >= 70
                  ? 'bg-emerald-500'
                  : load >= 50
                  ? 'bg-amber-500'
                  : 'bg-slate-300 dark:bg-slate-600';
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t ${color} transition-all`}
                      style={{ height }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">
                    {days[idx]}
                  </span>
                  <span className="text-[10px] font-medium text-gray-700 dark:text-slate-300">
                    {load}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects */}
        {employee.projects.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-2">
              Текущие проекты
            </div>
            <div className="flex flex-wrap gap-1.5">
              {employee.projects.map((proj) => (
                <span
                  key={proj}
                  className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                >
                  {proj}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
