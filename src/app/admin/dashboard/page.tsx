"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminListPools, type AdminPoolSummary } from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

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
      {/* Welcome card - orange gradient like Portfolio card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#fc4f02]/90 via-[#fc4f02]/70 to-[#fda300]/50 p-6 sm:p-8 shadow-lg border border-[#fc4f02]/30">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">VC Pool Admin</h2>
        <p className="text-white/90 text-sm sm:text-base mb-6">
          Manage pools and settings from here.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/pools"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#fc4f02] hover:bg-white/95 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            Manage Pools
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
          <p className="text-xs text-slate-400 mb-1">Total pools</p>
          <p className="text-2xl font-bold text-white">{loading ? "—" : stats.total}</p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
          <p className="text-xs text-slate-400 mb-1">Draft pools</p>
          <p className="text-2xl font-bold text-white">{loading ? "—" : stats.draft}</p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
          <p className="text-xs text-slate-400 mb-1">Open pools</p>
          <p className="text-2xl font-bold text-white">{loading ? "—" : stats.open}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[--color-border] px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Recent pools</h3>
          <Link href="/admin/pools" className="text-xs font-semibold text-[#fc4f02] hover:opacity-80">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-300 flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
            Loading…
          </div>
        ) : pools.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-300">
            No pools yet. Create your first pool.
          </div>
        ) : (
          <div className="divide-y divide-[--color-border]">
            {pools.slice(0, 5).map((p) => (
              <Link
                key={p.pool_id}
                href={`/admin/pools/${p.pool_id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[--color-surface-alt]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{p.status}</p>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <div className="font-mono text-white">${p.contribution_amount}</div>
                  <div>
                    {p.verified_members_count}/{p.max_members} members
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
