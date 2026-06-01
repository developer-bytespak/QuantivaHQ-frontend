"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  hasAffiliateToken,
  affiliateMe,
  clearAffiliateTokens,
} from "@/lib/api/affiliate";

const LOGIN = "/affiliate/login";
const PENDING = "/affiliate/pending";
const DASHBOARD = "/affiliate/dashboard";

interface AffiliateGuardProps {
  children: ReactNode;
  /** Login/signup pages — only allow unauthenticated visitors. */
  publicOnly?: boolean;
  /** Pages restricted to PENDING affiliates (the /pending page itself). */
  pendingOnly?: boolean;
}

/**
 * Routes any authenticated affiliate to the right place:
 *   - APPROVED  → can see dashboard pages (default behavior)
 *   - PENDING / INFO_REQUESTED  → redirected to /affiliate/pending
 *   - REJECTED / SUSPENDED / PAUSED  → logged out + sent to /affiliate/login
 *
 * Mirrors `AdminGuard` but for the affiliate auth context.
 */
export function AffiliateGuard({
  children,
  publicOnly = false,
  pendingOnly = false,
}: AffiliateGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">(
    "checking"
  );

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      if (publicOnly) {
        if (!hasAffiliateToken()) {
          if (isMounted) setStatus("allowed");
          return;
        }
        try {
          const me = await affiliateMe();
          if (isMounted) {
            setStatus("denied");
            router.replace(me.status === "APPROVED" ? DASHBOARD : PENDING);
          }
        } catch {
          clearAffiliateTokens();
          if (isMounted) setStatus("allowed");
        }
        return;
      }

      if (!hasAffiliateToken()) {
        if (isMounted) {
          setStatus("denied");
          const returnTo = pathname ? encodeURIComponent(pathname) : "";
          router.replace(returnTo ? `${LOGIN}?returnTo=${returnTo}` : LOGIN);
        }
        return;
      }

      try {
        const me = await affiliateMe();

        if (me.status === "REJECTED" || me.status === "SUSPENDED") {
          clearAffiliateTokens();
          if (isMounted) {
            setStatus("denied");
            router.replace(LOGIN);
          }
          return;
        }

        if (pendingOnly) {
          if (me.status === "APPROVED") {
            if (isMounted) {
              setStatus("denied");
              router.replace(DASHBOARD);
            }
            return;
          }
          if (isMounted) setStatus("allowed");
          return;
        }

        if (me.status !== "APPROVED") {
          if (isMounted) {
            setStatus("denied");
            router.replace(PENDING);
          }
          return;
        }

        if (isMounted) setStatus("allowed");
      } catch (err: unknown) {
        const is401 =
          (err as { response?: { status?: number }; status?: number })?.response
            ?.status === 401 ||
          (err as { status?: number })?.status === 401;
        if (is401) clearAffiliateTokens();
        if (isMounted) {
          setStatus("denied");
          router.replace(LOGIN);
        }
      }
    };

    check();
    return () => {
      isMounted = false;
    };
  }, [router, pathname, publicOnly, pendingOnly]);

  if (status === "checking") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050a12]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
          <p className="text-sm text-slate-400">Verifying affiliate session...</p>
        </div>
      </div>
    );
  }

  if (status === "denied") return null;
  return <>{children}</>;
}
