"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCurrentUser } from "@/lib/api/user";
import { navigateToDashboard } from "@/lib/auth/flow-router.service";
import useSubscriptionStore from "@/state/subscription-store";
import {
  PREMIUM_PERIOD_RENEWAL,
  PREMIUM_PERIOD_SUFFIX,
  TRIAL_DAYS,
  isLegacyPaidTier,
} from "@/config/subscription";
import { BillingPeriodToggle } from "@/components/subscription/billing-period-toggle";
import { HomeSection } from "./motion/home-section";
import { Stagger, StaggerItem } from "./motion/stagger";
import { NumberTicker } from "./motion/number-ticker";
import { scrollToId } from "./motion/smooth-scroll";
import { TrialStepsStrip } from "./trial-steps-strip";
import { useTrialCta } from "./use-trial-cta";

interface PricingTier {
  name: string;
  /** Numeric price; 0 renders with the period label inline ("$0 forever"). */
  amount: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  /** Small pill shown under the title (e.g. "7-day free trial"). */
  badge?: string;
  /** Fine print rendered under the CTA. */
  footnote?: string;
  /** Short reassurance bullets rendered under the footnote, one icon each. */
  reassurances?: string[];
}

/** Calendar, cog, shield: paired by index with the reassurance bullets. */
const REASSURANCE_ICON_PATHS = [
  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
];

