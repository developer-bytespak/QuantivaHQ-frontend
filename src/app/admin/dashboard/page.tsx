"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminListPools, type AdminPoolSummary } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

export default function AdminDashboardPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pools, setPools] = useState<AdminPoolSummary[]>([]);

  const loadPools = async () => {
    try {
      const res = await adminListPools({ page: 1, limit: 20 });
      setPools(res.pools);
    } catch (err: unknown) {
      showNotification(
        (err as { message?: string })?.message ?? "Failed to load dashboard",
        "error"
      );
    }
  };

  useEffect(() => {
    loadPools().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPools();
    setRefreshing(false);
    showNotification("Dashboard refreshed", "success");
  };

  const stats = useMemo(() => {
    const byStatus = pools.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: pools.length,
      draft: byStatus["draft"] ?? 0,
      open: byStatus["open"] ?? 0,
      completed: byStatus["completed"] ?? 0,
      cancelled: byStatus["cancelled"] ?? 0,
    };
  }, [pools]);

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Welcome card - enhanced gradient with buttons on right */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fc4f02] via-[#fd6a00] to-[#fd8a00] p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">VC Pool Admin</h2>
            <p className="text-white/90 text-sm sm:text-base">Manage pools and settings from here.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link
              href="/admin/pools"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-all duration-200 border border-white/20 hover:border-white/40 whitespace-nowrap"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              Manage Pools
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-all duration-200 border border-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`h-5 w-5 transition-transform ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              href="/admin/settings"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-all duration-200 border border-white/20 hover:border-white/40 whitespace-nowrap"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Stats cards - All in one line */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Pools Card */}
        <div className="rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[#fc4f02]/20 transition-all duration-300">
          <div className="bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 border border-[#fc4f02]/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-[#fc4f02]/20 border border-[#fc4f02]/30">
                <svg className="w-5 h-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-[#fc4f02] bg-[#fc4f02]/10 px-2 py-0.5 rounded-full border border-[#fc4f02]/20">Total</span>
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Total Pools</p>
            <p className="text-3xl font-black text-white">{loading ? "—" : stats.total}</p>
          </div>
        </div>

        {/* Draft Pools Card */}
        <div className="rounded-xl overflow-hidden hover:shadow-lg hover:shadow-slate-500/20 transition-all duration-300">
          <div className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border border-slate-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-slate-500/20 border border-slate-500/20">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">Draft</span>
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Draft Pools</p>
            <p className="text-2xl font-black text-white mb-2">{loading ? "—" : stats.draft}</p>
            <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden border border-slate-600/20">
              <div className="h-full bg-gradient-to-r from-slate-400 to-slate-500" style={{width: `${Math.min(100, stats.total > 0 ? (stats.draft / stats.total) * 100 : 0)}%`}} />
            </div>
          </div>
        </div>

        {/* Open Pools Card */}
        <div className="rounded-xl overflow-hidden hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/20">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3v-1m2-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Open</span>
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Open Pools</p>
            <p className="text-2xl font-black text-white mb-2">{loading ? "—" : stats.open}</p>
            <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden border border-slate-600/20">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500" style={{width: `${Math.min(100, stats.total > 0 ? (stats.open / stats.total) * 100 : 0)}%`}} />
            </div>
          </div>
        </div>

        {/* Completed Pools Card */}
        <div className="rounded-xl overflow-hidden hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/20">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Completed</span>
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Completed Pools</p>
            <p className="text-2xl font-black text-white mb-2">{loading ? "—" : stats.completed}</p>
            <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden border border-slate-600/20">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500" style={{width: `${Math.min(100, stats.total > 0 ? (stats.completed / stats.total) * 100 : 0)}%`}} />
            </div>
          </div>
        </div>

        {/* Cancelled Pools Card */}
        <div className="rounded-xl overflow-hidden hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300">
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/20">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Cancelled</span>
            </div>
            <p className="text-slate-400 text-xs font-medium mb-1">Cancelled Pools</p>
            <p className="text-2xl font-black text-white mb-2">{loading ? "—" : stats.cancelled}</p>
            <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden border border-slate-600/20">
              <div className="h-full bg-gradient-to-r from-red-400 to-red-500" style={{width: `${Math.min(100, stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0)}%`}} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Pools Grid - Full Width Below */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-white">Recent Pools</h3>
          <Link href="/admin/pools" className="text-xs sm:text-sm font-semibold text-[#fc4f02] hover:opacity-80 transition-opacity">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-8 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-[#fc4f02] border-t-transparent" />
          </div>
        ) : pools.length === 0 ? (
          <div className="rounded-xl sm:rounded-2xl border-2 border-dashed border-[--color-border] bg-[--color-surface]/50 px-6 py-12 text-center">
            <div className="text-4xl mb-3">🏊‍♂️</div>
            <p className="text-base font-semibold text-slate-300 mb-1">No pools yet</p>
            <p className="text-sm text-slate-400">Create your first pool to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pools.slice(0, 6).map((pool) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case "draft": return "bg-slate-500/20 text-slate-200 border border-slate-500/30";
                  case "open": return "bg-blue-500/20 text-blue-200 border border-blue-500/30";
                  case "full": return "bg-purple-500/20 text-purple-200 border border-purple-500/30";
                  case "active": return "bg-green-500/20 text-green-200 border border-green-500/30";
                  case "completed": return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30";
                  case "cancelled": return "bg-red-500/20 text-red-200 border border-red-500/30";
                  default: return "bg-slate-500/20 text-slate-200 border border-slate-500/30";
                }
              };

              const getStatusIcon = (status: string) => {
                switch (status) {
                  case "draft": return "📝";
                  case "open": return "🔓";
                  case "full": return "🔒";
                  case "active": return "⚡";
                  case "completed": return "✓";
                  case "cancelled": return "⊘";
                  default: return "◯";
                }
              };

              return (
                <Link
                  key={pool.pool_id}
                  href={`/admin/pools/${pool.pool_id}`}
                  className="group relative rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden hover:border-[#fc4f02] hover:shadow-lg hover:shadow-[#fc4f02]/20 transition-all duration-200"
                >
                  {/* Pool header with gradient */}
                  <div className="relative bg-gradient-to-r from-[#fc4f02]/80 via-[#fc4f02]/60 to-[#fda300]/40 p-4 border-b border-[#fc4f02]/30">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-white truncate flex-1">
                        {pool.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${getStatusColor(pool.status)}`}>
                        {getStatusIcon(pool.status)} {pool.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-white/60 mb-0.5">Contribution</p>
                        <p className="font-bold text-sm text-white">${pool.contribution_amount}</p>
                      </div>
                      <div>
                        <p className="text-white/60 mb-0.5">Duration</p>
                        <p className="font-bold text-sm text-white">{pool.duration_days} days</p>
                      </div>
                    </div>
                  </div>

                  {/* Pool stats */}
                  <div className="relative p-4 space-y-3">
                    {/* Members progress */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Members</p>
                        <p className="text-lg font-bold text-white">
                          {pool.verified_members_count}/{pool.max_members}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Available</p>
                        <p className="text-lg font-bold text-slate-300">
                          {pool.max_members - pool.verified_members_count}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden border border-slate-600/20">
                      <div 
                        className="h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-300"
                        style={{
                          width: `${pool.max_members > 0 ? (pool.verified_members_count / pool.max_members) * 100 : 0}%`
                        }}
                      />
                    </div>

                    {/* Quick stats */}
                    <div className="pt-2 border-t border-[--color-border]">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Status:</span>
                          <span className="font-semibold text-slate-300 capitalize">{pool.status}</span>
                        </div>
                        <span className="font-mono text-[#fc4f02]">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            </div>
          )}
        </div>
    </div>
  );
}
