// frontend/src/app/Layout.tsx
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StatusBar } from '@/components/StatusBar';
import { CollaborationProvider } from '@/features/collaboration/components/CollaborationProvider';

const navItems = [
  { path: '/projects', label: 'Проекты', color: 'border-blue-500 text-blue-600' },
  { path: '/documents', label: 'Документы', color: 'border-emerald-500 text-emerald-600' },
  { path: '/dependencies', label: 'Зависимости', color: 'border-indigo-500 text-indigo-600' },
  { path: '/remarks', label: 'Замечания', color: 'border-amber-500 text-amber-600' },
  { path: '/analytics', label: 'Аналитика', color: 'border-purple-500 text-purple-600' },
  { path: '/resources', label: 'Ресурсы', color: 'border-cyan-500 text-cyan-600' },
  { path: '/tenders', label: 'Тендеры', color: 'border-rose-500 text-rose-600' },
  { path: '/admin', label: 'Админ', color: 'border-slate-500 text-slate-600' },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                И
              </div>
              <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                ДокПоток <span className="text-blue-600">IRIS</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.full_name || user?.email}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm border border-red-400 text-red-500 rounded-md hover:bg-red-50 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
        <nav className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="flex space-x-1 -mb-px min-w-max">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-4 py-3 border-b-4 text-sm font-medium transition-colors ${
                    isActive
                      ? `${item.color} bg-gray-50`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CollaborationProvider>
          <Outlet />
        </CollaborationProvider>
      </main>
      <StatusBar />
      <footer className="bg-gray-50 border-t border-gray-200 py-1">
        <div className="max-w-[1600px] mx-auto px-4 text-[10px] text-gray-400 flex justify-between">
          <span>ДокПоток IRIS — управление инженерной документацией</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
};
