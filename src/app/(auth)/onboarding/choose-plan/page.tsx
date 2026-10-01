"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { BillingPeriodToggle } from "@/components/subscription/billing-period-toggle";
import useSubscriptionStore from "@/state/subscription-store";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "react-toastify";
import { acknowledgeFreeTier } from "@/lib/api/onboarding";
import { safeReturnPath } from "@/lib/auth/flow-router.service";
import {
  PREMIUM_PERIOD_RENEWAL,
  PREMIUM_PERIOD_SUFFIX,
  TRIAL_DAYS,
  premiumPriceLabel,
} from "@/config/subscription";

const FREE_FEATURES = [
  "Real-time market data",
  "Portfolio tracking",
  "Web and mobile access",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "AI trading signals and auto execution",
  "Unlimited custom strategies",
  "Options trading",
  "VC Pool access",
  "Early access to new features",
];

/** What a trial-eligible user gets from day one. Shown under the Premium CTA. */
const TRIAL_INCLUDES = [
  "Every Premium feature from day one",
  "AI signals, auto execution, options and VC Pools",
  `No charge until day ${TRIAL_DAYS + 1}. Cancel anytime from Settings`,
];

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const e = error as { message?: unknown; response?: { data?: { message?: unknown } } };
    const fromResponse = e.response?.data?.message;
    if (typeof fromResponse === "string" && fromResponse.trim()) return fromResponse;
    if (Array.isArray(fromResponse) && fromResponse.length) return fromResponse.join(", ");
    if (typeof e.message === "string" && e.message.trim()) return e.message;
  }
  return fallback;
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const { createCheckout } = useSubscription();
  const {
    allPlans,
    isLoading,
    fetchSubscriptionData,
    isPremium,
    isTrialEligible,
    getPremiumPriceLabel,
    getPremiumSavingsPercent,
    selectedBillingPeriod,
    setSelectedBillingPeriod,
  } = useSubscriptionStore();

  const returnPath = useMemo(
    () => safeReturnPath(searchParams.get("return")),
    [searchParams],
  );

  // Load the live catalogue (Premium prices, trial eligibility) if nothing is cached.
  useEffect(() => {
    if (allPlans.length === 0) {
      void fetchSubscriptionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Already paid: there is nothing to choose here.
  useEffect(() => {
    if (isPremium()) {
      router.replace(returnPath ?? "/dashboard");
    }
  }, [allPlans, returnPath, router, isPremium]);

  const goAfterSelection = () => {
    router.push(returnPath ?? "/dashboard");
  };

  const handleContinueFree = async () => {
    setSkipLoading(true);
    try {
      await acknowledgeFreeTier();
      goAfterSelection();
    } catch {
      toast.error("Could not save your choice. Please try again.");
      setSkipLoading(false);
    }
  };

  const handleStartPremium = () => {
    setCheckoutLoading(true);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    // After Stripe Checkout bring the user back to the dashboard (or their
    // chosen return path). The watcher in the dashboard layout picks up
    // ?onboarding=plan-selected and polls until the plan is active.
    const successPath = returnPath ?? "/dashboard";
    const successQuerySep = successPath.includes("?") ? "&" : "?";
    createCheckout.mutate(
      {
        billing_period: selectedBillingPeriod,
        cancel_url: `${baseUrl}/onboarding/choose-plan${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`,
        success_url: `${baseUrl}${successPath}${successQuerySep}onboarding=plan-selected`,
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
        onError: (error: unknown) => {
          setCheckoutLoading(false);
          toast.error(getErrorMessage(error, "Failed to start checkout. Please try again."));
        },
      },
    );
  };

  const trialEligible = isTrialEligible();
  const period = selectedBillingPeriod;
  const priceAmount = getPremiumPriceLabel(period);
  const fullPriceLabel = premiumPriceLabel(period, priceAmount);
  const periodSuffix = PREMIUM_PERIOD_SUFFIX[period];
  const renewal = PREMIUM_PERIOD_RENEWAL[period];
  const busy = checkoutLoading || createCheckout.isPending;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-black">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[var(--primary)]/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[var(--primary)]/5 blur-3xl" />

      <BackButton />

      <div className="relative z-10 flex flex-col items-center px-4 pb-8 pt-6 sm:px-6">
        <div className="mb-6 flex justify-center">
          <QuantivaLogo className="h-9 w-9 sm:h-10 sm:w-10" />
        </div>
        <h1 className="mb-1 text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
          Choose your plan
        </h1>
        {trialEligible && (
          <p className="mb-1 text-center text-sm font-semibold text-[var(--primary)]">
            Try everything free for {TRIAL_DAYS} days
          </p>
        )}
        <p className="mb-6 text-center text-sm text-slate-400">
          Start free, or unlock everything with Premium.
        </p>

        <BillingPeriodToggle
          className="mb-6"
          value={period}
          onChange={setSelectedBillingPeriod}
          getSavingsPercent={getPremiumSavingsPercent}
          disabled={busy || skipLoading}
        />

        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {/* FREE */}
          <div className="flex flex-col rounded-xl border-2 border-white/20 bg-[--color-surface-alt]/80 p-5 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">Free</h3>
            <p className="mb-4 text-xs text-slate-400">Explore the markets at no cost</p>
            <p className="mb-4 text-2xl font-bold text-white">
              $0
              <span className="text-sm font-normal text-slate-400"> /month</span>
            </p>
            <ul className="mb-6 flex-1 space-y-2 text-sm text-slate-300">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleContinueFree}
              disabled={skipLoading || busy}
              className="w-full rounded-lg border-2 border-white/30 bg-transparent py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5 disabled:opacity-50"
            >
              {skipLoading ? "Saving..." : "Continue with Free"}
            </button>
          </div>

          {/* PREMIUM */}
          <div className="relative flex flex-col rounded-xl border-2 border-[var(--primary)]/60 bg-[var(--primary)]/5 p-5 backdrop-blur">
            {trialEligible && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-semibold text-white">
                {TRIAL_DAYS}-DAY FREE TRIAL
              </div>
            )}
            <h3 className="text-lg font-semibold text-white">Premium</h3>
            <p className="mb-4 text-xs text-slate-400">Every feature. Billed monthly, quarterly or yearly.</p>
            <p className="mb-4 text-2xl font-bold text-white">
              {isLoading && allPlans.length === 0 ? (
                <span className="inline-block h-7 w-24 animate-pulse rounded bg-white/10 align-middle" />
              ) : (
                <>${priceAmount}</>
              )}
              <span className="text-sm font-normal text-slate-400"> {periodSuffix}</span>
            </p>
            <ul className="mb-6 flex-1 space-y-2 text-sm text-slate-300">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleStartPremium}
              disabled={busy || skipLoading}
              className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {busy
                ? "Loading..."
                : trialEligible
                  ? `Start ${TRIAL_DAYS}-day free trial`
                  : `Subscribe for ${fullPriceLabel}`}
            </button>
            {trialEligible && (
              <div className="mt-4 rounded-lg border border-[var(--primary)]/25 bg-black/30 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)]">
                  During your {TRIAL_DAYS}-day trial
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {TRIAL_INCLUDES.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          {trialEligible
            ? `Card required to start your trial. You will not be charged today. On day ${TRIAL_DAYS + 1} your card is charged $${priceAmount} and your plan renews ${renewal} unless you cancel first. Cancel anytime from Settings, and you keep access until your trial ends.`
            : `Billed $${priceAmount} today and then ${renewal}. Cancel anytime from Settings; you keep access until the end of your billing period.`}
        </p>
        <p className="mt-2 text-xs text-slate-500">You can upgrade any time from the dashboard.</p>
      </div>
    </div>
  );
}
