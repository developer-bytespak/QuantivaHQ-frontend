"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[--color-background] text-[--color-foreground]">
      <div className="max-w-lg rounded-3xl border border-[--color-border] bg-[--color-surface] p-10 text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-100">Something glitched</h1>
        <p className="mt-3 text-sm text-slate-400">
          The QuantivaHQ dashboard shell hit an unexpected error. Try reloading the current screen.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-900/30 hover:opacity-90"
        >
          Reload dashboard
        </button>
      </div>
    </div>
  );
}
