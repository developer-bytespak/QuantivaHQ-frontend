"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function AboutSimpleSection() {
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

      <div className="relative mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-8">
          <div
            className={`rounded-[2rem] border border-[--color-border]/60 bg-[--color-surface-alt]/85 p-6 sm:p-8 lg:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="mb-4 inline-flex rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
              About Us
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              About Us
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8 lg:text-lg">
              Quantiva builds AI-powered trading workflows for modern crypto and stock traders. We bring market intelligence,
              automation, and execution support into one focused platform so every decision is faster, clearer, and backed by
              real-time insight.
            </p>
          </div>

          <div
            className={`rounded-[2rem] border border-[var(--primary)]/30 bg-[linear-gradient(135deg,rgba(var(--primary-rgb),0.2),rgba(17,17,17,0.92))] p-6 sm:p-8 lg:p-10 shadow-[0_24px_90px_rgba(var(--primary-rgb),0.14)] transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "120ms" }}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                  Call To Action
                </p>
                <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  Ready to start trading with more confidence?
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
                  Join Quantiva to access AI-assisted market analysis, streamlined workflows, and a cleaner way to act on
                  opportunities.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <button
                  type="button"
                  onClick={handleStartTrading}
                  disabled={isNavigating}
                  className="rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.28)] transition-all duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isNavigating ? "Opening..." : "Start Trading"}
                </button>
                <button
                  type="button"
                  onClick={handleContactScroll}
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/10"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
