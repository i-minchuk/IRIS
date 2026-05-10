// frontend/src/main.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { router } from './app/router';
import { ThemeProvider } from './providers/ThemeProvider';
import { LanguageProvider } from "./features/profile/i18n/LanguageContext";
import { useAuthStore } from './features/auth/store/authStore';
import { useZoomStore } from './features/zoom/store/zoomStore';
import { Toaster } from 'sonner';
import './shared/styles/globals.css';

function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const scale = useZoomStore((state) => state.scale);

  useEffect(() => {
    document.documentElement.style.zoom = `${Math.round(scale * 100)}%`;
  }, [scale]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--layout-bg)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-app, #f8fafc)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl border p-8 text-center shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderColor: 'var(--border-default, #e2e8f0)',
        }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--error-bg, #fef2f2)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--error, #dc2626)' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary, #1e293b)' }}>
          Что-то пошло не так
        </h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #64748b)' }}>
          В приложении произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
        </p>
        <details className="mb-6 text-left">
          <summary className="text-xs cursor-pointer mb-2" style={{ color: 'var(--text-tertiary, #94a3b8)' }}>
            Подробности ошибки
          </summary>
          <pre
            className="text-xs p-3 rounded-lg overflow-auto max-h-32"
            style={{
              backgroundColor: 'var(--bg-surface-2, #f1f5f9)',
              color: 'var(--error, #dc2626)',
            }}
          >
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-engineering, #4f46e5)',
            color: 'var(--text-inverse, #ffffff)',
          }}
        >
          Перезагрузить приложение
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider>
        <LanguageProvider>
          <App />  {/* ← ИСПРАВЛЕНО: используем App вместо прямого RouterProvider */}
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);