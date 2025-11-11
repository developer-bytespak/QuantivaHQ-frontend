"use client";

import Link from "next/link";

interface LogoProps {
  collapsed?: boolean;
}

export function Logo({ collapsed = false }: LogoProps) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 text-lg font-semibold tracking-tight text-slate-100"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 via-sky-500 to-cyan-400 text-2xl font-bold text-white shadow-lg shadow-blue-900/40">
        Q
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-base uppercase tracking-[0.4em] text-slate-400">
            QuantivaHQ
          </span>
          <span className="text-xs text-slate-500 group-hover:text-slate-300">
            Trade with Intelligence
          </span>
        </div>
      )}
    </Link>
  );
}
