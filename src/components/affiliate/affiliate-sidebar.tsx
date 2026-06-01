"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { affiliateLogout } from "@/lib/api/affiliate";

const NAV = [
  { label: "Dashboard", href: "/affiliate/dashboard", icon: "dashboard" },
  { label: "Analytics", href: "/affiliate/analytics", icon: "chart" },
  { label: "Payouts", href: "/affiliate/payouts", icon: "wallet" },
  { label: "Assets", href: "/affiliate/assets", icon: "image" },
  { label: "Settings", href: "/affiliate/settings", icon: "settings" },
];

function NavIcon({ name, isActive }: { name: string; isActive: boolean }) {
  const c = isActive ? "text-[#fc4f02]" : "text-slate-400";
  switch (name) {
    case "dashboard":
      return (
        <svg className={`h-5 w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "chart":
      return (
        <svg className={`h-5 w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6m4 6V5m4 14v-9" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={`h-5 w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      );
    case "image":
      return (
        <svg className={`h-5 w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4 4 4 4-4 4 4M4 6h16v12H4z" />
        </svg>
      );
    case "settings":
      return (
        <svg className={`h-5 w-5 ${c}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35 0l1.083.992a1 1 0 00.93.224l1.426-.41a1 1 0 011.213.668l.495 1.426a1 1 0 00.668.668l1.426.494a1 1 0 01.668 1.214l-.41 1.426a1 1 0 00.224.93l.992 1.083a1 1 0 010 1.35l-.992 1.083a1 1 0 00-.224.93l.41 1.426a1 1 0 01-.668 1.214l-1.426.494a1 1 0 00-.668.668l-.495 1.426a1 1 0 01-1.213.668l-1.426-.41a1 1 0 00-.93.224l-1.083.992a1 1 0 01-1.35 0l-1.083-.992a1 1 0 00-.93-.224l-1.426.41a1 1 0 01-1.213-.668l-.495-1.426a1 1 0 00-.668-.668l-1.426-.494a1 1 0 01-.668-1.214l.41-1.426a1 1 0 00-.224-.93l-.992-1.083a1 1 0 010-1.35l.992-1.083a1 1 0 00.224-.93l-.41-1.426a1 1 0 01.668-1.214l1.426-.494a1 1 0 00.668-.668l.495-1.426a1 1 0 011.213-.668l1.426.41a1 1 0 00.93-.224z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AffiliateSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [imageError, setImageError] = useState(false);

  const handleLogout = async () => {
    try {
      await affiliateLogout();
    } catch {
      // ignore
    }
    router.replace("/affiliate/login");
  };

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#070d17] sm:flex">
      <Link
        href="/affiliate/dashboard"
        className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5 hover:opacity-80"
      >
        <div className="relative flex h-12 w-12 items-center justify-center">
          {imageError ? (
            <span className="text-2xl font-bold text-white">Q</span>
          ) : (
            <Image
              src="/logo_quantiva.svg"
              alt="QuantivaHQ"
              width={48}
              height={48}
              className="object-contain"
              priority
              unoptimized
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">
            QuantivaHQ
          </span>
          <span className="text-[10px] text-slate-400">Affiliate Portal</span>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          MAIN
        </p>
        {NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href + "/") ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/20 text-[#fc4f02] shadow-lg shadow-[#fc4f02]/10"
                  : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#fc4f02] to-[#fda300]" />
              )}
              <NavIcon name={item.icon} isActive={isActive} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#fc4f02]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800/40 hover:text-white"
        >
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
