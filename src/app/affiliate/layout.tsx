"use client";

import { usePathname } from "next/navigation";
import { AffiliateGuard } from "@/components/affiliate/affiliate-guard";
import { AffiliateSidebar } from "@/components/affiliate/affiliate-sidebar";
import { AffiliateTopBar } from "@/components/affiliate/affiliate-top-bar";

const PUBLIC_PATHS = new Set<string>([
  "/affiliate/login",
  "/affiliate/signup",
]);

const PENDING_PATHS = new Set<string>(["/affiliate/pending"]);

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic = pathname ? PUBLIC_PATHS.has(pathname) : false;
  const isPending = pathname ? PENDING_PATHS.has(pathname) : false;

  return (
    <div className="min-h-screen bg-[--color-background] text-[--color-foreground]">
      {isPublic ? (
        <AffiliateGuard publicOnly>{children}</AffiliateGuard>
      ) : isPending ? (
        <AffiliateGuard pendingOnly>
          <div className="flex min-h-screen items-start justify-center bg-[#050a12] px-4 py-10">
            <div className="w-full max-w-2xl">{children}</div>
          </div>
        </AffiliateGuard>
      ) : (
        <AffiliateGuard>
          <div className="flex h-screen overflow-hidden">
            <AffiliateSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <AffiliateTopBar />
              <main className="flex-1 overflow-y-auto bg-[#050a12] px-4 pb-10 pt-6 sm:px-6">
                <div className="mx-auto w-full max-w-6xl">{children}</div>
              </main>
            </div>
          </div>
        </AffiliateGuard>
      )}
    </div>
  );
}
