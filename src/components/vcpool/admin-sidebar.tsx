"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useMobileNav } from "@/hooks/useMobileNav";

const BASE_ADMIN_NAV = [
  { label: "Dashboard", href: "/vc-pool/admin/dashboard", icon: "dashboard" },
  { label: "Pools", href: "/vc-pool/admin/pools", icon: "pools" },
  { label: "Binance", href: "/vc-pool/admin/binance", icon: "binance" },
  { label: "Settings", href: "/vc-pool/admin/settings", icon: "settings" },
];

const SUPER_ADMIN_NAV = [
  { label: "Users", href: "/super/admin/users", icon: "users" },
  { label: "VC Pool Admins", href: "/super/admin/vc-pool-admins", icon: "shield" },
  { label: "Pools Oversight", href: "/super/admin/pools-oversight", icon: "pools" },
  { label: "Finance", href: "/super/admin/finance", icon: "binance" },
];

interface AdminSidebarProps {
  mode?: "admin" | "super";
}

function AdminLogo({ collapsed, mode }: { collapsed: boolean; mode: "admin" | "super" }) {
  const [imageError, setImageError] = useState(false);
  const homeHref = mode === "super" ? "/super/admin/users" : "/vc-pool/admin/dashboard";
  const panelLabel = mode === "super" ? "Super Admin Control" : "VC Pool Admin";
  return (
    <Link
      href={homeHref}
      className="group flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold tracking-tight text-slate-100 transition-opacity hover:opacity-80"
      aria-label="Admin Dashboard"
    >
      <div className="relative flex h-10 sm:h-14 w-10 sm:w-14 items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {imageError ? (
          <span className="text-lg sm:text-2xl font-bold text-white">Q</span>
        ) : (
          <Image
            src="/logo_quantiva.svg"
            alt="QuantivaHQ"
            width={56}
            height={56}
            className="object-contain"
            priority
            unoptimized
            onError={() => setImageError(true)}
          />
        )}
      </div>
      {!collapsed && (
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-xs sm:text-base font-bold uppercase tracking-[0.15em] text-white">
            QuantivaHQ
          </span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
            {panelLabel}
          </span>
        </div>
      )}
    </Link>
  );
}

function NavIcon({ name, isActive }: { name: string; isActive: boolean }) {
  const c = isActive ? "text-[#fc4f02]" : "text-slate-400";
  if (name === "dashboard") {
    return (
      <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (name === "pools") {
    return (
      <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    );
  }
  if (name === "binance") {
    return (
      <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-3-3H10a3 3 0 00-3 3v2m10 0H7m-5 0h5v-2a3 3 0 015.356-1.857M9 7a3 3 0 116 0 3 3 0 01-6 0zm-5 4a3 3 0 116 0 3 3 0 01-6 0zm14 0a3 3 0 116 0 3 3 0 01-6 0z" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4zm-2 9l1.5 1.5L14 11" />
      </svg>
    );
  }
  return (
    <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function AdminSidebar({ mode = "admin" }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const { isOpen: mobileOpen, setOpen: setMobileOpen } = useMobileNav();

  const adminNav = mode === "super" ? SUPER_ADMIN_NAV : BASE_ADMIN_NAV;

  const desktopSidebar = (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`group/admin relative hidden sm:flex h-screen flex-col border-r border-[#fc4f02]/30 bg-gradient-to-b from-[--color-surface] to-[--color-surface-alt] text-slate-100 transition-[width] duration-300 ease-out ${collapsed ? "w-[80px]" : "w-[280px]"}`}
    >
      <div className="flex h-16 sm:h-24 items-center justify-center bg-[--color-surface-alt]/50 px-2 sm:px-8">
        <AdminLogo collapsed={collapsed} mode={mode} />
      </div>
      <nav className={`flex-1 space-y-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="px-3 pb-2 text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            MAIN
          </p>
        )}
        <div className="space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-lg sm:rounded-xl ${collapsed ? "px-2" : "px-3"} py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/20 text-[#fc4f02] shadow-lg shadow-[#fc4f02]/10"
                    : "text-slate-300 hover:bg-[--color-surface-alt] hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#fc4f02] to-[#fda300]" />
                )}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <NavIcon name={item.icon} isActive={isActive} />
                </div>
                {!collapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#fc4f02]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );

  const mobileNav =
    typeof window !== "undefined"
      ? createPortal(
          <>
            {mobileOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm sm:hidden"
                onClick={() => setMobileOpen(false)}
              />
            )}
            <div
              className={`fixed left-0 top-16 z-40 w-full border-b border-[#fc4f02]/30 bg-gradient-to-b from-[--color-surface] to-[--color-surface-alt] text-slate-100 sm:hidden overflow-y-auto max-h-[calc(100vh-64px)] transition-all duration-300 ease-out transform ${
                mobileOpen
                  ? "translate-y-0 opacity-100 visible"
                  : "-translate-y-full opacity-0 invisible"
              }`}
            >
              <nav className="space-y-1 py-3 px-3">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  MAIN
                </p>
                <div className="space-y-1">
                  {adminNav.map((item) => {
                    const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/20 text-[#fc4f02] shadow-lg shadow-[#fc4f02]/10"
                            : "text-slate-300 hover:bg-[--color-surface-alt] hover:text-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#fc4f02] to-[#fda300]" />
                        )}
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <NavIcon name={item.icon} isActive={isActive} />
                        </div>
                        <span className="truncate font-medium">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#fc4f02]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      {desktopSidebar}
      {mobileNav}
    </>
  );
}
