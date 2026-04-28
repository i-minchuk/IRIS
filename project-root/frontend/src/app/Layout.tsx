// frontend/src/app/Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StatusBar } from '@/components/StatusBar';
import { CollaborationProvider } from '@/features/collaboration/components/CollaborationProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { FolderTabs } from '@/components/FolderTabs';
import { ZoomControl } from '@/features/zoom/components/ZoomControl';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: 'var(--layout-bg)' }}
    >
      {/* Хедер */}
      <header
        className="transition-colors duration-300 border-b"
        style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1
                className="text-lg font-bold tracking-tight transition-colors duration-200"
                style={{ color: 'var(--text-primary)' }}
              >
                ДокПоток <span className="text-[#00F0FF]">IRIS</span>
              </h1>
            </div>

            {/* Гамбургер меню (только mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Десктоп панель */}
            <div className="hidden lg:flex items-center space-x-3">
              <ZoomControl />

              <span className="text-sm transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}>
                {user?.full_name || user?.email}
              </span>

              {/* Кнопка переключения темы */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--button-bg)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--button-bg)';
                }}
                title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm rounded-md transition-colors"
                style={{
                  border: '1px solid rgba(255, 77, 109, 0.4)',
                  color: '#FF4D6D',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 77, 109, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>

        {/* Mobile меню */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden border-t transition-colors duration-200"
            style={{ borderColor: 'var(--header-border)', backgroundColor: 'var(--header-bg)' }}
          >
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {user?.full_name || user?.email}
                </span>
                <div className="flex items-center gap-2">
                  <ZoomControl />
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--button-bg)', color: 'var(--text-secondary)' }}
                  >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-sm rounded-md transition-colors"
                style={{
                  border: '1px solid rgba(255, 77, 109, 0.4)',
                  color: '#FF4D6D',
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Контентная область (папка + вкладки) */}
      <main className="flex-1 w-full">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <FolderTabs />
          <div
            className="rounded-b-2xl rounded-tr-2xl rounded-tl-none shadow-2xl border border-t-0 -mt-px min-h-[calc(100vh-var(--iris-header-height)-80px)] p-4 sm:p-6 transition-colors duration-300"
            style={{
              background: 'linear-gradient(180deg, var(--content-bg) 0%, var(--layout-bg) 100%)',
              borderColor: 'var(--content-border)',
            }}
          >
            <CollaborationProvider>
              <Outlet />
            </CollaborationProvider>
          </div>
        </div>
      </main>

      <StatusBar />

      <footer
        className="border-t py-2 transition-colors duration-200"
        style={{ backgroundColor: 'var(--layout-bg)', borderColor: 'var(--header-border)' }}
      >
        <div className="mx-auto px-4 text-[10px] flex flex-col sm:flex-row justify-between items-center gap-1 transition-colors duration-200" style={{ color: 'var(--text-muted)' }}>
          <span className="text-center sm:text-left">ДокПоток IRIS — система управления инженерной документацией</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
};
