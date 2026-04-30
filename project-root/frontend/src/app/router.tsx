// frontend/src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import { RemarksPage } from '@/features/remarks/pages/RemarksPage';
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { TendersPage } from '@/pages/TendersPage';
import { AdminPage } from '@/pages/AdminPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { ProductionControlPage } from '@/pages/ProductionControl';
import { ProjectTasksPage } from '@/pages/ProjectTasksPage';
import { PackagePage } from '@/pages/PackagePage';
import { WorkflowPage } from '@/pages/WorkflowPage';
import TenderPortfolioPage from '@/pages/TenderPortfolioPage';
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
            path: 'portfolio',
            element: <TenderPortfolioPage />,
          },
          {
            path: 'production',
            element: <ProductionControlPage />,
          },
          {
            path: 'tasks',
            element: <ProjectTasksPage />,
          },
          {
            path: 'packages',
            element: <PackagePage />,
          },
          {
            path: 'workflow',
            element: <WorkflowPage />,
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
          /* Обратная совместимость: старый путь портфеля проектов перенаправляет на задачи */
          {
            path: 'projects',
            element: <Navigate to="/tasks" replace />,
          },
          /* Обратная совместимость: старый путь согласований перенаправляет на workflow */
          {
            path: 'approval',
            element: <Navigate to="/workflow" replace />,
          },
          /* Обратная совместимость: старый путь перенаправляет на workflow */
          {
            path: 'dependencies',
            element: <Navigate to="/workflow" replace />,
          },
        ],
      },
    ],
  },
]);
