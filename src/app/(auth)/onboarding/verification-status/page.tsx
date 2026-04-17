"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useEffect, useRef } from "react";
import { getKycStatus, clearKycForRetry } from "@/lib/api/kyc";
import { deleteSelfAccount } from "@/lib/api/user";
import { authService } from "@/lib/auth/auth.service";
import type { KycStatus } from "@/lib/api/types/kyc";

type VerificationStatus = KycStatus;

export default function VerificationStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const [kycData, setKycData] = useState<{
    kyc_id: string | null;
    decision_reason?: string;
    review_reject_type?: "RETRY" | "FINAL" | null;
    rejection_reasons?: string[];
  } | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);

  const isFinalRejection =
    status === "rejected" && kycData?.review_reject_type === "FINAL";
  const isRetryRejection =
    status === "rejected" && kycData?.review_reject_type !== "FINAL";
  const isOnHold = status === "review";

  const handleRetry = async () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setRetryError(null);
    setRetryLoading(true);
    try {
      await clearKycForRetry();
      router.push("/onboarding/kyc-verification");
    } catch (err: unknown) {
      console.error("Failed to reset KYC for retry:", err);
      setRetryError(
        err instanceof Error
          ? err.message
          : "Could not prepare retry. Please try again."
      );
    } finally {
      setRetryLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    try {
      await deleteSelfAccount("final_rejection");
      // Clear session (cookies/tokens) and go back to landing
      try {
        await authService.logout();
      } catch {
        // logout failure is non-fatal — account is already gone server-side
      }
      router.push("/");
    } catch (err: unknown) {
      console.error("Failed to delete account:", err);
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Could not delete your account. Please try again."
      );
      setDeleteLoading(false);
    }
  };

  const handleContinueOnHold = async () => {
    setContinueLoading(true);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    try {
      const { navigateToNextRoute } = await import(
        "@/lib/auth/flow-router.service"
      );
      await navigateToNextRoute(router);
    } catch (err) {
      console.error("Failed to continue from onHold:", err);
      setContinueLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await getKycStatus();
      setStatus(response.status);
      setKycData({
        kyc_id: response.kyc_id,
        decision_reason: response.decision_reason,
        review_reject_type: response.review_reject_type as
          | "RETRY"
          | "FINAL"
          | null
          | undefined,
        rejection_reasons: response.rejection_reasons,
      });

      if (response.status === "approved") {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setTimeout(async () => {
          const { navigateToNextRoute } = await import(
            "@/lib/auth/flow-router.service"
          );
          await navigateToNextRoute(router);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to fetch KYC status:", err);
    }
  };

  // Poll every 10 seconds while status is pending or review (onHold).
  // No max-attempts cap — users stay locked on this screen until Sumsub decides.
  useEffect(() => {
    checkStatus();
    pollingIntervalRef.current = setInterval(() => {
      checkStatus();
    }, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Stop polling once we hit a terminal state (approved or FINAL rejection).
  // For RETRY / onHold we keep polling so UI updates if user takes action elsewhere.
  useEffect(() => {
    if (status === "approved" || isFinalRejection) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [status, isFinalRejection]);

  const getStatusConfig = () => {
    switch (status) {
      case "approved":
        return {
          badge: "Verified",
          badgeColor: "bg-gradient-to-r from-[#10b981] to-[#34d399]",
          badgeText: "text-white",
          icon: (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          message: "Your identity has been successfully verified!",
          description: "You can now proceed to set up your trading account.",
          progress: 100,
          showStepper: true,
        };
      case "rejected": {
        if (isFinalRejection) {
          const reasons =
            kycData?.rejection_reasons && kycData.rejection_reasons.length > 0
              ? kycData.rejection_reasons
              : [
                  kycData?.decision_reason ||
                    "Your verification has been permanently rejected.",
                ];
          return {
            badge: "Permanently Rejected",
            badgeColor: "bg-gradient-to-r from-red-600 to-red-700",
            badgeText: "text-white",
            icon: (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ),
            message: "Your verification has been permanently rejected",
            description: reasons.join(" "),
            reasons,
            progress: null,
            showStepper: false,
          };
        }
        // RETRY rejection
        const reasons =
          kycData?.rejection_reasons && kycData.rejection_reasons.length > 0
            ? kycData.rejection_reasons
            : [
                "There was an issue with your documents or selfie. Please try again.",
              ];
        return {
          badge: "Resubmission Required",
          badgeColor: "bg-gradient-to-r from-yellow-500 to-yellow-600",
          badgeText: "text-white",
          icon: (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ),
          message: "Please resubmit your documents",
          description: reasons.join(" "),
          reasons,
          progress: 0,
          showStepper: true,
        };
      }
      case "review":
        return {
          badge: "Under Review",
          badgeColor: "bg-gradient-to-r from-blue-500 to-blue-600",
          badgeText: "text-white",
          icon: (
            <svg
              className="h-6 w-6 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ),
          message: "Your verification needs manual review",
          description:
            "Our verification team is reviewing your documents. This may take a few hours. You can continue setting up your account in the meantime — we'll email you as soon as the review is complete.",
          progress: 75,
          showStepper: true,
        };
      default:
        return {
          badge: "Pending",
          badgeColor: "bg-gradient-to-r from-yellow-500 to-yellow-600",
          badgeText: "text-white",
          icon: (
            <svg
              className="h-6 w-6 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ),
          message: "Verifying your documents...",
          description: "This usually takes less than 2 minutes.",
          progress: 50,
          showStepper: true,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[var(--primary)]/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[var(--primary)]/5 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/5 blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="mb-4 sm:mb-5 text-center">
            <div className="mb-2 flex justify-center animate-logo-enter">
              <QuantivaLogo className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12" />
            </div>
            <h1
              className="mb-1 text-lg sm:text-xl font-bold tracking-tight text-white md:text-2xl animate-text-enter"
              style={{ animationDelay: "0.2s" }}
            >
              Verification <span className="text-white">Status</span>
            </h1>
            <p
              className="mx-auto max-w-xl text-[10px] sm:text-xs text-slate-400 animate-text-enter"
              style={{ animationDelay: "0.4s" }}
            >
              Track your KYC verification progress
            </p>
          </div>

          {/* Status Card */}
          <div
            className="animate-text-enter"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="group relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 sm:p-5 backdrop-blur shadow-2xl shadow-blue-900/10 transition-all duration-300 hover:border-[var(--primary)]/30 hover:shadow-[var(--primary)]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary-light)]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10">
                {/* Status Badge */}
                <div className="mb-3 sm:mb-4 flex justify-center">
                  <div
                    className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full ${statusConfig.badgeColor} ${statusConfig.badgeText} px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg`}
                  >
                    {statusConfig.icon}
                    <span className="text-xs sm:text-sm font-semibold">
                      {statusConfig.badge}
                    </span>
                  </div>
                </div>

                {/* Status Message */}
                <div className="mb-3 sm:mb-4 text-center">
                  <h2 className="mb-1 text-sm sm:text-base md:text-lg font-semibold text-white">
                    {statusConfig.message}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {statusConfig.description}
                  </p>
                  {status === "rejected" &&
                    "reasons" in statusConfig &&
                    statusConfig.reasons &&
                    statusConfig.reasons.length > 1 && (
                      <ul className="mt-2 text-left text-[10px] sm:text-xs text-slate-400 list-disc list-inside space-y-1 max-w-md mx-auto">
                        {statusConfig.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  {kycData?.kyc_id && isFinalRejection && (
                    <p className="mt-3 text-[10px] text-slate-500">
                      Reference ID: {kycData.kyc_id}
                    </p>
                  )}
                </div>

                {/* Progress Bar (hidden for FINAL rejection) */}
                {statusConfig.progress !== null && (
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">
                        Progress
                      </span>
                      <span className="font-bold text-white">
                        {statusConfig.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] transition-all duration-500 ease-out shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] rounded-full"
                        style={{ width: `${statusConfig.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Status Steps (hidden for FINAL rejection) */}
                {statusConfig.showStepper && (
                  <div className="mb-3 sm:mb-4">
                    <div className="relative flex items-center justify-between">
                      {/* Progress line */}
                      <div className="absolute top-3.5 sm:top-4 left-0 right-0 h-0.5 bg-[--color-border] -z-10">
                        <div
                          className={`h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] transition-all duration-500 ${
                            status === "approved"
                              ? "w-full"
                              : status === "pending"
                                ? "w-0"
                                : "w-1/2"
                          }`}
                        />
                      </div>

                      {["Pending", "Reviewing", "Verified"].map(
                        (step, index) => {
                          const isActive =
                            status === "approved"
                              ? true
                              : status === "rejected"
                                ? index === 0
                                : status === "review"
                                  ? index <= 1
                                  : index === 0;
                          const isCompleted =
                            status === "approved" && index < 3;

                          return (
                            <div
                              key={step}
                              className="flex flex-col items-center flex-1 relative z-10"
                            >
                              <div
                                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                  isActive || isCompleted
                                    ? "border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-light)]/20"
                                    : "border-[--color-border] bg-[--color-surface]"
                                }`}
                              >
                                {isCompleted ? (
                                  <svg
                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--primary)]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                ) : (
                                  <div
                                    className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[var(--primary)]" : "bg-slate-500"}`}
                                  />
                                )}
                              </div>
                              <span
                                className={`mt-1.5 text-[10px] sm:text-xs font-medium ${isActive || isCompleted ? "text-white" : "text-slate-500"}`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {/* RETRY rejection */}
                  {isRetryRejection && (
                    <div className="flex-1 flex flex-col gap-2">
                      <button
                        onClick={handleRetry}
                        disabled={retryLoading}
                        className="group relative overflow-hidden w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.4)] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {retryLoading ? "Preparing…" : "Retry Verification"}
                        </span>
                      </button>
                      {retryError && (
                        <p className="text-xs text-red-400 text-center">
                          {retryError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* FINAL rejection → Delete Account */}
                  {isFinalRejection && !showDeleteConfirm && (
                    <div className="flex-1 flex flex-col gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                      >
                        Delete My Account
                      </button>
                      <p className="text-[10px] text-slate-500 text-center">
                        This decision is final. Your account cannot be recovered.
                      </p>
                    </div>
                  )}

                  {/* FINAL rejection → Delete confirmation */}
                  {isFinalRejection && showDeleteConfirm && (
                    <div className="flex-1 flex flex-col gap-2 border border-red-900/50 rounded-lg p-3 bg-red-950/30">
                      <p className="text-xs sm:text-sm text-red-200 text-center mb-1">
                        Are you sure? This will permanently delete your account and all your data.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={deleteLoading}
                          className="flex-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 border border-slate-600 hover:bg-slate-800/50 disabled:opacity-70"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-xs font-semibold text-white hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {deleteLoading ? "Deleting…" : "Yes, delete"}
                        </button>
                      </div>
                      {deleteError && (
                        <p className="text-[10px] text-red-400 text-center">
                          {deleteError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* onHold → Continue to choose-plan */}
                  {isOnHold && (
                    <button
                      onClick={handleContinueOnHold}
                      disabled={continueLoading}
                      className="group relative overflow-hidden flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {continueLoading ? "Continuing…" : "Continue Setup"}
                        <svg
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </span>
                    </button>
                  )}

                  {/* Approved → auto-redirects; show Continue button as fallback */}
                  {status === "approved" && (
                    <button
                      onClick={async () => {
                        const { navigateToNextRoute } = await import(
                          "@/lib/auth/flow-router.service"
                        );
                        await navigateToNextRoute(router);
                      }}
                      className="group relative overflow-hidden flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Continue
                        <svg
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
