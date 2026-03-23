"use client";

/**
 * @deprecated This page is no longer used. KYC verification is now handled
 * by the SumSub Web SDK at /onboarding/kyc-verification.
 * This redirect stub exists for backward compatibility with bookmarked URLs.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SelfieCapturePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/onboarding/kyc-verification");
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <p className="text-sm text-slate-400">Redirecting to verification...</p>
    </div>
  );
}
