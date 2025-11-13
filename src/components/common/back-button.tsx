"use client";

import { useRouter, usePathname } from "next/navigation";

const ONBOARDING_PAGES = [
  "/onboarding/welcome",
  "/onboarding/region",
  "/onboarding/risk-disclosure",
  "/onboarding/account-type",
  "/onboarding/sign-up",
  "/onboarding/personal-info",
  "/onboarding/proof-upload",
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
      className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl border border-[--color-border] bg-[--color-surface-alt]/80 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition-all duration-300 hover:border-[#FF6B35]/50 hover:bg-[--color-surface-alt] hover:shadow-lg hover:shadow-[#FF6B35]/10"
      aria-label="Go back"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back</span>
    </button>
  );
}

