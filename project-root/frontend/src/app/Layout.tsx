// frontend/src/app/Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StatusBar } from '@/components/StatusBar';
import { CollaborationProvider } from '@/features/collaboration/components/CollaborationProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { FolderTabs } from '@/components/FolderTabs';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1220] flex flex-col">
      {/* Хедер */}
      <header className="bg-white dark:bg-[#0F172A] shadow-sm border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Логотип */}
            <div className="flex items-center space-x-2">
              <img
                src="/icons/logo-light.svg"
                alt="ДокПоток IRIS"
                className="h-8 w-8 dark:hidden"
              />
              <img
                src="/icons/logo-dark.svg"
                alt="ДокПоток IRIS"
                className="h-8 w-8 hidden dark:block"
              />
              <h1 className="text-lg font-bold text-[#1E2230] dark:text-white tracking-tight">
                ДокПоток <span className="text-[#4F7A4C]">IRIS</span>
              </h1>
            </div>

            {/* Гамбургер меню (только mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Десктоп панель */}
            <div className="hidden lg:flex items-center space-x-3">
              <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">{user?.full_name || user?.email}</span>

              {/* Кнопка переключения темы */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-[#F5F7FA] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] transition-colors"
                title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm border border-[#DC2626] text-[#DC2626] rounded-md hover:bg-[#DC2626]/5 dark:hover:bg-[#DC2626]/10 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>

        {/* Mobile меню */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A]">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">{user?.full_name || user?.email}</span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-[#F5F7FA] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-sm border border-[#DC2626] text-[#DC2626] rounded-md hover:bg-[#DC2626]/5 dark:hover:bg-[#DC2626]/10 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Вкладки-разделители */}
      <FolderTabs />

      {/* Контентная область (папка) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-px">
        <div className="bg-white dark:bg-[#0F172A] rounded-b-xl rounded-tr-xl rounded-tl-none shadow-sm border border-[#E2E8F0] dark:border-[#1E293B] border-t-0 min-h-[calc(100vh-200px)] p-4 sm:p-6">
          <CollaborationProvider>
            <Outlet />
          </CollaborationProvider>
        </div>
      </main>

      <StatusBar />

      <footer className="bg-[#F5F7FA] dark:bg-[#0B1220] border-t border-[#E2E8F0] dark:border-[#1E293B] py-1">
        <div className="max-w-[1600px] mx-auto px-4 text-[10px] text-[#94A3B8] dark:text-[#64748B] flex justify-between">
          <span>ДокПоток IRIS — управление инженерной документацией</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
};
