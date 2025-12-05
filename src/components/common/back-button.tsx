"use client";

import { useRouter, usePathname } from "next/navigation";

const ONBOARDING_PAGES = [
  "/onboarding/account-type",
  "/onboarding/crypto-exchange",
  "/onboarding/api-key-tutorial",
  "/onboarding/api-keys",
  "/onboarding/connecting",
  "/onboarding/sign-up",
  "/onboarding/personal-info",
  "/onboarding/proof-upload",
  "/onboarding/selfie-capture",
  "/onboarding/verification-status",
  "/onboarding/experience",
  "/onboarding/api-setup",
];

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    let prevPage = "";

    // Handle branched navigation
    if (pathname === "/onboarding/sign-up" || pathname.startsWith("/onboarding/sign-up")) {
      prevPage = "/";
    } else if (pathname === "/onboarding/stock-exchange") {
      prevPage = "/onboarding/account-type";
    } else if (pathname === "/onboarding/crypto-exchange") {
      prevPage = "/onboarding/account-type";
    } else if (pathname === "/onboarding/api-key-tutorial") {
      // Check account type and selected exchange to determine previous page
      const accountType = localStorage.getItem("quantivahq_account_type");
      const selectedExchange = localStorage.getItem("quantivahq_selected_exchange");
      
      if (accountType === "stocks" || selectedExchange === "ibkr") {
        // If stocks account type or IBKR exchange, go back to stock exchange page
        prevPage = "/onboarding/stock-exchange";
      } else if (accountType === "both") {
        // If "both" account type and crypto exchange, go back to crypto exchange page
        prevPage = "/onboarding/crypto-exchange";
      } else {
        // Default: crypto exchange
        prevPage = "/onboarding/crypto-exchange";
      }
    } else {
      // Default linear navigation
      const currentIndex = ONBOARDING_PAGES.findIndex((page) => pathname === page || pathname.startsWith(page + "/"));

      if (currentIndex <= 0) {
        prevPage = "/onboarding/account-type";
      } else {
        prevPage = ONBOARDING_PAGES[currentIndex - 1];
      }
    }

    router.push(prevPage);
  };

  // Don't show back button on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <button
      onClick={handleBack}
      className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl border-2 border-[#fc4f02] bg-black px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition-all duration-300 hover:border-[#fda300] hover:bg-[#1a1a1a] hover:shadow-lg hover:shadow-[#fc4f02]/30"
      aria-label="Go back"
    >
      <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back</span>
    </button>
  );
}

