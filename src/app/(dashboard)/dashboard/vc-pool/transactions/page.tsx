"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyTransactions, type MyTransaction } from "@/lib/api/vc-pools";
import { getApiErrorMessage } from "@/lib/utils/errors";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

function TransactionTypeIcon({ type }: { type: string }) {
  if (type === "payment_submitted") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/20">
        <svg className="h-4.5 w-4.5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  if (type === "payment_verified") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/20">
        <svg className="h-4.5 w-4.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  if (type === "payment_rejected") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20">
        <svg className="h-4.5 w-4.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-500/20">
      <svg className="h-4.5 w-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    verified: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
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

function formatTransactionType(type: string): string {
  const labels: Record<string, string> = {
    payment_submitted: "Payment Submitted",
    payment_verified: "Payment Verified",
    payment_rejected: "Payment Rejected",
  };
  return labels[type] ?? type;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const [transactions, setTransactions] = useState<MyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = () => {
    if (!canAccessVCPool) return;
    setLoading(true);
    setError(null);
    getMyTransactions()
      .then(setTransactions)
      .catch((err: unknown) =>
        setError(getApiErrorMessage(err, "Failed to load transactions"))
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canAccessVCPool) {
      setLoading(false);
      return;
    }
    fetchTransactions();
  }, [canAccessVCPool]);

  return (
    <div className="min-h-screen bg-[--color-surface] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {!canAccessVCPool && (
          <LockedFeatureOverlay
            featureName="VC Pool Access"
            requiredTier={PlanTier.ELITE}
            message="Transaction history is available only for ELITE members."
          />
        )}

        <Link
          href="/dashboard/vc-pool"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[#fda300] transition-colors group"
        >
          <svg className="w-4 h-4 text-[#fc4f02] group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-white/90 group-hover:text-[#fda300]">Back to VC pools</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Transaction History</h1>
            <p className="text-sm text-slate-400">
              Audit log of all your VC Pool payment events.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTransactions}
            disabled={loading}
            className="rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/vc-pool/my-submissions")}
            className="rounded-xl bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            My submissions
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => { setError(null); fetchTransactions(); }}
              className="shrink-0 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
            <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No transactions yet.</p>
            <Link href="/dashboard/vc-pool" className="mt-4 inline-block text-[#fc4f02] hover:underline font-medium">
              Browse available pools
            </Link>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.transaction_id}
                className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4 hover:border-[--color-border] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <TransactionTypeIcon type={tx.transaction_type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {formatTransactionType(tx.transaction_type)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{tx.pool_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-semibold text-white">
                          {tx.amount_usdt} USDT
                        </span>
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mt-2">{tx.description}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      {(tx.tx_hash || tx.binance_tx_id) && (
                        <span>
                          TX Hash: <span className="font-mono text-slate-400">{tx.tx_hash || tx.binance_tx_id}</span>
                        </span>
                      )}
                      {tx.expected_amount && (
                        <span>
                          Expected: <span className="font-mono text-slate-400">{tx.expected_amount}</span>
                        </span>
                      )}
                      {tx.actual_amount_received && (
                        <span>
                          Received: <span className="font-mono text-slate-400">{tx.actual_amount_received}</span>
                        </span>
                      )}
                      <span>{new Date(tx.created_at).toLocaleString()}</span>
                      {tx.resolved_at && (
                        <span>
                          Resolved: {new Date(tx.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
