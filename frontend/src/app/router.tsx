import { lazy, Suspense } from "react";
import type { FC } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "../shared/hooks/useAuth";
import { Spinner } from "../shared/ui/Spinner";

/* ===== Lazy-loaded pages ===== */
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const TransactionsPage = lazy(() => import("../pages/TransactionsPage"));
const AccountsPage = lazy(() => import("../pages/AccountsPage"));
const BudgetsPage = lazy(() => import("../pages/BudgetsPage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const ImportPage = lazy(() => import("../pages/ImportPage"));
const SettingsPage = lazy(() => import("../pages/SettingsPage"));

/* ===== Loading fallback ===== */
const PageLoader: FC = () => (
  <div className="flex items-center justify-center h-screen bg-[var(--color-content)]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size={32} className="text-[var(--color-accent)]" />
      <p className="text-sm text-[var(--color-muted)]">Загрузка...</p>
    </div>
  </div>
);

/* ===== Route guards ===== */
const ProtectedRoute: FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

const PublicRoute: FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

/* ===== Router ===== */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/transactions", element: <TransactionsPage /> },
      { path: "/accounts", element: <AccountsPage /> },
      { path: "/budgets", element: <BudgetsPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/import", element: <ImportPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
