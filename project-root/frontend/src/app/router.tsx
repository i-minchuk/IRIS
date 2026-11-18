import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Layout from '@/components/Layout';
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRouteGuard } from '@/components/admin/AdminRouteGuard';
import { PermRoute } from '@/components/PermRoute';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'));

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
/* Скрытый импорт — календарь теперь в Dashboard
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
*/
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const MyTasksPage = lazy(() => import('@/pages/MyTasksPage'));
const ProductionControlPage = lazy(() => import('@/pages/ProductionControl'));
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
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const TimeTrackingPage = lazy(() => import('@/pages/TimeTrackingPage'));
const SemanticSearchPage = lazy(() => import('@/pages/SemanticSearchPage'));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage'));
const OneCExportPage = lazy(() => import('@/pages/OneCExportPage'));
const MonitoringPage = lazy(() => import('@/pages/MonitoringPage'));

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
          { path: '/dashboard', element: <SuspenseWrapper><PermRoute perm="dashboard.read"><Dashboard /></PermRoute></SuspenseWrapper> },
          { path: '/projects', element: <SuspenseWrapper><PermRoute perm="projects.read"><ProjectsPage /></PermRoute></SuspenseWrapper> },
          { path: '/documents', element: <SuspenseWrapper><PermRoute perm="documents.read"><DocumentsPage /></PermRoute></SuspenseWrapper> },
          { path: '/my-tasks', element: <SuspenseWrapper><PermRoute perm="tasks.read"><MyTasksPage /></PermRoute></SuspenseWrapper> },
          { path: '/workflow', element: <Navigate to="/documents" replace /> },
          { path: '/remarks', element: <SuspenseWrapper><PermRoute perm="remarks.read"><RemarksPage /></PermRoute></SuspenseWrapper> },
          { path: '/archive', element: <SuspenseWrapper><PermRoute perm="archive.read"><ArchivePage /></PermRoute></SuspenseWrapper> },
          { path: '/achievements', element: <SuspenseWrapper><AchievementsPage /></SuspenseWrapper> },
          { path: '/portfolio', element: <SuspenseWrapper><PermRoute perm="tenders.read"><PortfolioPage /></PermRoute></SuspenseWrapper> },
          { path: '/portfolio/*', element: <SuspenseWrapper><PermRoute perm="tenders.read"><PortfolioPage /></PermRoute></SuspenseWrapper> },
          /* ── Redirects from old standalone pages ── */
          { path: '/tenders', element: <Navigate to="/portfolio?tab=tenders" replace /> },
          { path: '/project-portfolio', element: <Navigate to="/portfolio?tab=projects" replace /> },
          { path: '/project-tasks', element: <Navigate to="/portfolio?tab=projects" replace /> },
          { path: '/package', element: <Navigate to="/portfolio?tab=package" replace /> },
          { path: '/srm/suppliers', element: <Navigate to="/portfolio?tab=srm&srm_tab=suppliers" replace /> },
          { path: '/srm/purchase-requests', element: <Navigate to="/portfolio?tab=srm&srm_tab=purchase-requests" replace /> },
          { path: '/srm/contracts', element: <Navigate to="/portfolio?tab=contracts" replace /> },
          { path: '/srm/orders', element: <Navigate to="/portfolio?tab=srm&srm_tab=orders" replace /> },
          { path: '/srm/invoices', element: <Navigate to="/portfolio?tab=srm&srm_tab=invoices" replace /> },
  { path: '/tenders/:id', element: <Navigate to="/portfolio?tender=:id" replace /> },
          /* Скрытый роут /calendar — календарь теперь в Dashboard
  { path: '/calendar', element: <SuspenseWrapper><CalendarPage /></SuspenseWrapper> },
  */
          { path: '/calendar', element: <Navigate to="/dashboard" replace /> },
          { path: '/reports', element: <SuspenseWrapper><PermRoute perm="reports.read"><ReportsPage /></PermRoute></SuspenseWrapper> },
          { path: '/contacts', element: <Navigate to="/references" replace /> },
          { path: '/profile', element: <SuspenseWrapper><ProfileSettingsPage /></SuspenseWrapper> },
          { path: '/profile/2fa', element: <SuspenseWrapper><TwoFactorSettingsPage /></SuspenseWrapper> },
          { path: '/notifications', element: <SuspenseWrapper><NotificationPage /></SuspenseWrapper> },
          { path: '/production', element: <SuspenseWrapper><PermRoute perm="production.read"><ProductionControlPage /></PermRoute></SuspenseWrapper> },
          { path: '/time-tracking', element: <SuspenseWrapper><PermRoute perm="time_tracking.read"><TimeTrackingPage /></PermRoute></SuspenseWrapper> },
          { path: '/analytics', element: <Navigate to='/dashboard' replace /> },
          { path: '/references', element: <SuspenseWrapper><PermRoute perm="references.read"><ReferencePage /></PermRoute></SuspenseWrapper> },
          { path: '/documents/new', element: <SuspenseWrapper><PermRoute perm="documents.read"><DocumentCreate /></PermRoute></SuspenseWrapper> },
          { path: '/documents/import', element: <SuspenseWrapper><PermRoute perm="documents.read"><ImportExcel /></PermRoute></SuspenseWrapper> },
          { path: '/documents/:id', element: <SuspenseWrapper><PermRoute perm="documents.read"><DocumentDetail /></PermRoute></SuspenseWrapper> },
          { path: '/ai-search', element: <SuspenseWrapper><PermRoute perm="ai.read"><SemanticSearchPage /></PermRoute></SuspenseWrapper> },
          { path: '/integrations', element: <SuspenseWrapper><IntegrationsPage /></SuspenseWrapper> },
          { path: '/integrations/1c', element: <SuspenseWrapper><OneCExportPage /></SuspenseWrapper> },
          { path: '/monitoring', element: <SuspenseWrapper><AdminRouteGuard><MonitoringPage /></AdminRouteGuard></SuspenseWrapper> },
          /* ── Admin routes (guarded by AdminRouteGuard inside Layout) ── */
          { path: '/admin', element: <SuspenseWrapper><AdminRouteGuard><AdminDashboard /></AdminRouteGuard></SuspenseWrapper> },
          { path: '/admin/users', element: <SuspenseWrapper><AdminRouteGuard><AdminPage /></AdminRouteGuard></SuspenseWrapper> },
          { path: '/admin/audit', element: <SuspenseWrapper><AdminRouteGuard><AuditLogPage /></AdminRouteGuard></SuspenseWrapper> },
          { path: '/admin/releases', element: <SuspenseWrapper><AdminRouteGuard><ReleasesPage /></AdminRouteGuard></SuspenseWrapper> },
          { path: '/admin/tickets', element: <SuspenseWrapper><AdminRouteGuard><SupportTicketsPage /></AdminRouteGuard></SuspenseWrapper> },
          { path: '/admin/incidents', element: <SuspenseWrapper><AdminRouteGuard><IncidentsPage /></AdminRouteGuard></SuspenseWrapper> },
          { path: '/admin/kb', element: <SuspenseWrapper><AdminRouteGuard><KnowledgeBasePage /></AdminRouteGuard></SuspenseWrapper> },
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
          { path: '/srm/suppliers', element: <SuspenseWrapper><PermRoute perm="srm.read"><SuppliersPage /></PermRoute></SuspenseWrapper> },
          { path: '/srm/purchase-requests', element: <SuspenseWrapper><PermRoute perm="srm.read"><PurchaseRequestsPage /></PermRoute></SuspenseWrapper> },
          { path: '/srm/contracts', element: <SuspenseWrapper><PermRoute perm="srm.read"><ContractsPage /></PermRoute></SuspenseWrapper> },
          { path: '/srm/orders', element: <SuspenseWrapper><PermRoute perm="srm.read"><OrdersPage /></PermRoute></SuspenseWrapper> },
          { path: '/srm/invoices', element: <SuspenseWrapper><PermRoute perm="srm.read"><InvoicesPage /></PermRoute></SuspenseWrapper> },
          { path: '/team', element: <SuspenseWrapper><TeamPage /></SuspenseWrapper> },
          { path: '/gamification', element: <Navigate to="/team" replace /> },
          { path: '/gamification/leaderboard', element: <Navigate to="/team" replace /> },
        ],
      },
    ],
  },

  // === Catch-all ===
  { path: '*', element: <SuspenseWrapper><NotFound /></SuspenseWrapper> },
]);
