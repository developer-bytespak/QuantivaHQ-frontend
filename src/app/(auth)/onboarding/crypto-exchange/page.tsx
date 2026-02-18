"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState } from "react";
import { useUserNationality } from "@/hooks/useUserNationality";

interface ExchangeCardProps {
  name: string;
  description: string;
  logo: React.ReactNode;
  gradient: string;
  delay: string;
  onSelect: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

function ExchangeCard({ name, description, logo, gradient, delay, onSelect, disabled = false, disabledReason }: ExchangeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={disabled ? undefined : onSelect}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        disabled={disabled}
        className={`group relative overflow-hidden rounded-lg sm:rounded-xl border-2 ${
          disabled
            ? "border-[--color-border]/50 bg-[--color-surface-alt]/30 cursor-not-allowed opacity-50"
            : "border-[--color-border] bg-[--color-surface-alt]/60 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20"
        } backdrop-blur transition-all duration-300 p-4 sm:p-6 md:p-7 min-h-max w-full`}
        style={{ animationDelay: delay }}
      >
        {/* Gradient overlay on hover (only if not disabled) */}
        {!disabled && (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 ${
              isHovered ? "opacity-10" : "opacity-0"
            }`}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={`mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center transition-transform duration-300 ${
            !disabled ? "group-hover:scale-110" : ""
          }`}>
            {logo}
          </div>
          <h3 className="mb-2 sm:mb-2.5 text-sm sm:text-base md:text-lg font-semibold text-white">{name}</h3>
          <p className="text-xs sm:text-sm md:text-sm leading-snug text-slate-300">{description}</p>
        </div>

        {/* Shine effect (only if not disabled) */}
        {!disabled && (
          <div className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden />
        )}
      </button>
    </div>
  );
}

export default function CryptoExchangePage() {
  const router = useRouter();
  const { nationality, isUS, loading } = useUserNationality();
  const [showFAQModal, setShowFAQModal] = useState(false);

  const handleExchangeSelect = (exchange: "binance" | "bybit" | "binance.us") => {
    // Get existing selected exchanges
    const existingExchanges = JSON.parse(
      localStorage.getItem("quantivahq_selected_exchanges") || "[]"
    );
    
    // Add exchange if not already selected
    const exchangeData = {
      name: exchange === "binance" ? "Binance" : exchange === "binance.us" ? "Binance.US" : "Bybit",
      type: "crypto",
      code: exchange,
    };
    
    if (!existingExchanges.find((e: any) => e.code === exchange)) {
      existingExchanges.push(exchangeData);
      localStorage.setItem("quantivahq_selected_exchanges", JSON.stringify(existingExchanges));
    }
    
    // Also save current selection for immediate use
    localStorage.setItem("quantivahq_selected_exchange", exchange);
    
    // Check if user selected "both" - if so, allow selecting stock exchange next
    const accountType = localStorage.getItem("quantivahq_account_type");
    if (accountType === "both") {
      // After crypto, go to stocks
      router.push("/onboarding/stock-exchange");
    } else {
      router.push("/onboarding/api-key-tutorial");
    }
  };

  // Define available exchanges based on user's nationality
  const allExchanges = [
    {
      name: "Binance",
      description: "The world's largest cryptocurrency exchange. Trade hundreds of cryptocurrencies with advanced trading tools and deep liquidity.",
      gradient: "from-[#f0b90b] to-[#f8d33a]",
      logo: (
        <Image
          src="/binance logo.png"
          alt="Binance"
          width={48}
          height={48}
          className="h-9 w-9 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain"
        />
      ),
      onSelect: () => handleExchangeSelect("binance"),
      code: "binance",
      disabled: isUS, // Disable Binance for US nationals
      disabledReason: isUS ? "Not available for US residents" : undefined,
    },
    {
      name: "Binance.US",
      description: "Binance's US platform. Fully compliant with US regulations. Trade popular cryptocurrencies with confidence.",
      gradient: "from-[#f0b90b] to-[#f8d33a]",
      logo: (
        <Image
          src="/binance logo.png"
          alt="Binance.US"
          width={48}
          height={48}
          className="h-9 w-9 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain"
        />
      ),
      onSelect: () => handleExchangeSelect("binance.us"),
      code: "binance.us",
      disabled: false, // Allowed for non-US too (e.g. when using a US client's API keys)
      disabledReason: undefined,
    },
    {
      name: "Bybit",
      description: "Fast-growing derivatives exchange with competitive fees. Perfect for both spot trading and advanced derivatives strategies.",
      gradient: "from-[#f59e0b] to-[#d97706]",
      logo: (
        <Image
          src="/bybit logo.png"
          alt="Bybit"
          width={48}
          height={48}
          className="h-9 w-9 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain"
        />
      ),
      onSelect: () => handleExchangeSelect("bybit"),
      code: "bybit",
      disabled: false,
    },
  ];

  // Filter exchanges: US must use Binance.US only; non-US can use Binance, Binance.US (e.g. US client keys), or Bybit
  const exchanges = allExchanges.filter(exchange => {
    if (isUS) {
      return exchange.code === "binance.us" || exchange.code === "bybit";
    }
    return exchange.code === "binance" || exchange.code === "binance.us" || exchange.code === "bybit";
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background matching design */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient orbs for depth */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden px-2 py-3 sm:px-6 sm:py-6 lg:px-8">
        <div className="w-full max-w-4xl flex flex-col justify-center">
          {/* Header Section */}
          <div className="mb-3 sm:mb-8 text-center flex-shrink-0">
            <div className="mb-2 sm:mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24" />
            </div>
            <h1 className="mb-3 sm:mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Choose Your <span className="text-white">Crypto Exchange</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs sm:text-sm md:text-base text-slate-400 animate-text-enter px-3 sm:px-2 leading-tight" style={{ animationDelay: "0.4s" }}>
              Select the platform you want to connect to your trading account.
              {isUS && (
                <span className="block mt-2 text-[#fc4f02] font-medium">
                  🇺🇸 US Residents: Only Binance.US is available for regulatory compliance
                </span>
              )}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fc4f02]" />
            </div>
          )}

          {/* Exchange Cards */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 animate-text-enter mb-4 sm:mb-6 flex-shrink-0" style={{ animationDelay: "0.6s" }}>
              {exchanges.map((exchange, index) => (
                <ExchangeCard
                  key={exchange.name}
                  name={exchange.name}
                  description={exchange.description}
                  logo={exchange.logo}
                  gradient={exchange.gradient}
                  delay={`${index * 0.1}s`}
                  onSelect={exchange.onSelect}
                  disabled={exchange.disabled}
                  disabledReason={exchange.disabledReason}
                />
              ))}
            </div>
          )}

          {/* Help Link Section */}
          <div className="w-full flex-shrink-0 text-center animate-text-enter px-3" style={{ animationDelay: "0.8s" }}>
            <button
              onClick={() => setShowFAQModal(true)}
              className="text-xs sm:text-sm text-slate-400 hover:text-[#fc4f02] transition-colors duration-200 underline underline-offset-2"
            >
              Why do I need API Keys?
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Modal */}
      {showFAQModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowFAQModal(false)}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full mx-3 sm:mx-0 max-w-2xl max-h-[90vh] rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt] to-[--color-surface] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[--color-border] bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-bold text-white">Why do I need API Keys?</h2>
                  <p className="text-xs text-slate-400">Understanding API integration</p>
                </div>
              </div>
              <button
                onClick={() => setShowFAQModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--color-surface-alt] text-slate-400 transition-all duration-200 hover:bg-[--color-surface] hover:text-white flex-shrink-0"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div>
                  <h3 className="mb-2 text-sm sm:text-base font-semibold text-white">What are API Keys?</h3>
                  <p className="leading-relaxed">
                    API (Application Programming Interface) keys are secure credentials that allow QuantivaHQ to connect to your exchange account. They enable our platform to read your account data and execute trades on your behalf, all while keeping your account secure.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-sm sm:text-base font-semibold text-white">Why are they required?</h3>
                  <p className="leading-relaxed">
                    API keys are essential for QuantivaHQ to provide you with:
                  </p>
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-xs sm:text-sm">
                    <li>Real-time portfolio tracking and analysis</li>
                    <li>Automated trading strategies execution</li>
                    <li>AI-powered market insights based on your holdings</li>
                    <li>Seamless integration with your exchange account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-sm sm:text-base font-semibold text-white">Is it safe?</h3>
                  <p className="leading-relaxed">
                    Yes! We use industry-standard security practices:
                  </p>
                  <ul className="mt-2 ml-4 list-disc space-y-1 text-xs sm:text-sm">
                    <li>API keys are encrypted and stored securely</li>
                    <li>You can set read-only permissions (no withdrawal access)</li>
                    <li>Keys can be revoked at any time from your exchange</li>
                    <li>We never store your exchange login credentials</li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-sm sm:text-base font-semibold text-white">How to get API Keys?</h3>
                  <p className="leading-relaxed">
                    After selecting your exchange, we'll guide you through the simple process of generating API keys from your exchange account. It typically takes just a few minutes and requires no technical knowledge.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[--color-border] bg-gradient-to-r from-[#fc4f02]/5 to-[#fda300]/5 px-4 sm:px-6 py-3 sm:py-4">
              <button
                onClick={() => setShowFAQModal(false)}
                className="w-full rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

