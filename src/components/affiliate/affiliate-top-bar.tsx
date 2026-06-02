"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { affiliateMe } from "@/lib/api/affiliate";
import type { AffiliateProfile } from "@/lib/api/affiliate";

const TITLES: Record<string, string> = {
  "/affiliate/dashboard": "Dashboard",
  "/affiliate/analytics": "Analytics",
  "/affiliate/payouts": "Payouts",
  "/affiliate/settings": "Settings",
  "/affiliate/pending": "Application Status",
};

function statusBadge(status?: string) {
  switch (status) {
    case "APPROVED":
      return { label: "APPROVED", className: "bg-emerald-500/20 text-emerald-300" };
    case "PENDING":
      return { label: "PENDING REVIEW", className: "bg-amber-500/20 text-amber-300" };
    case "PAUSED":
      return { label: "PAUSED", className: "bg-slate-500/20 text-slate-300" };
    case "SUSPENDED":
      return { label: "SUSPENDED", className: "bg-rose-500/20 text-rose-300" };
    case "REJECTED":
      return { label: "REJECTED", className: "bg-rose-500/20 text-rose-300" };
    default:
      return { label: "UNKNOWN", className: "bg-slate-500/20 text-slate-300" };
  }
}

export function AffiliateTopBar() {
  const pathname = usePathname();
  const [me, setMe] = useState<AffiliateProfile | null>(null);

  useEffect(() => {
    affiliateMe().then(setMe).catch(() => setMe(null));
  }, []);

  const title = (pathname && TITLES[pathname]) ?? "Affiliate";
  const badge = statusBadge(me?.status);
  const initial =
    me?.display_name?.charAt(0)?.toUpperCase() ||
    me?.email?.charAt(0)?.toUpperCase() ||
    "A";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#fc4f02]/30 bg-[#060b12] px-4 sm:px-6">
      <h1 className="text-lg font-bold text-white sm:text-xl">{title}</h1>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/30 to-[#fda300]/30 text-sm font-bold text-white">
            {initial}
          </div>
          <span className="hidden max-w-[140px] truncate text-sm font-medium text-white sm:block">
            {me?.display_name || me?.email || "Affiliate"}
          </span>
        </div>
      </div>
    </header>
  );
}
