"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  adminListPools,
  type AdminPoolSummary,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

type FilterKey = "all" | "draft" | "open" | "active" | "completed" | "cancelled";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "open", label: "Open" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: "bg-slate-500/15 border-slate-500/20", text: "text-slate-300", dot: "bg-slate-400" },
    open: { bg: "bg-emerald-500/15 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-400 animate-pulse" },
    full: { bg: "bg-amber-500/15 border-amber-500/20", text: "text-amber-400", dot: "bg-amber-400" },
    active: { bg: "bg-blue-500/15 border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400 animate-pulse" },
    completed: { bg: "bg-slate-500/15 border-slate-500/20", text: "text-slate-300", dot: "bg-slate-400" },
    cancelled: { bg: "bg-red-500/15 border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminPoolsPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [pools, setPools] = useState<AdminPoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    adminListPools({ page: 1, limit: 20 })
      .then((res) => setPools(res.pools))
      .catch((err: unknown) => {
        showNotification((err as { message?: string })?.message ?? "Failed to load pools", "error");
      })
      .finally(() => setLoading(false));
  }, [showNotification]);

  const filtered = useMemo(() => {
    if (filter === "all") return pools;
    if (filter === "open") return pools.filter((p) => p.status === "open" || p.status === "full");
    return pools.filter((p) => p.status === filter);
  }, [pools, filter]);

  const tabCounts = useMemo(() => ({
    all: pools.length,
    draft: pools.filter((p) => p.status === "draft").length,
    open: pools.filter((p) => p.status === "open" || p.status === "full").length,
    active: pools.filter((p) => p.status === "active").length,
    completed: pools.filter((p) => p.status === "completed").length,
    cancelled: pools.filter((p) => p.status === "cancelled").length,
  }), [pools]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Pools</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Create, publish, and manage VC pools.
          </p>
        </div>
        <Link
          href="/admin/pools/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all duration-300 w-fit"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Pool
        </Link>
      </div>

      {/* Filter tabs */}
      {!loading && pools.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.key;
            const count = tabCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`
                  relative flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium
                  whitespace-nowrap transition-all duration-300 border
                  ${isActive
                    ? "bg-gradient-to-r from-[#fc4f02]/20 to-[#fda300]/10 border-[#fc4f02]/40 text-white shadow-[0_0_15px_rgba(252,79,2,0.15)]"
                    : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/[0.12]"
                  }
                `}
              >
                {tab.label}
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px] rounded-full px-1 text-[10px] font-semibold ${isActive ? "bg-[#fc4f02]/25 text-[#fc4f02]" : "bg-white/[0.06] text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]" />
          <span className="text-sm text-slate-400">Loading pools…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && pools.length === 0 && (
        <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 sm:p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fc4f02]/10 border border-[#fc4f02]/20">
            <svg className="h-7 w-7 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-white">No pools yet</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">Create your first pool to get started.</p>
          <Link href="/admin/pools/create" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all">
            Create pool
          </Link>
        </div>
      )}

      {/* Empty for filter */}
      {!loading && pools.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-8 sm:p-10 text-center">
          <p className="text-sm text-slate-400">No {filter} pools found.</p>
        </div>
      )}

      {/* Pool cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {filtered.map((pool) => {
            const filledSeats = pool.verified_members_count;
            const totalSeats = pool.max_members;
            const progress = totalSeats > 0 ? Math.min(100, (filledSeats / totalSeats) * 100) : 0;

            return (
              <Link
                key={pool.pool_id}
                href={`/admin/pools/${pool.pool_id}`}
                className="group block rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent
                  p-4 sm:p-5 backdrop-blur border border-white/[0.06]
                  shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.04)]
                  hover:border-[#fc4f02]/40
                  hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_30px_rgba(252,79,2,0.15)]
                  transition-all duration-300 hover:translate-y-[-1px]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-[#fc4f02] transition-colors truncate">{pool.name}</h3>
                      <StatusBadge status={pool.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                      <span>${pool.contribution_amount} <span className="text-slate-500">{pool.coin_type}</span></span>
                      <span>{pool.duration_days}d</span>
                      <span>{filledSeats}/{totalSeats} members</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#fc4f02] group-hover:gap-2 transition-all duration-300 flex-shrink-0">
                    Manage
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </span>
                </div>

                {/* Members progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${progress >= 100 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

