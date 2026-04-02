"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyPools, type MyPoolMembership } from "@/lib/api/vc-pools";
import { getApiErrorMessage } from "@/lib/utils/errors";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function PoolCard({
  item,
  formatUsd,
  onViewDetail,
}: {
  item: MyPoolMembership;
  formatUsd: (n: number) => string;
  onViewDetail: () => void;
}) {
  const badge = getPoolBadge(item);
  const isActive = item.membership_status === "active_in_pool" || item.membership_status === "rejoined_after_exit";
  const isRejoin = item.membership_status === "rejoined_after_exit";
  const isCompleted = item.membership_status === "completed_and_paid";
  const isExited = item.membership_status === "exited_with_refund";
  const isPending = item.membership_status === "exit_requested_pending_approval";
  const isApprovedPending = item.membership_status === "exit_approved_pending_refund";
  const isPoolCancelled = item.membership_status === "pool_cancelled_refund";

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 hover:border-[var(--primary)]/40 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-white">{item.membership.pool_name}</h2>
            <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-200">
              {badge.icon} {badge.text}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">
            {isRejoin && item.status_detail.rejoined_at && (
              <>Re-joined {new Date(item.status_detail.rejoined_at).toLocaleDateString()}</>
            )}
            {!isRejoin && item.membership.started_at && (
              <>Started {new Date(item.membership.started_at).toLocaleDateString()}</>
            )}
            {item.membership.end_date && <> · Ends {new Date(item.membership.end_date).toLocaleDateString()}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewDetail}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          View Detail
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        {/* Investment Amount */}
        <div className="rounded-lg bg-[--color-surface-alt] p-3">
          <p className="text-xs text-slate-400">
            {isCompleted ? "Final Payout" : isExited || isPoolCancelled ? "Refund" : "My Investment"}
          </p>
          <p className="font-semibold text-white">
            {isCompleted
              ? formatUsd(Number(item.status_detail.payout_amount))
              : isExited
                ? formatUsd(Number(item.status_detail.refund_amount))
                : isPoolCancelled
                  ? formatUsd(Number(item.status_detail.refund_amount))
                : isPending || isApprovedPending
                  ? formatUsd(Number(item.status_detail.refund_amount))
                  : formatUsd(item.my_investment.invested_amount)}
          </p>
          {!isCompleted && !isExited && !isPoolCancelled && !isPending && !isApprovedPending && (
            <p className="text-xs text-slate-500">
              {item.membership.pool_status === "open" || item.membership.pool_status === "full"
                ? "Share: Pending"
                : `Share: ${item.my_investment.share_percent}%`}
            </p>
          )}
        </div>

        {/* Current Value / Status Info */}
        <div className="rounded-lg bg-[--color-surface-alt] p-3">
          <p className="text-xs text-slate-400">
            {isCompleted ? "Earnings" : isRejoin ? "Current Value" : isExited ? "Status" : "Current Value"}
          </p>
          {isCompleted && item.status_detail.profit_loss !== undefined ? (
            <>
              <p className={`font-semibold ${Number(item.status_detail.profit_loss) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {Number(item.status_detail.profit_loss) >= 0 ? "+" : ""}
                {formatUsd(Number(item.status_detail.profit_loss))}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(item.status_detail.paid_at!).toLocaleDateString()}
              </p>
            </>
          ) : isRejoin ? (
            <>
              <p className="font-semibold text-white">{formatUsd(item.my_value.current_value)}</p>
              <p className={`text-xs ${item.my_value.profit_loss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {item.my_value.profit_loss >= 0 ? "+" : ""}{formatUsd(item.my_value.profit_loss)}
              </p>
            </>
          ) : isExited ? (
            <>
              <p className="font-semibold text-slate-300">Refunded</p>
              <p className="text-xs text-slate-500">
                {new Date(item.status_detail.refund_completed_at!).toLocaleDateString()}
              </p>
            </>
          ) : isPending ? (
            <>
              <p className="font-semibold text-yellow-400">Pending</p>
              <p className="text-xs text-slate-500">
                {new Date(item.status_detail.requested_at!).toLocaleDateString()}
              </p>
            </>
          ) : isApprovedPending ? (
            <>
              <p className="font-semibold text-blue-400">Processing</p>
              <p className="text-xs text-slate-500">1-3 business days</p>
            </>
          ) : isPoolCancelled ? (
            <>
              <p className="font-semibold text-amber-400">Cancelled</p>
              <p className="text-xs text-slate-500">Full refund</p>
            </>
          ) : item.membership.pool_status === "open" || item.membership.pool_status === "full" ? (
            <>
              <p className="font-semibold text-white">{formatUsd(item.my_value.current_value)}</p>
              <p className="text-xs text-slate-500">Awaiting pool start</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-white">{formatUsd(item.my_value.current_value)}</p>
              <p className={`text-xs ${item.my_value.profit_loss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {item.my_value.profit_loss >= 0 ? "+" : ""}{formatUsd(item.my_value.profit_loss)}
              </p>
            </>
          )}
        </div>

        {/* Pool Value / Fee Info */}
        <div className="rounded-lg bg-[--color-surface-alt] p-3">
          <p className="text-xs text-slate-400">
            {isExited || isPoolCancelled || isPending || isApprovedPending ? "Fee Deducted" : "Pool Value"}
          </p>
          {isExited || isPoolCancelled ? (
            <>
              <p className="font-semibold text-red-400">
                -{formatUsd(Number(item.my_investment.invested_amount) - Number(item.status_detail.refund_amount))}
              </p>
              <p className="text-xs text-slate-500">Cancellation fee</p>
            </>
          ) : isPending || isApprovedPending ? (
            <>
              <p className="font-semibold text-red-400">
                -{formatUsd(Number(item.my_investment.invested_amount) - Number(item.status_detail.refund_amount))}
              </p>
              <p className="text-xs text-slate-500">Est. fee deducted</p>
            </>
          ) : item.membership.pool_status === "open" || item.membership.pool_status === "full" ? (
            <>
              <p className="font-semibold text-white">{formatUsd(item.pool_performance.current_pool_value)}</p>
              <p className="text-xs text-slate-500">Capital collected</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-white">{formatUsd(item.pool_performance.current_pool_value)}</p>
              <p className="text-xs text-slate-500">Profit: {formatUsd(item.pool_performance.total_profit)}</p>
            </>
          )}
        </div>

        {/* Status Summary */}
        <div className="rounded-lg bg-[--color-surface-alt] p-3">
          <p className="text-xs text-slate-400">Status Summary</p>
          {isActive && <p className="text-sm font-semibold text-emerald-400">Active Investment</p>}
          {isCompleted && <p className="text-sm font-semibold text-green-400">✓ Completed & Paid</p>}
          {isExited && <p className="text-sm font-semibold text-slate-300">✓ Refund Received</p>}
          {isPending && <p className="text-sm font-semibold text-yellow-400">⏳ Awaiting Approval</p>}
          {isApprovedPending && <p className="text-sm font-semibold text-blue-400">Processing Refund</p>}
          {isPoolCancelled && <p className="text-sm font-semibold text-amber-400">Pool Cancelled</p>}
        </div>
      </div>
    </div>
  );
}

function getPoolSection(item: MyPoolMembership): "active" | "closed" | "pending" {
  // Use membership_status as the source of truth for categorization
  switch (item.membership_status) {
    case "active_in_pool":
    case "rejoined_after_exit":
      return "active";

    case "exit_requested_pending_approval":
    case "exit_approved_pending_refund":
      return "pending";

    case "completed_and_paid":
    case "exited_with_refund":
    case "pool_cancelled_refund":
      return "closed";

    default:
      return "closed"; // Fallback for unknown statuses
  }
}

function getPoolBadge(item: MyPoolMembership): { text: string; icon: string } {
  switch (item.membership_status) {
    case "active_in_pool":
      return { icon: "✅", text: "Active" };
    case "completed_and_paid":
      return { icon: "✓", text: "Completed" };
    case "exited_with_refund":
      return { icon: "⊘", text: "Exited" };
    case "rejoined_after_exit":
      return { icon: "↻", text: "Re-entered" };
    case "exit_requested_pending_approval":
      return { icon: "⏳", text: "Exit Pending" };
    case "exit_approved_pending_refund":
      return { icon: "📤", text: "Refund Processing" };
    case "pool_cancelled_refund":
      return { icon: "⚠️", text: "Cancelled" };
    default:
      return { icon: "•", text: "Unknown" };
  }
}

export default function MyPoolsPage() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const [pools, setPools] = useState<MyPoolMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "closed">("active");

  const { activePools, pendingPools, closedPools } = useMemo(() => {
    const active: MyPoolMembership[] = [];
    const pending: MyPoolMembership[] = [];
    const closed: MyPoolMembership[] = [];

    for (const item of pools) {
      const section = getPoolSection(item);
      if (section === "active") active.push(item);
      else if (section === "pending") pending.push(item);
      else closed.push(item);
    }

    return { activePools: active, pendingPools: pending, closedPools: closed };
  }, [pools]);

  const fetchMyPools = () => {
    if (!canAccessVCPool) return;
    setLoading(true);
    setError(null);
    getMyPools()
      .then((res) => setPools(res.pools))
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Failed to load my pools")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!canAccessVCPool) {
      setLoading(false);
      return;
    }
    fetchMyPools();
  }, [canAccessVCPool]);

  return (
    <div className="min-h-screen bg-[--color-surface] p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        {!canAccessVCPool && (
          <LockedFeatureOverlay
            featureName="VC Pool Access"
            requiredTier={PlanTier.ELITE}
            message="My pools is available only for ELITE members."
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
            <h1 className="text-2xl font-bold text-white mb-1">My pools</h1>
            <p className="text-sm text-slate-400">Your pool memberships, current value, and cancellation status.</p>
          </div>
          <button
            type="button"
            onClick={fetchMyPools}
            disabled={loading}
            className="rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
          >
            {loading ? "Loading…" : "Refresh"}
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
              onClick={() => { setError(null); fetchMyPools(); }}
              className="shrink-0 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && pools.length === 0 && (
          <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
            <p>You are not a member of any pool yet.</p>
            <Link href="/dashboard/vc-pool" className="mt-4 inline-block text-[var(--primary)] hover:underline font-medium">
              Browse available pools
            </Link>
          </div>
        )}

        {!loading && !error && pools.length > 0 && (
          <div className="space-y-6">
            {/* Tabs: Active | Pending | Closed */}
            <div className="flex flex-wrap gap-2 border-b border-[--color-border] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "active"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[--color-surface-alt] text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Active Investments
                {activePools.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{activePools.length}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "pending"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[--color-surface-alt] text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Pending Actions
                {pendingPools.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{pendingPools.length}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("closed")}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "closed"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[--color-surface-alt] text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                Closed Investments
                {closedPools.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{closedPools.length}</span>
                )}
              </button>
            </div>

            {/* Tab: Active Investments */}
            {activeTab === "active" && (
              <section className="space-y-4">
                {activePools.length === 0 ? (
                  <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
                    <p>No active investments. Browse <Link href="/dashboard/vc-pool" className="text-[var(--primary)] hover:underline font-medium">available pools</Link> to join one.</p>
                  </div>
                ) : (
                  activePools.map((item) => (
                    <PoolCard key={item.membership.pool_id} item={item} formatUsd={formatUsd} onViewDetail={() => router.push(`/dashboard/vc-pool/${item.membership.pool_id}`)} />
                  ))
                )}
              </section>
            )}

            {/* Tab: Pending Actions */}
            {activeTab === "pending" && (
              <section className="space-y-4">
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                  <p className="font-medium">⏳ Requests Awaiting Admin Review</p>
                  <p className="mt-1 text-yellow-200/90">Your exit requests are pending admin approval. Refunds will be processed once approved.</p>
                </div>
                {pendingPools.length === 0 ? (
                  <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
                    <p>No pending actions. All exit requests have been resolved.</p>
                  </div>
                ) : (
                  pendingPools.map((item) => (
                    <PoolCard key={item.membership.pool_id} item={item} formatUsd={formatUsd} onViewDetail={() => router.push(`/dashboard/vc-pool/${item.membership.pool_id}`)} />
                  ))
                )}
              </section>
            )}

            {/* Tab: Closed Investments */}
            {activeTab === "closed" && (
              <section className="space-y-4">
                <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 p-4 text-sm text-slate-300">
                  <p className="font-medium">✓ Completed or Exited Pools</p>
                  <p className="mt-1 text-slate-400">These pools are no longer active. You can view details or rejoin if the pool is still open.</p>
                </div>
                {closedPools.length === 0 ? (
                  <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
                    <p>No closed investments yet. Active pools will appear here once completed or exited.</p>
                  </div>
                ) : (
                  closedPools.map((item) => (
                    <PoolCard key={item.membership.pool_id} item={item} formatUsd={formatUsd} onViewDetail={() => router.push(`/dashboard/vc-pool/${item.membership.pool_id}`)} />
                  ))
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