function PricingCard({ tier, isCurrentPlan }: { tier: PricingTier; isCurrentPlan: boolean }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  // Premium card: same auth check, but signed-in Free users land on choose-plan.
  const { startTrial, isChecking } = useTrialCta();

  const handleGetStarted = async () => {
    setIsCheckingAuth(true);
    try {
      // Check if user is already authenticated
      await getCurrentUser();
      // User is authenticated, send straight to the dashboard.
      await navigateToDashboard(router);
    } catch (error: unknown) {
      const err = error as { status?: number; statusCode?: number; message?: string };
      const isUnauthorized =
        err?.status === 401 ||
        err?.statusCode === 401 ||
        err?.message?.includes("401") ||
        err?.message?.includes("Unauthorized");
      if (!isUnauthorized) {
        console.error("Error checking authentication:", error);
      }
      router.push("/onboarding/sign-up?tab=signup");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const highlighted = tier.popular && !isCurrentPlan;

  return (
    <div className={`relative h-full ${tier.popular ? "lg:-my-2" : ""}`}>
      {/* Popular / Current badges */}
      {(tier.popular || isCurrentPlan) && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <span
            className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-lg ${
              isCurrentPlan
                ? "bg-green-500"
                : "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] shadow-[rgba(var(--primary-rgb),0.4)]"
            }`}
          >
            {isCurrentPlan ? "Current Plan" : "Most Popular"}
          </span>
        </div>
      )}

      <div
        className={`relative flex h-full flex-col rounded-3xl border p-6 backdrop-blur-md transition-colors duration-300 ${
          highlighted
            ? "hp-conic-border border-transparent bg-[#0d0d0d]"
            : isCurrentPlan
              ? "border-green-500/50 bg-white/[0.03]"
              : "border-white/10 bg-white/[0.03] hover:border-[var(--primary)]/40"
        }`}
      >
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
            {tier.badge && (
              <span className="rounded-full border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                {tier.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{tier.description}</p>
        </div>

        <div className="mb-6 border-b border-white/[0.08] pb-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold text-white">
              <NumberTicker value={tier.amount} prefix="$" decimals={tier.amount % 1 === 0 ? 0 : 2} duration={0.6} />
            </span>
            {tier.amount > 0 && <span className="text-sm font-normal text-slate-500">/{tier.period}</span>}
            {tier.amount === 0 && <span className="text-sm font-normal text-slate-500">{tier.period}</span>}
          </div>
        </div>

        <ul className="mb-6 flex-grow space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs leading-relaxed text-slate-300">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={tier.popular ? startTrial : handleGetStarted}
          disabled={isCheckingAuth || isChecking || isCurrentPlan}
          className={`w-full cursor-pointer rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
            highlighted
              ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] hover:shadow-xl"
              : isCurrentPlan
                ? "bg-green-500 text-white"
                : "border border-white/15 bg-white/[0.04] text-white hover:border-[var(--primary)]/50 hover:bg-white/[0.08]"
          }`}
        >
          {isCheckingAuth || isChecking
            ? "Checking..."
            : isCurrentPlan
              ? "Your Current Plan"
              : tier.popular
                ? "Start free trial"
                : "Get Started"}
        </button>

        {tier.footnote && (
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">{tier.footnote}</p>
        )}

        {tier.reassurances && tier.reassurances.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-white/[0.08] pt-4">
            {tier.reassurances.map((item, index) => (
              <li key={item} className="flex items-center gap-2.5 text-xs text-slate-400">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={REASSURANCE_ICON_PATHS[index % REASSURANCE_ICON_PATHS.length]}
                    />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PricingSection() {
  const {
    currentSubscription,
    selectedBillingPeriod,
    setSelectedBillingPeriod,
    getPremiumPriceLabel,
    getPremiumSavingsPercent,
  } = useSubscriptionStore();
  const currentTier = currentSubscription?.tier as string | undefined;

  // Falls back to the list prices in @/config/subscription until the
  // catalogue has loaded (visitors on the homepage are usually signed out).
  const period = selectedBillingPeriod;
  const premiumAmount = getPremiumPriceLabel(period);
  const premiumPeriodWord = PREMIUM_PERIOD_SUFFIX[period].replace(/^\//, "");
  const premiumRenewal = PREMIUM_PERIOD_RENEWAL[period];

  const tiers: PricingTier[] = [
    {
      name: "Free",
      amount: 0,
      period: "forever",
      description: "View the markets and track your portfolio",
      features: ["Real-time market data", "Portfolio tracking", "Web and mobile access"],
    },
    {
      name: "Premium",
      amount: Number(premiumAmount),
      period: premiumPeriodWord,
      description: "Every feature. Billed monthly, quarterly or yearly.",
      popular: true,
      badge: `${TRIAL_DAYS}-day free trial`,
      features: [
        "Everything in Free",
        "AI trading signals and auto execution",
        "Unlimited custom strategies",
        "Options trading",
        "VC Pool access",
        "Early access to new features",
      ],
      footnote: `Card required. Charged $${premiumAmount} after ${TRIAL_DAYS} days, then ${premiumRenewal} unless you cancel.`,
      reassurances: [
        `${TRIAL_DAYS} days free, then the plan you pick`,
        "Cancel anytime from Settings",
        "Keep access until your trial ends",
      ],
    },
  ];

  const isCurrentPlan = (tier: PricingTier): boolean => {
    if (!currentTier) return false;
    if (tier.popular) return currentTier === "PREMIUM" || isLegacyPaidTier(currentTier);
    return currentTier === "FREE";
  };

  return (
    <HomeSection
      id="pricing"
      eyebrow="Pricing"
      title="Choose Your"
      highlight="Plan"
      description="One plan. Every feature. Start with a 7-day free trial."
    >
      {/* Billing period */}
      <div className="flex justify-center pb-6">
        <BillingPeriodToggle
          value={period}
          onChange={setSelectedBillingPeriod}
          getSavingsPercent={getPremiumSavingsPercent}
        />
      </div>

      {/* Plans */}
      <Stagger className="mx-auto grid max-w-3xl grid-cols-1 gap-5 pt-3 md:grid-cols-2">
        {tiers.map((tier) => (
          // The popular plan leads on mobile where only one card is visible at a time
          <StaggerItem key={tier.name} className={`h-full ${tier.popular ? "max-md:order-first" : ""}`}>
            <PricingCard tier={tier} isCurrentPlan={isCurrentPlan(tier)} />
          </StaggerItem>
        ))}
      </Stagger>

      {/* How the trial works */}
      <TrialStepsStrip />

      {/* Additional CTA */}
      <div className="mt-14 text-center">
        <p className="mb-3 text-sm text-slate-400">Questions about Premium?</p>
        <button
          onClick={() => scrollToId("contact", -88)}
          className="cursor-pointer text-sm font-semibold text-[var(--primary)] transition-colors hover:text-[var(--primary-light)]"
        >
          Contact Sales →
        </button>
      </div>
    </HomeSection>
  );
}
