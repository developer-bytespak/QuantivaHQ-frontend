"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useOnboardingProgressStore, {
  completedStepCount,
  isFullyOnboarded,
} from "@/state/onboarding-progress-store";
import {
  getNextOnboardingStepRoute,
  type OnboardingProgressShape,
} from "@/lib/auth/flow-router.service";
import { acknowledgeFreeTier } from "@/lib/api/onboarding";
import { clearKycForRetry } from "@/lib/api/kyc";
import { deleteSelfAccount } from "@/lib/api/user";
import { authService } from "@/lib/auth/auth.service";

const RETURN_QUERY = "?return=%2Fdashboard";
const TOTAL_STEPS = 4;

type StepKey = "personal_info" | "kyc" | "subscription" | "exchange";

type StepDescriptor = {
  key: StepKey;
  label: string;
  href: string;
};

const STEPS: StepDescriptor[] = [
  { key: "personal_info", label: "Personal info", href: `/onboarding/personal-info${RETURN_QUERY}` },
  { key: "kyc", label: "KYC", href: `/onboarding/kyc-verification${RETURN_QUERY}` },
  { key: "subscription", label: "Subscription", href: `/onboarding/choose-plan${RETURN_QUERY}` },
  { key: "exchange", label: "Exchange", href: `/onboarding/account-type${RETURN_QUERY}` },
];

function isStepComplete(p: OnboardingProgressShape, key: StepKey): boolean {
  switch (key) {
    case "personal_info":
      return p.personal_info.complete;
    case "kyc":
      return p.kyc.status === "approved";
    case "subscription":
      return p.subscription.is_paid || p.subscription.acknowledged;
    case "exchange":
      return p.exchange.connected;
  }
}

function isStepLocked(p: OnboardingProgressShape, key: StepKey): boolean {
  // Exchange wiring is gated by KYC at the backend (KycVerifiedGuard on
  // POST /exchanges/connections), so we lock the pill until KYC clears
  // rather than letting users hit a 403.
  if (key === "exchange" && p.kyc.status !== "approved") return true;
  return false;
}

function kycPillState(
  p: OnboardingProgressShape,
): "complete" | "pending" | "rejected_retry" | "rejected_final" | "incomplete" {
  if (p.kyc.status === "approved") return "complete";
  if (p.kyc.status === "rejected" && p.kyc.review_reject_type === "FINAL")
    return "rejected_final";
  if (p.kyc.status === "rejected") return "rejected_retry";
  if (p.kyc.status === "review" || (p.kyc.status === "pending" && p.kyc.has_submission))
    return "pending";
  return "incomplete";
}

