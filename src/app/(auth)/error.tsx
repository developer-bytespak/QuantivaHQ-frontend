"use client";

import { useEffect } from "react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[--color-background] text-[--color-foreground]">
      <div className="max-w-lg rounded-3xl border border-[--color-border] bg-[--color-surface] p-10 text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-100">Onboarding paused</h1>
        <p className="mt-3 text-sm text-slate-400">
          We hit a snag preparing your QuantivaHQ account. Retry the current step to continue.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-xl border border-[--color-border] bg-[--color-surface-alt] px-6 py-2 text-sm font-semibold text-[--color-accent] hover:border-[--color-accent] hover:bg-[--color-accent]/10"
        >
          Retry step
        </button>
      </div>
    </div>
  );
}
