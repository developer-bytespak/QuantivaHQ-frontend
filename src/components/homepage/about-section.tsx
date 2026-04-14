"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";

const journeyItems = [
  {
    label: "Vision",
    title: "Smart Trading for Everyone",
    description:
      "We believe AI should work for traders, not replace them. Our platform puts powerful intelligence in your hands.",
  },
  {
    label: "Mission",
    title: "Democratize Intelligent Trading",
    description:
      "Bridge the gap between institutional-grade tools and individual traders with accessible, AI-powered workflows.",
  },
  {
    label: "Future",
    title: "Continuous Evolution",
    description:
      "Our AI learns and improves with every market cycle. Stay ahead with strategies that adapt to changing conditions.",
  },
];

export function AboutSection() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.15 });

  const handleStartTrading = () => {
    setIsNavigating(true);
    router.push("/onboarding/sign-up?tab=signup");
  };

  const handleContactScroll = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--primary-rgb),0.18),transparent_45%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(var(--primary-rgb),0.08))]" />

      <div className="relative mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-10 xl:px-14">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10 xl:gap-16">
          <div
            className={`h-full self-start rounded-[2rem] bg-[--color-surface-alt]/85 p-6 text-left sm:p-8 lg:justify-self-start lg:mr-auto lg:max-w-[38rem] lg:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="mb-4 inline-flex rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
              About Us
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              About Us
            </h2>
            <p className="mt-4 max-w-[34rem] text-base leading-8 text-slate-300 sm:text-lg sm:leading-9 lg:text-xl">
              Quantiva builds AI-powered trading workflows for modern crypto and stock traders. We bring market intelligence,
              automation, and execution support into one focused platform so every decision is faster, clearer, and backed by
              real-time insight.
            </p>

            <p className="mt-5 max-w-[34rem] text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              From signal discovery and market sentiment tracking to structured execution support, Quantiva is designed to help
              traders reduce noise, act with more confidence, and stay consistent across fast-moving crypto and equity markets.
            </p>

            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Real-Time Intelligence</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Live market context, sentiment signals, and clearer trade decision support.
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Execution Workflow</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  A focused system that connects analysis, planning, and action in one place.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`h-full rounded-[2rem] bg-[linear-gradient(135deg,rgba(var(--primary-rgb),0.2),rgba(17,17,17,0.92))] p-6 sm:p-8 lg:justify-self-end lg:ml-auto lg:w-full lg:max-w-[42rem] lg:p-10 shadow-[0_24px_90px_rgba(var(--primary-rgb),0.14)] transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "120ms" }}
          >
            <div className="flex h-full flex-col gap-8">
              <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                <div>
                  <h3 className="text-3xl font-bold text-white sm:text-4xl">
                    Our <span className="text-[var(--primary)]">Journey</span>
                  </h3>

                  <div className="mt-8 space-y-7">
                    {journeyItems.map((item, index) => (
                      <div key={item.label} className="grid grid-cols-[auto_1fr] gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] shadow-[0_0_0_6px_rgba(var(--primary-rgb),0.18)]">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                          {index < journeyItems.length - 1 ? (
                            <div className="mt-2 h-full w-px bg-[linear-gradient(180deg,rgba(var(--primary-rgb),0.6),rgba(var(--primary-rgb),0.08))]" />
                          ) : null}
                        </div>

                        <div className="pb-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)] sm:text-xs">
                            {item.label}
                          </p>
                          <h4 className="mt-2 text-base font-semibold text-white sm:text-lg">
                            {item.title}
                          </h4>
                          <p className="mt-2 max-w-md text-xs leading-6 text-slate-300 sm:text-sm sm:leading-7">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 sm:p-8">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(var(--primary-rgb),0.12),transparent_35%,rgba(var(--primary-rgb),0.04))]" />
                  <div className="absolute inset-x-8 inset-y-6 border border-[var(--primary)]/10 opacity-40" />

                  <div className="relative flex min-h-[260px] flex-col items-center justify-center text-center">
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] p-4 shadow-[0_20px_45px_rgba(var(--primary-rgb),0.3)]">
                      <div className="absolute inset-[-12px] rounded-[2rem] border border-[var(--primary)]/20" />
                      <QuantivaLogo className="h-full w-full" disableFadeIn />
                    </div>

                    <h4 className="mt-10 text-2xl font-bold text-white sm:text-[1.65rem]">
                      AI-Powered Trading
                    </h4>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-300 sm:text-sm">
                      Intelligent. Unified. Secure.
                    </p>
                  </div>
                </div>
              </div>

              {/* <div className="rounded-[1.4rem] border border-[var(--primary)]/20 bg-[rgba(var(--primary-rgb),0.08)] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white sm:text-2xl">
                      Ready to Trade <span className="text-[var(--primary)]">Smarter</span>?
                    </h4>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-slate-200">
                      Join thousands of traders using AI-powered insights to make better decisions every day.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={handleStartTrading}
                      disabled={isNavigating}
                      className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.28)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isNavigating ? "Opening..." : "Start Trading Now"}
                    </button>
                    <button
                      type="button"
                      onClick={handleContactScroll}
                      className="rounded-xl bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
                    >
                      Contact Us
                    </button>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
