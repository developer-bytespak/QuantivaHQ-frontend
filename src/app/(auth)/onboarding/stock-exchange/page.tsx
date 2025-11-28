"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState } from "react";

interface ExchangeCardProps {
    name: string;
    description: string;
    logo: React.ReactNode;
    gradient: string;
    delay: string;
    onSelect: () => void;
}

function ExchangeCard({ name, description, logo, gradient, delay, onSelect }: ExchangeCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative overflow-hidden rounded-xl border-2 border-[--color-border] bg-[--color-surface-alt]/60 backdrop-blur transition-all duration-300 p-6 sm:p-8 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 w-full max-w-md mx-auto"
            style={{ animationDelay: delay }}
        >
            {/* Gradient overlay on hover */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 ${isHovered ? "opacity-10" : "opacity-0"
                    }`}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    {logo}
                </div>
                <h3 className="mb-2 text-lg sm:text-xl font-semibold text-white">{name}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{description}</p>
            </div>

            {/* Shine effect */}
            <div
                className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ${isHovered ? "translate-x-full" : ""
                    }`}
            />
        </button>
    );
}

export default function StockExchangePage() {
    const router = useRouter();
    const [showFAQModal, setShowFAQModal] = useState(false);

    const handleExchangeSelect = (exchange: "ibkr") => {
        // Get existing selected exchanges
        const existingExchanges = JSON.parse(
            localStorage.getItem("quantivahq_selected_exchanges") || "[]"
        );
        
        // Add exchange if not already selected
        const exchangeData = {
            name: "Interactive Brokers",
            type: "stocks",
            code: exchange,
        };
        
        if (!existingExchanges.find((e: any) => e.code === exchange)) {
            existingExchanges.push(exchangeData);
            localStorage.setItem("quantivahq_selected_exchanges", JSON.stringify(existingExchanges));
        }
        
        // Also save current selection for immediate use
        localStorage.setItem("quantivahq_selected_exchange", exchange);
        
        router.push("/onboarding/api-key-tutorial");
    };

    const exchanges = [
        {
            name: "Interactive Brokers",
            description: "Global leader in online trading. Access stocks, options, futures, currencies, bonds and funds on over 150 markets.",
            gradient: "from-[#ce2029] to-[#e63946]", // IBKR red-ish colors
            logo: (
                <div className="flex h-full w-full items-center justify-center p-2">
                    <Image
                        src="/IBKR_logo.png"
                        alt="Interactive Brokers"
                        width={64}
                        height={64}
                        className="h-full w-full object-contain"
                    />
                </div>
            ),
            onSelect: () => handleExchangeSelect("ibkr"),
        },
    ];

    return (
        <div className="relative flex h-full w-full overflow-hidden">
            <BackButton />
            {/* Background matching design */}
            <div className="absolute inset-0 bg-black">
                {/* Subtle gradient orbs for depth */}
                <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fc4f02]/5 blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 lg:px-8">
                <div className="w-full max-w-4xl flex flex-col justify-center">
                    {/* Header Section */}
                    <div className="mb-6 sm:mb-8 text-center flex-shrink-0">
                        <div className="mb-2 flex justify-center animate-logo-enter">
                            <QuantivaLogo className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
                        </div>
                        <h1 className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
                            Choose Your <span className="text-white">Stock Broker</span>
                        </h1>
                        <p className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
                            Select the platform you want to connect to your trading account.
                        </p>
                    </div>

                    {/* Exchange Cards */}
                    <div className="flex justify-center animate-text-enter mb-6 sm:mb-8 flex-shrink-0" style={{ animationDelay: "0.6s" }}>
                        {exchanges.map((exchange, index) => (
                            <ExchangeCard
                                key={exchange.name}
                                name={exchange.name}
                                description={exchange.description}
                                logo={exchange.logo}
                                gradient={exchange.gradient}
                                delay={`${index * 0.1}s`}
                                onSelect={exchange.onSelect}
                            />
                        ))}
                    </div>

                    {/* Help Link Section */}
                    <div className="w-full flex-shrink-0 text-center animate-text-enter" style={{ animationDelay: "0.8s" }}>
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
                    <div className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt] to-[--color-surface] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-[--color-border] bg-gradient-to-r from-[#fc4f02]/10 to-[#fda300]/10 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                                    <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Why do I need API Keys?</h2>
                                    <p className="text-xs text-slate-400">Understanding API integration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFAQModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--color-surface-alt] text-slate-400 transition-all duration-200 hover:bg-[--color-surface] hover:text-white"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <div className="space-y-4 text-sm text-slate-300">
                                <div>
                                    <h3 className="mb-2 text-base font-semibold text-white">What are API Keys?</h3>
                                    <p className="leading-relaxed">
                                        API (Application Programming Interface) keys are secure credentials that allow QuantivaHQ to connect to your brokerage account. They enable our platform to read your account data and execute trades on your behalf, all while keeping your account secure.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="mb-2 text-base font-semibold text-white">Why are they required?</h3>
                                    <p className="leading-relaxed">
                                        API keys are essential for QuantivaHQ to provide you with:
                                    </p>
                                    <ul className="mt-2 ml-4 list-disc space-y-1">
                                        <li>Real-time portfolio tracking and analysis</li>
                                        <li>Automated trading strategies execution</li>
                                        <li>AI-powered market insights based on your holdings</li>
                                        <li>Seamless integration with your brokerage account</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="mb-2 text-base font-semibold text-white">Is it safe?</h3>
                                    <p className="leading-relaxed">
                                        Yes! We use industry-standard security practices:
                                    </p>
                                    <ul className="mt-2 ml-4 list-disc space-y-1">
                                        <li>API keys are encrypted and stored securely</li>
                                        <li>You can set read-only permissions (no withdrawal access)</li>
                                        <li>Keys can be revoked at any time from your brokerage</li>
                                        <li>We never store your brokerage login credentials</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="mb-2 text-base font-semibold text-white">How to get API Keys?</h3>
                                    <p className="leading-relaxed">
                                        After selecting your broker, we'll guide you through the simple process of generating API keys from your brokerage account. It typically takes just a few minutes and requires no technical knowledge.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-[--color-border] bg-gradient-to-r from-[#fc4f02]/5 to-[#fda300]/5 px-6 py-4">
                            <button
                                onClick={() => setShowFAQModal(false)}
                                className="w-full rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40"
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
