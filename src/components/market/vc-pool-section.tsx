"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";
import { getAvailableVcPools, type VcPoolSummary } from "@/lib/api/vc-pools";
import { getApiErrorMessage } from "@/lib/utils/errors";

const truncAddr = (addr: string) =>
  addr.length > 14 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

export function VCPoolSection() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);

  const [pools, setPools] = useState<VcPoolSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchPools = (pageToFetch = 1, append = false) => {
    if (!canAccessVCPool) return;
    if (pageToFetch === 1) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    getAvailableVcPools(pageToFetch, 20)
      .then((res) => {
        setPagination(res.pagination);
        setPools((prev) => (append ? [...prev, ...res.pools] : res.pools));
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load pools"));
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  const loadMore = () => {
    if (!pagination || loadingMore) return;
    const nextPage = pagination.page + 1;
    if (nextPage <= pagination.totalPages) fetchPools(nextPage, true);
  };

  useEffect(() => {
    if (!canAccessVCPool) return;
    fetchPools(1);
  }, [canAccessVCPool]);

  const stats = useMemo(() => {
    if (!pools.length) {
      return {
        totalPools: pagination?.total ?? 0,
        avgContribution: 0,
        avgDuration: 0,
      };
    }
    const totalPools = pagination?.total ?? pools.length;
    const sumContribution = pools.reduce(
      (acc, p) => acc + Number(p.contribution_amount || 0),
      0
    );
    const sumDuration = pools.reduce(
      (acc, p) => acc + (p.duration_days || 0),
      0
    );
    return {
      totalPools,
      avgContribution: sumContribution / totalPools,
      avgDuration: sumDuration / totalPools,
    };
  }, [pools, pagination?.total]);

  return (
    <div className="relative">
      {!canAccessVCPool && (
        <LockedFeatureOverlay
          featureName="VC Pool Access"
          requiredTier={PlanTier.ELITE}
          message="VC pools are available only for ELITE members. Upgrade your plan to access curated pools."
        />
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-white">VC Pool Access</h2>
            <p className="text-sm text-slate-400">
              Browse curated trading pools created by Quantiva admins.
            </p>
          </div>
          {canAccessVCPool && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchPools(1)}
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
              <button
                onClick={() => router.push("/dashboard/vc-pool/transaction")}
                className="rounded-xl bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Transactions
              </button>
              <button
                onClick={() => router.push("/dashboard/vc-pool/my-pools")}
                className="rounded-xl bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                My pools
              </button>
            </div>
          )}
        </div>

        {canAccessVCPool && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-[#fc4f02]/30 to-[#fda300]/20 p-4">
                <p className="mb-1 text-xs text-slate-200/80">
                  Open pools available
                </p>
                <p className="text-2xl font-bold text-white">
                  {pagination?.total ?? stats.totalPools}
                </p>
              </div>
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
                <p className="mb-1 text-xs text-slate-400">
                  Avg. Contribution / seat
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.avgContribution ? `$${stats.avgContribution.toFixed(0)}` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
                <p className="mb-1 text-xs text-slate-400">Avg. Duration</p>
                <p className="text-2xl font-bold text-white">
                  {stats.avgDuration ? `${stats.avgDuration.toFixed(0)} days` : "—"}
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-3 rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-3 text-sm text-slate-300">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
                Loading pools…
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex flex-wrap items-center justify-between gap-3">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => { setError(null); fetchPools(1); }}
                  className="shrink-0 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && pools.length === 0 && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-6 text-sm text-slate-300">
                No open pools are available right now. Please check back soon.
              </div>
            )}

            {!loading && !error && pools.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Available Opportunities
                </h3>
                {pools.map((pool) => {
                  const filledSeats = pool.max_members - pool.available_seats;
                  const totalSeats = pool.max_members || 0;
                  const progress =
                    totalSeats > 0 ? Math.min(100, Math.max(0, (filledSeats / totalSeats) * 100)) : 0;
                  const depositAddr = pool.admin_wallet_address || pool.admin_binance_uid || "";

                  return (
                    <Link
                      key={pool.pool_id}
                      href={`/dashboard/vc-pool/${pool.pool_id}`}
                      className="group block w-full rounded-2xl border border-[--color-border] bg-gradient-to-b from-[--color-surface] to-black/60 p-5 text-left shadow-sm hover:border-[#fc4f02]/70 hover:shadow-[0_0_40px_rgba(252,79,2,0.25)] transition-all"
                    >
                      {/* Header: name + min investment + fee */}
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            VC pool opportunity
                          </p>
                          <h4 className="mt-1 text-base sm:text-lg font-semibold text-white">
                            {pool.name}
                          </h4>
                          {pool.description && (
                            <p className="mt-1 text-xs text-slate-400 line-clamp-2 max-w-md">
                              {pool.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-slate-400">
                            Min investment{" "}
                            <span className="font-semibold text-white">
                              ${pool.contribution_amount} {pool.coin_type}
                            </span>
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="mb-1 text-slate-400">Pool fee</p>
                          <p className="text-lg font-semibold text-emerald-400">
                            {pool.pool_fee_percent}%
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Payment window {pool.payment_window_minutes} min
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-5">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Funding progress</span>
                          <span className="text-slate-300">
                            {filledSeats}/{totalSeats} seats filled
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                        <div>
                          <p className="mb-1">Duration</p>
                          <p className="font-semibold text-white">
                            {pool.duration_days} days
                          </p>
                        </div>
                        <div>
                          <p className="mb-1">Seats left</p>
                          <p className="font-semibold text-white">
                            {pool.available_seats}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1">Created</p>
                          <p className="font-semibold text-white">
                            {new Date(pool.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Footer: address (truncate + copy) + CTA */}
                      <div className="mt-5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] text-slate-500">
                            Deposit Address (BSC):{" "}
                            <span className="font-mono text-slate-300">
                              {depositAddr ? truncAddr(depositAddr) : "Not set"}
                            </span>
                          </p>
                          {depositAddr && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigator.clipboard.writeText(depositAddr);
                              }}
                              className="shrink-0 rounded-lg border border-[--color-border] px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/5 transition-colors"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                        <span className="mt-2 flex h-9 w-full items-center justify-center rounded-full bg-[#fc4f02] text-center text-xs font-semibold text-white group-hover:brightness-110 transition-colors">
                          View details &amp; join
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {pagination &&
                  pagination.page < pagination.totalPages &&
                  !loading &&
                  !error && (
                    <div className="pt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="rounded-xl border border-[--color-border] bg-[--color-surface] px-6 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
                      >
                        {loadingMore ? "Loading…" : "Load more pools"}
                      </button>
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
