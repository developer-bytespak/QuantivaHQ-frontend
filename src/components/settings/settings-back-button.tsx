"use client";

import { useRouter } from "next/navigation";

export function SettingsBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/dashboard/settings")}
      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="text-sm font-medium">Back to Settings</span>
    </button>
  );
}

