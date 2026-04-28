// frontend/src/main.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { ThemeProvider } from './providers/ThemeProvider';
import { useAuthStore } from './features/auth/store/authStore';
import { useZoomStore } from './features/zoom/store/zoomStore';
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

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
