"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getMyPaymentSubmissions,
  type MyPaymentSubmission,
  type PaymentStatus,
} from "@/lib/api/vc-pools";
import { getApiErrorMessage } from "@/lib/utils/errors";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    processing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    verified: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    refunded: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[status] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"
      }`}
    >
      {status}
    </span>
  );
}

function PaymentStatusIndicator({ status }: { status: PaymentStatus }) {
  if (status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        <span className="text-xs text-yellow-300">Awaiting approval…</span>
      </div>
    );
  }
  if (status === "verified") {
    return (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs text-green-300">Verified</span>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-xs text-red-300">Rejected</span>
      </div>
    );
  }
  if (status === "refunded") {
    return (
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-blue-300">Refunded</span>
      </div>
    );
  }
  return null;
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const [submissions, setSubmissions] = useState<MyPaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = () => {
    if (!canAccessVCPool) return;
    setLoading(true);
    setError(null);
    getMyPaymentSubmissions()
      .then(setSubmissions)
      .catch((err: unknown) =>
        setError(getApiErrorMessage(err, "Failed to load submissions"))
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canAccessVCPool) {
      setLoading(false);
      return;
    }
    fetchSubmissions();
  }, [canAccessVCPool]);

  return (
    <div className="min-h-screen bg-[--color-surface] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {!canAccessVCPool && (
          <LockedFeatureOverlay
            featureName="VC Pool Access"
            requiredTier={PlanTier.ELITE}
            message="Payment submissions are available only for ELITE members."
          />
        )}

        <Link
          href="/dashboard/vc-pool"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[var(--primary-light)] transition-colors group"
        >
          <svg className="w-4 h-4 text-[var(--primary)] group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-white/90 group-hover:text-[var(--primary-light)]">Back to VC pools</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Payment Submissions</h1>
            <p className="text-sm text-slate-400">
              Track all your Binance P2P payment submissions and verification status.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSubmissions}
            disabled={loading}
            className="rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/vc-pool/transactions")}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Transaction history
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => { setError(null); fetchSubmissions(); }}
              className="shrink-0 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
            <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No payment submissions yet.</p>
            <Link href="/dashboard/vc-pool" className="mt-4 inline-block text-[var(--primary)] hover:underline font-medium">
              Browse available pools
            </Link>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.submission_id}
                className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 hover:border-[var(--primary)]/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{sub.pool_name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Submitted {new Date(sub.submitted_at).toLocaleString()}
                      {sub.payment_deadline && (
                        <> · Deadline {new Date(sub.payment_deadline).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={sub.status} />
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/vc-pool/${sub.pool_id}`)}
                      className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      View pool
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">Total amount</p>
                    <p className="font-semibold text-white font-mono">{sub.total_amount} {sub.coin_type}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Invest: {sub.investment_amount} + Fee: {sub.pool_fee_amount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">TX Hash</p>
                    <p className="font-mono text-white text-sm truncate">
                      {sub.tx_hash || sub.binance_tx_id || "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      Method: {sub.payment_method}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">Verification</p>
                    <PaymentStatusIndicator status={sub.payment_status || sub.binance_payment_status} />
                    {sub.exact_amount_received && (
                      <p className="text-xs text-slate-500 mt-1">
                        Received: {sub.exact_amount_received} {sub.coin_type}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">Expected amount</p>
                    <p className="font-semibold text-white font-mono">{sub.exact_amount_expected} {sub.coin_type}</p>
                    {sub.verified_at && (
                      <p className="text-xs text-green-400 mt-0.5">
                        Verified: {new Date(sub.verified_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Refund / rejection info */}
                {(sub.refund_reason || sub.rejection_reason) && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm">
                    <p className="text-red-200 font-medium">
                      {sub.rejection_reason || sub.refund_reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
