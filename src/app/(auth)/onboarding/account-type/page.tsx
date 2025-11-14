"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState, useEffect } from "react";

interface AccountTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: "crypto" | "stocks" | "both";
  gradient: string;
  delay: string;
  isSelected: boolean;
  onSelect: (value: "crypto" | "stocks" | "both") => void;
}

function AccountTypeCard({ icon, title, description, value, gradient, delay, isSelected, onSelect }: AccountTypeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 p-5 backdrop-blur text-left ${
        isSelected
          ? "border-[#FF6B35] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 shadow-2xl shadow-[#FF6B35]/30"
          : "border-[--color-border] bg-[--color-surface-alt]/60 hover:border-[#FF6B35]/50 hover:shadow-2xl hover:shadow-[#FF6B35]/20"
      }`}
      style={{ animationDelay: delay }}
    >
      {/* Gradient overlay on hover/select */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 ${
          isSelected ? "opacity-20" : isHovered ? "opacity-10" : "opacity-0"
        }`}
      />

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] shadow-lg shadow-[#FF6B35]/50">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-[#1d4ed8]/20 transition-transform duration-300 ${
          isSelected ? "scale-110" : "group-hover:scale-110"
        }`}>
          {icon}
        </div>
        <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
        <p className="text-xs leading-relaxed text-slate-400">{description}</p>
      </div>

      {/* Shine effect */}
      <div
        className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ${
          isHovered || isSelected ? "translate-x-full" : ""
        }`}
      />
    </button>
  );
}

export default function AccountTypePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"crypto" | "stocks" | "both" | null>(null);

  useEffect(() => {
    // Load saved account type from localStorage if available
    const savedType = localStorage.getItem("quantivahq_account_type");
    if (savedType && (savedType === "crypto" || savedType === "stocks" || savedType === "both")) {
      setSelectedType(savedType as "crypto" | "stocks" | "both");
    }
  }, []);

  const handleSelect = (value: "crypto" | "stocks" | "both") => {
    setSelectedType(value);
    localStorage.setItem("quantivahq_account_type", value);
  };

  const handleContinue = () => {
    if (!selectedType) {
      return;
    }

    // Store in localStorage (already done in handleSelect, but ensure it's saved)
    localStorage.setItem("quantivahq_account_type", selectedType);

    // Navigate to next step
    router.push("/onboarding/sign-up");
  };

  const accountTypes = [
    {
      value: "crypto" as const,
      title: "Crypto",
      description: "Trade cryptocurrencies with AI-powered insights. Access real-time market data, sentiment analysis, and automated trading strategies for Bitcoin, Ethereum, and altcoins.",
      gradient: "from-[#FF6B35] to-[#FF8C5A]",
      icon: (
        <svg className="h-8 w-8 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      value: "stocks" as const,
      title: "Stocks",
      description: "Trade stocks and equities with intelligent automation. Get AI-driven analysis, portfolio optimization, and automated execution for traditional markets.",
      gradient: "from-[#1d4ed8] to-[#3b82f6]",
      icon: (
        <svg className="h-8 w-8 text-[#1d4ed8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      value: "both" as const,
      title: "Both",
      description: "Access both crypto and stock markets in one unified platform. Maximize your trading opportunities with cross-market analysis and diversified strategies.",
      gradient: "from-[#10b981] to-[#34d399]",
      icon: (
        <svg className="h-8 w-8 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

      return (
        <div className="relative flex h-full w-full overflow-hidden">
          <BackButton />
          {/* Gradient background matching other onboarding pages */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0f19] via-[#1a1f2e] to-[#0b0f19]">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#1d4ed8]/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#10b981]/10 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-start overflow-y-auto px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        <div className="w-full max-w-6xl flex-1 flex flex-col justify-between">
          <div>
            {/* Header Section */}
            <div className="mb-6 text-center">
              <div className="mb-3 flex justify-center animate-logo-enter">
                <QuantivaLogo className="h-12 w-12 md:h-14 md:w-14" />
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
                Select Your <span className="text-[#FF6B35]">Account Type</span>
              </h1>
              <p className="mx-auto max-w-xl text-sm text-slate-400 md:text-base animate-text-enter" style={{ animationDelay: "0.4s" }}>
                Choose your preferred trading markets. This will personalize your dashboard and optimize your trading experience.
              </p>
            </div>

            {/* Account Type Cards */}
            <div className="grid gap-4 md:grid-cols-3 animate-text-enter" style={{ animationDelay: "0.6s" }}>
              {accountTypes.map((type, index) => (
                <AccountTypeCard
                  key={type.value}
                  icon={type.icon}
                  title={type.title}
                  description={type.description}
                  value={type.value}
                  gradient={type.gradient}
                  delay={`${index * 0.1}s`}
                  isSelected={selectedType === type.value}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>

          {/* CTA Section - Positioned at bottom */}
          <div className="w-full mt-6">
            <div className="text-center animate-text-enter" style={{ animationDelay: "0.8s" }}>
              <button
                onClick={handleContinue}
                disabled={!selectedType}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[#FF6B35]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#FF6B35]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <p className="mt-3 text-xs text-slate-400">
                Your selection will personalize your trading dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

