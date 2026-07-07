"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { getCurrentUser } from "@/lib/api/user";
import { navigateToDashboard } from "@/lib/auth/flow-router.service";
import { scrollToId } from "./motion/smooth-scroll";
import { StaggerWords } from "./motion/stagger";
import { HP_EASE } from "./motion/reveal";
import { GradientText } from "./motion/gradient-text";

export function HeroSection() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const handleGetStarted = async () => {
    setIsCheckingAuth(true);
    try {
      // Check if user is already authenticated
      await getCurrentUser();
      // User is authenticated, send straight to the dashboard.
      await navigateToDashboard(router);
    } catch (error: unknown) {
      // User is not authenticated (or check failed) — either way, sign-up is the destination
      const err = error as { status?: number; statusCode?: number; message?: string };
      const isUnauthorized =
        err?.status === 401 ||
        err?.statusCode === 401 ||
        err?.message?.includes("401") ||
        err?.message?.includes("Unauthorized");
      if (!isUnauthorized) {
        console.error("Error checking authentication:", error);
      }
      router.push("/onboarding/sign-up?tab=signup");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-28 pb-14 text-center sm:px-6 lg:px-8">
        {/* Eyebrow */}
        <m.div
          initial={{ opacity: 0.001, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: HP_EASE }}
          className="mb-6 flex justify-center"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium tracking-wide text-slate-300 backdrop-blur sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]" />
            </span>
            AI-Powered Trading · Crypto + Stocks
          </span>
        </m.div>

        {/* Headline */}
        {/* Font size follows viewport height, guarded by width so tall narrow phones don't oversize */}
        <h1 className="mx-auto max-w-5xl text-[clamp(2rem,min(8.5vh,9.5vw),4.75rem)] font-bold leading-[1.06] tracking-tight text-white">
          <StaggerWords text="Unlock Your Trading Potential" trigger="mount" stagger={0.07} />
          <br />
          <m.span
            className="inline-block"
            initial={{ opacity: 0.001, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.55, delay: 0.32, ease: HP_EASE }}
          >
            <GradientText>with AI-Powered Insights</GradientText>
          </m.span>
        </h1>

        {/* Subheading */}
        <m.p
          initial={{ opacity: 0.001, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.45, ease: HP_EASE }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          Automate your crypto and stock trading with powerful AI strategies. Real-time sentiment
          analysis and seamless multi-exchange connectivity.
        </m.p>

        {/* CTAs */}
        <m.div
          initial={{ opacity: 0.001, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.58, ease: HP_EASE }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <button
            onClick={handleGetStarted}
            disabled={isCheckingAuth}
            className="group relative w-full cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[rgba(var(--primary-rgb),0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isCheckingAuth ? "Checking..." : "Get Started"}
              {!isCheckingAuth && (
                <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>

          <button
            onClick={() => scrollToId("features", -88)}
            className="group w-full cursor-pointer rounded-full border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] sm:w-auto"
          >
            <span className="flex items-center justify-center gap-2">
              Learn More
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </button>
        </m.div>
      </div>
    </section>
  );
}
