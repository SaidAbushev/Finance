import type { FC, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface PageLayoutProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export const PageLayout: FC<PageLayoutProps> = ({
  title,
  actions,
  children,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-content)]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar title={title} actions={actions} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
