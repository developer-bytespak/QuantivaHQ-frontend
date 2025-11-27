"use client";

import { useState, useEffect, useRef } from "react";
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
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { ref: cardRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const router = useRouter();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    setMousePosition({ x: rotateY, y: rotateX });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };


  return (
    <div
      ref={cardRef}
      className="relative group"
      style={{ 
        perspective: "1000px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10" style={{ transform: "translateZ(30px)" }}>
          <span className="bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
            Popular
          </span>
        </div>
      )}

      <div
        className={`relative rounded-2xl border transition-all duration-700 p-6 sm:p-8 h-full ${
          tier.popular
            ? "border-[#fc4f02]/50 bg-gradient-to-br from-[--color-surface-alt]/90 to-[--color-surface-alt]/70 shadow-2xl shadow-[#fc4f02]/20"
            : "border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60"
        } ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg) translateZ(30px) scale(1.02)`
            : "perspective(1000px) rotateX(0) rotateY(0) translateZ(0) scale(1)",
          transformStyle: "preserve-3d",
          transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Gradient overlay on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-0 transition-opacity duration-300 rounded-2xl ${
            isHovered ? "opacity-10" : ""
          }`}
        />

        {/* 3D Depth Shadow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ transform: "translateZ(-20px)" }} />

        <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
          {/* Tier Name */}
          <h3 className={`text-2xl font-bold text-white mb-2 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`} style={{ transitionDelay: isVisible ? `${(index * 100) + 100}ms` : "0ms" }}>{tier.name}</h3>
          <p className="text-sm text-slate-400 mb-6">{tier.description}</p>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{tier.price}</span>
              <span className="text-slate-400">/{tier.period}</span>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button
            onClick={() => router.push("/onboarding/sign-up?tab=signup")}
            className={`w-full rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 cursor-pointer ${
              tier.popular
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
                : "border-2 border-slate-600 bg-slate-900/40 text-white hover:border-[#fc4f02]/50 hover:bg-slate-800/60"
            }`}
          >
            Get Started
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
        <div className="text-center mt-12">
          <p className="text-slate-400 mb-4">Need help choosing? Contact our sales team</p>
          <button
            onClick={() => {
              const element = document.getElementById("contact");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-[#fc4f02] hover:text-[#fda300] font-semibold transition-colors cursor-pointer"
          >
            Contact Sales →
          </button>
        </div>
      </div>
    </section>
  );
}

