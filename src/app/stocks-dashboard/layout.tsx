"use client";

import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { STOCKS_DASHBOARD_NAV } from "@/config/navigation";
import { AuthGuard } from "@/components/common/auth-guard";

export default function StocksDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[--color-background] text-[--color-foreground]">
        <DashboardSidebar sections={STOCKS_DASHBOARD_NAV} />
        <div className="flex h-screen flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto bg-[--color-surface-alt]/60 px-6 pb-16 pt-10">
            <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}



