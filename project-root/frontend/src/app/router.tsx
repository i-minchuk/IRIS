import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import { ProtectedRoute } from './ProtectedRoute';

const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.default ?? m.Dashboard })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then(m => ({ default: m.default ?? m.ProjectsPage })));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage').then(m => ({ default: m.default ?? m.DocumentsPage })));
const WorkflowPage = lazy(() => import('@/pages/WorkflowPage').then(m => ({ default: m.default ?? m.WorkflowPage })));
const RemarksPage = lazy(() => import('@/pages/RemarksPage').then(m => ({ default: m.default ?? m.RemarksPage })));
const ArchivePage = lazy(() => import('@/pages/ArchivePage').then(m => ({ default: m.default ?? m.ArchivePage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then(m => ({ default: m.default ?? m.AdminPage })));

function RouteFallback() {
  return <div className="flex items-center justify-center h-screen text-gray-400 text-sm">Загрузка…</div>;
}

function SuspenseWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function RouteErrorFallback() {
  return <div className="flex items-center justify-center h-screen text-red-500 text-sm">Произошла ошибка. Попробуйте обновить страницу.</div>;
}

export const router = createBrowserRouter([
  // === ПУБЛИЧНЫЕ ===
  { path: '/', element: <LandingPage /> },        // ← LandingPage на корень
  { path: '/login', element: <LoginPage /> },

  // === ЗАЩИЩЁННЫЕ (pathless — без path: '/') ===
  {
    element: (
      <ErrorBoundary fallback={<RouteErrorFallback />}>
        <ProtectedRoute />
      </ErrorBoundary>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          // Убрали index: true, потому что / занят LandingPage
          { path: '/dashboard', element: <SuspenseWrapper><Dashboard /></SuspenseWrapper> },
          { path: '/projects', element: <SuspenseWrapper><ProjectsPage /></SuspenseWrapper> },
          { path: '/documents', element: <SuspenseWrapper><DocumentsPage /></SuspenseWrapper> },
          { path: '/workflow', element: <SuspenseWrapper><WorkflowPage /></SuspenseWrapper> },
          { path: '/remarks', element: <SuspenseWrapper><RemarksPage /></SuspenseWrapper> },
          { path: '/archive', element: <SuspenseWrapper><ArchivePage /></SuspenseWrapper> },
          { path: '/admin', element: <SuspenseWrapper><AdminPage /></SuspenseWrapper> },
        ],
      },
    ],
  },
]);