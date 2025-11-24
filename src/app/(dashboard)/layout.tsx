import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DASHBOARD_NAV } from "@/config/navigation";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[--color-background] text-[--color-foreground]">
      <DashboardSidebar sections={DASHBOARD_NAV} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[--color-surface-alt]/60 px-6 pb-16 pt-10">
          <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
