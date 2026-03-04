"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminListPools, type AdminPoolSummary } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

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

export default function AdminDashboardPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<AdminPoolSummary[]>([]);

  useEffect(() => {
    adminListPools({ page: 1, limit: 20 })
      .then((res) => setPools(res.pools))
      .catch((err: unknown) => {
        showNotification(
          (err as { message?: string })?.message ?? "Failed to load dashboard",
          "error"
        );
      })
      .finally(() => setLoading(false));
  }, [showNotification]);

  const stats = useMemo(() => {
    const byStatus = pools.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: pools.length,
      draft: byStatus["draft"] ?? 0,
      open: byStatus["open"] ?? 0,
      active: byStatus["active"] ?? 0,
      completed: byStatus["completed"] ?? 0,
      full: byStatus["full"] ?? 0,
    };
  }, [pools]);

  const statCards = [
    { label: "Total Pools", value: stats.total, icon: (
      <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    ), accent: true },
    { label: "Draft", value: stats.draft, icon: (
      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    ) },
    { label: "Open / Full", value: `${stats.open} / ${stats.full}`, icon: (
      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ) },
    { label: "Active", value: stats.active, icon: (
      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    ) },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#fc4f02]/90 via-[#fc4f02]/70 to-[#fda300]/50 p-6 sm:p-8 shadow-[0_20px_40px_rgba(252,79,2,0.2)] border border-[#fc4f02]/30">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#fda300]/20 blur-3xl" />
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">VC Pool Admin</h2>
          <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg">
            Manage pools, review payments, track trades, and monitor performance — all from one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/pools"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#fc4f02] hover:bg-white/95 transition-colors shadow-lg"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" /></svg>
              Manage Pools
            </Link>
            <Link
              href="/admin/pools/create"
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Pool
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${
              card.accent
                ? "border-[#fc4f02]/30 bg-gradient-to-br from-[#fc4f02]/15 via-[#fda300]/8 to-transparent shadow-[0_0_20px_rgba(252,79,2,0.08)]"
                : "border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-transparent"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-400 mb-1 sm:mb-2">{card.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{loading ? "—" : card.value}</p>
              </div>
              <div className={`flex-shrink-0 flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl ${card.accent ? "bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10" : "bg-white/[0.05]"}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent pools */}
      <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 sm:px-6 py-4">
          <h3 className="text-sm sm:text-base font-semibold text-white">Recent Pools</h3>
          <Link href="/admin/pools" className="text-xs sm:text-sm font-semibold text-[#fc4f02] hover:text-[#fda300] transition-colors">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-12">
            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]" />
            <span className="text-sm text-slate-400">Loading…</span>
          </div>
        ) : pools.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-400">No pools yet. Create your first pool to get started.</p>
            <Link href="/admin/pools/create" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/25 hover:shadow-[#fc4f02]/40 hover:scale-[1.02] transition-all">
              Create pool
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {pools.slice(0, 5).map((p) => (
              <Link
                key={p.pool_id}
                href={`/admin/pools/${p.pool_id}`}
                className="group flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white group-hover:text-[#fc4f02] transition-colors">{p.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="text-[10px] text-slate-500">{p.verified_members_count}/{p.max_members} members</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-white">${p.contribution_amount}</div>
                  <div className="text-[10px] text-slate-500">{p.coin_type}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
