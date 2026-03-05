import type { FC, ReactNode } from "react";

interface TopBarProps {
  title: string;
  actions?: ReactNode;
}

export const TopBar: FC<TopBarProps> = ({ title, actions }) => {
  return (
    <header className="h-[var(--topbar-height)] shrink-0 flex items-center justify-between px-6 lg:px-8 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      {/* Left offset for mobile hamburger */}
      <h1 className="text-xl font-semibold text-[var(--color-text)] pl-12 lg:pl-0">
        {title}
      </h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
};
