"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useEffect, useCallback } from "react";
import { getSdkToken, getKycStatus } from "@/lib/api/kyc";
import { getCurrentUser } from "@/lib/api/user";
import dynamic from "next/dynamic";

const SumsubWebSdk = dynamic(() => import("@sumsub/websdk-react"), {
  ssr: false,
});

export default function KycVerificationPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // `showContinue` flips true ONLY when Sumsub returns GREEN (approved).
  // For every other state (onHold, pending, RETRY, verifying) the user
  // stays inside the Sumsub SDK — no "continue anyway" escape hatch.
  // Only a fully approved KYC unlocks the rest of onboarding.
  const [showContinue, setShowContinue] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) return;

        let kycStatus = currentUser.kyc_status;
        if (kycStatus !== "approved") {
          try {
            const kycResponse = await getKycStatus();
            kycStatus = kycResponse.status;
          } catch {
            // fall through
          }
        }

        if (kycStatus === "approved" && isMounted) {
          const { navigateToNextRoute } = await import(
            "@/lib/auth/flow-router.service"
          );
          await navigateToNextRoute(router);
          return;
        }

        if (
          (kycStatus === "pending" || kycStatus === "review") &&
          isMounted
        ) {
          // Already submitted -- check if it's a fresh "pending" with no sumsub submission yet
          // If the backend has a sumsub_review_status it means docs were already sent
          try {
            const detailed = await getKycStatus();
            if (detailed.decision_reason?.includes("Sumsub")) {
              router.push("/onboarding/verification-status");
              return;
            }
          } catch {
            // fall through - let SDK load
          }
        }

        const response = await getSdkToken();
        if (isMounted) {
          setAccessToken(response.token);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (
          err?.status === 401 ||
          err?.statusCode === 401 ||
          err?.message?.includes("401")
        ) {
          router.push("/onboarding/sign-up?tab=login");
          return;
        }
        setError(
          err?.message || "Failed to initialize verification. Please try again."
        );
        setIsLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleAccessTokenExpiration = useCallback(async () => {
    try {
      const response = await getSdkToken();
      return response.token;
    } catch {
      setError("Session expired. Please refresh the page.");
      return "";
    }
  }, []);

  const handleMessage = useCallback(
    (type: string, payload: any) => {
      console.info("[kyc-verification] SDK event:", type, payload);

      // NOTE: We intentionally do NOT navigate on `onApplicantSubmitted` any
      // more — Sumsub's SDK shows its own processing/waiting UI (spinner +
      // "submission received" screen) that is strictly better than anything
      // we'd render. We stay inside the SDK and only leave once there's a
      // real outcome (reviewAnswer GREEN/RED) or the user is sent to manual
      // review (onHold).

      if (
        type === "idCheck.onApplicantStatusChanged" ||
        type === "idCheck.onApplicantReviewed" ||
        type === "idCheck.onApplicantLoaded" ||
        type === "idCheck.onActionSubmitted" ||
        type === "idCheck.onStepCompleted"
      ) {
        const reviewAnswer = payload?.reviewResult?.reviewAnswer;
        const reviewStatus =
          payload?.reviewStatus || payload?.reviewResult?.reviewStatus;
        const rejectType = payload?.reviewResult?.reviewRejectType;

        // Strict policy: ONLY a fully-approved KYC (GREEN) unlocks the rest
        // of onboarding. Our own code takes over in exactly two places:
        //   • FINAL rejection → /verification-status (Delete Account UI —
        //                       Sumsub can't trigger account deletion on
        //                       our platform).
        //   • GREEN (approved) → show Continue button below the SDK so the
        //                        user proceeds to subscription.
        // Every other state (pending, review/onHold, RETRY, "verifying")
        // stays inside the Sumsub SDK — there is no "continue anyway"
        // escape hatch.
        const isFinalised = reviewStatus === "completed";
        const isPrecheckedGreen =
          reviewStatus === "prechecked" && reviewAnswer === "GREEN";

        // GREEN (approved) — show in-page Continue button below the SDK.
        if (isPrecheckedGreen || (isFinalised && reviewAnswer === "GREEN")) {
          setShowContinue(true);
          return;
        }

        // FINAL rejection — Delete Account UI at /verification-status.
        if (
          isFinalised &&
          ((reviewAnswer === "RED" && rejectType === "FINAL") ||
            rejectType === "FINAL")
        ) {
          router.push("/onboarding/verification-status");
          return;
        }

        // Everything else (onHold, RETRY, prechecked RED, "verifying" etc.)
        // stays inside the Sumsub SDK. No Continue button, no escape hatch.
        // Only a fully-approved KYC unlocks the rest of onboarding.
      }
    },
    [router]
  );

  const handleError = useCallback(
    (error: any) => {
      console.error("SumSub SDK error:", error);
      // Duplicate applicant / document-already-submitted errors — Sumsub tries
      // to show its own hosted page. Intercept and send the user to our own
      // verification-status screen so the rejection UX stays in-app.
      const errorCode = String(error?.code || error?.type || "").toLowerCase();
      const errorMessage = String(error?.message || error?.reason || "").toLowerCase();
      const isDuplicate =
        errorCode.includes("duplicate") ||
        errorCode.includes("already") ||
        errorMessage.includes("another profile") ||
        errorMessage.includes("already submitted") ||
        errorMessage.includes("duplicate");
      if (isDuplicate) {
        router.push("/onboarding/verification-status");
      }
    },
    [router]
  );

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[var(--primary)]/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[var(--primary)]/5 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center overflow-y-auto px-3 pt-3 pb-4 sm:px-4 sm:pt-4 sm:pb-6 md:px-6 md:pt-6 md:pb-8 lg:px-8">
        <div className="w-full max-w-3xl flex flex-col flex-1 min-h-0 py-4">
          {/* Header */}
          <div className="mb-4 sm:mb-5 flex-shrink-0 text-center">
            <div className="mb-1.5 sm:mb-2 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14" />
            </div>
            <h1
              className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl lg:text-3xl animate-text-enter"
              style={{ animationDelay: "0.2s" }}
            >
              Identity <span className="text-white">Verification</span>
            </h1>
            <p
              className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 md:text-sm animate-text-enter"
              style={{ animationDelay: "0.4s" }}
            >
              Complete the verification steps below to verify your identity.
              Upload your document and take a selfie when prompted.
            </p>
          </div>

          {/* SDK Container */}
          <div
            className="flex-1 min-h-0 animate-text-enter"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="group relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-3 sm:p-4 md:p-6 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[var(--primary)]/30 hover:shadow-[rgba(var(--primary-rgb),0.1)]">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary-light)]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl sm:rounded-2xl" />

              <div className="relative z-10">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <svg
                      className="h-10 w-10 text-[var(--primary)] animate-spin mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-sm text-slate-400">
                      Preparing verification...
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/20">
                      <svg
                        className="h-7 w-7 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-red-400 mb-4 text-center max-w-md">
                      {error}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {accessToken && !error && (
                  <div className="min-h-[500px]">
                    <SumsubWebSdk
                      accessToken={accessToken}
                      expirationHandler={handleAccessTokenExpiration}
                      config={{
                        lang: "en",
                        theme: "dark",
                      }}
                      options={{
                        addViewportTag: false,
                        adaptIframeHeight: true,
                      }}
                      onMessage={handleMessage}
                      onError={handleError}
                    />
                  </div>
                )}

                {/* Continue button appears ONLY when Sumsub returns GREEN
                    (approved). No longWait / onHold escape hatch — the user
                    stays in the SDK until they're fully verified. */}
                {showContinue && !error && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <button
                      onClick={async () => {
                        setContinueLoading(true);
                        try {
                          const { navigateToNextRoute } = await import(
                            "@/lib/auth/flow-router.service"
                          );
                          await navigateToNextRoute(router);
                        } catch {
                          router.push("/onboarding/choose-plan");
                        }
                      }}
                      disabled={continueLoading}
                      className="rounded-lg sm:rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {continueLoading ? "Continuing…" : "Continue to Subscription"}
                    </button>
                    <p className="text-[10px] text-slate-500 text-center max-w-md">
                      Your identity has been verified.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center flex-shrink-0">
            <p className="text-xs text-slate-400">
              Your documents are encrypted and securely processed by SumSub
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
