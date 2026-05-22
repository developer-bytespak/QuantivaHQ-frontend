"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useOnboardingProgressStore, {
  isFullyOnboarded,
} from "@/state/onboarding-progress-store";
import { getNextOnboardingStepRoute } from "@/lib/auth/flow-router.service";

const SEEN_STORAGE_KEY = "qhq.freeSignalsPromo.v1.seen";

export function FreeSignalTradesPromoModal() {
  const router = useRouter();
  const { progress } = useOnboardingProgressStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!progress) return;
    if (isFullyOnboarded(progress)) return;
    if (progress.subscription.is_paid) return; // promo is FREE-tier only
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(SEEN_STORAGE_KEY) === "1") return;
    } catch {
      // Private mode or storage disabled — show the modal anyway.
    }
    setOpen(true);
  }, [progress]);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_STORAGE_KEY, "1");
    } catch {
      // Best-effort persistence.
    }
  };

  const handleContinue = () => {
    const next = progress ? getNextOnboardingStepRoute(progress) : null;
    dismiss();
    if (next) router.push(next);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--primary)]/40 bg-gradient-to-br from-[var(--primary)]/15 via-slate-900 to-black p-6 shadow-2xl shadow-[rgba(var(--primary-rgb),0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Free perk for new users
        </div>

        <h2 className="mb-2 text-xl font-bold text-white sm:text-2xl">
          Claim free trading signals for up to 5 trades
        </h2>
        <p className="mb-5 text-sm text-slate-300">
          Finish the onboarding process and your first <span className="font-semibold text-white">5 Top Trades executions are on us</span> — real signals, on your exchange, no upgrade required.
        </p>

        <div className="mb-6 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
          Top Trades unlocks once you complete: Personal info, Identity (KYC), Subscription, and Exchange connection.
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-lg border border-white/15 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/30 hover:text-white"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition hover:opacity-90 hover:scale-[1.02]"
          >
            Continue setup
          </button>
        </div>
      </div>
    </div>
  );
}
