"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useKycStore from "@/state/kyc-store";
import { clearKycForRetry } from "@/lib/api/kyc";
import { deleteSelfAccount } from "@/lib/api/user";
import { authService } from "@/lib/auth/auth.service";

export function KycBanner() {
  const router = useRouter();
  const { status, reviewRejectType, rejectionReasons, fetchStatus, startPolling, stopPolling } =
    useKycStore();
  const [retryLoading, setRetryLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchStatus();
    startPolling(30000);
    return () => stopPolling();
  }, [fetchStatus, startPolling, stopPolling]);

  if (!status) return null;
  if (status === "approved") return null;

  const isFinal = status === "rejected" && reviewRejectType === "FINAL";
  const isRetry = status === "rejected" && reviewRejectType !== "FINAL";
  const reasonText =
    rejectionReasons && rejectionReasons.length > 0
      ? rejectionReasons.join(" ")
      : "";

  const handleRetry = async () => {
    setRetryLoading(true);
    try {
      await clearKycForRetry();
      router.push("/onboarding/kyc-verification");
    } catch (err) {
      console.error("Retry failed:", err);
      setRetryLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const result = await deleteSelfAccount("final_rejection");
      console.info("[KYC Banner] Delete response:", result);
      try {
        await authService.logout();
      } catch {}
      if (typeof window !== "undefined") {
        localStorage.removeItem("quantivahq_access_token");
        localStorage.removeItem("quantivahq_refresh_token");
        localStorage.removeItem("quantivahq_is_authenticated");
      }
      router.push("/");
    } catch (err: any) {
      console.error("[KYC Banner] Delete failed:", err);
      setDeleteLoading(false);
    }
  };

  // ── FINAL rejection (destructive, delete account) ──
  if (isFinal) {
    return (
      <div className="border-b border-red-500/40 bg-gradient-to-r from-red-950/70 to-red-900/60 px-6 py-3 text-sm text-red-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

  // ── RETRY rejection (action required) ──
  if (isRetry) {
    return (
      <div className="border-b border-orange-500/40 bg-gradient-to-r from-orange-950/60 to-red-950/50 px-6 py-3 text-sm text-orange-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-orange-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Your verification failed.</p>
              {reasonText && <p className="mt-1 text-orange-200/80 text-xs">{reasonText}</p>}
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={retryLoading}
            className="self-start sm:self-auto rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60"
          >
            {retryLoading ? "Preparing…" : "Retry Verification"}
          </button>
        </div>
      </div>
    );
  }

  // pending / review states are unreachable on the dashboard — flow-router
  // only lets approved users through. If the store ever sees one of these
  // (e.g. stale state from an earlier session), render nothing rather than
  // showing a misleading "in progress" banner.

  return null;
}
