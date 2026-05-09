// frontend/src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { WelcomePage } from '@/pages/WelcomePage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import Dashboard from '@/pages/Dashboard';
import { ArchivePage } from '@/pages/ArchivePage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { WorkflowPage } from '@/pages/WorkflowPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
import { RemarksPage } from '@/pages/RemarksPage';
import { TendersPage } from '@/pages/TendersPage';
import TenderPortfolioPage from '@/pages/TenderPortfolioPage';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { AdminPage } from '@/pages/AdminPage';
import NotFound from '@/pages/NotFound';
import Layout from '@/components/Layout';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  // Публичные страницы (без авторизации)
  { path: '/', element: <WelcomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Защищённые страницы (требуют авторизацию)
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          // Дашборд — объединённая панель управления + аналитика
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'analytics', element: <Dashboard /> },  // Редирект на dashboard

          // 4 основных вкладки
          { path: 'projects', element: <ProjectsPage /> },        // Портфель заказов
          { path: 'documents', element: <DocumentsPage /> },      // Документация
          { path: 'workflow', element: <WorkflowPage /> },        // Документооборот
          { path: 'archive', element: <ArchivePage /> },          // Архив

          // Дополнительные маршруты
          { path: 'remarks', element: <RemarksPage /> },
          { path: 'tenders', element: <TendersPage /> },
          { path: 'tender-portfolio', element: <TenderPortfolioPage /> },
          { path: 'resources', element: <ResourcesPage /> },
          { path: 'admin', element: <AdminPage /> },

          // 404
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);
