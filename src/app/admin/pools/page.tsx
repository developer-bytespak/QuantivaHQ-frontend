"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListPools,
  type AdminPoolSummary,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

function getStatusColor(status: string): string {
  switch (status) {
    case "draft":
      return "bg-slate-500/20 text-slate-200 border border-slate-500/30";
    case "open":
      return "bg-blue-500/20 text-blue-200 border border-blue-500/30";
    case "full":
      return "bg-purple-500/20 text-purple-200 border border-purple-500/30";
    case "active":
      return "bg-green-500/20 text-green-200 border border-green-500/30";
    case "completed":
      return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-200 border border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-200 border border-slate-500/30";
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case "draft":
      return "📝";
    case "open":
      return "🔓";
    case "full":
      return "🔒";
    case "active":
      return "⚡";
    case "completed":
      return "✓";
    case "cancelled":
      return "⊘";
    default:
      return "◯";
  }
}

export default function AdminPoolsPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [pools, setPools] = useState<AdminPoolSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListPools({ page: 1, limit: 20 })
      .then((res) => setPools(res.pools))
      .catch((err: unknown) => {
        showNotification((err as { message?: string })?.message ?? "Failed to load pools", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Pools</h1>
          <p className="text-sm text-slate-400">
            Create, publish, and manage VC pools. Monitor status and performance.
          </p>
        </div>
        <Link
          href="/admin/pools/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#fc4f02] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity w-fit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Pool
        </Link>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent mx-auto mb-3" />
            <p className="text-slate-400">Loading pools...</p>
          </div>
        </div>
      )}

      {!loading && pools.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[--color-border] bg-[--color-surface]/50 px-6 py-12 text-center">
          <div className="text-4xl mb-3">🏊‍♂️</div>
          <p className="text-lg font-semibold text-slate-300 mb-1">No pools yet</p>
          <p className="text-sm text-slate-400">Create your first pool to get started.</p>
        </div>
      )}

      {!loading && pools.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => (
            <Link
              key={pool.pool_id}
              href={`/admin/pools/${pool.pool_id}`}
              className="group relative rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden hover:border-[#fc4f02]/50 transition-all hover:shadow-lg hover:shadow-[#fc4f02]/10"
            >
              {/* Gradient background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* ── Pool header with gradient ── */}
              <div className="relative bg-gradient-to-r from-[#fc4f02]/80 via-[#fc4f02]/60 to-[#fda300]/40 p-4 border-b border-[#fc4f02]/30">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white truncate">
                      {pool.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${getStatusColor(pool.status)}`}>
                    {getStatusIcon(pool.status)} {pool.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-white/85">
                  <div>
                    <p className="text-white/60 mb-0.5 text-xs">Contribution</p>
                    <p className="font-bold text-sm">${pool.contribution_amount} {pool.coin_type}</p>
                  </div>
                  <div>
                    <p className="text-white/60 mb-0.5 text-xs">Duration</p>
                    <p className="font-bold text-sm">{pool.duration_days} days</p>
                  </div>
                </div>
              </div>

              {/* ── Pool stats ── */}
              <div className="relative p-4 space-y-3">
                {/* Members */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Members</p>
                    <p className="text-lg font-bold text-white">
                      {pool.verified_members_count}/{pool.max_members}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Available seats</p>
                    <p className="text-lg font-bold text-slate-300">
                      {pool.max_members - pool.verified_members_count - pool.reserved_seats_count}
                    </p>
                  </div>
                </div>

                {/* Financial metrics if available */}
                {(pool.total_invested_usdt || pool.current_pool_value_usdt) && (
                  <>
                    <div className="border-t border-[--color-border] pt-3">
                      <p className="text-xs text-slate-400 font-medium mb-2">Performance</p>
                      <div className="grid grid-cols-2 gap-2">
                        {pool.total_invested_usdt && (
                          <div className="rounded-lg bg-[--color-surface-alt] p-2">
                            <p className="text-xs text-slate-400">Invested</p>
                            <p className="text-sm font-semibold text-white">
                              ${Number(pool.total_invested_usdt).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                        )}
                        {pool.current_pool_value_usdt && (
                          <div className="rounded-lg bg-[--color-surface-alt] p-2">
                            <p className="text-xs text-slate-400">Current</p>
                            <p className="text-sm font-semibold text-white">
                              ${Number(pool.current_pool_value_usdt).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profit/Loss */}
                    {pool.total_profit_usdt && (
                      <div className={`rounded-lg p-3 ${
                        Number(pool.total_profit_usdt) >= 0
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-red-500/10 border border-red-500/20'
                      }`}>
                        <p className="text-xs text-slate-400 font-medium mb-1">Profit/Loss</p>
                        <p className={`text-base font-bold ${
                          Number(pool.total_profit_usdt) >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {Number(pool.total_profit_usdt) >= 0 ? '+' : ''}${Math.abs(Number(pool.total_profit_usdt)).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Footer with timestamps */}
                <div className="border-t border-[--color-border] pt-3 text-xs text-slate-400">
                  <p className="flex justify-between">
                    <span>Created</span>
                    <span>{new Date(pool.created_at).toLocaleDateString()}</span>
                  </p>
                  {pool.started_at && (
                    <p className="flex justify-between mt-1">
                      <span>Started</span>
                      <span>{new Date(pool.started_at).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* ── Hover action indicator ── */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm rounded-xl">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white mb-1">View Details</p>
                  <svg className="w-5 h-5 text-[#fc4f02] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

