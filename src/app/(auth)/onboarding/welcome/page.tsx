"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, delay, gradient }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-[--color-border] bg-[--color-surface-alt]/60 p-6 backdrop-blur transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 ${delay}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: delay }}
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 ${
          isHovered ? "opacity-10" : ""
        }`}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>

      {/* Shine effect */}
      <div
        className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ${
          isHovered ? "translate-x-full" : ""
        }`}
      />
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();

  const features = [
    {
      icon: (
        <svg className="h-8 w-8 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI Trading",
      description: "Leverage advanced machine learning algorithms to identify patterns, predict market movements, and execute trades with precision. Your intelligent trading partner.",
      gradient: "from-[#fc4f02] to-[#fda300]",
    },
    {
      icon: (
        <svg className="h-8 w-8 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      title: "Sentiment Intelligence",
      description: "Real-time sentiment analysis from news, social media, and market data. Make informed decisions backed by comprehensive market intelligence.",
      gradient: "from-[#1d4ed8] to-[#3b82f6]",
    },
    {
      icon: (
        <svg className="h-8 w-8 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: "Automation",
      description: "Set it and forget it. Automate your trading strategies with confidence. Risk management, position sizing, and execution all handled seamlessly.",
      gradient: "from-[#10b981] to-[#34d399]",
    },
  ];

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <BackButton />
      {/* Background matching Figma design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-between overflow-y-auto px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        <div className="w-full max-w-6xl">
          {/* Header Section */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Welcome to <span className="text-[#fc4f02]">QuantivaHQ</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Your intelligent trading platform that combines AI-powered insights, real-time sentiment analysis, and automated execution.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-3 animate-text-enter" style={{ animationDelay: "0.6s" }}>
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={`${index * 0.1}s`}
                gradient={feature.gradient}
              />
            ))}
          </div>
        </div>

        {/* CTA Section - Positioned at bottom */}
        <div className="w-full max-w-6xl">
          <div className="text-center animate-text-enter" style={{ animationDelay: "0.8s" }}>
            <button
              onClick={() => router.push("/onboarding/region")}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
            >
              <span className="relative z-10">Get Started</span>
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
            <p className="mt-4 text-sm text-slate-500">
              Start your journey in less than 5 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

