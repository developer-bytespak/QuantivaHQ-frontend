"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAllTransactions,
  getTransactionSummary,
  type MyTransaction,
  type TransactionFilters,
  type TransactionSummary,
} from "@/lib/api/vc-pools";
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

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);

  const [transactions, setTransactions] = useState<MyTransaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchData = useCallback(() => {
    if (!canAccessVCPool) return;
    setLoading(true);
    setError(null);

    const filters: TransactionFilters = { page, limit };
    if (statusFilter) filters.status = statusFilter;
    if (typeFilter) filters.type = typeFilter;

    Promise.all([getAllTransactions(filters), getTransactionSummary()])
      .then(([txRes, summaryRes]) => {
        setTransactions(txRes.transactions ?? txRes as unknown as MyTransaction[]);
        setTotalPages(txRes.pagination?.totalPages ?? 1);
        setSummary(summaryRes);
      })
      .catch((err: unknown) => {
        // Fallback: if the enhanced endpoints are not available, use the array response
        setError(getApiErrorMessage(err, "Failed to load transactions"));
      })
      .finally(() => setLoading(false));
  }, [canAccessVCPool, page, statusFilter, typeFilter]);

  useEffect(() => {
    if (!canAccessVCPool) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, canAccessVCPool]);

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
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-[var(--primary-light)] transition-colors group"
        >
          <svg className="w-4 h-4 text-[var(--primary)] group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-white/90 group-hover:text-[var(--primary-light)]">Back to VC pools</span>
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Transaction History</h1>
            <p className="text-sm text-slate-400">
              Audit log of all your VC Pool payment events.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/vc-pool/my-submissions")}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              My submissions
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <SummaryCard label="Total" value={summary.total_transactions} color="text-white" />
            <SummaryCard label="Deposited" value={`$${summary.total_deposited.toLocaleString()}`} color="text-green-400" />
            <SummaryCard label="Withdrawn" value={`$${summary.total_withdrawn.toLocaleString()}`} color="text-blue-400" />
            <SummaryCard label="Pending" value={summary.pending_count} color="text-yellow-400" />
            <SummaryCard label="Verified" value={summary.verified_count} color="text-green-400" />
            <SummaryCard label="Rejected" value={summary.rejected_count} color="text-red-400" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-slate-200 focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-slate-200 focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="payment_submitted">Payment Submitted</option>
            <option value="payment_verified">Payment Verified</option>
            <option value="payment_rejected">Payment Rejected</option>
          </select>
          {(statusFilter || typeFilter) && (
            <button
              type="button"
              onClick={() => { setStatusFilter(""); setTypeFilter(""); setPage(1); }}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => { setError(null); fetchData(); }}
              className="shrink-0 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && transactions.length === 0 && (
          <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
            <svg className="mx-auto h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No transactions found.</p>
            <Link href="/dashboard/vc-pool" className="mt-4 inline-block text-[var(--primary)] hover:underline font-medium">
              Browse available pools
            </Link>
          </div>
        )}

        {/* Transaction List */}
        {!loading && !error && transactions.length > 0 && (
          <>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Link
                  key={tx.transaction_id}
                  href={`/dashboard/vc-pool/transactions/${tx.transaction_id}`}
                  className="block rounded-xl border border-[--color-border] bg-[--color-surface] p-4 hover:border-[var(--primary)]/40 transition-colors"
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
                            TX: <span className="font-mono text-slate-400">{(tx.tx_hash || tx.binance_tx_id || "").slice(0, 16)}…</span>
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
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-[--color-border] px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-[--color-border] px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
