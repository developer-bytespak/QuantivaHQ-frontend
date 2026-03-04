"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";
import { getAvailableVcPools, getMyPools, type VcPoolSummary } from "@/lib/api/vc-pools";

/* ── Format helpers ─────────────────────────────────────── */
function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/* ── Stat Card ──────────────────────────────────────────── */
function StatCard({
  label,
  value,
  accent = false,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${
        accent
          ? "border-[#fc4f02]/30 bg-gradient-to-br from-[#fc4f02]/15 via-[#fda300]/8 to-transparent shadow-[0_0_20px_rgba(252,79,2,0.08)]"
          : "border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-white truncate">{value}</p>
        </div>
        <div
          className={`flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl ${
            accent
              ? "bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10"
              : "bg-white/[0.05]"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ── Pool Card ──────────────────────────────────────────── */
function PoolCard({ pool }: { pool: VcPoolSummary }) {
  const router = useRouter();
  const filledSeats = pool.max_members - pool.available_seats;
  const totalSeats = pool.max_members || 0;
  const progress = totalSeats > 0 ? Math.min(100, Math.max(0, (filledSeats / totalSeats) * 100)) : 0;
  const isFull = pool.available_seats <= 0;

  return (
    <button
      onClick={() => router.push(`/dashboard/vc-pool/${pool.pool_id}`)}
      className="group relative block w-full text-left rounded-xl sm:rounded-2xl
        bg-gradient-to-br from-white/[0.07] to-transparent
        p-4 sm:p-6 backdrop-blur
        border border-white/[0.06]
        shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.04)]
        hover:border-[#fc4f02]/40
        hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_30px_rgba(252,79,2,0.15),0_0_40px_rgba(253,163,0,0.08)]
        transition-all duration-300 hover:translate-y-[-2px]"
    >
      {/* Status dot */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] sm:text-xs font-medium ${
            isFull
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isFull ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
            }`}
          />
          {isFull ? "Full" : "Open"}
        </span>
      </div>

      {/* Pool name & description */}
      <div className="pr-20 sm:pr-24">
        <h4 className="text-base sm:text-lg font-semibold text-white group-hover:text-[#fc4f02] transition-colors duration-200">
          {pool.name}
        </h4>
        {pool.description && (
          <p className="mt-1 text-xs sm:text-sm text-slate-400 line-clamp-2 max-w-xl">
            {pool.description}
          </p>
        )}
      </div>

      {/* Key metrics grid */}
      <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2.5 sm:p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Investment</p>
          <p className="text-sm sm:text-base font-semibold text-white">
            ${pool.contribution_amount}
          </p>
          <p className="text-[10px] text-slate-500">{pool.coin_type}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2.5 sm:p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Duration</p>
          <p className="text-sm sm:text-base font-semibold text-white">
            {pool.duration_days}
          </p>
          <p className="text-[10px] text-slate-500">days</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2.5 sm:p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Pool Fee</p>
          <p className="text-sm sm:text-base font-semibold text-emerald-400">
            {pool.pool_fee_percent}%
          </p>
          <p className="text-[10px] text-slate-500">of profits</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2.5 sm:p-3">
          <p className="text-[10px] text-slate-500 mb-0.5">Seats Left</p>
          <p className={`text-sm sm:text-base font-semibold ${pool.available_seats > 0 ? "text-white" : "text-amber-400"}`}>
            {pool.available_seats}
          </p>
          <p className="text-[10px] text-slate-500">of {pool.max_members}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 mb-1.5">
          <span>Funding progress</span>
          <span className="font-medium text-slate-300">
            {filledSeats}/{totalSeats} seats
          </span>
        </div>
        <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              progress >= 100
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-4 sm:mt-5 flex items-center justify-between">
        <p className="text-[10px] sm:text-xs text-slate-500">
          Created {new Date(pool.created_at).toLocaleDateString()}
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#fc4f02] group-hover:gap-2.5 transition-all duration-300">
          View details
          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
}

/* ── Main Section ───────────────────────────────────────── */
export function VCPoolSection() {
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const [pools, setPools] = useState<VcPoolSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedPoolIds, setJoinedPoolIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!canAccessVCPool) return;
    setLoading(true);
    setError(null);

    // Fetch available pools and user's pools in parallel
    Promise.all([
      getAvailableVcPools(1, 20),
      getMyPools().catch(() => ({ pools: [] })), // gracefully handle if my-pools fails
    ])
      .then(([availRes, myRes]) => {
        const myIds = new Set(myRes.pools.map((p) => p.membership.pool_id));
        setJoinedPoolIds(myIds);
        // Filter out pools the user has already joined
        setPools(availRes.pools.filter((p) => !myIds.has(p.pool_id)));
      })
      .catch((err: any) => setError(err?.message || "Failed to load pools"))
      .finally(() => setLoading(false));
  }, [canAccessVCPool]);

  const stats = useMemo(() => {
    if (!pools.length) return { totalPools: 0, avgContribution: 0, avgDuration: 0, totalSeats: 0 };
    const totalPools = pools.length;
    const sumContribution = pools.reduce((acc, p) => acc + Number(p.contribution_amount || 0), 0);
    const sumDuration = pools.reduce((acc, p) => acc + (p.duration_days || 0), 0);
    const totalSeats = pools.reduce((acc, p) => acc + p.available_seats, 0);
    return {
      totalPools,
      avgContribution: sumContribution / totalPools,
      avgDuration: sumDuration / totalPools,
      totalSeats,
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

      <div className="space-y-6 sm:space-y-8">
        {/* ── Header ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">VC Pool Access</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-lg">
              Browse curated trading pools created by Quantiva admins. Pool into collective trading strategies and track performance in real-time.
            </p>
          </div>
          {canAccessVCPool && (
            <Link
              href="/dashboard/vc-pool/my-pools"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all duration-300 w-fit"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              My Pools
            </Link>
          )}
        </div>

        {canAccessVCPool && (
          <>
            {/* ── Stat Cards ─────────────────────── */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard
                accent
                label="Available Pools"
                value={String(stats.totalPools)}
                icon={
                  <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              />
              <StatCard
                label="Avg. Investment"
                value={stats.avgContribution ? formatUsd(stats.avgContribution) : "—"}
                icon={
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Avg. Duration"
                value={stats.avgDuration ? `${stats.avgDuration.toFixed(0)}d` : "—"}
                icon={
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Open Seats"
                value={String(stats.totalSeats)}
                icon={
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
            </div>

            {/* ── Loading ─────────────────────────── */}
            {loading && (
              <div className="flex items-center justify-center gap-3 py-16">
                <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]" />
                <span className="text-sm text-slate-400">Loading pools…</span>
              </div>
            )}

            {/* ── Error ───────────────────────────── */}
            {error && !loading && (
              <div className="rounded-xl border-l-4 border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
                <p className="font-medium">Failed to load pools</p>
                <p className="mt-1 text-xs text-red-300/70">{error}</p>
              </div>
            )}

            {/* ── Empty ───────────────────────────── */}
            {!loading && !error && pools.length === 0 && (
              <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 sm:p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fc4f02]/10 border border-[#fc4f02]/20">
                  <svg className="h-7 w-7 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">No pools available</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
                  No open pools right now. Check back soon for new investment opportunities.
                </p>
              </div>
            )}

            {/* ── Pool Cards ──────────────────────── */}
            {!loading && !error && pools.length > 0 && (
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Available Opportunities</h3>
                  <span className="text-xs text-slate-500">{pools.length} pool{pools.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid gap-4 sm:gap-5 grid-cols-1 xl:grid-cols-2">
                  {pools.map((pool) => (
                    <PoolCard key={pool.pool_id} pool={pool} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
