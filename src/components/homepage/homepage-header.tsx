"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "framer-motion";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { authService } from "@/lib/auth/auth.service";
import { scrollToId } from "./motion/smooth-scroll";

const NAV_LINKS = [
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "pricing", label: "Pricing" },
  { id: "contact", label: "Contact" },
];

export function HomepageHeader() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setIsScrolled(y > 20));

  // Check auth status on mount and when returning to homepage
  const checkAuthStatus = async () => {
    if (typeof window !== "undefined") {
      try {
        // First check localStorage for quick status
        const authStatus = localStorage.getItem("quantivahq_is_authenticated");
        if (authStatus === "true") {
          // Verify with server
          try {
            await authService.getCurrentUser();
            setIsAuthenticated(true);
          } catch {
            // Server says not authenticated, clear localStorage
            localStorage.removeItem("quantivahq_is_authenticated");
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn("Error checking auth status:", err);
        setIsAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    checkAuthStatus();

    // Refresh auth status periodically (localStorage-only, no server call)
    const authCheckInterval = setInterval(() => {
      if (typeof window !== "undefined") {
        const authStatus = localStorage.getItem("quantivahq_is_authenticated");
        setIsAuthenticated(authStatus === "true");
      }
    }, 30000);

    return () => clearInterval(authCheckInterval);
  }, []);

  // Track which section is in the middle band of the viewport
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleGoToDashboard = async () => {
    // Send authenticated users straight to the dashboard. The activation
    // widget on the dashboard surfaces any incomplete onboarding steps.
    try {
      await authService.getCurrentUser();
      const { navigateToDashboard } = await import("@/lib/auth/flow-router.service");
      await navigateToDashboard(router);
    } catch {
      router.push("/onboarding/sign-up?tab=login");
    }
  };

  const scrollToSection = (sectionId: string) => {
    scrollToId(sectionId, -88);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled ? "bg-black/60 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-all duration-500 ${
            isScrolled ? "h-16" : "h-20"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <QuantivaLogo
              className={`transition-all duration-500 group-hover:scale-[1.04] ${
                isScrolled ? "h-9 w-9" : "h-10 w-10 sm:h-12 sm:w-12"
              }`}
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold uppercase tracking-[0.15em] text-white sm:text-lg">
                QuantivaHQ
              </span>
              <span className="text-[10px] text-slate-400 transition-colors group-hover:text-slate-300 sm:text-xs">
                Trade with Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation — floating pill */}
          <nav
            className={`hidden items-center gap-1 rounded-full p-1 transition-all duration-500 md:flex ${
              isScrolled ? "border border-white/10 bg-white/[0.04] backdrop-blur-xl" : "border border-transparent"
            }`}
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 cursor-pointer ${
                  activeSection === link.id
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <button
                onClick={handleGoToDashboard}
                className="group relative cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.25)] transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.35)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Go to Dashboard
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            ) : (
              <>
                <Link
                  href="/onboarding/sign-up?tab=login"
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-300 hover:bg-white/5 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/onboarding/sign-up?tab=signup"
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.25)] transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.35)]"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="cursor-pointer rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Gradient hairline, only once scrolled */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent transition-opacity duration-500 ${
          isScrolled ? "opacity-60" : "opacity-0"
        }`}
      />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="border-t border-white/10 bg-black/95 backdrop-blur-xl md:hidden"
          >
            <nav className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link, i) => (
                <m.button
                  key={link.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 + i * 0.05, ease: "easeOut" }}
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </m.button>
              ))}
              <div className="space-y-3 border-t border-white/10 pt-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleGoToDashboard();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full cursor-pointer rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <Link
                      href="/onboarding/sign-up?tab=login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full rounded-full border border-white/15 px-6 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/5"
                    >
                      Login
                    </Link>
                    <Link
                      href="/onboarding/sign-up?tab=signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-2.5 text-center text-sm font-semibold text-white"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
