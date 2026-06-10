import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Layout from '@/components/Layout';
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'));
const WorkflowPage = lazy(() => import('@/pages/WorkflowPage'));
const RemarksPage = lazy(() => import('@/pages/RemarksPage'));
const ArchivePage = lazy(() => import('@/pages/ArchivePage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AchievementsPage = lazy(() => import('@/pages/Achievements'));
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'));
const ProfileSettingsPage = lazy(() => import('@/pages/ProfileSettingsPage'));
const TwoFactorSettingsPage = lazy(() => import('@/pages/TwoFactorSettingsPage'));
const ReferencePage = lazy(() => import('@/pages/ReferencePage'));
const DocumentCreate = lazy(() => import('@/pages/DocumentCreate'));
const ImportExcel = lazy(() => import('@/pages/ImportExcel'));
const DocumentDetail = lazy(() => import('@/pages/DocumentDetail'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const NotificationPage = lazy(() => import('@/features/notifications/components/NotificationPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AuditLogPage = lazy(() => import('@/pages/admin/AuditLog'));
const ReleasesPage = lazy(() => import('@/pages/admin/Releases'));
const SupportTicketsPage = lazy(() => import('@/pages/admin/SupportTickets'));
const IncidentsPage = lazy(() => import('@/pages/admin/Incidents'));
const KnowledgeBasePage = lazy(() => import('@/pages/admin/KnowledgeBase'));
const SuppliersPage = lazy(() => import('@/pages/srm/Suppliers'));
const PurchaseRequestsPage = lazy(() => import('@/pages/srm/PurchaseRequests'));
const ContractsPage = lazy(() => import('@/pages/srm/Contracts'));
const OrdersPage = lazy(() => import('@/pages/srm/Orders'));
const InvoicesPage = lazy(() => import('@/pages/srm/Invoices'));
const LeaderboardPage = lazy(() => import('@/pages/gamification/Leaderboard'));

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
  { path: '/', element: <SuspenseWrapper><LandingPage /></SuspenseWrapper> },
  { path: '/login', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
  { path: '/register', element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper> },
  { path: '/forgot-password', element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper> },
  { path: '/reset-password', element: <SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper> },

  // === ЗАЩИЩЁННЫЕ (все авторизованные) ===
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
          { path: '/dashboard', element: <SuspenseWrapper><Dashboard /></SuspenseWrapper> },
          { path: '/projects', element: <SuspenseWrapper><ProjectsPage /></SuspenseWrapper> },
          { path: '/documents', element: <SuspenseWrapper><DocumentsPage /></SuspenseWrapper> },
          { path: '/workflow', element: <SuspenseWrapper><WorkflowPage /></SuspenseWrapper> },
          { path: '/remarks', element: <SuspenseWrapper><RemarksPage /></SuspenseWrapper> },
          { path: '/archive', element: <SuspenseWrapper><ArchivePage /></SuspenseWrapper> },
          { path: '/achievements', element: <SuspenseWrapper><AchievementsPage /></SuspenseWrapper> },
          { path: '/portfolio', element: <SuspenseWrapper><PortfolioPage /></SuspenseWrapper> },
          { path: '/portfolio/*', element: <SuspenseWrapper><PortfolioPage /></SuspenseWrapper> },
          { path: '/calendar', element: <SuspenseWrapper><CalendarPage /></SuspenseWrapper> },
          { path: '/reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
          { path: '/profile', element: <SuspenseWrapper><ProfileSettingsPage /></SuspenseWrapper> },
          { path: '/profile/2fa', element: <SuspenseWrapper><TwoFactorSettingsPage /></SuspenseWrapper> },
          { path: '/notifications', element: <SuspenseWrapper><NotificationPage /></SuspenseWrapper> },
          { path: '/references', element: <SuspenseWrapper><ReferencePage /></SuspenseWrapper> },
          { path: '/documents/new', element: <SuspenseWrapper><DocumentCreate /></SuspenseWrapper> },
          { path: '/documents/import', element: <SuspenseWrapper><ImportExcel /></SuspenseWrapper> },
          { path: '/documents/:id', element: <SuspenseWrapper><DocumentDetail /></SuspenseWrapper> },
        ],
      },
    ],
  },

  // === SRM (all authenticated) ===
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
          { path: '/srm/suppliers', element: <SuspenseWrapper><SuppliersPage /></SuspenseWrapper> },
          { path: '/srm/purchase-requests', element: <SuspenseWrapper><PurchaseRequestsPage /></SuspenseWrapper> },
          { path: '/srm/contracts', element: <SuspenseWrapper><ContractsPage /></SuspenseWrapper> },
          { path: '/srm/orders', element: <SuspenseWrapper><OrdersPage /></SuspenseWrapper> },
          { path: '/srm/invoices', element: <SuspenseWrapper><InvoicesPage /></SuspenseWrapper> },
          { path: '/gamification', element: <SuspenseWrapper><LeaderboardPage /></SuspenseWrapper> },
          { path: '/gamification/leaderboard', element: <SuspenseWrapper><LeaderboardPage /></SuspenseWrapper> },
        ],
      },
    ],
  },

  // === Catch-all ===
  { path: '*', element: <SuspenseWrapper><NotFound /></SuspenseWrapper> },

  // === ADMIN ONLY ===
  {
    element: (
      <ErrorBoundary fallback={<RouteErrorFallback />}>
        <AdminRouteGuard />
      </ErrorBoundary>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/admin', element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
          { path: '/admin/users', element: <SuspenseWrapper><AdminPage /></SuspenseWrapper> },
          { path: '/admin/audit', element: <SuspenseWrapper><AuditLogPage /></SuspenseWrapper> },
          { path: '/admin/releases', element: <SuspenseWrapper><ReleasesPage /></SuspenseWrapper> },
          { path: '/admin/tickets', element: <SuspenseWrapper><SupportTicketsPage /></SuspenseWrapper> },
          { path: '/admin/incidents', element: <SuspenseWrapper><IncidentsPage /></SuspenseWrapper> },
          { path: '/admin/kb', element: <SuspenseWrapper><KnowledgeBasePage /></SuspenseWrapper> },
        ],
      },
    ],
  },
]);