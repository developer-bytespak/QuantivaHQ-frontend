"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMyPools, type MyPoolMembership } from "@/lib/api/vc-pools";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

function formatUsd(n: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function MyPoolsPage() {
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);
  const [pools, setPools] = useState<MyPoolMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccessVCPool) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getMyPools()
      .then((res) => setPools(res.pools))
      .catch((err: unknown) => setError((err as { message?: string })?.message ?? "Failed to load my pools"))
      .finally(() => setLoading(false));
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
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to VC pools
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">My pools</h1>
        <p className="text-sm text-slate-400 mb-6">Your pool memberships, current value, and cancellation status.</p>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && pools.length === 0 && (
          <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt] p-8 text-center text-slate-400">
            <p>You are not a member of any pool yet.</p>
            <Link href="/dashboard/vc-pool" className="mt-4 inline-block text-[#fc4f02] hover:underline font-medium">
              Browse available pools
            </Link>
          </div>
        )}

        {!loading && !error && pools.length > 0 && (
          <div className="space-y-4">
            {pools.map((item) => (
              <div
                key={item.membership.pool_id}
                className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 hover:border-[#fc4f02]/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{item.membership.pool_name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">
                      Status: {item.membership.pool_status}
                      {item.membership.started_at && (
                        <> · Started {new Date(item.membership.started_at).toLocaleDateString()}</>
                      )}
                      {item.membership.end_date && <> · Ends {new Date(item.membership.end_date).toLocaleDateString()}</>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/vc-pool/${item.membership.pool_id}`)}
                    className="rounded-lg bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    View pool
                  </button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">My investment</p>
                    <p className="font-semibold text-white">{formatUsd(item.my_investment.invested_amount)}</p>
                    <p className="text-xs text-slate-500">Share: {item.my_investment.share_percent}%</p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">My current value</p>
                    <p className="font-semibold text-white">{formatUsd(item.my_value.current_value)}</p>
                    <p className={`text-xs ${item.my_value.profit_loss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      P/L: {item.my_value.profit_loss >= 0 ? "+" : ""}{formatUsd(item.my_value.profit_loss)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">Pool value</p>
                    <p className="font-semibold text-white">{formatUsd(item.pool_performance.current_pool_value)}</p>
                    <p className="text-xs text-slate-500">Profit: {formatUsd(item.pool_performance.total_profit)}</p>
                  </div>
                  <div className="rounded-lg bg-[--color-surface-alt] p-3">
                    <p className="text-xs text-slate-400">Cancellation</p>
                    {item.cancellation ? (
                      <>
                        <p className="font-semibold capitalize text-white">{item.cancellation.status}</p>
                        <p className="text-xs text-slate-500">
                          Refund: {formatUsd(item.cancellation.refund_amount)} {item.membership.coin_type}
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-500">None</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
