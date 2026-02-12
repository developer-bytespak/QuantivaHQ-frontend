"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { getCurrentUser } from "@/lib/api/user";
import { navigateToNextRoute } from "@/lib/auth/flow-router.service";
import useSubscriptionStore from "@/state/subscription-store";
import {
  SUBSCRIPTION_PLANS,
  BillingPeriod,
  PlanTier,
  calculatePrice,
} from "@/mock-data/subscription-dummy-data";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  gradient: string;
}

function ScrollAnimatedHeader({ title, titleHighlight, description }: { title: string; titleHighlight: string; description: string }) {
  const { ref: headerRef, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div
      ref={headerRef}
      className="text-center mb-10 sm:mb-12 md:mb-16"
    >
      <h2 className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        {title}
        <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent"> {titleHighlight}</span>
      </h2>
      <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-slate-300 px-4">
        {description}
      </p>
    </div>
  );
}

function PricingCard({ tier, delay, index, isCurrentPlan }: { tier: PricingTier; delay: string; index: number; isCurrentPlan: boolean }) {
  const { ref: cardRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const handleGetStarted = async () => {
    if (tier.price === "Custom") {
      // For custom pricing, could redirect to contact page or do something else
      return;
    }

    setIsCheckingAuth(true);
    try {
      // Check if user is already authenticated
      await getCurrentUser();
      // User is authenticated, redirect to appropriate page using flow router
      await navigateToNextRoute(router);
    } catch (error: any) {
      // User is not authenticated, redirect to sign-up page
      if (error?.status === 401 || error?.statusCode === 401 || 
          error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
        router.push("/onboarding/sign-up?tab=signup");
      } else {
        // Other error - still redirect to sign-up
        console.error("Error checking authentication:", error);
        router.push("/onboarding/sign-up?tab=signup");
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative h-full"
    >
      {/* Popular Badge */}
      {tier.popular && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-block bg-[#fc4f02] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
            Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-block bg-green-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
            Current Plan
          </span>
        </div>
      )}

      <div
        className={`relative rounded-lg border-2 bg-gradient-to-br from-[--color-surface-alt]/90 via-[--color-surface-alt]/70 to-[--color-surface-alt]/90 backdrop-blur-xl p-5 h-full flex flex-col transition-all duration-200 ${
          tier.popular || isCurrentPlan
            ? "border-[#fc4f02]/60"
            : "border-[--color-border]"
        } ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } hover:border-[#fc4f02]/60`}
        style={{
          transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
        }}
      >
        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Tier Name */}
          <div className="mb-4">
            <h3 className={`text-lg font-semibold text-white mb-1 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`} style={{ transitionDelay: isVisible ? `${(index * 100) + 150}ms` : "0ms" }}>
              {tier.name}
            </h3>
            <p className="text-xs text-slate-500">{tier.description}</p>
          </div>

          {/* Price Section */}
          <div className="mb-5 pb-4 border-b border-[--color-border]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white">
                {tier.price}
              </span>
              {tier.price !== "Custom" && tier.price !== "$0" && (
                <span className="text-sm text-slate-500 font-normal">
                  /{tier.period}
                </span>
              )}
            </div>
            {tier.price === "Custom" && (
              <p className="text-xs text-slate-500 mt-1">Contact for pricing</p>
            )}
          </div>

          {/* Features List */}
          <ul className="space-y-2.5 mb-5 flex-grow">
            {tier.features.map((feature, featureIndex) => (
              <li 
                key={featureIndex} 
                className="flex items-start gap-2"
              >
                <svg className="h-3.5 w-3.5 text-[#10b981] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-slate-400 leading-snug">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button
            onClick={handleGetStarted}
            disabled={isCheckingAuth || isCurrentPlan}
            className={`w-full rounded-md px-4 py-2.5 text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              tier.popular && !isCurrentPlan
                ? "bg-[#fc4f02] text-white hover:bg-[#e04502]"
                : isCurrentPlan
                ? "bg-green-500 text-white cursor-not-allowed"
                : "border border-[--color-border] bg-[--color-surface] text-white hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
            }`}
          >
            {isCheckingAuth 
              ? "Checking..." 
              : isCurrentPlan
              ? "Your Current Plan"
              : tier.price === "Custom" 
                ? "Contact Sales" 
                : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(BillingPeriod.MONTHLY);
  const { currentSubscription } = useSubscriptionStore();
  const currentTier = currentSubscription?.tier;

  // Generate pricing tiers from dummy data
  const getTierFeatures = (tier: PlanTier): string[] => {
    const tiers: Record<PlanTier, string[]> = {
      [PlanTier.FREE]: [
        "✓ AI Trading",
        "✓ Auto Execution",
        "✓ Real-Time Data",
        "✓ Mobile Access",
        "✓ Web Access",
        "✓ Community Access",
        "✓ Multi-Exchange Support",
      ],
      [PlanTier.PRO]: [
        "✓ Everything in FREE, PLUS:",
        "✓ Up to 5 Custom Strategies",
      ],
      [PlanTier.ELITE]: [
        "✓ Everything in PRO, PLUS:",
        "✓ Unlimited Strategies",
        "✓ Early Access to Features",
        "✓ VC Pool Access",
      ],
    };
    return tiers[tier];
  };

  const tiers: PricingTier[] = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: getTierFeatures(PlanTier.FREE),
      gradient: "from-slate-600 to-slate-700",
    },
    {
      name: "PRO",
      price: `$${calculatePrice(PlanTier.PRO, billingPeriod).price.toFixed(2)}`,
      period: billingPeriod === BillingPeriod.MONTHLY ? "month" : billingPeriod === BillingPeriod.QUARTERLY ? "3 months" : "year",
      description: "Perfect for individual traders",
      popular: true,
      features: getTierFeatures(PlanTier.PRO),
      gradient: "from-[#fc4f02] to-[#fda300]",
    },
    {
      name: "ELITE",
      price: `$${calculatePrice(PlanTier.ELITE, billingPeriod).price.toFixed(2)}`,
      period: billingPeriod === BillingPeriod.MONTHLY ? "month" : billingPeriod === BillingPeriod.QUARTERLY ? "3 months" : "year",
      description: "For professional traders",
      features: getTierFeatures(PlanTier.ELITE),
      gradient: "from-[#1d4ed8] to-[#3b82f6]",
    },
  ];

  return (
    <section id="pricing" className="relative pb-16 sm:pb-20 md:pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimatedHeader
          title="Choose Your"
          titleHighlight="Plan"
          description="Flexible pricing options for traders of all levels"
        />

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-[--color-border] bg-[--color-surface] p-1">
            {[
              { label: "Monthly", value: BillingPeriod.MONTHLY },
              { label: "Quarterly", value: BillingPeriod.QUARTERLY },
              { label: "Yearly", value: BillingPeriod.YEARLY },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setBillingPeriod(option.value)}
                className={`px-4 py-2 text-sm font-medium transition-all rounded-md ${
                  billingPeriod === option.value
                    ? "bg-[#fc4f02] text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {option.label}
                {option.value === BillingPeriod.QUARTERLY && (
                  <span className="ml-1 text-xs text-green-400">-15%</span>
                )}
                {option.value === BillingPeriod.YEARLY && (
                  <span className="ml-1 text-xs text-green-400">-20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Grid - Mobile responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <PricingCard
              key={index}
              tier={tier}
              delay="animate-fade-in"
              index={index}
              isCurrentPlan={currentTier ? tier.name.toUpperCase() === currentTier : false}
            />
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-slate-400 mb-3 sm:mb-4 text-xs sm:text-sm">Need help choosing a plan?</p>
          <button
            onClick={() => {
              const element = document.getElementById("contact");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-[#fc4f02] hover:text-[#e04502] font-semibold transition-colors cursor-pointer text-xs sm:text-sm"
          >
            Contact Sales →
          </button>
        </div>
      </div>
    </section>
  );
}

