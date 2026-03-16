"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const PLAN_CHOSEN_KEY = "quantivahq_plan_chosen";

const FREE_FEATURES = [
  "Real-Time Data",
  "Mobile Access",
  "Web Access",
  "Multi-Exchange Support",
];

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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(
    BillingPeriod.MONTHLY
  );
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { createCheckout , createSubs } = useSubscription();

  const handleContinueWithFree = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PLAN_CHOSEN_KEY, PlanTier.FREE);
    }
    const { navigateToNextRoute } = await import("@/lib/auth/flow-router.service");
    await navigateToNextRoute(router);
  };

  const handleSelectFree = () => {
    handleContinueWithFree();
  };

  const handleSelectPaid = (tier: PlanTier) => {
    if (tier === PlanTier.ELITE_PLUS) {
      toast.info("ELITE Plus is coming soon.");
      return;
    }

    const plans = getPlansByTier(tier).filter(
      (p) => p.billing_period === billingPeriod
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
    }

    setLoadingPlanId(plan.plan_id);
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : "";
    createCheckout.mutate(
      {
        plan_id: plan.plan_id,
        price_id: priceId,
        cancel_url: `${baseUrl}/onboarding/choose-plan`,
        success_url: `${baseUrl}/onboarding/account-type`,
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
      }
    );
  };

  // Resolve display price per tier for current billing period
  const freePrice = "$0";
  const proPriceInfo = calculatePrice(PlanTier.PRO, billingPeriod);
  const elitePriceInfo = calculatePrice(PlanTier.ELITE, billingPeriod);
  const elitePlusPlans = getPlansByTier(PlanTier.ELITE_PLUS).filter(
    (p) => p.billing_period === billingPeriod
  );
  const elitePlusPrice = elitePlusPlans[0]
    ? `$${elitePlusPlans[0].price}`
    : "$119.99";

  const periodOptions: { value: BillingPeriod; label: string }[] = [
    { value: BillingPeriod.MONTHLY, label: "Monthly" },
    {
      value: BillingPeriod.QUARTERLY,
      label: "Quarterly -15%",
    },
    { value: BillingPeriod.YEARLY, label: "Yearly -20%" },
  ];

  const handleSubscribe = async (tier: PlanTier) => {
    await createSubs.mutate({
      plan_id: tier,
      price_id: "",
      status: "active",
      auto_renew: false,
    }, {
      onSuccess: () => {
        toast.success("Subscription created successfully");
        router.push("/onboarding/account-type");
      },
      onError: () => {
        toast.error("Failed to create subscription");
      },
    });
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl" />

      <BackButton />

      <div className="relative z-10 flex flex-col items-center px-4 pb-8 pt-6 sm:px-6">
        <div className="mb-6 flex justify-center">
          <QuantivaLogo className="h-9 w-9 sm:h-10 sm:w-10" />
        </div>
        <h1 className="mb-1 text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
          Choose your plan
        </h1>
        <p className="mb-6 text-center text-sm text-slate-400">
          Select a plan to get started with Quantiva
        </p>

        {/* Billing period toggle */}
        <div className="mb-8 flex flex-wrap justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBillingPeriod(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                billingPeriod === opt.value
                  ? "bg-[#fc4f02] text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div className="grid w-full max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <div className="flex flex-col rounded-xl border-2 border-white/20 bg-[--color-surface-alt]/80 p-5 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">Free</h3>
            <p className="mb-4 text-xs text-slate-400">
              Perfect for getting started
            </p>
            <p className="mb-4 text-2xl font-bold text-white">
              {freePrice}
              <span className="text-sm font-normal text-slate-400">/month</span>
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
              onClick={() => handleSubscribe(PlanTier.FREE)}
              disabled={createSubs.isPending}
              className="w-full rounded-lg border-2 border-white/30 bg-transparent py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
            >
              Get Started
            </button>
          </div>

          {/* PRO */}
          <div className="relative flex flex-col rounded-xl border-2 border-[#fc4f02]/50 bg-[#fc4f02]/5 p-5 backdrop-blur">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#fc4f02] px-3 py-0.5 text-xs font-semibold text-white">
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
              className="w-full rounded-lg bg-[#fc4f02] py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04502] disabled:opacity-50"
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
              className="w-full rounded-lg border-2 border-white/30 bg-transparent py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Continue with free tier */}
       
      </div>
    </div>
  );
}
