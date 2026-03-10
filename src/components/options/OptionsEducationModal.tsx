"use client";

import { useState } from "react";

// ── Education Sections ───────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "basics",
    title: "What are Options?",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    content: [
      {
        heading: "Options are Contracts",
        text: "An option gives you the right (but not obligation) to buy or sell an asset at a specific price before a specific date. You pay a premium for this right.",
      },
      {
        heading: "Call Options",
        text: "A CALL gives you the right to BUY the asset at the strike price. Buy calls when you think the price will go UP. Your max loss is the premium you paid.",
        tag: "CALL",
        tagColor: "bg-green-500/15 text-green-400",
      },
      {
        heading: "Put Options",
        text: "A PUT gives you the right to SELL the asset at the strike price. Buy puts when you think the price will go DOWN, or to protect (hedge) an existing position.",
        tag: "PUT",
        tagColor: "bg-red-500/15 text-red-400",
      },
      {
        heading: "Premium",
        text: "The price you pay for an option. If the option expires worthless (out of the money), you lose the entire premium — this is your maximum loss as a buyer.",
      },
    ],
  },
  {
    id: "strikes",
    title: "Strike Price & Moneyness",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    content: [
      {
        heading: "Strike Price",
        text: "The price at which you can buy (call) or sell (put) the underlying asset. Choose strikes based on where you think the asset price will be at expiry.",
      },
      {
        heading: "In The Money (ITM)",
        text: "A call is ITM when the asset price is ABOVE the strike. A put is ITM when the asset is BELOW the strike. ITM options are more expensive but safer.",
        tag: "ITM",
        tagColor: "bg-green-500/15 text-green-400",
      },
      {
        heading: "At The Money (ATM)",
        text: "When the strike price equals (or is very close to) the current asset price. ATM options have the highest time value and are the most commonly traded.",
        tag: "ATM",
        tagColor: "bg-blue-500/15 text-blue-400",
      },
      {
        heading: "Out of The Money (OTM)",
        text: "A call is OTM when the asset price is BELOW the strike. A put is OTM when the asset is ABOVE the strike. OTM options are cheaper but more likely to expire worthless.",
        tag: "OTM",
        tagColor: "bg-amber-500/15 text-amber-400",
      },
    ],
  },
  {
    id: "expiry",
    title: "Expiry & Time Decay",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    content: [
      {
        heading: "Expiration Date",
        text: "Every option has an expiry date. After this date, the option ceases to exist. If it's OTM at expiry, it expires worthless and you lose the premium.",
      },
      {
        heading: "Days to Expiry (DTE)",
        text: "The number of days until the option expires. Longer DTE = more time for the trade to work out = higher premium.",
      },
      {
        heading: "Time Decay (Theta)",
        text: "Options lose value every day due to time decay, accelerating as expiry approaches. This is why buying options with <7 days to expiry is risky — they lose value fast even if the price is moving your way.",
        tag: "⚠ KEY RISK",
        tagColor: "bg-red-500/15 text-red-400",
      },
      {
        heading: "Recommended DTE",
        text: "For beginners, 30–45 DTE is the sweet spot — enough time for the trade to work while keeping premiums reasonable. Avoid <7 DTE unless you have a strong conviction.",
      },
    ],
  },
  {
    id: "greeks",
    title: "Understanding Greeks",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    content: [
      {
        heading: "Delta (Δ)",
        text: "How much the option price changes per $1 move in the underlying. Delta 0.5 = option gains $0.50 for every $1 up. Also approximates the probability of being ITM at expiry.",
        tag: "Δ",
        tagColor: "bg-green-500/15 text-green-400",
      },
      {
        heading: "Gamma (Γ)",
        text: "How fast Delta changes. High gamma (near ATM, near expiry) means your position risk can change rapidly. Important for managing risk.",
        tag: "Γ",
        tagColor: "bg-blue-500/15 text-blue-400",
      },
      {
        heading: "Theta (Θ)",
        text: "Daily time decay. If theta is -5, the option loses $5 per day. Buyers pay theta; sellers collect it. This is why option buyers need the price to move in their direction.",
        tag: "Θ",
        tagColor: "bg-amber-500/15 text-amber-400",
      },
      {
        heading: "Vega (ν)",
        text: "Sensitivity to implied volatility (IV). High vega means the option price swings more with IV changes. Buy options when IV is low; sell when IV is high.",
        tag: "ν",
        tagColor: "bg-purple-500/15 text-purple-400",
      },
      {
        heading: "Implied Volatility (IV)",
        text: "The market's expectation of future price movement. High IV = expensive premiums. After major events (earnings, news), IV often 'crushes' and option prices drop even if the asset doesn't move much.",
        tag: "IV",
        tagColor: "bg-cyan-500/15 text-cyan-400",
      },
    ],
  },
  {
    id: "chain",
    title: "Reading the Options Chain",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    content: [
      {
        heading: "Bid & Ask",
        text: "Bid = highest price someone is willing to pay. Ask = lowest price someone is willing to sell at. You buy at the ask and sell at the bid. Tight spreads = better liquidity.",
      },
      {
        heading: "Volume (Vol)",
        text: "Number of contracts traded today. Higher volume = more active trading = easier to enter and exit positions at fair prices.",
      },
      {
        heading: "Open Interest (OI)",
        text: "Total number of outstanding contracts. High OI = more established contracts with better liquidity. Low OI can lead to wide bid-ask spreads.",
      },
      {
        heading: "Mark Price",
        text: "Fair value of the option, typically the midpoint between bid and ask. Used as a reference for P&L calculations. Your actual fill price may differ.",
      },
    ],
  },
  {
    id: "risks",
    title: "Key Risks & Tips",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    content: [
      {
        heading: "You Can Lose 100% of Premium",
        text: "When buying options, the maximum loss is the entire premium paid. Unlike spot trading, there is no asset to hold — an expired worthless option has zero value.",
        tag: "⚠ CRITICAL",
        tagColor: "bg-red-500/15 text-red-400",
      },
      {
        heading: "Start Small",
        text: "Begin with 1 contract and small premium amounts. Options are leveraged instruments — small price changes in the underlying cause large percentage swings in option value.",
      },
      {
        heading: "Watch the Spread",
        text: "If bid-ask spread is more than 10-15% of the option price, liquidity is poor. You'll lose money immediately upon entry. Prefer contracts with tight spreads and high volume.",
      },
      {
        heading: "Don't Fight Theta",
        text: "As a buyer, time is working against you. Have a clear plan: take profits early, set mental stop losses, and don't hold through expiry hoping for a miracle.",
      },
      {
        heading: "Use AI Signals Wisely",
        text: "Our AI recommendations are based on technical analysis and market conditions. They are suggestions, not guarantees. Always do your own research and size positions according to your risk tolerance.",
        tag: "AI",
        tagColor: "bg-[#fc4f02]/15 text-[#fc4f02]",
      },
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────────────

interface OptionsEducationModalProps {
  open: boolean;
  onClose: () => void;
}

export function OptionsEducationModal({ open, onClose }: OptionsEducationModalProps) {
  const [activeSection, setActiveSection] = useState(0);

  if (!open) return null;

  const section = SECTIONS[activeSection];
  const isLast = activeSection === SECTIONS.length - 1;
  const isFirst = activeSection === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e0e16] shadow-2xl sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fc4f02]/10 text-[#fc4f02]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Options Trading Guide</h2>
              <p className="text-xs text-slate-500">Everything you need to know before trading</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar — section nav */}
          <div className="hidden w-52 flex-shrink-0 border-r border-white/[0.06] bg-white/[0.01] p-3 sm:block">
            <nav className="space-y-1">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                    activeSection === i
                      ? "bg-[#fc4f02]/10 text-[#fc4f02]"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  <span className={activeSection === i ? "text-[#fc4f02]" : "text-slate-500"}>
                    {s.icon}
                  </span>
                  {s.title}
                </button>
              ))}
            </nav>

            {/* Progress */}
            <div className="mt-4 px-3">
              <div className="text-[10px] text-slate-500">
                Section {activeSection + 1} of {SECTIONS.length}
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[#fc4f02] transition-all duration-300"
                  style={{ width: `${((activeSection + 1) / SECTIONS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Mobile section selector */}
            <div className="mb-4 flex items-center gap-2 sm:hidden">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(Number(e.target.value))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none"
              >
                {SECTIONS.map((s, i) => (
                  <option key={s.id} value={i}>
                    {i + 1}. {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Section heading */}
            <div className="mb-5 flex items-center gap-3">
              <span className="text-[#fc4f02]">{section.icon}</span>
              <h3 className="text-lg font-bold text-slate-100">{section.title}</h3>
            </div>

            {/* Section content cards */}
            <div className="space-y-3">
              {section.content.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-semibold text-slate-200">{item.heading}</h4>
                    {item.tag && (
                      <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with nav */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3.5">
          <button
            onClick={() => setActiveSection((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              isFirst
                ? "cursor-not-allowed text-slate-600"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {/* Section dots */}
          <div className="hidden items-center gap-1.5 sm:flex">
            {SECTIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={`h-1.5 rounded-full transition-all ${
                  activeSection === i
                    ? "w-5 bg-[#fc4f02]"
                    : "w-1.5 bg-white/[0.1] hover:bg-white/[0.2]"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onClose}
              className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2 text-xs font-semibold text-white transition-transform hover:scale-105"
            >
              Start Trading
            </button>
          ) : (
            <button
              onClick={() => setActiveSection((s) => Math.min(SECTIONS.length - 1, s + 1))}
              className="flex items-center gap-1.5 rounded-lg bg-[#fc4f02]/10 px-4 py-2 text-xs font-semibold text-[#fc4f02] transition-colors hover:bg-[#fc4f02]/20"
            >
              Next
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
