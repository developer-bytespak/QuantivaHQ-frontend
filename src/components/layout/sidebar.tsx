"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

export type SidebarSection = {
  title: string;
  items: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
};

interface DashboardSidebarProps {
  sections: SidebarSection[];
}

export function DashboardSidebar({ sections }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`group/dashboard relative flex h-full flex-col border-r border-[--color-border] bg-[--color-surface] text-slate-100 transition-[width] duration-300 ease-out ${collapsed ? "w-[92px]" : "w-[260px]"}`}
    >
      <div className="flex items-center justify-between px-5 pb-4 pt-6">
        <Logo collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-3 py-1 text-xs text-slate-300 transition hover:border-slate-500/40 hover:text-white"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-8">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            {!collapsed && (
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {section.title}
              </p>
            )}
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium transition-all ${isActive ? "bg-[--color-accent]/10 text-[--color-accent]" : "text-slate-300 hover:border-slate-700/40 hover:bg-slate-900/60 hover:text-white"}`}
                  >
                    <span className="h-2 w-2 rounded-full border border-slate-600 bg-slate-800 group-hover:border-[--color-accent] group-hover:bg-[--color-accent]" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[--color-border] bg-[--color-surface-alt] px-4 py-5 text-xs text-slate-500">
        {!collapsed ? (
          <div className="space-y-2">
            <p className="font-semibold text-slate-300">Upgrade your edge</p>
            <p className="leading-relaxed">
              Unlock Elite AI strategies, multi-account automation, and 24/7 smart alerts.
            </p>
            <Link
              href="/settings/subscription"
              className="inline-flex items-center justify-center rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 text-sm font-semibold text-[--color-accent] transition hover:border-[--color-accent] hover:bg-[--color-accent]/10"
            >
              Upgrade
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-[--color-accent]">Pro</span>
            <Link
              href="/settings/subscription"
              className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-2 text-xs text-slate-300 transition hover:border-[--color-accent] hover:text-white"
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
