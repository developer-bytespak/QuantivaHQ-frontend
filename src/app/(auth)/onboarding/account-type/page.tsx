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
      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 p-4 sm:p-5 md:p-6 backdrop-blur text-left ${
        isSelected
          ? "border-[#fc4f02] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 shadow-2xl shadow-[#fc4f02]/30"
          : "border-[--color-border] bg-[--color-surface-alt]/60 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20"
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
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#fc4f02] to-[#fda300] shadow-lg shadow-[#fc4f02]/50">
          <svg className="h-3 w-3 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className={`mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 transition-transform duration-300 ${
          isSelected ? "scale-110" : "group-hover:scale-110"
        }`}>
          {icon}
        </div>
        <h3 className="mb-2 text-base sm:text-lg font-semibold text-white">{title}</h3>
        <p className="text-xs sm:text-sm leading-relaxed text-slate-400">{description}</p>
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
      gradient: "from-[#fc4f02] to-[#fda300]",
      icon: (
        <div className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 flex items-center justify-center">
          {/* Circular golden background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600"></div>
          {/* Bitcoin symbol (₿) */}
          <span className="relative z-10 text-white font-bold text-sm sm:text-base md:text-lg">₿</span>
        </div>
      ),
    },
    {
      value: "stocks" as const,
      title: "Stocks",
      description: "Trade stocks and equities with intelligent automation. Get AI-driven analysis, portfolio optimization, and automated execution for traditional markets.",
      gradient: "from-[#1d4ed8] to-[#3b82f6]",
      icon: (
        <svg className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" viewBox="0 0 24 24" fill="none">
          {/* Three candlestick charts: green, red, green */}
          {/* First candlestick (green) */}
          <rect x="4" y="8" width="3" height="6" fill="#10b981" />
          <line x1="5.5" y1="6" x2="5.5" y2="8" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5.5" y1="14" x2="5.5" y2="16" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Second candlestick (red) */}
          <rect x="10" y="10" width="3" height="4" fill="#ef4444" />
          <line x1="11.5" y1="8" x2="11.5" y2="10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11.5" y1="14" x2="11.5" y2="18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Third candlestick (green) */}
          <rect x="16" y="7" width="3" height="7" fill="#10b981" />
          <line x1="17.5" y1="5" x2="17.5" y2="7" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17.5" y1="14" x2="17.5" y2="16" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      value: "both" as const,
      title: "Both",
      description: "Access both crypto and stock markets in one unified platform. Maximize your trading opportunities with cross-market analysis and diversified strategies.",
      gradient: "from-[#10b981] to-[#34d399]",
      icon: (
        <svg className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
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
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 lg:px-8">
        <div className="w-full max-w-6xl flex flex-col justify-center">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8 text-center flex-shrink-0">
            <div className="mb-2 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
            </div>
            <h1 className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Select Your <span className="text-white">Account Type</span>
            </h1>
            <p className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Choose your preferred trading markets. This will personalize your dashboard and optimize your trading experience.
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3 animate-text-enter mb-4 sm:mb-5 flex-shrink-0" style={{ animationDelay: "0.6s" }}>
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

          {/* CTA Section */}
          <div className="w-full flex-shrink-0">
            <div className="text-center animate-text-enter" style={{ animationDelay: "0.8s" }}>
              <button
                onClick={handleContinue}
                disabled={!selectedType}
                className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                  Continue
                  <svg className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-slate-400">
                Your selection will personalize your trading dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

