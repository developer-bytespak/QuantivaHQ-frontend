"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminMe, adminLogout } from "@/lib/api/vcpool-admin";
import type { AdminProfile } from "@/lib/api/vcpool-admin";
import { useMobileNav } from "@/hooks/useMobileNav";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/pools": "Pools",
  "/admin/pools/create": "Create pool",
  "/admin/settings": "Settings",
  "/admin/settings/exchange-configuration": "Exchange Configuration",
  "/admin/settings/binance": "Binance UID",
  "/admin/settings/fees": "Default Fees",
  "/admin/settings/notifications": "Notifications",
  "/admin/settings/security": "Security",
  "/admin/settings/help-support": "Help and Support",
  "/admin/settings/terms": "Terms and Conditions",
  "/admin/settings/connect-crypto": "Connect Crypto",
  "/admin/settings/connect-stock": "Connect Stock",
  "/admin/settings/connect-api-keys": "API Keys",
  "/admin/users": "Users",
  "/admin/vc-pool-admins": "VC Pool Admins",
  "/super/admin/users": "Users",
  "/super/admin/vc-pool-admins": "VC Pool Admins",
  "/super/admin/pools-oversight": "Pools Oversight",
  "/super/admin/finance": "Unified Finance",
  "/super/admin/contact-submissions": "Contact Submissions",
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.match(/^\/admin\/pools\/[^/]+\/top-trade$/)) return "Top Trade";
  if (pathname.startsWith("/admin/pools/") && pathname !== "/admin/pools/create")
    return "Pool details";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  if (pathname.startsWith("/super/admin")) return "Super Admin";
  return "Dashboard";
}

function normalizeAdminPath(pathname: string | null): string | null {
  if (!pathname) return pathname;
  if (pathname.startsWith("/vc-pool/admin")) {
    return pathname.replace("/vc-pool/admin", "/admin");
  }
  return pathname;
}

interface AdminTopBarProps {
  mode?: "admin" | "super";
}

export function AdminTopBar({ mode = "admin" }: AdminTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isOpen: mobileOpen, toggle: toggleMobile } = useMobileNav();

  useEffect(() => {
    adminMe().then(setAdmin).catch(() => setAdmin(null));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await adminLogout();
    } catch {
      // ignore
    }
    router.replace(mode === "super" ? "/super/admin/login" : "/vc-pool/admin/login");
  };

  const title = getPageTitle(normalizeAdminPath(pathname));
  const initial = admin?.full_name?.charAt(0)?.toUpperCase() || admin?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#fc4f02]/30 bg-[--color-surface]/80 px-4 sm:px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobile}
          className="sm:hidden flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-white/[0.07] to-transparent border border-[#fc4f02]/30 hover:border-[#fc4f02]/50 transition-all"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          type="button"
        >
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
          {admin?.is_super_admin ? "SUPER ADMIN" : "ADMIN"}
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-surface-alt]/50 px-3 py-2 hover:bg-[--color-surface-alt] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/30 to-[#fda300]/30 text-sm font-bold text-white">
              {initial}
            </div>
            <span className="max-w-[120px] truncate text-sm font-medium text-white sm:block hidden">
              {admin?.full_name || admin?.email || "Admin"}
            </span>
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-[--color-border] bg-[--color-surface] py-1 shadow-xl">
              <div className="border-b border-[--color-border] px-3 py-2">
                <p className="truncate text-sm font-medium text-white">{admin?.full_name || "Admin"}</p>
                <p className="truncate text-xs text-slate-400">{admin?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-[--color-surface-alt] hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
