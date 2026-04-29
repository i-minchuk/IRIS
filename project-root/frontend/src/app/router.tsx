// frontend/src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import { ProjectPortfolioPage } from '@/pages/ProjectPortfolioPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import TenderPortfolioPage from '@/pages/TenderPortfolioPage';
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage';
import { DependencyGraphPage } from '@/features/documents/pages/DependencyGraphPage';
import { RemarksPage } from '@/features/remarks/pages/RemarksPage';
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { TendersPage } from '@/pages/TendersPage';
import { AdminPage } from '@/pages/AdminPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'projects',
            element: <ProjectPortfolioPage />,
          },
          {
            path: 'portfolio',
            element: <TenderPortfolioPage />,
          },
          {
            path: 'projects',
            element: <ProjectsPage />,
          },
          {
            path: 'documents',
            element: <DocumentsPage />,
          },
          {
            path: 'remarks',
            element: <RemarksPage />,
          },
          {
            path: 'analytics',
            element: <AnalyticsPage />,
          },
          {
            path: 'resources',
            element: <ResourcesPage />,
          },
          {
            path: 'approval',
            element: <DependencyGraphPage />,
          },
          {
            path: 'tenders',
            element: <TendersPage />,
          },
          {
            path: 'admin',
            element: <AdminPage />,
          },
          {
            path: 'archive',
            element: <ArchivePage />,
          },
          /* Обратная совместимость: старый путь перенаправляет на новый */
          {
            path: 'dependencies',
            element: <Navigate to="/approval" replace />,
          },
        ],
      },
    ],
  },
]);
