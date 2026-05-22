"use client";

import Link from "next/link";

export function CustomStrategiesPaywall() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--primary)]/40 bg-gradient-to-br from-[var(--primary)]/15 via-slate-900 to-black p-6 text-center shadow-2xl shadow-[rgba(var(--primary-rgb),0.15)]">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/20">
          <svg className="h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">Custom Strategies are a PRO feature</h2>
        <p className="mb-5 text-sm text-slate-300">
          Build your own trading strategies with AI-powered signals and automated execution.
          Upgrade to <span className="font-semibold text-[var(--primary)]">PRO</span> for up to 5 custom strategies,
          or <span className="font-semibold text-[var(--primary)]">ELITE</span> for unlimited.
        </p>
        <Link
          href="/dashboard/settings/subscription?tab=change"
          className="block w-full rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition hover:opacity-90 hover:scale-[1.02]"
        >
          Upgrade to unlock
        </Link>
      </div>
    </div>
  );
}
