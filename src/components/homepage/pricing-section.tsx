"use client";

import { useRouter } from "next/navigation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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
      className="text-center mb-12 sm:mb-16"
    >
      <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}>
        {title}
        <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent"> {titleHighlight}</span>
      </h2>
      <p className="mx-auto max-w-2xl text-xl text-slate-300">
        {description}
      </p>
    </div>
  );
}

function PricingCard({ tier, delay, index }: { tier: PricingTier; delay: string; index: number }) {
  const { ref: cardRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const router = useRouter();

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

      <div
        className={`relative rounded-lg border-2 bg-gradient-to-br from-[--color-surface-alt]/90 via-[--color-surface-alt]/70 to-[--color-surface-alt]/90 backdrop-blur-xl p-5 h-full flex flex-col transition-all duration-200 ${
          tier.popular
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
              {tier.price !== "Custom" && (
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
            onClick={() => router.push("/onboarding/sign-up?tab=signup")}
            className={`w-full rounded-md px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
              tier.popular
                ? "bg-[#fc4f02] text-white hover:bg-[#e04502]"
                : "border border-[--color-border] bg-[--color-surface] text-white hover:border-[#fc4f02]/50 hover:bg-[--color-surface-alt]"
            }`}
          >
            {tier.price === "Custom" ? "Contact Sales" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PricingSection() {
  const tiers: PricingTier[] = [
    {
      name: "Free",
      price: "$0",
      period: "month",
      description: "Perfect for getting started",
      features: [
        "Basic AI trading strategies",
        "Real-time market data",
        "Single exchange connection",
        "Community support",
        "Basic portfolio tracking",
      ],
      gradient: "from-slate-600 to-slate-700",
    },
    {
      name: "Pro",
      price: "$99",
      period: "month",
      description: "For serious traders",
      popular: true,
      features: [
        "Advanced AI strategies",
        "Real-time sentiment analysis",
        "Multi-exchange connectivity",
        "Portfolio optimization",
        "Priority support",
        "Advanced analytics",
      ],
      gradient: "from-[#fc4f02] to-[#fda300]",
    },
    {
      name: "Elite",
      price: "$299",
      period: "month",
      description: "For professional traders",
      features: [
        "All Pro features",
        "Custom AI strategies",
        "Dedicated account manager",
        "API access",
        "White-label options",
        "24/7 premium support",
      ],
      gradient: "from-[#1d4ed8] to-[#3b82f6]",
    },
    {
      name: "Institutional",
      price: "Custom",
      period: "contact",
      description: "Enterprise solutions",
      features: [
        "All Elite features",
        "Custom integrations",
        "Dedicated infrastructure",
        "SLA guarantees",
        "On-premise deployment",
        "Custom training & support",
      ],
      gradient: "from-[#10b981] to-[#34d399]",
    },
  ];

  return (
    <section id="pricing" className="relative pb-20 sm:pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollAnimatedHeader
          title="Choose Your"
          titleHighlight="Plan"
          description="Flexible pricing options for traders of all levels"
        />

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {tiers.map((tier, index) => (
            <PricingCard
              key={index}
              tier={tier}
              delay="animate-fade-in"
              index={index}
            />
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-400 mb-4 text-sm">Need help choosing a plan?</p>
          <button
            onClick={() => {
              const element = document.getElementById("contact");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-[#fc4f02] hover:text-[#e04502] font-semibold transition-colors cursor-pointer text-sm"
          >
            Contact Sales →
          </button>
        </div>
      </div>
    </section>
  );
}

