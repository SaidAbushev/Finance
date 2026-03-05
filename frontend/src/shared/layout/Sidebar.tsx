import { useState } from "react";
import type { FC } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  BarChart3,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";

interface NavItem {
  to: string;
  label: string;
  icon: FC<{ size?: number }>;
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { to: "/transactions", label: "Транзакции", icon: ArrowLeftRight },
  { to: "/accounts", label: "Счета", icon: Wallet },
  { to: "/budgets", label: "Бюджеты", icon: PiggyBank },
  { to: "/reports", label: "Отчёты", icon: BarChart3 },
  { to: "/import", label: "Импорт", icon: Upload },
  { to: "/settings", label: "Настройки", icon: Settings },
];

export const Sidebar: FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Финансы
        </h1>
        <p className="text-xs text-white/40 mt-0.5">Управление бюджетом</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + "/");
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobile}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                "transition-all duration-200",
                isActive
                  ? "bg-[var(--color-accent)] text-white shadow-md shadow-indigo-500/20"
                  : "text-white/60 hover:bg-[var(--color-sidebar-hover)] hover:text-white/90",
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2">
          <p
            className="text-sm text-white/80 truncate"
            title={user?.email ?? ""}
          >
            {user?.name ?? user?.email ?? ""}
          </p>
          <p className="text-xs text-white/40 truncate">
            {user?.email ?? ""}
          </p>
        </div>
        <button
          onClick={() => {
            logout();
            closeMobile();
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 mt-1 rounded-lg text-sm font-medium text-white/50 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--color-sidebar)] text-white shadow-lg lg:hidden cursor-pointer"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 backdrop lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-[var(--sidebar-width)] bg-[var(--color-sidebar)]",
          "transform transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[var(--sidebar-width)] lg:shrink-0 h-screen bg-[var(--color-sidebar)] sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
};
