"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

export type SidebarSection = {
  title: string;
  items: Array<{
    label: string;
    href: string;
    description?: string;
    icon?: React.ReactNode;
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

const getIcon = (label: string, isActive: boolean) => {
  const iconProps = { isActive };
  switch (label.toLowerCase()) {
    case "dashboard":
      return <DashboardIcon {...iconProps} />;
    case "top trades":
      return <TradesIcon {...iconProps} />;
    case "ai insights":
      return <AIInsightsIcon {...iconProps} />;
    case "vc pool":
      return <VCPoolIcon {...iconProps} />;
    case "profile":
      return <ProfileIcon {...iconProps} />;
    default:
      return null;
  }
};

export function DashboardSidebar({ sections }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`group/dashboard relative flex h-screen flex-col border-r border-[--color-border] bg-gradient-to-b from-[--color-surface] to-[--color-surface-alt] text-slate-100 transition-[width] duration-300 ease-out ${collapsed ? "w-[80px]" : "w-[280px]"}`}
    >
      {/* Header */}
      <div className="border-b border-[--color-border] bg-[--color-surface-alt]/50 px-4 py-5">
        <div className="flex items-center justify-center">
          <Logo collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && section.title && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/20 text-[#fc4f02] shadow-lg shadow-[#fc4f02]/10"
                        : "text-slate-300 hover:bg-[--color-surface-alt] hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#fc4f02] to-[#fda300]" />
                    )}
                    <div className={`flex-shrink-0 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}>
                      {getIcon(item.label, isActive)}
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

      {/* Footer - User Profile Section */}
      <UserProfileSection collapsed={collapsed} />
    </aside>
  );
}

// Separate component for user profile to handle client-side localStorage
function UserProfileSection({ collapsed }: { collapsed: boolean }) {
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [userInitial, setUserInitial] = useState<string>("U");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("quantivahq_user_name") || "User";
      const email = localStorage.getItem("quantivahq_user_email") || "user@example.com";
      setUserName(name);
      setUserEmail(email);
      setUserInitial(name.charAt(0).toUpperCase());
    }
  }, []);

  return (
    <div className="border-t border-[--color-border] bg-[--color-surface-alt]/50 px-4 py-4">
      {!collapsed ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-surface] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-sm font-bold text-white shadow-lg shadow-[#fc4f02]/30">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-slate-400">{userEmail}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] text-sm font-bold text-white shadow-lg shadow-[#fc4f02]/30">
            {userInitial}
          </div>
        </div>
      )}
    </div>
  );
}
