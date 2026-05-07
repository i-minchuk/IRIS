import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FolderKanban, FileText, ClipboardList, Archive } from 'lucide-react';
import { getProjects } from '@/api/projects';
import { getRemarks } from '@/api/remarks';
import type { Project } from '@/api/projects';
import type { PaginatedResponse, RemarkListItem } from '@/types/remarks';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0, remarks: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [projects, remarksResponse]: [Project[], PaginatedResponse<RemarkListItem>] = await Promise.all([
        getProjects(),
        getRemarks({ page: 1, page_size: 1 }),
      ]);
      setStats({ projects: projects.length, remarks: remarksResponse.total });
    } catch {
      // ignore
    }
  };

  const cards = [
    { title: 'Панель аналитики', subtitle: 'KPI и статистика', icon: <BarChart3 size={32} />, color: 'bg-blue-500', hover: 'hover:bg-blue-600', path: '/analytics' },
    { title: 'Портфель заказов', subtitle: `${stats.projects} активных проектов`, icon: <FolderKanban size={32} />, color: 'bg-purple-500', hover: 'hover:bg-purple-600', path: '/projects' },
    { title: 'Документация', subtitle: 'Все документы проектов', icon: <FileText size={32} />, color: 'bg-green-500', hover: 'hover:bg-green-600', path: '/documents' },
    { title: 'Документооборот', subtitle: 'Задачи и замечания', icon: <ClipboardList size={32} />, color: 'bg-yellow-500', hover: 'hover:bg-yellow-600', path: '/workflow' },
    { title: 'Архив', subtitle: 'История и версии', icon: <Archive size={32} />, color: 'bg-gray-500', hover: 'hover:bg-gray-600', path: '/archive' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <h1 className="text-2xl font-bold text-[#1E2230] mb-2">ДокПоток IRIS</h1>
      <p className="text-sm text-[#64748B] mb-8">Выберите раздел</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {cards.map((card) => (
          <button key={card.path} onClick={() => navigate(card.path)}
            className={`${card.color} ${card.hover} text-white rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 text-left flex flex-col gap-3`}>
            <div className="bg-white/20 w-fit p-2 rounded-xl">{card.icon}</div>
            <div><h2 className="text-lg font-bold">{card.title}</h2><p className="text-sm text-white/80">{card.subtitle}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
}
