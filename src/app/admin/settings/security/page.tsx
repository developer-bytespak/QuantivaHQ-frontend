"use client";

import { AdminSettingsBackButton } from "@/components/settings/admin-settings-back-button";

export default function AdminSecurityPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminSettingsBackButton />
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
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Admin account security</h3>
            <p className="text-sm text-slate-400">
              Keep your admin credentials secure. To change your admin password, please use the admin login flow or contact your system administrator.
            </p>
          </div>
          <div className="bg-[--color-surface]/50 border border-[--color-border]/50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Two-factor authentication</h3>
            <p className="text-sm text-slate-400">
              Additional security options for admin accounts can be configured by your platform administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
