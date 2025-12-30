"use client";

import { SettingsBackButton } from "@/components/settings/settings-back-button";

export default function TokenomicsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SettingsBackButton />
      
      <div className="group cursor-pointer rounded-lg sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 sm:p-8 md:p-12 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
        <div className="flex flex-col items-center justify-center text-center min-h-[300px] sm:min-h-[400px]">
          {/* Icon */}
          <div className="mb-4 sm:mb-6 flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 border border-[#fc4f02]/30">
            <svg
              className="h-8 sm:h-10 w-8 sm:w-10 text-[#fc4f02]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="mb-2 sm:mb-3 text-xl sm:text-3xl font-bold text-white">Tokenomics</h2>

          {/* Coming Soon Text */}
          <p className="mb-2 text-3xl sm:text-5xl font-bold text-[#fc4f02]">Launching Soon</p>
          <p className="max-w-xs sm:max-w-md text-sm sm:text-lg text-slate-400">
            We're working on something exciting! Tokenomics information will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}
