"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const crumbs: Record<string, string[]> = {
  "/dashboard": ["Dashboard"],
  "/dashboard/screener": ["Dashboard", "Market Screener"],
  "/ai/strategy-mode": ["AI Trading", "Strategy Mode"],
  "/sentiment/news": ["News & Sentiment", "Live News"],
  "/charts/advanced": ["Charts", "Advanced"],
};

function getBreadcrumb(pathname: string | null) {
  if (!pathname) return ["Home"];
  const entry = Object.entries(crumbs).find(([key]) => pathname.startsWith(key));
  if (!entry) {
    const segments = pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.replace(/-/g, " "));
    return ["Home", ...segments];
  }
  return ["Home", ...entry[1]];
}

export function TopBar() {
  const pathname = usePathname();
  const trail = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[--color-border] bg-[--color-surface-alt]/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        {trail.map((crumb, index) => (
          <span key={crumb} className="flex items-center gap-3 uppercase tracking-[0.35em]">
            {index > 0 && <span className="text-slate-600">/</span>}
            <span className={index === trail.length - 1 ? "text-slate-200" : "text-slate-500"}>
              {crumb}
            </span>
          </span>
        ))}
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
