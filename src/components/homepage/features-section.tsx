"use client";

import Image from "next/image";
import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { Reveal } from "./motion/reveal";
import { GradientText } from "./motion/gradient-text";
import { TiltCard } from "./motion/tilt-card";
import { TiltIn } from "./motion/tilt-in";

/**
 * The AI robot mascot — waves on a continuous loop. Scroll-driven entrance:
 * grows from tiny to full size out of the particle scatter (reversible).
 * Black video bg removed via screen blending + radial mask.
 */
function RobotVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.3"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.35, 1], [0, 0.7, 1]);

  return (
    <div ref={ref} className={className}>
      <m.div
        style={{ scale, opacity }}
        className="origin-center"
        viewport={{ amount: 0.15 }}
        // Mobile browsers sometimes defer autoplay — nudge playback when it scrolls into view
        onViewportEnter={() => videoRef.current?.play().catch(() => {})}
      >
        <video
          ref={videoRef}
          src="/robot-wave.mp4"
          poster="/robot-still.png"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className="pointer-events-none w-full mix-blend-screen motion-reduce:hidden"
          style={{
            filter: "brightness(1.06) contrast(1.14)",
            maskImage: "radial-gradient(ellipse 60% 56% at 50% 42%, black 50%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 56% at 50% 42%, black 50%, transparent 75%)",
          }}
        />
      </m.div>
    </div>
  );
}

/* --- Compact mini-visuals (right slot of each card) --- */

function StrategiesVisual() {
  return (
    <svg viewBox="0 0 150 64" className="h-14 w-36" aria-hidden>
      <defs>
        <linearGradient id="hpSparkFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <m.path
        d="M4,54 C24,50 32,38 50,41 C68,44 76,26 96,28 C116,30 128,14 146,10"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <m.path
        d="M4,54 C24,50 32,38 50,41 C68,44 76,26 96,28 C116,30 128,14 146,10 L146,64 L4,64 Z"
        fill="url(#hpSparkFill)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, delay: 0.7 }}
      />
    </svg>
  );
}

function SentimentVisual() {
  const chips = [
    { label: "Bullish 62%", cls: "border-[#10b981]/30 bg-[#10b981]/10 text-[#34d399]" },
    { label: "Neutral 24%", cls: "border-white/15 bg-white/[0.06] text-slate-300" },
    { label: "Bearish 14%", cls: "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#f87171]" },
  ];
  return (
    <div className="flex w-36 flex-col items-start gap-1.5" aria-hidden>
      {chips.map((chip, i) => (
        <m.span
          key={chip.label}
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.35, delay: 0.1 + i * 0.1 }}
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${chip.cls}`}
        >
          {chip.label}
        </m.span>
      ))}
    </div>
  );
}

function ExchangesVisual() {
  const logos = [
    { src: "/binance logo.png", alt: "Binance" },
    { src: "/bybit logo.png", alt: "Bybit" },
    { src: "/IBKR_logo.png", alt: "Interactive Brokers" },
    { src: "/alpaca_logo.png", alt: "Alpaca" },
  ];
  return (
    <div className="grid w-36 grid-cols-2 gap-1.5" aria-hidden>
      {logos.map((logo, i) => (
        <m.div
          key={logo.alt}
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.35, delay: 0.08 + i * 0.08 }}
          className="flex h-7 items-center justify-center rounded-lg border border-white/10 bg-black/60 px-2"
        >
          <Image src={logo.src} alt={logo.alt} width={70} height={18} className="h-3 w-auto object-contain opacity-70" />
        </m.div>
      ))}
    </div>
  );
}

/* --- Feature data (copy preserved) --- */

const FEATURES = [
  {
    title: "AI-Driven Trading Strategies",
    description: "Machine learning algorithms that continuously learn from market patterns across crypto and stocks.",
    accent: "group-hover:border-[var(--primary)]/40",
    iconBg: "from-[var(--primary)] to-[var(--primary-light)]",
    visual: <StrategiesVisual />,
    icon: (
      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Sentiment Analysis",
    description: "Sentiment intelligence from news, social media, and market data — in real time.",
    accent: "group-hover:border-[#3b82f6]/40",
    iconBg: "from-[#1d4ed8] to-[#3b82f6]",
    visual: <SentimentVisual />,
    icon: (
      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    title: "Multi-Exchange Connectivity",
    description: "Trade across Binance, Bybit, and Interactive Brokers from one unified platform.",
    accent: "group-hover:border-[#f59e0b]/40",
    iconBg: "from-[#f59e0b] to-[#d97706]",
    visual: <ExchangesVisual />,
    icon: (
      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
        <path strokeLinecap="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  return (
    // Single-viewport section: content vertically centered, 60/40 split with the robot on the right
    <section id="features" className="relative flex min-h-svh items-center py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[3fr_2fr] lg:gap-10">
          <div>
            {/* Left-aligned header */}
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                Features
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Powerful Features for <GradientText>Modern Traders</GradientText>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-3 text-base leading-relaxed text-slate-400 sm:text-lg">
                Everything you need to trade smarter, faster, and more profitably
              </p>
            </Reveal>

            {/* Compact stacked cards */}
            <div className="mt-9 space-y-4">
              {FEATURES.map((feature, i) => (
                <TiltIn
                  key={feature.title}
                  fromRotateX={14}
                  fromY={36}
                  fromScale={0.97}
                  fromOpacity={0.25}
                  until={0.28 + i * 0.04}
                >
                  <TiltCard maxTilt={6} className="rounded-2xl">
                    <div
                      className={`group relative flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 transition-colors duration-300 sm:items-center sm:gap-5 sm:p-6 ${feature.accent}`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div
                        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ${feature.iconBg}`}
                        style={{ transform: "translateZ(28px)" }}
                      >
                        {feature.icon}
                      </div>
                      <div className="min-w-0 flex-1" style={{ transform: "translateZ(18px)" }}>
                        <h3 className="text-lg font-semibold text-white sm:text-xl">{feature.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{feature.description}</p>
                      </div>
                      <div className="hidden shrink-0 xl:block" style={{ transform: "translateZ(22px)" }}>
                        {feature.visual}
                      </div>
                    </div>
                  </TiltCard>
                </TiltIn>
              ))}
            </div>
          </div>

          {/* Right 40% — the waving robot mascot */}
          <div className="hidden items-center justify-center lg:flex">
            <RobotVideo className="w-full max-w-[460px]" />
          </div>
        </div>

        {/* Mobile: robot below the cards */}
        <div className="mt-4 flex justify-center lg:hidden">
          <RobotVideo className="w-72" />
        </div>
      </div>
    </section>
  );
}
