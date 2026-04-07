"use client";

import Link from "next/link";

export function HomepageFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative border-t border-[--color-border] bg-gradient-to-b from-[--color-surface-alt] to-[--color-surface-alt] py-10 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand Column */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">QuantivaHQ</h3>
              <p className="text-xs sm:text-sm text-white font-semibold">
                Trade with Intelligence. Automate with Confidence.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-4 justify-center sm:justify-start">
              <a
                href="https://www.instagram.com/quantivahq/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg border border-[--color-border] bg-[--color-surface] text-slate-400 hover:text-white hover:border-[var(--primary)]/50 hover:bg-[--color-surface-alt] transition-all cursor-pointer"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/people/Quantivahq/61585587477058/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg border border-[--color-border] bg-[--color-surface] text-slate-400 hover:text-white hover:border-[var(--primary)]/50 hover:bg-[--color-surface-alt] transition-all cursor-pointer"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Add navigation logic here when About Us page is ready
                  }}
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-center sm:text-left">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-center sm:text-left">
            <h4 className="text-xs sm:text-sm font-bold text-white mb-3 sm:mb-4">Support</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  href="/faq"
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("contact");
                  }}
                  className="text-xs sm:text-sm text-slate-400 font-bold hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[--color-border] pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-white font-semibold text-center sm:text-left">
            © {new Date().getFullYear()} QuantivaHQ. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="text-xs sm:text-sm text-white font-semibold hover:text-[var(--primary)] transition-colors flex items-center gap-2 cursor-pointer"
          >
            Back to top
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}