export function ActivateAccountWidget() {
  const router = useRouter();
  const { progress, fetchProgress, startPolling, stopPolling, reset } =
    useOnboardingProgressStore();
  const [retryLoading, setRetryLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Clear any progress cached from a previous session before fetching, so
    // the next user briefly never sees the previous user's state. Zustand
    // stores persist across mount/unmount, so without this an old progress
    // object would render for one round-trip after re-login.
    reset();
    fetchProgress();
    startPolling(30000);
    return () => stopPolling();
  }, [reset, fetchProgress, startPolling, stopPolling]);

  const completed = useMemo(
    () => (progress ? completedStepCount(progress) : 0),
    [progress],
  );
  const nextStep = useMemo(
    () => (progress ? getNextOnboardingStepRoute(progress) : null),
    [progress],
  );

  if (!progress) return null;
  if (isFullyOnboarded(progress)) return null;

  const kycState = kycPillState(progress);

  // Hard-stop variant: KYC permanently rejected. The user can't move forward
  // anywhere, so show the destructive delete-account UX exclusively.
  if (kycState === "rejected_final") {
    const reasonText = progress.kyc.rejection_reasons?.join(" ") ?? "";
    const handleDelete = async () => {
      setDeleteLoading(true);
      try {
        await deleteSelfAccount("final_rejection");
        try {
          await authService.logout();
        } catch {}
        if (typeof window !== "undefined") {
          localStorage.removeItem("quantivahq_access_token");
          localStorage.removeItem("quantivahq_refresh_token");
          localStorage.removeItem("quantivahq_is_authenticated");
        }
        router.push("/");
      } catch (err) {
        console.error("[ActivateAccountWidget] Delete failed:", err);
        setDeleteLoading(false);
      }
    };
    return (
      <div className="border-b border-red-500/40 bg-gradient-to-r from-red-950/70 to-red-900/60 px-6 py-4 text-sm text-red-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div>
              <p className="font-semibold">Your verification has been permanently rejected.</p>
              {reasonText && <p className="mt-1 text-red-200/80 text-xs">{reasonText}</p>}
            </div>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="self-start sm:self-auto rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <div className="flex gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-100 hover:bg-red-900/40 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-700 hover:bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handlePillClick = async (step: StepDescriptor) => {
    if (isStepComplete(progress, step.key)) return;
    if (isStepLocked(progress, step.key)) return;
    if (step.key === "kyc" && kycState === "pending") return;
    // RETRY-rejected KYC needs the applicant cleared on the backend before
    // we send the user back into the SDK — otherwise Sumsub refuses to open
    // a fresh session on the same applicant. Mirrors what the old kyc-banner
    // did via clearKycForRetry().
    if (step.key === "kyc" && kycState === "rejected_retry") {
      setRetryLoading(true);
      try {
        await clearKycForRetry();
        router.push(step.href);
      } catch (err) {
        console.error("[ActivateAccountWidget] Retry prep failed:", err);
        setRetryLoading(false);
      }
      return;
    }
    router.push(step.href);
  };

  const handleContinueSetup = async () => {
    if (kycState === "rejected_retry") {
      setRetryLoading(true);
      try {
        await clearKycForRetry();
        router.push(`/onboarding/kyc-verification${RETURN_QUERY}`);
      } catch (err) {
        console.error("[ActivateAccountWidget] Retry prep failed:", err);
        setRetryLoading(false);
      }
      return;
    }
    if (nextStep) {
      const sep = nextStep.includes("?") ? "&" : "?";
      router.push(`${nextStep}${sep}return=%2Fdashboard`);
    }
  };

  const handleSkipFreeTier = async () => {
    setSkipLoading(true);
    try {
      await acknowledgeFreeTier();
      await fetchProgress();
    } catch (err) {
      console.error("[ActivateAccountWidget] Skip-as-free failed:", err);
    } finally {
      setSkipLoading(false);
    }
  };

  const ctaLabel =
    kycState === "rejected_retry"
      ? retryLoading
        ? "Preparing…"
        : "Retry verification"
      : "Continue setup";

  const subtext =
    kycState === "rejected_retry"
      ? progress.kyc.rejection_reasons?.length
        ? progress.kyc.rejection_reasons.join(" ")
        : "Your verification failed. Please retry to continue."
      : kycState === "pending"
        ? "We're reviewing your documents. The other steps below are still available."
        : "Finish a few quick steps to unlock trading and your full dashboard.";

  const showSkipFreeCta =
    !progress.subscription.is_paid &&
    !progress.subscription.acknowledged &&
    progress.personal_info.complete &&
    progress.kyc.status === "approved";

  const containerClass =
    kycState === "rejected_retry"
      ? "border-b border-orange-500/40 bg-gradient-to-r from-orange-950/60 to-red-950/50 text-orange-100"
      : "border-b border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary)]/10 via-[var(--primary)]/5 to-transparent text-[--color-foreground]";

  return (
    <div className={`${containerClass} px-6 py-4 text-sm`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Activate your account</h2>
            <p className="mt-0.5 text-xs text-[--color-foreground]/60">{subtext}</p>
          </div>
          <span className="text-xs font-medium tabular-nums text-[--color-foreground]/60">
            {completed} of {TOTAL_STEPS} complete
          </span>
        </div>

        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          {STEPS.map((step) => {
            const done = isStepComplete(progress, step.key);
            return (
              <div
                key={step.key}
                className={`flex-1 ${done ? "bg-[var(--primary)]" : "bg-transparent"} ${
                  step === STEPS[STEPS.length - 1] ? "" : "border-r border-white/10"
                }`}
              />
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step) => {
              const done = isStepComplete(progress, step.key);
              const locked = isStepLocked(progress, step.key);
              const kycPending = step.key === "kyc" && kycState === "pending";
              const kycRetry = step.key === "kyc" && kycState === "rejected_retry";
              const interactive = !done && !locked && !kycPending;

              const colorClass = done
                ? "border-[var(--primary)]/60 bg-[var(--primary)]/15 text-[var(--primary)]"
                : kycRetry
                  ? "border-orange-400/50 bg-orange-500/15 text-orange-200"
                  : kycPending
                    ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-200/90"
                    : locked
                      ? "border-white/10 bg-white/5 text-[--color-foreground]/40"
                      : "border-white/15 bg-white/5 text-[--color-foreground]/80 hover:border-[var(--primary)]/40 hover:text-[--color-foreground]";

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => handlePillClick(step)}
                  disabled={!interactive}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${colorClass} ${
                    interactive ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span aria-hidden>
                    {done ? "✓" : kycRetry ? "!" : kycPending ? "…" : locked ? "🔒" : "○"}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showSkipFreeCta && (
              <button
                type="button"
                onClick={handleSkipFreeTier}
                disabled={skipLoading}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-[--color-foreground]/80 hover:border-white/40 hover:text-white disabled:opacity-60"
              >
                {skipLoading ? "Saving…" : "Stay on Free"}
              </button>
            )}
            {nextStep && (
              <button
                type="button"
                onClick={handleContinueSetup}
                disabled={retryLoading}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {ctaLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
