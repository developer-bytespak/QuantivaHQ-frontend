"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCurrentUser } from "@/lib/api/user";
import { navigateToDashboard } from "@/lib/auth/flow-router.service";
import useSubscriptionStore from "@/state/subscription-store";
import {
  BillingPeriod,
  PlanTier,
  calculatePrice,
} from "@/mock-data/subscription-dummy-data";
import { HomeSection } from "./motion/home-section";
import { Stagger, StaggerItem } from "./motion/stagger";
import { NumberTicker } from "./motion/number-ticker";
import { scrollToId } from "./motion/smooth-scroll";

interface PricingTier {
  name: string;
  /** Numeric price for the selected period; null renders "Custom". */
  amount: number | null;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const BILLING_OPTIONS = [
  { label: "Monthly", value: BillingPeriod.MONTHLY, discount: null },
  { label: "Quarterly", value: BillingPeriod.QUARTERLY, discount: "-15%" },
  { label: "Yearly", value: BillingPeriod.YEARLY, discount: "-20%" },
];

function PricingCard({ tier, isCurrentPlan }: { tier: PricingTier; isCurrentPlan: boolean }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const handleGetStarted = async () => {
    if (tier.amount === null) {
      // For custom pricing, could redirect to contact page or do something else
      return;
    }

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
          <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{tier.description}</p>
        </div>

        <div className="mb-6 border-b border-white/[0.08] pb-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold text-white">
              {tier.amount === null ? (
                "Custom"
              ) : (
                <NumberTicker value={tier.amount} prefix="$" decimals={tier.amount % 1 === 0 ? 0 : 2} duration={0.6} />
              )}
            </span>
            {tier.amount !== null && tier.amount > 0 && (
              <span className="text-sm font-normal text-slate-500">/{tier.period}</span>
            )}
            {tier.amount === 0 && <span className="text-sm font-normal text-slate-500">{tier.period}</span>}
          </div>
        </div>

        <ul className="mb-6 flex-grow space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs leading-relaxed text-slate-300">{feature.replace(/^✓\s*/, "")}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleGetStarted}
          disabled={isCheckingAuth || isCurrentPlan}
          className={`w-full cursor-pointer rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
            highlighted
              ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] hover:shadow-xl"
              : isCurrentPlan
                ? "bg-green-500 text-white"
                : "border border-white/15 bg-white/[0.04] text-white hover:border-[var(--primary)]/50 hover:bg-white/[0.08]"
          }`}
        >
          {isCheckingAuth ? "Checking..." : isCurrentPlan ? "Your Current Plan" : tier.amount === null ? "Contact Sales" : "Get Started"}
        </button>
      </div>
    </div>
  );
}

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(BillingPeriod.MONTHLY);
  const { currentSubscription } = useSubscriptionStore();
  const currentTier = currentSubscription?.tier;
  const activeIndex = BILLING_OPTIONS.findIndex((o) => o.value === billingPeriod);

  // Generate pricing tiers from dummy data
  const getTierFeatures = (tier: PlanTier): string[] => {
    const tiers: Record<PlanTier, string[]> = {
      [PlanTier.FREE]: [
        "✓ Real-Time Data",
        "✓ Mobile Access",
        "✓ Web Access",
        "✓ Multi-Exchange Support",
      ],
      [PlanTier.PRO]: [
        "✓ Everything in FREE, PLUS:",
        "✓ AI Trading",
        "✓ Auto Execution",
        "✓ Up to 5 Custom Strategies",
      ],
      [PlanTier.ELITE]: [
        "✓ Everything in PRO, PLUS:",
        "✓ Unlimited Strategies",
        "✓ Early Access to Features",
        "✓ VC Pool Access",
      ],
      [PlanTier.ELITE_PLUS]: [
        "✓ Everything in ELITE, PLUS:",
        "✓ Option Trading",
        "✓ Unlimited Strategies",
        "✓ Early Access to Features",
        "✓ VC Pool Access",
      ],
    };
    return tiers[tier];
  };

  const periodLabel =
    billingPeriod === BillingPeriod.MONTHLY ? "month" : billingPeriod === BillingPeriod.QUARTERLY ? "3 months" : "year";

  const tiers: PricingTier[] = [
    {
      name: "Free",
      amount: 0,
      period: "forever",
      description: "Perfect for getting started",
      features: getTierFeatures(PlanTier.FREE),
    },
    {
      name: "PRO",
      amount: calculatePrice(PlanTier.PRO, billingPeriod).price,
      period: periodLabel,
      description: "Perfect for individual traders",
      popular: true,
      features: getTierFeatures(PlanTier.PRO),
    },
    {
      name: "ELITE",
      amount: calculatePrice(PlanTier.ELITE, billingPeriod).price,
      period: periodLabel,
      description: "For professional traders",
      features: getTierFeatures(PlanTier.ELITE),
    },
    {
      name: "ELITE Plus",
      amount: calculatePrice(PlanTier.ELITE_PLUS, billingPeriod).price,
      period: periodLabel,
      description: "For advanced traders with option trading",
      features: getTierFeatures(PlanTier.ELITE_PLUS),
    },
  ];

  return (
    <HomeSection
      id="pricing"
      eyebrow="Pricing"
      title="Choose Your"
      highlight="Plan"
      description="Flexible pricing options for traders of all levels"
    >
      {/* Billing period segmented pill */}
      <div className="mb-12 flex justify-center">
        <div className="relative grid w-full max-w-md grid-cols-3 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
          <span
            className="absolute bottom-1 top-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {BILLING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setBillingPeriod(option.value)}
              className={`relative z-10 cursor-pointer rounded-full px-2 py-2.5 text-sm font-medium transition-colors duration-300 ${
                billingPeriod === option.value ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {option.label}
              {option.discount && (
                <span className={`ml-1 text-xs ${billingPeriod === option.value ? "text-white/80" : "text-green-400"}`}>
                  {option.discount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <Stagger className="mx-auto grid max-w-6xl grid-cols-1 gap-5 pt-3 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <StaggerItem key={tier.name} className="h-full">
            <PricingCard
              tier={tier}
              isCurrentPlan={currentTier ? tier.name.toUpperCase().replace(/\s+/g, "_") === currentTier : false}
            />
          </StaggerItem>
        ))}
      </Stagger>

      {/* Additional CTA */}
      <div className="mt-14 text-center">
        <p className="mb-3 text-sm text-slate-400">Need help choosing a plan?</p>
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
