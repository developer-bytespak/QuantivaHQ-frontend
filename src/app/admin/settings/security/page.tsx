"use client";

import { useRouter } from "next/navigation";
import { SettingsBackButton } from "@/components/settings/settings-back-button";
import { adminLogout } from "@/lib/api/vcpool-admin";

export default function AdminSecurityPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      // ignore
    }
    router.replace("/admin/login");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsBackButton backHref="/admin/settings" />
      <div className="bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 backdrop-blur-xl border border-[--color-border] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fc4f02]/10 border border-[#fc4f02]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 sm:w-6 h-5 sm:h-6 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Security</h1>
        </div>
        <div className="space-y-4">
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Admin session</h3>
            <p className="text-sm text-slate-400 mb-4">
              You are signed in to the admin panel. Log out when you finish managing pools and settings.
            </p>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
            >
              Log out
            </button>
          </div>
          <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl">
            <p className="text-xs sm:text-sm text-blue-300">
              Password and 2FA are managed by your admin account. Contact your system administrator for account changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
