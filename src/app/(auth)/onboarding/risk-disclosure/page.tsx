"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { BackButton } from "@/components/common/back-button";
import { useState, useEffect } from "react";

const RISK_DISCLOSURE_TEXT = `
RISK DISCLOSURE STATEMENT

IMPORTANT: Please read this Risk Disclosure Statement carefully before using QuantivaHQ's trading services. By proceeding, you acknowledge that you have read, understood, and agree to accept all risks associated with trading financial instruments.

1. GENERAL RISK WARNING

Trading in financial instruments, including but not limited to stocks, options, futures, forex, cryptocurrencies, and other derivatives, involves substantial risk of loss. You should carefully consider whether such trading is suitable for you in light of your circumstances, knowledge, and financial resources. You may lose some or all of your initial investment, and you should not invest money that you cannot afford to lose.

2. HIGH RISK OF LOSS

The high degree of leverage that is often obtainable in trading can work against you as well as for you. The use of leverage can lead to large losses as well as gains. You should be aware of all the risks associated with trading and seek advice from an independent financial advisor if you have any doubts.

3. MARKET RISK

Financial markets are volatile and unpredictable. Market conditions can change rapidly, and prices can move against your position. Past performance is not indicative of future results. No guarantee or representation is made that any account will or is likely to achieve profits or losses similar to those shown.

4. LIQUIDITY RISK

Some financial instruments may have limited liquidity, which may make it difficult to enter or exit positions at desired prices. This can result in significant losses, especially in volatile market conditions.

5. TECHNOLOGY RISK

While QuantivaHQ employs advanced technology and security measures, technical failures, system errors, network issues, or cyber-attacks may occur. Such events could result in delays, errors, or inability to execute trades, potentially causing financial losses.

6. AI AND ALGORITHMIC TRADING RISKS

QuantivaHQ's AI-powered trading features are based on algorithms and machine learning models. These systems are not infallible and may:
- Make incorrect predictions or decisions
- Fail to adapt to changing market conditions
- Experience technical glitches or bugs
- Produce unexpected results

You should not rely solely on AI recommendations and should always exercise your own judgment.

7. REGULATORY RISK

Trading regulations vary by jurisdiction and may change. Regulatory changes could affect your ability to trade, the instruments available to you, or the terms of your trading account.

8. COUNTERPARTY RISK

When trading through brokers or exchanges, you are exposed to counterparty risk. If a broker or exchange becomes insolvent, you may lose some or all of your funds.

9. FOREIGN EXCHANGE RISK

If you trade instruments denominated in currencies other than your base currency, you are exposed to foreign exchange risk. Currency fluctuations can significantly affect the value of your positions.

10. INTEREST RATE RISK

Changes in interest rates can affect the value of financial instruments, particularly fixed-income securities and derivatives.

11. CONCENTRATION RISK

Concentrating your investments in a single instrument, sector, or market increases your risk. Diversification may help reduce risk but does not guarantee against loss.

12. OPERATIONAL RISK

Operational risks include errors in trade execution, settlement failures, and other operational issues that could result in financial losses.

13. NO GUARANTEES

QuantivaHQ does not guarantee:
- The accuracy, completeness, or timeliness of market data
- That trading will be profitable
- That you will not incur losses
- The performance of any trading strategy or AI system

14. YOUR RESPONSIBILITIES

You are responsible for:
- Understanding the risks associated with trading
- Making your own investment decisions
- Managing your risk exposure
- Complying with all applicable laws and regulations
- Ensuring you have sufficient funds to cover potential losses

15. PROFESSIONAL ADVICE

This Risk Disclosure Statement does not constitute financial, investment, legal, or tax advice. You should consult with qualified professionals before making trading decisions.

16. ACCEPTANCE OF RISKS

By proceeding, you acknowledge that:
- You have read and understood this Risk Disclosure Statement
- You understand the risks associated with trading
- You are willing and able to accept these risks
- You will not hold QuantivaHQ liable for trading losses
- You will trade responsibly and within your means

17. UPDATES TO THIS STATEMENT

QuantivaHQ reserves the right to update this Risk Disclosure Statement at any time. You are responsible for reviewing any updates and continuing to accept the risks described herein.

18. CONTACT

If you have questions about this Risk Disclosure Statement or the risks associated with trading, please contact our support team before proceeding.

By checking the acknowledgment box below, you confirm that you have read, understood, and accept all risks described in this statement.
`;

