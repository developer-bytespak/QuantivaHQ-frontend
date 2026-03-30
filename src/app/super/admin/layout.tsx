"use client";

import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/vcpool/admin-guard";
import { AdminSidebar } from "@/components/vcpool/admin-sidebar";
import { AdminTopBar } from "@/components/vcpool/admin-top-bar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/super/admin/login";

  return (
    <div className="min-h-screen bg-[--color-background] text-[--color-foreground]">
      {isLoginPage ? (
        <AdminGuard publicOnly loginPath="/super/admin/login">
          {children}
        </AdminGuard>
      ) : (
        <AdminGuard requireSuperAdmin loginPath="/super/admin/login">
          <div className="flex h-screen overflow-hidden">
            <AdminSidebar mode="super" />
            <div className="flex flex-1 flex-col overflow-hidden">
              <AdminTopBar mode="super" />
              <main className="flex-1 overflow-y-auto bg-[--color-surface-alt]/60 px-4 sm:px-6 pb-10 pt-6">
                <div className="mx-auto w-full max-w-5xl">{children}</div>
              </main>
            </div>
          </div>
        </AdminGuard>
      )}
    </div>
  );
}
