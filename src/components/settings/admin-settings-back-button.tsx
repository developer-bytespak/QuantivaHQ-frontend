"use client";

import Link from "next/link";

export function AdminSettingsBackButton() {
  return (
    <Link
      href="/admin/settings"
      className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Settings
    </Link>
  );
}
