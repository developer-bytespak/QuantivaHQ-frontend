"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasAdminToken, adminMe, clearAdminTokens } from "@/lib/api/vcpool-admin";

const ADMIN_LOGIN = "/admin/login";

interface AdminGuardProps {
  children: ReactNode;
  /** If true, only allow unauthenticated (e.g. login page). Redirect to /admin if already logged in. */
  publicOnly?: boolean;
}

export function AdminGuard({ children, publicOnly = false }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      if (publicOnly) {
        if (!hasAdminToken()) {
          if (isMounted) setStatus("allowed");
          return;
        }
        try {
          await adminMe();
          if (isMounted) {
            setStatus("denied");
            router.replace("/admin/dashboard");
          }
        } catch {
          clearAdminTokens();
          if (isMounted) setStatus("allowed");
        }
        return;
      }

      if (!hasAdminToken()) {
        if (isMounted) {
          setStatus("denied");
          const returnTo = pathname && pathname !== "/admin" ? encodeURIComponent(pathname) : "";
          router.replace(returnTo ? `${ADMIN_LOGIN}?returnTo=${returnTo}` : ADMIN_LOGIN);
        }
        return;
      }

      try {
        await adminMe();
        if (isMounted) setStatus("allowed");
      } catch (err: unknown) {
        const is401 =
          (err as { response?: { status?: number }; status?: number })?.response?.status === 401 ||
          (err as { status?: number })?.status === 401;
        if (is401) clearAdminTokens();
        if (isMounted) {
          setStatus("denied");
          router.replace(ADMIN_LOGIN);
        }
      }
    };

    check();
    return () => {
      isMounted = false;
    };
  }, [router, pathname, publicOnly]);

  if (status === "checking") {
    return (
      <div className="flex h-screen items-center justify-center bg-[--color-background]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent" />
          <p className="text-sm text-[--color-foreground]/60">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (status === "denied") return null;
  return <>{children}</>;
}
