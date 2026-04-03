"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  hasAdminToken,
  adminMe,
  clearAdminTokens,
} from "@/lib/api/vcpool-admin";

const ADMIN_LOGIN = "/vc-pool/admin/login";
const SUPER_ADMIN_HOME = "/super/admin/users";
const ADMIN_HOME = "/vc-pool/admin/dashboard";

interface AdminGuardProps {
  children: ReactNode;
  /** If true, only allow unauthenticated pages (login). */
  publicOnly?: boolean;
  /** Restrict route to super admins only. */
  requireSuperAdmin?: boolean;
  /** Restrict route to regular VC pool admins only. */
  blockSuperAdmin?: boolean;
  /** Login page used when user is unauthenticated. */
  loginPath?: string;
}

export function AdminGuard({
  children,
  publicOnly = false,
  requireSuperAdmin = false,
  blockSuperAdmin = false,
  loginPath = ADMIN_LOGIN,
}: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let isMounted = true;

    const areaHome = loginPath.startsWith("/super/admin") ? SUPER_ADMIN_HOME : ADMIN_HOME;

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
            router.replace(areaHome);
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
          const returnTo = pathname ? encodeURIComponent(pathname) : "";
          router.replace(returnTo ? `${loginPath}?returnTo=${returnTo}` : loginPath);
        }
        return;
      }

      try {
        const admin = await adminMe();

        if (requireSuperAdmin && !admin.is_super_admin) {
          if (isMounted) {
            setStatus("denied");
            router.replace(ADMIN_HOME);
          }
          return;
        }

        if (blockSuperAdmin && admin.is_super_admin) {
          if (isMounted) {
            setStatus("denied");
            router.replace(SUPER_ADMIN_HOME);
          }
          return;
        }

        if (isMounted) setStatus("allowed");
      } catch (err: unknown) {
        const is401 =
          (err as { response?: { status?: number }; status?: number })?.response?.status === 401 ||
          (err as { status?: number })?.status === 401;
        if (is401) clearAdminTokens();
        if (isMounted) {
          setStatus("denied");
          router.replace(loginPath);
        }
      }
    };

    check();
    return () => {
      isMounted = false;
    };
  }, [router, pathname, publicOnly, requireSuperAdmin, blockSuperAdmin, loginPath]);

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
