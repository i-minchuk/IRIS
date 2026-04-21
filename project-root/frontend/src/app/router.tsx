// frontend/src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage';
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
            element: <Navigate to="/projects" replace />,
          },
          {
            path: 'projects',
            element: <ProjectsPage />,
          },
          // Здесь добавятся другие защищённые маршруты
        ],
      },
    ],
  },
]);