export default function RiskDisclosurePage() {
  const router = useRouter();
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged
    const acknowledged = localStorage.getItem("quantivahq_risk_acknowledged");
    if (acknowledged === "true") {
      setIsAcknowledged(true);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isScrolledToBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (isScrolledToBottom) {
      setHasScrolled(true);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setHasScrolled(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAcknowledgmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAcknowledged(e.target.checked);
  };

  const handleContinue = () => {
    if (!isAcknowledged) {
      return;
    }

    // Store acknowledgment in localStorage
    localStorage.setItem("quantivahq_risk_acknowledged", "true");
    localStorage.setItem("quantivahq_risk_acknowledged_date", new Date().toISOString());

    // Navigate to next step
    router.push("/onboarding/account-type");
  };

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
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        <div className="w-full max-w-2xl" style={{ position: "relative", zIndex: 1 }}>
          {/* Header Section */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            <h1 className="mb-2 text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter" style={{ animationDelay: "0.2s" }}>
              Risk Disclosure <span className="text-[#FF6B35]">Acknowledgement</span>
            </h1>
            <p className="mx-auto max-w-xl text-xs text-slate-400 md:text-sm animate-text-enter" style={{ animationDelay: "0.4s" }}>
              Please read the following risk disclosure statement carefully. You must acknowledge and accept these risks before proceeding.
            </p>
          </div>

          {/* Risk Disclosure Content */}
          <div className="mb-4 animate-text-enter" style={{ animationDelay: "0.6s", position: "relative", zIndex: 100 }}>
            <div className="group relative rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[#FF6B35]/30 hover:shadow-[#FF6B35]/10">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/5 via-transparent to-[#1d4ed8]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10">
                {/* Label with icon */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-[#1d4ed8]/20">
                    <svg className="h-4 w-4 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <label className="text-sm font-semibold text-white">
                    Risk Disclosure Statement
                  </label>
                </div>

                {/* Button to View Risk Disclosure */}
                <button
                  onClick={openModal}
                  className="mb-3 w-full rounded-xl border-2 border-[#FF6B35]/50 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF8C5A]/10 px-4 py-3 text-left transition-all duration-300 hover:border-[#FF6B35] hover:bg-gradient-to-r hover:from-[#FF6B35]/20 hover:to-[#FF8C5A]/20 hover:shadow-lg hover:shadow-[#FF6B35]/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="h-5 w-5 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-white">View Risk Disclosure Statement</p>
                        <p className="text-xs text-slate-400">Click to read the full disclosure document</p>
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Acknowledgment Checkbox */}
                <div className="mt-3 rounded-xl border border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 p-3 backdrop-blur">
                  <label className="flex cursor-pointer items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isAcknowledged}
                        onChange={handleAcknowledgmentChange}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-slate-400 bg-[--color-surface] transition-all checked:border-[#10b981] checked:bg-[#10b981] hover:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/50"
                      />
                      {isAcknowledged && (
                        <svg
                          className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#10b981] mb-1">
                        I Understand the Risks
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        I have read, understood, and accept all risks described in the Risk Disclosure Statement above. I acknowledge that trading involves substantial risk of loss and that I am solely responsible for my trading decisions.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="w-full mt-4">
            <div className="text-center animate-text-enter" style={{ animationDelay: "0.8s" }}>
              <button
                onClick={handleContinue}
                disabled={!isAcknowledged}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#FF6B35]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#FF6B35]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                Your acknowledgment will be saved for compliance purposes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Disclosure Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt] to-[--color-surface] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[--color-border] bg-gradient-to-r from-[#FF6B35]/10 to-[#1d4ed8]/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-[#1d4ed8]/20">
                  <svg className="h-5 w-5 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Risk Disclosure Statement</h2>
                  <p className="text-xs text-slate-400">Please read carefully</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface-alt] hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed text-slate-300"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-line text-slate-300">
                  {RISK_DISCLOSURE_TEXT.split('\n').map((line, index) => {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) {
                      return <br key={index} />;
                    }
                    
                    // Check if it's a main heading (all caps and short)
                    if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 80 && !trimmedLine.includes('.') && trimmedLine.length > 10) {
                      return (
                        <h3 key={index} className="mt-6 mb-3 text-base font-bold text-white first:mt-0">
                          {trimmedLine}
                        </h3>
                      );
                    }
                    
                    // Check if it's a numbered heading
                    if (/^\d+\.\s+[A-Z\s]+$/.test(trimmedLine)) {
                      return (
                        <h4 key={index} className="mt-5 mb-2 text-sm font-bold text-white">
                          {trimmedLine}
                        </h4>
                      );
                    }
                    
                    // Check if it's a list item
                    if (trimmedLine.startsWith('-')) {
                      return (
                        <div key={index} className="ml-4 mb-1 text-slate-300">
                          • {trimmedLine.substring(1).trim()}
                        </div>
                      );
                    }
                    
                    return (
                      <p key={index} className="mb-3 text-slate-300 last:mb-0">
                        {trimmedLine}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[--color-border] bg-gradient-to-r from-[#FF6B35]/5 to-[#1d4ed8]/5 px-6 py-4">
              <div className="flex items-center justify-between">
                {!hasScrolled && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span>Please scroll to read the full disclosure</span>
                  </div>
                )}
                {hasScrolled && (
                  <div className="flex items-center gap-2 text-xs text-[#10b981]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>You've read the full disclosure</span>
                  </div>
                )}
                <button
                  onClick={closeModal}
                  className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#FF6B35]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#FF6B35]/40"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

