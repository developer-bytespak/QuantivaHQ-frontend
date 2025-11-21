"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/top-trades": "Top Trades",
  "/dashboard/ai-insights": "AI Insights",
  "/dashboard/vc-pool": "VC Pool",
  "/dashboard/profile": "Profile",
  "/dashboard/screener": "Market Screener",
  "/ai/strategy-mode": "Strategy Mode",
  "/sentiment/news": "Live News",
  "/charts/advanced": "Advanced Charts",
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  
  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  
  // Check for paths that start with known paths
  const matchedPath = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length) // Sort by length descending to match longest first
    .find((path) => pathname.startsWith(path));
  
  if (matchedPath) {
    return pageTitles[matchedPath];
  }
  
  // Fallback: format the pathname
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, " "));
  return segments.length > 0 
    ? segments[segments.length - 1].replace(/\b\w/g, (l) => l.toUpperCase())
    : "Dashboard";
}

export function TopBar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[--color-border] bg-[--color-surface-alt]/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-300">
        <Link
          href="/sentiment/news"
          className="rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 font-medium transition hover:border-[--color-accent] hover:text-[--color-accent]"
        >
          Pulse Feed
        </Link>
        <Link
          href="/ai/strategy-mode"
          className="rounded-lg bg-linear-to-r from-blue-500 via-sky-500 to-cyan-400 px-4 py-2 font-semibold text-slate-950 shadow-lg shadow-blue-900/40 transition hover:opacity-90"
        >
          Launch AI Trade
        </Link>
      </div>
    </header>
  );
}
