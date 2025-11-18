"use client";

import { useRouter, usePathname } from "next/navigation";

const ONBOARDING_PAGES = [
  "/onboarding/welcome",
  "/onboarding/region",
  "/onboarding/risk-disclosure",
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

  const getPreviousPage = () => {
    const currentIndex = ONBOARDING_PAGES.findIndex((page) => pathname === page || pathname.startsWith(page + "/"));
    
    if (currentIndex <= 0) {
      // If on first page or not found, go to welcome
      return "/onboarding/welcome";
    }
    
    return ONBOARDING_PAGES[currentIndex - 1];
  };

  const handleBack = () => {
    router.push(getPreviousPage());
  };

  // Don't show back button on welcome page
  if (pathname === "/onboarding/welcome" || pathname === "/") {
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

