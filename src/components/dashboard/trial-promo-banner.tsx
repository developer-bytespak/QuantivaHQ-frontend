"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import useSubscriptionStore from "@/state/subscription-store";
import { useSubscription } from "@/hooks/useSubscription";
import { PREMIUM_PERIOD_RENEWAL, TRIAL_DAYS } from "@/config/subscription";

const DISMISS_KEY = "quantivahq_trial_promo_dismissed_until";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function readDismissedUntil(): number {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

// Dismissal lives in localStorage; useSyncExternalStore reads it without a
// setState-in-effect and keeps the server render (hidden) hydration-safe.
const dismissListeners = new Set<() => void>();

function subscribeDismissed(onChange: () => void): () => void {
  dismissListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    dismissListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function isDismissedSnapshot(): boolean {
  return readDismissedUntil() > Date.now();
}

function isDismissedServerSnapshot(): boolean {
  return true;
}

function writeDismissedUntil(timestamp: number): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(timestamp));
  } catch {
    // Storage unavailable (private mode, quota). The banner simply shows again next visit.
  }
  dismissListeners.forEach((listener) => listener());
}

/**
 * Slim dashboard card for Free users who can still start the 7-day trial.
 * Hidden for Premium, trialing and non-eligible accounts. Dismissal is kept in
 * localStorage for 7 days.
 */
export function TrialPromoBanner() {
  const {
    currentSubscription,
    isPremium,
    isTrialActive,
    isTrialEligible,
    selectedBillingPeriod,
    getPremiumPriceLabel,
  } = useSubscriptionStore();
  const { createCheckout } = useSubscription();
  const dismissed = useSyncExternalStore(subscribeDismissed, isDismissedSnapshot, isDismissedServerSnapshot);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (dismissed || !currentSubscription) return null;
  if (isPremium() || isTrialActive() || !isTrialEligible()) return null;

  const period = selectedBillingPeriod;
  const amount = getPremiumPriceLabel(period);
  const renewal = PREMIUM_PERIOD_RENEWAL[period];
  const busy = checkoutLoading || createCheckout.isPending;

  const handleDismiss = () => {
    writeDismissedUntil(Date.now() + DISMISS_FOR_MS);
  };

  const handleStartTrial = () => {
    setCheckoutLoading(true);
    const origin = window.location.origin;
    createCheckout.mutate(
      {
        billing_period: period,
        // The plan-activation watcher in the dashboard layout picks this flag up
        // and polls until Premium is active, same as the choose-plan flow.
        success_url: `${origin}/dashboard?onboarding=plan-selected`,
        cancel_url: `${origin}/dashboard`,
      },
      {
        onSuccess: (data) => {
          if (data?.url) {
            window.location.href = data.url;
          } else {
            setCheckoutLoading(false);
            toast.error("Could not start checkout.");
          }
        },
        onError: () => {
          setCheckoutLoading(false);
          toast.error("Failed to start checkout. Please try again.");
        },
      },
    );
  };

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-[var(--primary)]/30 bg-[--color-surface] px-4 py-3 pr-10 sm:flex-row sm:items-center sm:justify-between sm:pr-12">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Unlock every feature free for {TRIAL_DAYS} days</p>
          <p className="mt-0.5 text-xs text-slate-400">
            AI signals, auto execution, options and VC Pools. No charge until day {TRIAL_DAYS + 1}, then ${amount}{" "}
            {renewal} unless you cancel.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={handleStartTrial}
          disabled={busy}
          className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "linear-gradient(90deg,#fc4f02,#fda300)" }}
        >
          {busy ? "Loading..." : "Start free trial"}
        </button>
        <Link
          href="/onboarding/choose-plan?return=%2Fdashboard"
          className="whitespace-nowrap text-xs font-semibold text-[var(--primary)] transition-colors hover:text-[var(--primary-light)]"
        >
          See plans
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-slate-500 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
