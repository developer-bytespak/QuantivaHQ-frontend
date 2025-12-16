"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

export type SidebarSection = {
  title: string;
  items: Array<{
    label: string;
    href: string;
    description?: string;
    icon?: ReactNode;
  }>;
};

interface DashboardSidebarProps {
  sections: SidebarSection[];
}

// Icon components for menu items
const DashboardIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TradesIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AIInsightsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const VCPoolIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ProfileIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const HoldingsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MarketIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const PaperTradingIcon = ({ isActive }: { isActive: boolean }) => (
  <svg className={`h-5 w-5 ${isActive ? "text-[#fc4f02]" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const getIcon = (label: string, isActive: boolean) => {
  const iconProps = { isActive };
  switch (label.toLowerCase()) {
    case "dashboard":
      return <DashboardIcon {...iconProps} />;
    case "market":
      return <MarketIcon {...iconProps} />;
    case "top trades":
      return <TradesIcon {...iconProps} />;
    case "ai insights":
      return <AIInsightsIcon {...iconProps} />;
    case "vc pool":
      return <VCPoolIcon {...iconProps} />;
    case "paper trading":
      return <PaperTradingIcon {...iconProps} />;
    case "holdings":
      return <HoldingsIcon {...iconProps} />;
    case "profile":
      return <ProfileIcon {...iconProps} />;
    default:
      return null;
  }
};

export function DashboardSidebar({ sections }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`group/dashboard relative flex h-screen flex-col border-r border-[#fc4f02]/30 bg-gradient-to-b from-[--color-surface] to-[--color-surface-alt] text-slate-100 transition-[width] duration-300 ease-out ${collapsed ? "w-[80px]" : "w-[280px]"}`}
    >
      {/* Header */}
      <div className="flex h-24 items-center justify-center bg-[--color-surface-alt]/50 px-8">
        <Logo collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && section.title && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                // More precise active state detection
                // For /dashboard and /stocks-dashboard, only match exactly
                // For other paths, match exactly or if pathname starts with href + "/"
                let isActive = false;
                if (item.href === "/dashboard" || item.href === "/stocks-dashboard") {
                  isActive = pathname === item.href;
                } else {
                  isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false);
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-xl ${collapsed ? "px-2" : "px-3"} py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/20 text-[#fc4f02] shadow-lg shadow-[#fc4f02]/10"
                        : "text-slate-300 hover:bg-[--color-surface-alt] hover:text-white"
                      }`}
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#fc4f02] to-[#fda300]"
                      />
                    )}
                    <div className="flex-shrink-0 flex items-center justify-center">
                      {getIcon(item.label, isActive) || (
                        <div className={`h-5 w-5 rounded ${isActive ? "bg-[#fc4f02]" : "bg-slate-400"}`}></div>
                      )}
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
          </div>
        ))}
      </nav>

    </aside>
  );
}
