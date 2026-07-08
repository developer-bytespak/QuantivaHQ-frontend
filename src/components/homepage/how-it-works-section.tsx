"use client";

import { ReactNode, RefObject, useRef, useState } from "react";
import Image from "next/image";
import { m, useInView, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Reveal, HP_EASE } from "./motion/reveal";
import { GradientText } from "./motion/gradient-text";

interface Step {
  number: number;
  title: string;
  description: string;
  visual: ReactNode;
}

/* --- Per-step mock UIs shown inside the device card --- */

function ConnectVisual() {
  const exchanges = [
    { src: "/binance logo.png", name: "Binance", detail: "Spot · Futures" },
    { src: "/bybit logo.png", name: "Bybit", detail: "Spot · Derivatives" },
    { src: "/IBKR_logo.png", name: "Interactive Brokers", detail: "Stocks · Options" },
    { src: "/alpaca_logo.png", name: "Alpaca", detail: "Stocks · Paper" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Exchange Connections</p>
        <span className="text-[10px] font-medium text-slate-500">4 of 4 linked</span>
      </div>
      {exchanges.map((exchange) => (
        <div
          key={exchange.name}
          className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2"
        >
          <span className="flex h-8 w-14 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/60 px-2">
            <Image src={exchange.src} alt="" width={90} height={24} className="h-3.5 w-auto object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{exchange.name}</p>
            <p className="text-[10px] text-slate-500">{exchange.detail}</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#34d399]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            </span>
            Connected
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <svg className="h-3.5 w-3.5 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured with industry-standard encryption
      </div>
    </div>
  );
}

function AnalysisVisual() {
  const stats = [
    { label: "Sentiment", value: "72%", note: "Bullish", tone: "text-[#34d399]" },
    { label: "News", value: "128", note: "per hour", tone: "text-white" },
    { label: "Signals", value: "14", note: "live now", tone: "text-[var(--primary-light)]" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Live Market Intelligence</p>
        <span className="font-mono text-[10px] text-slate-500">scanning 2,400+ assets</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className={`mt-0.5 text-base font-bold ${stat.tone}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-500">{stat.note}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
        <svg viewBox="0 0 260 60" className="w-full">
          <defs>
            <linearGradient id="hpHiwChart" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M2,48 C28,44 42,32 66,36 C90,40 104,20 128,24 C152,28 166,13 196,11 C222,9 240,6 258,4 L258,60 L2,60 Z"
            fill="url(#hpHiwChart)"
          />
          <path
            d="M2,48 C28,44 42,32 66,36 C90,40 104,20 128,24 C152,28 166,13 196,11 C222,9 240,6 258,4"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M2,42 C30,44 48,38 72,28 C96,18 118,30 142,20 C166,10 192,20 218,15 C236,11 248,13 258,11"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="4 4"
            opacity="0.7"
          />
        </svg>
        <div className="mt-1.5 flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-3 rounded-full bg-[var(--primary)]" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-3 rounded-full bg-[#34d399]" /> Sentiment
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-slate-300">BTC <span className="text-[#34d399]">+2.4%</span></span>
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-slate-300">ETH <span className="text-[#34d399]">+1.1%</span></span>
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-slate-300">NVDA <span className="text-[#f87171]">-0.6%</span></span>
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-slate-300">AAPL <span className="text-[#34d399]">+0.8%</span></span>
      </div>
    </div>
  );
}

function RecommendationVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Today&apos;s Recommendations</p>
        <span className="rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--primary-light)]">
          3 new
        </span>
      </div>

      {/* Primary signal */}
      <div className="rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/[0.07] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#10b981]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#34d399]">BUY</span>
            <span className="text-sm font-semibold text-white">BTC/USDT</span>
          </div>
          <span className="text-[11px] font-medium text-[var(--primary-light)]">Confidence 87%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]" />
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-black/30 px-2 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">Entry</p>
            <p className="font-mono text-[11px] font-semibold text-white">$43,250</p>
          </div>
          <div className="rounded-lg bg-black/30 px-2 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">Target</p>
            <p className="font-mono text-[11px] font-semibold text-[#34d399]">$46,800</p>
          </div>
          <div className="rounded-lg bg-black/30 px-2 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">Stop</p>
            <p className="font-mono text-[11px] font-semibold text-[#f87171]">$41,900</p>
          </div>
        </div>
        <div className="mt-2 flex gap-1.5">
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-slate-400">Momentum</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-slate-400">Sentiment +</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-slate-400">Risk: matched</span>
        </div>
      </div>

      {/* Secondary signal */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 opacity-75">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#3b82f6]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#60a5fa]">HOLD</span>
            <span className="text-sm font-semibold text-white">NVDA</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Confidence 74%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[74%] rounded-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}

function ExecuteVisual() {
  const receipt = [
    { label: "Filled", value: "0.25 BTC @ $43,251" },
    { label: "Position size", value: "4% of portfolio" },
    { label: "Stop-loss", value: "placed automatically" },
    { label: "Slippage", value: "0.02%" },
  ];
  const timeline = ["Approved", "Routed", "Filled"];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#10b981]/40 bg-[#10b981]/10">
          <svg className="h-5 w-5 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Order Executed</p>
          <p className="text-[10px] text-slate-500">One-click approval · executed in 0.4s</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5">
        {receipt.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-2 text-xs ${i < receipt.length - 1 ? "border-b border-white/[0.06]" : ""}`}
          >
            <span className="text-slate-500">{row.label}</span>
            <span className="font-mono font-medium text-white">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Status timeline */}
      <div className="flex items-center px-1">
        {timeline.map((stage, i) => (
          <div key={stage} className={`flex items-center ${i < timeline.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#10b981]/15">
                <svg className="h-3 w-3 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-[9px] text-slate-400">{stage}</span>
            </div>
            {i < timeline.length - 1 && <div className="mx-2 mb-5 h-px flex-1 bg-[#10b981]/30" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Step data (copy preserved) --- */

const STEPS: Step[] = [
  {
    number: 1,
    title: "Sign Up & Connect Accounts",
    description:
      "Create your account and securely connect your exchange accounts. We support Binance, Bybit, and Interactive Brokers with industry-standard encryption.",
    visual: <ConnectVisual />,
  },
  {
    number: 2,
    title: "AI Trading Strategies & Market Sentiment",
    description:
      "Our AI analyzes market data, news, and social sentiment in real-time to identify profitable trading opportunities across crypto and stocks.",
    visual: <AnalysisVisual />,
  },
  {
    number: 3,
    title: "Receive Trade Recommendations",
    description:
      "Get personalized trade recommendations based on your risk profile, portfolio goals, and market conditions. Review detailed analysis before executing.",
    visual: <RecommendationVisual />,
  },
  {
    number: 4,
    title: "Approve and Execute Trades",
    description:
      "Review recommendations and approve trades with one click. Our system handles execution, position sizing, and risk management automatically.",
    visual: <ExecuteVisual />,
  },
];

/**
 * Accordion list item. Snap behavior: `isActive` flips per scroll segment and the
 * open/close transition always plays out fully — it can never rest half-way.
 */
function StepListItem({ step, isActive }: { step: Step; isActive: boolean }) {
  return (
    <m.div
      initial={false}
      animate={{ opacity: isActive ? 1 : 0.45 }}
      transition={{ duration: 0.3, ease: HP_EASE }}
      className="relative flex gap-4 py-3"
    >
      <span className="relative z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0b0b0b] text-sm font-bold text-white">
        <m.span
          aria-hidden
          initial={false}
          animate={{ opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] shadow-[0_0_18px_rgba(var(--primary-rgb),0.45)]"
        />
        <span className="relative">{step.number}</span>
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="pt-1.5 text-base font-semibold text-white xl:text-lg">{step.title}</h3>
        <m.div
          initial={false}
          animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.4, ease: HP_EASE }}
          className="overflow-hidden"
        >
          <p className="max-w-md pt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
        </m.div>
      </div>
    </m.div>
  );
}

function StepVisual({ step, index, activeStep }: { step: Step; index: number; activeStep: number }) {
  const isActive = index === activeStep;
  // Inactive panels wait below (upcoming) or park above (passed) for directional motion
  const restY = index < activeStep ? -20 : 20;

  return (
    <m.div
      initial={false}
      animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : restY }}
      transition={{ duration: 0.4, ease: HP_EASE }}
      style={{ pointerEvents: isActive ? "auto" : "none" }}
      className="absolute inset-0 overflow-hidden p-6 xl:p-7"
    >
      {step.visual}
    </m.div>
  );
}

function PinnedSteps({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const [activeStep, setActiveStep] = useState(0);

  // Snap: scroll position only selects the active segment; transitions are time-based
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActiveStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(p * STEPS.length))));
  });

  return (
    <div className="sticky top-0 flex h-screen items-center overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[0.95fr_1.05fr] items-center gap-14 px-8">
        {/* Left — compact header + accordion step list */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white xl:text-4xl">
            How It <GradientText>Works</GradientText>
          </h2>
          <p className="mt-2 text-base text-slate-400">Get started in minutes and start trading smarter today</p>

          <div className="relative mt-7">
            {/* Rail sits behind the solid circles */}
            <div className="absolute bottom-6 left-[17px] top-6 w-0.5 rounded-full bg-white/10" />
            <m.div
              className="absolute bottom-6 left-[17px] top-6 w-0.5 origin-top rounded-full bg-gradient-to-b from-[var(--primary)] to-[var(--primary-light)]"
              style={{ scaleY: scrollYProgress }}
            />
            <div className="relative">
              {STEPS.map((step, i) => (
                <StepListItem key={step.number} step={step} isActive={i === activeStep} />
              ))}
            </div>
          </div>
        </div>

        {/* Right — device card with snapping mock UIs */}
        <div className="flex items-center justify-center">
          <div className="relative h-[480px] max-h-[78vh] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-md">
            {/* Title bar with scrub progress */}
            <div className="absolute inset-x-0 top-0 z-10 flex h-10 items-center justify-between border-b border-white/[0.06] bg-black/20 px-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <span className="font-mono text-[10px] text-slate-500">quantivahq.app</span>
              <m.div
                className="absolute bottom-0 left-0 h-px w-full origin-left bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]"
                style={{ scaleX: scrollYProgress }}
              />
            </div>
            <div className="absolute inset-0 top-10">
              {STEPS.map((step, i) => (
                <StepVisual key={step.number} step={step} index={i} activeStep={activeStep} />
              ))}
            </div>
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[var(--primary)]/10 blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Stacked cards — mobile and reduced-motion fallback. */
function StackedSteps() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            How It Works
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            How It <GradientText>Works</GradientText>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mt-5 text-lg text-slate-400">Get started in minutes and start trading smarter today</p>
        </Reveal>
      </div>

      {/* Stacking deck: each card pins near the top and the next slides up over it,
          so the long scroll reads as one continuous animation */}
      <div>
        {STEPS.map((step, i) => (
          <div key={step.number} className="sticky mb-6" style={{ top: 84 + i * 16 }}>
            <StackedStepCard step={step} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked card that lights up whenever it overlaps the middle band of the viewport. */
function StackedStepCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { margin: "-38% 0px -38% 0px" });

  return (
    <Reveal delay={index * 0.06}>
      <m.div
        ref={ref}
        initial="inactive"
        animate={active ? "active" : "inactive"}
        // Opaque bg + top shadow so stacked cards cover each other cleanly
        className="relative rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_-14px_36px_rgba(0,0,0,0.55)] sm:p-8"
      >
              <m.div
                aria-hidden
                variants={{ inactive: { opacity: 0 }, active: { opacity: 1 } }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none absolute inset-0 rounded-3xl border border-[var(--primary)]/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.18)]"
              />
              <div className="flex items-start gap-4">
                <m.span
                  variants={{
                    inactive: { scale: 1, boxShadow: "0 0 0px rgba(252,79,2,0)" },
                    active: { scale: 1.12, boxShadow: "0 0 22px rgba(252,79,2,0.55)" },
                  }}
                  transition={{ duration: 0.35 }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-base font-bold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]"
                >
                  {step.number}
                </m.span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white sm:text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.description}</p>
                  <div className="mt-6 max-w-md rounded-2xl border border-white/[0.06] bg-black/30 p-4">{step.visual}</div>
                </div>
              </div>
      </m.div>
    </Reveal>
  );
}

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  return (
    <section id="how-it-works" className="relative">
      {/* Mobile / tablet: stacked */}
      <div className="lg:hidden">
        <StackedSteps />
      </div>
      {/* Desktop: pinned scroll-snap (stacked under reduced motion) */}
      <div className="hidden lg:block">
        {reduced ? (
          <StackedSteps />
        ) : (
          <div ref={containerRef} className="relative h-[320vh]">
            <PinnedSteps containerRef={containerRef} />
          </div>
        )}
      </div>
    </section>
  );
}
