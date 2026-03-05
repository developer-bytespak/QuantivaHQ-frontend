"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyPools, type MyPoolMembership } from "@/lib/api/vc-pools";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    open: { bg: "bg-emerald-500/15 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" },
    full: { bg: "bg-amber-500/15 border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
    active: { bg: "bg-blue-500/15 border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400 animate-pulse" },
    completed: { bg: "bg-slate-500/15 border-slate-500/20", text: "text-slate-300", dot: "bg-slate-400" },
    cancelled: { bg: "bg-red-500/15 border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  };
  const s = map[status] ?? map.open;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── Tab definitions ────────────────────────────────────── */
type TabKey = "all" | "active" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "all",
    label: "All Pools",
    icon: (
      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    key: "active",
    label: "Active",
    icon: (
      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: "completed",
    label: "Completed",
    icon: (
      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: (
      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const ACTIVE_STATUSES = new Set(["open", "full", "active"]);
const COMPLETED_STATUSES = new Set(["completed"]);
const CANCELLED_STATUSES = new Set(["cancelled"]);

function filterPools(pools: MyPoolMembership[], tab: TabKey): MyPoolMembership[] {
  if (tab === "all") return pools;
  if (tab === "active") return pools.filter((p) => ACTIVE_STATUSES.has(p.membership.pool_status) && !CANCELLED_STATUSES.has(p.membership.pool_status) && p.cancellation === null);
  if (tab === "completed") return pools.filter((p) => COMPLETED_STATUSES.has(p.membership.pool_status));
  return pools.filter((p) => CANCELLED_STATUSES.has(p.membership.pool_status) || p.cancellation !== null);
}

export default function MyPoolsPage() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const [pools, setPools] = useState<MyPoolMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  useEffect(() => {
    if (!canAccessVCPool) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    getMyPools()
      .then((res) => setPools(res.pools))
      .catch((err: unknown) => setError((err as { message?: string })?.message ?? "Failed to load my pools"))
      .finally(() => setLoading(false));
  }, [canAccessVCPool]);

  const filteredPools = useMemo(() => filterPools(pools, activeTab), [pools, activeTab]);

  const tabCounts = useMemo(() => ({
    all: pools.length,
    active: filterPools(pools, "active").length,
    completed: filterPools(pools, "completed").length,
    cancelled: filterPools(pools, "cancelled").length,
  }), [pools]);

  return (
    <div className="relative">
      {!canAccessVCPool && (
        <LockedFeatureOverlay featureName="VC Pool Access" requiredTier={PlanTier.ELITE} message="My pools is available only for ELITE members." />
      )}

      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/vc-pool")}
        className="mb-5 sm:mb-6 inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-[#fc4f02] transition-colors group"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to VC Pools
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">My Pools</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">Your pool memberships, current value, and cancellation status.</p>
        </div>
        <Link
          href="/dashboard/vc-pool"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-[#fc4f02]/30 transition-all w-fit"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Browse pools
        </Link>
      </div>

      {/* ── Status Tabs ──────────────────────── */}
      {!loading && !error && pools.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    relative flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium
                    whitespace-nowrap transition-all duration-300 border
                    ${
                      isActive
                        ? "bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/10 border-[#fc4f02]/40 text-white shadow-[0_0_15px_rgba(252,79,2,0.15)]"
                        : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/[0.12]"
                    }
                  `}
                >
                  <span className={isActive ? "text-[#fc4f02]" : "text-slate-500"}>{tab.icon}</span>
                  {tab.label}
                  <span
                    className={`
                      inline-flex items-center justify-center min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] rounded-full px-1 text-[10px] font-semibold
                      ${
                        isActive
                          ? "bg-[#fc4f02]/25 text-[#fc4f02]"
                          : "bg-white/[0.06] text-slate-500"
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]" />
          <span className="text-sm text-slate-400">Loading your pools…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border-l-4 border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">
          <p className="font-medium">Error loading pools</p>
          <p className="mt-1 text-xs text-red-300/70">{error}</p>
        </div>
      )}

      {/* Empty – no pools at all */}
      {!loading && !error && pools.length === 0 && (
        <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fc4f02]/10 border border-[#fc4f02]/20">
            <svg className="h-7 w-7 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">No pool memberships</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">You are not a member of any pool yet. Browse available pools to get started.</p>
          <Link
            href="/dashboard/vc-pool"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all"
          >
            Browse available pools
          </Link>
        </div>
      )}

      {/* Empty – no pools in current tab */}
      {!loading && !error && pools.length > 0 && filteredPools.length === 0 && (
        <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 sm:p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-white">No {activeTab === "all" ? "" : activeTab} pools</h3>
          <p className="mt-1.5 text-sm text-slate-400">You don&apos;t have any {activeTab} pool memberships.</p>
        </div>
      )}

      {/* Pool cards */}
      {!loading && !error && filteredPools.length > 0 && (
        <div className="space-y-4 sm:space-y-5">
          {filteredPools.map((item) => {
            const pnl = item.my_value.profit_loss;
            const pnlPositive = pnl >= 0;
            const sharePercent = item.my_investment.share_percent;
            // Approximate member count from share % (equal splits assumed)
            const estMembers = sharePercent > 0 ? Math.round(100 / sharePercent) : 1;

            return (
              <div
                key={item.membership.pool_id}
                className="group rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent border border-white/[0.06] backdrop-blur p-5 sm:p-6
                  shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.04)]
                  hover:border-[#fc4f02]/30
                  hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_25px_rgba(252,79,2,0.1)]
                  transition-all duration-300"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusBadge status={item.membership.pool_status} />
                      {item.membership.started_at && (
                        <span className="text-[10px] text-slate-500">Since {new Date(item.membership.started_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-white">{item.membership.pool_name}</h2>
                    {item.membership.end_date && (
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Ends {new Date(item.membership.end_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/vc-pool/${item.membership.pool_id}`)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/20 hover:shadow-[#fc4f02]/35 hover:scale-[1.02] transition-all"
                  >
                    View pool
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Stats grid */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">My Investment</p>
                    <p className="text-sm sm:text-base font-bold text-white">{formatUsd(item.my_investment.invested_amount)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Share: {item.my_investment.share_percent}%</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Current Value</p>
                    <p className="text-sm sm:text-base font-bold text-white">{formatUsd(item.my_value.current_value)}</p>
                    <p className={`text-[10px] sm:text-xs font-medium mt-0.5 ${pnlPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {pnlPositive ? "+" : ""}{formatUsd(pnl)} P/L
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Pool Value</p>
                    <p className="text-sm sm:text-base font-bold text-white">{formatUsd(item.pool_performance.current_pool_value)}</p>
                    <p className={`text-[10px] sm:text-xs font-medium mt-0.5 ${item.pool_performance.total_profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {item.pool_performance.total_profit >= 0 ? "+" : ""}{formatUsd(item.pool_performance.total_profit)} profit
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-3">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Cancellation</p>
                    {item.cancellation ? (
                      <>
                        <p className="text-sm sm:text-base font-bold capitalize text-amber-400">{item.cancellation.status}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Refund: {formatUsd(item.cancellation.refund_amount)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm sm:text-base font-medium text-slate-500">None</p>
                    )}
                  </div>
                </div>

                {/* Members / Your Share bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Your pool share
                    </span>
                    <span className="font-medium text-slate-300">
                      {sharePercent}% · ~{estMembers} member{estMembers !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, sharePercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
