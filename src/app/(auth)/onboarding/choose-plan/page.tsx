"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import {
  PlanTier,
  BillingPeriod,
  calculatePrice,
  getPlansByTier,
} from "@/mock-data/subscription-dummy-data";
import { PRICE_IDS } from "@/constant";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "react-toastify";
import { acknowledgeFreeTier } from "@/lib/api/onboarding";
import { safeReturnPath } from "@/lib/auth/flow-router.service";

const PRO_FEATURES = [
  "Everything in FREE, PLUS:",
  "AI Trading",
  "Auto Execution",
  "Up to 5 Custom Strategies",
];

const ELITE_FEATURES = [
  "Everything in PRO, PLUS:",
  "Unlimited Strategies",
  "Early Access to Features",
  "VC Pool Access",
];

const ELITE_PLUS_FEATURES = [
  "Everything in ELITE, PLUS:",
  "Option Trading",
  "Unlimited Strategies",
  "Early Access to Features",
  "VC Pool Access",
];

function getPriceLabel(period: BillingPeriod): string {
  switch (period) {
    case BillingPeriod.MONTHLY:
      return "/month";
    case BillingPeriod.QUARTERLY:
      return "/3 months";
    case BillingPeriod.YEARLY:
      return "/year";
    default:
      return "";
  }
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    BillingPeriod.MONTHLY,
  );
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const { createCheckout } = useSubscription();

  const returnPath = useMemo(
    () => safeReturnPath(searchParams.get("return")),
    [searchParams],
  );

  const goAfterSelection = () => {
    router.push(returnPath ?? "/dashboard");
  };

  const handleSkipFree = async () => {
    setSkipLoading(true);
    try {
      await acknowledgeFreeTier();
      goAfterSelection();
    } catch {
      toast.error("Could not save your choice. Please try again.");
      setSkipLoading(false);
    }
  };

  const handleSelectPaid = (tier: PlanTier) => {
    const plans = getPlansByTier(tier).filter(
      (p) => p.billing_period === billingPeriod,
    );
    const plan = plans[0];
    if (!plan) return;

    let priceId = "";
    if (tier === PlanTier.PRO) {
      priceId =
        billingPeriod === BillingPeriod.MONTHLY
          ? PRICE_IDS.PRO_PLAN_MONTHLY
          : billingPeriod === BillingPeriod.QUARTERLY
            ? PRICE_IDS.PRO_PLAN_QUARTERLY
            : PRICE_IDS.PRO_PLAN_YEARLY;
    } else if (tier === PlanTier.ELITE) {
      priceId =
        billingPeriod === BillingPeriod.MONTHLY
          ? PRICE_IDS.ELITE_PLAN_MONTHLY
          : billingPeriod === BillingPeriod.QUARTERLY
            ? PRICE_IDS.ELITE_PLAN_QUARTERLY
            : PRICE_IDS.ELITE_PLAN_YEARLY;
    } else if (tier === PlanTier.ELITE_PLUS) {
      priceId =
        billingPeriod === BillingPeriod.MONTHLY
          ? PRICE_IDS.ELITE_PLUS_PLAN_MONTHLY
          : billingPeriod === BillingPeriod.QUARTERLY
            ? PRICE_IDS.ELITE_PLUS_PLAN_QUARTERLY
            : PRICE_IDS.ELITE_PLUS_PLAN_YEARLY;
    }

    setLoadingPlanId(plan.plan_id);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    // After Stripe checkout we bring the user back to the dashboard (or to
    // their chosen return path) — never to the legacy /onboarding/account-type
    // page, which only exists as a deep-link target for the exchange step now.
    const successPath = returnPath ?? "/dashboard";
    const successQuerySep = successPath.includes("?") ? "&" : "?";
    createCheckout.mutate(
      {
        plan_id: plan.plan_id,
        price_id: priceId,
        cancel_url: `${baseUrl}/onboarding/choose-plan${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`,
        success_url: `${baseUrl}${successPath}${successQuerySep}onboarding=plan-selected`,
      },
      {
        onSuccess: (data: { url?: string }) => {
          if (data?.url) {
            window.location.href = data.url;
          } else {
            setLoadingPlanId(null);
            toast.error("Could not start checkout.");
          }
        },
        onError: () => {
          setLoadingPlanId(null);
          toast.error("Failed to start checkout. Please try again.");
        },
      },
    );
  };

  const proPriceInfo = calculatePrice(PlanTier.PRO, billingPeriod);
  const elitePriceInfo = calculatePrice(PlanTier.ELITE, billingPeriod);
  const elitePlusPlans = getPlansByTier(PlanTier.ELITE_PLUS).filter(
    (p) => p.billing_period === billingPeriod,
  );
  const elitePlusPrice = elitePlusPlans[0]
    ? `$${elitePlusPlans[0].price}`
    : "$119.99";

  const periodOptions: { value: BillingPeriod; label: string }[] = [
    { value: BillingPeriod.MONTHLY, label: "Monthly" },
    { value: BillingPeriod.QUARTERLY, label: "Quarterly -15%" },
    { value: BillingPeriod.YEARLY, label: "Yearly -20%" },
  ];

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
          Upgrade your plan
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          You&apos;re on the Free tier. Upgrade for AI trading, custom strategies, and more — or stay on Free.
        </p>

        <div className="mb-6 w-full max-w-6xl rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-center text-xs sm:text-sm text-amber-200">
            <span className="font-semibold">Note:</span> ELITE Plus is recommended for Binance users only.
          </p>
        </div>

        {/* Billing period toggle */}
        <div className="mb-8 flex flex-wrap justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBillingPeriod(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                billingPeriod === opt.value
                  ? "bg-[var(--primary)] text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Plan cards (FREE tier omitted — every user is already on FREE) */}
        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* PRO */}
          <div className="relative flex flex-col rounded-xl border-2 border-[var(--primary)]/50 bg-[var(--primary)]/5 p-5 backdrop-blur">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-3 py-0.5 text-xs font-semibold text-white">
              POPULAR
            </div>
            <h3 className="text-lg font-semibold text-white">PRO</h3>
            <p className="mb-4 text-xs text-slate-400">
              Perfect for individual traders
            </p>
            <p className="mb-4 text-2xl font-bold text-white">
              ${proPriceInfo.price.toFixed(2)}
              <span className="text-sm font-normal text-slate-400">
                {getPriceLabel(billingPeriod)}
              </span>
            </p>
            <ul className="mb-6 flex-1 space-y-2 text-sm text-slate-300">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPaid(PlanTier.PRO)}
              disabled={createCheckout.isPending || !!loadingPlanId}
              className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              {loadingPlanId && getPlansByTier(PlanTier.PRO).some((p) => p.plan_id === loadingPlanId)
                ? "Loading..."
                : "Get Started"}
            </button>
          </div>

          {/* ELITE */}
          <div className="flex flex-col rounded-xl border-2 border-white/20 bg-[--color-surface-alt]/80 p-5 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">ELITE</h3>
            <p className="mb-4 text-xs text-slate-400">
              For professional traders
            </p>
            <p className="mb-4 text-2xl font-bold text-white">
              ${elitePriceInfo.price.toFixed(2)}
              <span className="text-sm font-normal text-slate-400">
                {getPriceLabel(billingPeriod)}
              </span>
            </p>
            <ul className="mb-6 flex-1 space-y-2 text-sm text-slate-300">
              {ELITE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPaid(PlanTier.ELITE)}
              disabled={createCheckout.isPending || !!loadingPlanId}
              className="w-full rounded-lg border-2 border-white/30 bg-transparent py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5 disabled:opacity-50"
            >
              {loadingPlanId && getPlansByTier(PlanTier.ELITE).some((p) => p.plan_id === loadingPlanId)
                ? "Loading..."
                : "Get Started"}
            </button>
          </div>

          {/* ELITE Plus */}
          <div className="flex flex-col rounded-xl border-2 border-white/20 bg-[--color-surface-alt]/80 p-5 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">ELITE Plus</h3>
            <p className="mb-4 text-xs text-slate-400">
              For advanced traders with option trading
            </p>
            <p className="mb-4 text-2xl font-bold text-white">
              {elitePlusPrice}
              <span className="text-sm font-normal text-slate-400">
                {getPriceLabel(billingPeriod)}
              </span>
            </p>
            <ul className="mb-6 flex-1 space-y-2 text-sm text-slate-300">
              {ELITE_PLUS_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectPaid(PlanTier.ELITE_PLUS)}
              disabled={createCheckout.isPending || !!loadingPlanId}
              className="w-full rounded-lg border-2 border-white/30 bg-transparent py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5 disabled:opacity-50"
            >
              {loadingPlanId && getPlansByTier(PlanTier.ELITE_PLUS).some((p) => p.plan_id === loadingPlanId)
                ? "Loading..."
                : "Get Started"}
            </button>
          </div>
        </div>

        {/* Skip — stay on Free */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleSkipFree}
            disabled={skipLoading}
            className="rounded-lg border border-white/20 bg-transparent px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/40 hover:text-white disabled:opacity-60"
          >
            {skipLoading ? "Saving…" : "Skip — stay on Free"}
          </button>
          <p className="text-xs text-slate-500">You can upgrade any time from the dashboard.</p>
        </div>
      </div>
    </div>
  );
}
