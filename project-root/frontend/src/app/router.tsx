// frontend/src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingLoginPage } from '@/pages/LandingLoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import Dashboard from '@/pages/Dashboard';
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage';
import { ArchivePage } from '@/pages/ArchivePage';
import { WorkflowPage } from '@/pages/WorkflowPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { DocumentsPage } from '@/features/documents/pages/DocumentsPage';
import { Layout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';
import DocumentCreate from '@/pages/DocumentCreate';
import DocumentWorkspace from '@/components/workspace/DocumentWorkspace';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LandingLoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
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
            path: 'workflow',
            element: <WorkflowPage />,
          },
          {
            path: 'analytics',
            element: <AnalyticsPage />,
          },
          {
            path: 'archive',
            element: <ArchivePage />,
          },
          {
            path: 'documents/create/:projectId?',
            element: <DocumentCreate />,
          },
          {
            path: 'workspace/:projectId',
            element: <DocumentWorkspace />,
          },
          /* Projects page */
          {
            path: 'projects',
            element: <ProjectsPage />,
          },
          {
            path: 'documents',
            element: <DocumentsPage />,
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
