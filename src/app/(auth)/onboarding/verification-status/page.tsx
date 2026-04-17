"use client";

import { useRouter } from "next/navigation";
import { QuantivaLogo } from "@/components/common/quantiva-logo";
import { useState, useEffect, useRef } from "react";
import { getKycStatus } from "@/lib/api/kyc";
import { deleteSelfAccount } from "@/lib/api/user";
import { authService } from "@/lib/auth/auth.service";

/**
 * Verification Status page
 *
 * This page now serves a single purpose: the FINAL rejection screen (Delete
 * Account UI). Every other KYC state is handled elsewhere:
 *   - pending / review / RETRY / verifying → stays inside the Sumsub SDK
 *   - approved / onHold → shown inline on /onboarding/kyc-verification with
 *     a Continue button
 *
 * Users who land here with any other status are redirected back to the SDK
 * page by the first /kyc/status check.
 */
export default function VerificationStatusPage() {
  const router = useRouter();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [kycData, setKycData] = useState<{
    kyc_id: string | null;
    rejection_reasons?: string[];
    decision_reason?: string;
  } | null>(null);
  const didRedirectRef = useRef(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const result = await deleteSelfAccount("final_rejection");
      console.info("[verification-status] Delete response:", result);
      try {
        await authService.logout();
      } catch {
        // logout failure is non-fatal — account is gone server-side
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("quantivahq_access_token");
        localStorage.removeItem("quantivahq_refresh_token");
        localStorage.removeItem("quantivahq_is_authenticated");
      }
      router.push("/");
    } catch (err: any) {
      console.error("[verification-status] Delete failed:", err);
      const msg = err?.response?.data?.message || err?.message || "Unknown error";
      setDeleteError(`Could not delete your account: ${msg}`);
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    // Guard re-entry: we only want to perform the check/redirect once.
    if (didRedirectRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await getKycStatus();
        if (cancelled) return;

        const isFinalRejection =
          response.status === "rejected" &&
          response.review_reject_type === "FINAL";

        if (!isFinalRejection) {
          didRedirectRef.current = true;
          router.replace("/onboarding/kyc-verification");
          return;
        }

        setKycData({
          kyc_id: response.kyc_id,
          rejection_reasons: response.rejection_reasons,
          decision_reason: response.decision_reason,
        });
        setInitialCheckDone(true);
      } catch (err) {
        console.error("[verification-status] Failed to fetch KYC status:", err);
        // On fetch error, send them back to the SDK page rather than rendering
        // a broken screen.
        didRedirectRef.current = true;
        router.replace("/onboarding/kyc-verification");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Neutral loader until the first /kyc/status call resolves.
  if (!initialCheckDone) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 mx-auto animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
          <p className="text-sm text-slate-400">Checking verification status...</p>
        </div>
      </div>
    );
  }

  const reasons =
    kycData?.rejection_reasons && kycData.rejection_reasons.length > 0
      ? kycData.rejection_reasons
      : [
          kycData?.decision_reason ||
            "Your verification has been permanently rejected.",
        ];

  return (
    <div className="relative flex h-full w-full overflow-hidden">
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

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <div className="w-full max-w-2xl">
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
          </div>

          <div className="animate-text-enter" style={{ animationDelay: "0.6s" }}>
            <div className="relative rounded-xl sm:rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 sm:p-5 backdrop-blur shadow-2xl shadow-red-900/10">
              {/* Rejection badge */}
              <div className="mb-3 sm:mb-4 flex justify-center">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 shadow-lg">
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
                  <span className="text-xs sm:text-sm font-semibold">
                    Permanently Rejected
                  </span>
                </div>
              </div>

              {/* Message */}
              <div className="mb-3 sm:mb-4 text-center">
                <h2 className="mb-1 text-sm sm:text-base md:text-lg font-semibold text-white">
                  Your verification has been permanently rejected
                </h2>
                {reasons.length === 1 ? (
                  <p className="text-[10px] sm:text-xs text-slate-400">
                    {reasons[0]}
                  </p>
                ) : (
                  <ul className="mt-2 text-left text-[10px] sm:text-xs text-slate-400 list-disc list-inside space-y-1 max-w-md mx-auto">
                    {reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
                {kycData?.kyc_id && (
                  <p className="mt-3 text-[10px] text-slate-500">
                    Reference ID: {kycData.kyc_id}
                  </p>
                )}
              </div>

              {/* Delete Account */}
              {!showDeleteConfirm ? (
                <div className="flex flex-col gap-2">
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
              ) : (
                <div className="flex flex-col gap-2 border border-red-900/50 rounded-lg p-3 bg-red-950/30">
                  <p className="text-xs sm:text-sm text-red-200 text-center mb-1">
                    Are you sure? This will permanently delete your account and
                    all your data.
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
