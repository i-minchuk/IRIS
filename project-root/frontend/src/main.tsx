// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { router } from './app/router';
import { ThemeProvider } from './providers/ThemeProvider';
import { LanguageProvider } from "./features/profile/i18n/LanguageContext";
import { useAuthStore } from './features/auth/store/authStore';
import { Toaster } from 'sonner';
import { FloatingZoom } from './features/zoom/components/FloatingZoom';
import './shared/styles/globals.css';

function App() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-app, #f8fafc)' }}>
      <div className="max-w-md w-full rounded-2xl border p-8 text-center shadow-sm" style={{ backgroundColor: 'var(--bg-surface, #ffffff)', borderColor: 'var(--border-default, #e2e8f0)' }}>
        <h1 className="text-lg font-semibold mb-2">Что-то пошло не так</h1>
        <p className="text-sm mb-4">В приложении произошла непредвиденная ошибка.</p>
        <button onClick={resetErrorBoundary} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
          Перезагрузить
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
          <App />
          <FloatingZoom />  {/* ← ВНЕ App, вне масштаба */}
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);