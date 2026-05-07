// frontend/src/app/Layout.tsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StatusBar } from '@/components/StatusBar';
import { CollaborationProvider } from '@/features/collaboration/components/CollaborationProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import { FolderTabs } from '@/components/FolderTabs';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'АД';

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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1e3a8a] rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="3" width="12" height="14" rx="2" fill="white"/>
                  <path d="M7 8H13M7 11H11M7 14H10" stroke="#1e3a8a" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-[#1e2230] dark:text-white">ДокПоток</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#3b82f6] text-white">IRIS</span>
            </div>

            {/* Правая панель */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e2230] dark:text-[#94a3b8] dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                Выход
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[#64748b] hover:text-[#1e2230] dark:text-[#94a3b8] dark:hover:text-white transition-colors"
                title={isDark ? 'Светлая тема' : 'Тёмная тема'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="w-8 h-8 rounded-full bg-[#e2e8f0] dark:bg-[#334155] flex items-center justify-center text-xs font-bold text-[#1e2230] dark:text-white">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Табы */}
      <FolderTabs />

      {/* Контентная область */}
      <main className="flex-1 w-full">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-b-2xl shadow-2xl border border-t-0 min-h-[calc(100vh-var(--iris-header-height)-80px)] p-4 sm:p-6 transition-colors duration-300"
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
