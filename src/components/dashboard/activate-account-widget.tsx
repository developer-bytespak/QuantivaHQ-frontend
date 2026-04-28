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
  { key: "kyc", label: "Identity (KYC)", href: `/onboarding/kyc-verification${RETURN_QUERY}` },
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

const CheckIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.085l6.79-6.794a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const LockIcon = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M10 1a4.5 4.5 0 00-4.5 4.5V8H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm2.5 7V5.5a2.5 2.5 0 00-5 0V8h5z"
      clipRule="evenodd"
    />
  </svg>
);

const WarningIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
    <path
      fillRule="evenodd"
      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
      clipRule="evenodd"
    />
  </svg>
);

const SpinnerIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const SparkleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

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
      <div className="px-6 pt-5">
        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/60 via-red-950/30 to-transparent p-5 sm:p-6 backdrop-blur">
          <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/15 ring-1 ring-red-500/40">
                <WarningIcon className="h-5 w-5 text-red-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Verification permanently rejected</h2>
                {reasonText && <p className="mt-1 text-sm text-red-200/80">{reasonText}</p>}
              </div>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-red-500 hover:shadow-red-900/50 sm:self-auto"
              >
                Delete my account
              </button>
            ) : (
              <div className="flex gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-100 transition-colors hover:bg-red-900/40 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/30 transition-all hover:bg-red-500 disabled:opacity-60"
                >
                  {deleteLoading ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            )}
          </div>
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
    // a fresh session on the same applicant.
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

  const isRetryVariant = kycState === "rejected_retry";

  const ctaLabel = isRetryVariant
    ? retryLoading
      ? "Preparing…"
      : "Retry verification"
    : "Continue setup";

  const subtext = isRetryVariant
    ? progress.kyc.rejection_reasons?.length
      ? progress.kyc.rejection_reasons.join(" ")
      : "Your verification failed. Please retry to continue."
    : kycState === "pending"
      ? "We're reviewing your documents. Other steps below are still available."
      : "Finish a few quick steps to unlock trading and your full dashboard.";

  const showSkipFreeCta =
    !progress.subscription.is_paid &&
    !progress.subscription.acknowledged &&
    progress.personal_info.complete &&
    progress.kyc.status === "approved";

  // Variant tokens — the RETRY state uses an orange/red accent; the normal
  // state uses the brand primary color. Defined as a small object so each
  // class string stays a static literal that Tailwind's compiler can pick up.
  const accent = isRetryVariant
    ? {
        cardBorder: "border-orange-500/30",
        cardBg: "from-orange-950/50 via-orange-950/20",
        glow: "bg-orange-500/10",
        iconBg: "bg-orange-500/15 ring-orange-500/40",
        iconColor: "text-orange-300",
        progressFill: "from-orange-500 to-amber-400",
        ctaBg: "bg-orange-500 hover:bg-orange-400",
        ctaShadow: "shadow-orange-900/30 hover:shadow-orange-900/50",
      }
    : {
        cardBorder: "border-[var(--primary)]/25",
        cardBg: "from-[var(--primary)]/[0.08] via-[var(--primary)]/[0.03]",
        glow: "bg-[var(--primary)]/15",
        iconBg: "bg-[var(--primary)]/15 ring-[var(--primary)]/40",
        iconColor: "text-[var(--primary-light)]",
        progressFill: "from-[var(--primary)] to-[var(--primary-light)]",
        ctaBg: "bg-[var(--primary)] hover:bg-[var(--primary-hover)]",
        ctaShadow: "shadow-[rgba(252,79,2,0.25)] hover:shadow-[rgba(252,79,2,0.4)]",
      };

  return (
    <div className="px-6 pt-5">
      <div
        className={`relative overflow-hidden rounded-2xl border ${accent.cardBorder} bg-gradient-to-br ${accent.cardBg} to-transparent p-5 sm:p-6 backdrop-blur shadow-[0_8px_30px_-10px_rgba(0,0,0,0.5)]`}
      >
        {/* Decorative accent glows */}
        <div className={`pointer-events-none absolute -top-32 -right-24 h-64 w-64 rounded-full ${accent.glow} blur-3xl`} />
        <div className={`pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full ${accent.glow} opacity-50 blur-3xl`} />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${accent.iconBg} ring-1`}
              >
                <SparkleIcon className={`h-5 w-5 ${accent.iconColor}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                  Activate your account
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{subtext}</p>
              </div>
            </div>
            <div className="hidden flex-shrink-0 text-right sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Progress
              </div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                <span className={accent.iconColor}>{completed}</span>
                <span className="text-slate-500"> / {TOTAL_STEPS}</span>
              </div>
            </div>
          </div>

          {/* Segmented progress bar */}
          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {STEPS.map((step) => {
              const done = isStepComplete(progress, step.key);
              return (
                <div
                  key={step.key}
                  className={`h-1.5 overflow-hidden rounded-full ${
                    done
                      ? `bg-gradient-to-r ${accent.progressFill}`
                      : "bg-white/[0.06]"
                  }`}
                />
              );
            })}
          </div>

          {/* Steps + actions */}
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STEPS.map((step, idx) => {
                const done = isStepComplete(progress, step.key);
                const locked = isStepLocked(progress, step.key);
                const kycPending = step.key === "kyc" && kycState === "pending";
                const kycRetry = step.key === "kyc" && kycState === "rejected_retry";
                const interactive = !done && !locked && !kycPending;

                let pillClass: string;
                let badgeClass: string;
                let labelClass: string;
                let badgeContent: React.ReactNode;

                if (done) {
                  pillClass =
                    "border-[var(--primary)]/40 bg-[var(--primary)]/10";
                  badgeClass = "bg-[var(--primary)] text-white";
                  labelClass = "text-white";
                  badgeContent = <CheckIcon />;
                } else if (kycRetry) {
                  pillClass =
                    "border-orange-400/40 bg-orange-500/10 hover:border-orange-400/70 hover:bg-orange-500/15";
                  badgeClass = "bg-orange-500/20 text-orange-300";
                  labelClass = "text-orange-200";
                  badgeContent = <WarningIcon className="h-3 w-3" />;
                } else if (kycPending) {
                  pillClass = "border-yellow-400/30 bg-yellow-500/[0.06]";
                  badgeClass = "bg-yellow-500/20 text-yellow-300";
                  labelClass = "text-yellow-100/90";
                  badgeContent = <SpinnerIcon className="h-3 w-3" />;
                } else if (locked) {
                  pillClass = "border-white/[0.06] bg-white/[0.02]";
                  badgeClass = "bg-white/5 text-slate-500";
                  labelClass = "text-slate-500";
                  badgeContent = <LockIcon className="h-3 w-3" />;
                } else {
                  pillClass =
                    "border-white/10 bg-white/[0.03] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/[0.06]";
                  badgeClass = "bg-white/[0.06] text-slate-300";
                  labelClass = "text-slate-200";
                  badgeContent = (
                    <span className="text-[10px] font-bold tabular-nums">{idx + 1}</span>
                  );
                }

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => handlePillClick(step)}
                    disabled={!interactive}
                    className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${pillClass} ${
                      interactive ? "cursor-pointer hover:-translate-y-px" : "cursor-default"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${badgeClass}`}
                      aria-hidden
                    >
                      {badgeContent}
                    </span>
                    <span className={`text-xs font-medium sm:text-sm ${labelClass}`}>
                      {step.label}
                    </span>
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
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-white/30 hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
                >
                  {skipLoading ? "Saving…" : "Stay on Free"}
                </button>
              )}
              {nextStep && (
                <button
                  type="button"
                  onClick={handleContinueSetup}
                  disabled={retryLoading}
                  className={`inline-flex items-center gap-1.5 rounded-lg ${accent.ctaBg} px-4 py-2 text-sm font-semibold text-white shadow-lg ${accent.ctaShadow} transition-all hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60`}
                >
                  <span>{ctaLabel}</span>
                  {!retryLoading && (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
