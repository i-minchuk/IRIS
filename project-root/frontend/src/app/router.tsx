// frontend/src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import Dashboard from '@/pages/Dashboard';
import ArchivePage from '@/pages/ArchivePage';
import DocumentsPage from '@/pages/DocumentsPage';
import WorkflowPage from '@/pages/WorkflowPage';
import ProjectsPage from '@/pages/ProjectsPage';
import { RemarksPage } from '@/pages/RemarksPage';
import { AdminPage } from '@/pages/AdminPage';
import NotFound from '@/pages/NotFound';
import Layout from '@/components/Layout';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  // Публичные страницы (без авторизации)
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },


  // Защищённые страницы
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'analytics', element: <Navigate to="/dashboard" replace /> },

          // 5 основных вкладок
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'documents', element: <DocumentsPage /> },
          { path: 'workflow', element: <WorkflowPage /> },
          { path: 'archive', element: <ArchivePage /> },

          // Дополнительные
          { path: 'remarks', element: <RemarksPage /> },
          { path: 'admin', element: <AdminPage /> },
          { path: 'profile', element: <ProfilePage /> },

          // 404
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);