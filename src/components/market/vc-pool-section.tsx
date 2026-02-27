"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";
import { getAvailableVcPools, type VcPoolSummary } from "@/lib/api/vc-pools";

export function VCPoolSection() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);

  const [pools, setPools] = useState<VcPoolSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccessVCPool) return;
    setLoading(true);
    setError(null);
    getAvailableVcPools(1, 20)
      .then((res) => setPools(res.pools))
      .catch((err: any) => {
        const msg = err?.message || "Failed to load pools";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [canAccessVCPool]);

  const stats = useMemo(() => {
    if (!pools.length) {
      return {
        totalPools: 0,
        avgContribution: 0,
        avgDuration: 0,
      };
    }
    const totalPools = pools.length;
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
  }, [pools]);

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
        <div>
          <h2 className="mb-1 text-2xl font-bold text-white">VC Pool Access</h2>
          <p className="text-sm text-slate-400">
            Browse curated trading pools created by Quantiva admins.
          </p>
        </div>

        {canAccessVCPool && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-[#fc4f02]/30 to-[#fda300]/20 p-4">
                <p className="mb-1 text-xs text-slate-200/80">
                  Open pools available
                </p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalPools}
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
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
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

                  return (
                    <button
                      key={pool.pool_id}
                      onClick={() => router.push(`/dashboard/vc-pool/${pool.pool_id}`)}
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

                      {/* Footer CTA */}
                      <div className="mt-5 space-y-2">
                        <p className="text-[11px] text-slate-500">
                          Admin Binance UID:{" "}
                          <span className="font-mono text-slate-300">
                            {pool.admin_binance_uid || "Not set"}
                          </span>
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="h-9 flex-1 rounded-full bg-[#fc4f02] text-center text-xs font-semibold text-white flex items-center justify-center group-hover:brightness-110 transition">
                            View details &amp; join
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
