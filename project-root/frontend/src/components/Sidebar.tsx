import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, FolderKanban, FileText, ArrowLeftRight, Archive, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const menuItems = [
    { path: '/analytics', label: 'Панель аналитики', icon: <BarChart3 size={20} />, neon: 'neon-blue', text: 'text-neon-blue', color: '#3B82F6' },
    { path: '/projects', label: 'Портфель заказов', icon: <FolderKanban size={20} />, neon: 'neon-purple', text: 'text-neon-purple', color: '#6B5B95' },
    { path: '/documents', label: 'Документация', icon: <FileText size={20} />, neon: 'neon-green', text: 'text-neon-green', color: '#4F7A4C' },
    { path: '/workflow', label: 'Документооборот', icon: <ArrowLeftRight size={20} />, neon: 'neon-yellow', text: 'text-neon-yellow', color: '#D4AF37' },
    { path: '/archive', label: 'Архив', icon: <Archive size={20} />, neon: 'neon-gray', text: 'text-neon-gray', color: '#6B7280' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-[#1E2230] border-r border-[#2F3654] min-h-screen flex flex-col flex-shrink-0">
      {/* Логотип */}
      <div className="p-5 border-b border-[#2F3654]">
        <div className="flex items-center gap-2.5">
          <img
            src="/Иконка ДокПоток IRIS.png"
            alt="ДокПоток IRIS"
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <span className="text-base font-bold text-[#E8ECF1]">ДокПоток</span>
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3b82f6] text-white">IRIS</span>
          </div>
        </div>
      </div>

      {/* Меню */}
      <nav className="flex-1 p-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-sm ${
              isActive(item.path)
                ? `${item.neon} font-semibold`
                : 'text-[#94A3B8] hover:bg-[#2A3042] hover:text-[#E8ECF1]'
            }`}
          >
            <span style={{ color: isActive(item.path) ? item.color : undefined }}>{item.icon}</span>
            <span className={isActive(item.path) ? item.text : ''}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Выход */}
      <div className="p-3 border-t border-[#2F3654]">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-950/30 text-red-400 transition-colors text-sm"
        >
          <LogOut size={18} />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
