"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { authService } from "@/lib/auth/auth.service";

export function HomepageHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountType, setAccountType] = useState<"crypto" | "stocks" | "both" | null>(null);
  const lastScrollY = useRef(0);

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
          } catch (err) {
            // Server says not authenticated, clear localStorage
            localStorage.removeItem("quantivahq_is_authenticated");
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
        
        const savedAccountType = localStorage.getItem("quantivahq_account_type");
        if (savedAccountType === "crypto" || savedAccountType === "stocks" || savedAccountType === "both") {
          setAccountType(savedAccountType);
        }
      } catch (err) {
        console.warn("Error checking auth status:", err);
        setIsAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    checkAuthStatus();
    lastScrollY.current = window.scrollY;

    // Handle scroll effect
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setIsScrollingDown(false);
      }
      
      setIsScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    // Also refresh auth status periodically to catch logout from other tabs
    const authCheckInterval = setInterval(checkAuthStatus, 5000);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(authCheckInterval);
    };
  }, []);

  const handleGoToDashboard = async () => {
    // Check if user has active session before redirecting
    try {
      await authService.getCurrentUser();
      
      // User has active session, proceed with redirect
      // Use sessionStorage for UI state flags (cleared on browser close, more secure)
      if (accountType === "stocks" || (accountType === "both" && sessionStorage.getItem("quantivahq_stocks_connected") === "true")) {
        router.push("/stocks-dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      // No active session, redirect to login
      router.push("/onboarding/sign-up?tab=login");
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled
          ? "bg-black/80 backdrop-blur-md border-b border-[--color-border] shadow-lg"
          : "bg-black/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <QuantivaLogo className="h-10 w-10 sm:h-12 sm:w-12 transition-transform duration-300 group-hover:scale-105" />
            <div className="flex flex-col leading-tight">
              <span className="text-base sm:text-lg font-bold uppercase tracking-[0.15em] text-white">
                QuantivaHQ
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                Trade with Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={handleGoToDashboard}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 cursor-pointer"
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
                  className="group rounded-xl border-2 border-white bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-gradient-to-r from-[#fc4f02] to-[#fda300] hover:border-none hover:scale-105 cursor-pointer"
                >
                  <span className="text-white group-hover:text-black">Login</span>
                </Link>
                <Link
                  href="/onboarding/sign-up?tab=signup"
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40 cursor-pointer"
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
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-[--color-surface] transition-colors cursor-pointer"
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

      {/* Yellowish-orange horizontal line at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#fc4f02] via-[#fda300] to-[#fc4f02]"></div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[--color-border] bg-black/95 backdrop-blur-md">
          <nav className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="block w-full text-left text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="block w-full text-left text-sm font-medium text-slate-300 hover:text-white transition-colors py-2 cursor-pointer"
            >
              Contact
            </button>
            <div className="pt-4 border-t border-[--color-border] space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleGoToDashboard();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white text-center cursor-pointer"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link
                    href="/onboarding/sign-up?tab=login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white text-center cursor-pointer"
                  >
                    Login
                  </Link>
                  <Link
                    href="/onboarding/sign-up?tab=signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-6 py-2.5 text-sm font-semibold text-white text-center cursor-pointer"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

