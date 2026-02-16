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
    <div className="flex min-h-[200px] flex-col items-center justify-center py-8 text-[--color-foreground]">
      <div className="max-w-lg rounded-2xl border border-[--color-border] bg-[--color-surface] p-6 text-center shadow-lg">
        <h1 className="text-lg font-semibold text-slate-100">Something glitched</h1>
        <p className="mt-2 text-sm text-slate-400">
          This screen hit an unexpected error. Try reloading.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-900/30 hover:opacity-90"
        >
          Reload dashboard
        </button>
      </div>
    </div>
  );
}
