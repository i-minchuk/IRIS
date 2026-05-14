import { createBrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import ProjectsPage from '@/pages/ProjectsPage';
import DocumentsPage from '@/pages/DocumentsPage';
import WorkflowPage from '@/pages/WorkflowPage';
import ArchivePage from '@/pages/ArchivePage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  // Публичные
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },

  // Защищённые
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/documents', element: <DocumentsPage /> },
          { path: '/workflow', element: <WorkflowPage /> },
          { path: '/archive', element: <ArchivePage /> },
        ],
      },
    ],
  },
]);