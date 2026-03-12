"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminGetSettings, adminLogout } from "@/lib/api/vcpool-admin";
import type { AdminProfile } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

interface SettingsItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color?: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminGetSettings()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        const msg = (err as { message?: string })?.message ?? "Failed to load settings";
        if (!cancelled) showNotification(msg, "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showNotification]);

  const handleLogout = async () => {
    try {
      await adminLogout();
      router.replace("/admin/login");
    } catch {
      router.replace("/admin/login");
    }
  };

  const settingsItems: SettingsItem[] = [
    {
      id: "exchange-config",
      label: "Exchange Configuration",
      href: "/admin/settings/exchange-configuration",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "binance",
      label: "Binance UID / Deposit Wallet",
      href: "/admin/settings/binance",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "fees",
      label: "Default Fees",
      href: "/admin/settings/fees",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      href: "/admin/settings/notifications",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      href: "/admin/settings/security",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: "help-support",
      label: "Help and Support",
      href: "/admin/settings/help-support",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "terms",
      label: "Terms and Conditions",
      href: "/admin/settings/terms",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "logout",
      label: "Logout",
      href: "#",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      color: "text-red-400",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Back Button - same as user */}
      <button
        onClick={() => router.push("/admin/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-xs sm:text-sm font-medium">Back to Dashboard</span>
      </button>

      {/* Profile card - same style as user Settings (orange gradient) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fc4f02] via-[#fd6a00] to-[#fd8a00] p-4 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">{initial}</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{profile?.full_name ?? "Admin"}</h2>
          <p className="text-white/90 text-sm mt-1">{profile?.email ?? "—"}</p>
        </div>
      </div>

      {/* Settings list - same style as user (Subscription, Tokenomics rows) */}
      <div className="bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Settings</h3>
        <div className="space-y-2">
          {settingsItems.map((item) =>
            item.id === "logout" ? (
              <button
                key={item.id}
                onClick={handleLogout}
                className="w-full flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
              >
                <div className={`flex-shrink-0 text-sm sm:text-base ${item.color || "text-[#fc4f02]"}`}>
                  {item.icon}
                </div>
                <span className={`flex-1 text-left text-xs sm:text-sm font-medium ${item.color || "text-white"} group-hover:text-[#fc4f02] transition-colors`}>
                  {item.label}
                </span>
                <svg
                  className={`w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 ${item.color || "text-slate-400"} group-hover:text-[#fc4f02] transition-colors`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <Link
                key={item.id}
                href={item.href}
                className="w-full flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent hover:from-white/[0.1] hover:to-transparent transition-all duration-200 group cursor-pointer"
              >
                <div className={`flex-shrink-0 text-sm sm:text-base ${item.color || "text-[#fc4f02]"}`}>
                  {item.icon}
                </div>
                <span className={`flex-1 text-left text-xs sm:text-sm font-medium ${item.color || "text-white"} group-hover:text-[#fc4f02] transition-colors`}>
                  {item.label}
                </span>
                <svg
                  className={`w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0 ${item.color || "text-slate-400"} group-hover:text-[#fc4f02] transition-colors`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
