"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getVcPoolById, type VcPoolDetails } from "@/lib/api/vc-pools";
import useSubscriptionStore from "@/state/subscription-store";
import { FeatureType, PlanTier } from "@/mock-data/subscription-dummy-data";
import { LockedFeatureOverlay } from "@/components/common/feature-guard";

export default function VcPoolDetailPage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const { canAccessFeature } = useSubscriptionStore();
  const canAccessVCPool = canAccessFeature(FeatureType.VC_POOL_ACCESS);

  const [pool, setPool] = useState<VcPoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccessVCPool) {
      setLoading(false);
      return;
    }
    const id = params.poolId;
    if (!id) return;
    setLoading(true);
    setError(null);
    getVcPoolById(String(id))
      .then(setPool)
      .catch((err: any) => {
        setError(err?.message || "Failed to load pool");
      })
      .finally(() => setLoading(false));
  }, [params.poolId, canAccessVCPool]);

  return (
    <div className="relative">
      {!canAccessVCPool && (
        <LockedFeatureOverlay
          featureName="VC Pool Access"
          requiredTier={PlanTier.ELITE}
          message="VC pools are available only for ELITE members. Upgrade your plan to access pool details."
        />
      )}

      <button
        onClick={() => router.push("/dashboard/vc-pool")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to VC pools
      </button>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && pool && canAccessVCPool && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-b from-[#fc4f02]/90 via-[#fc4f02]/70 to-[#fda300]/50 p-6 sm:p-8 border border-[#fc4f02]/30">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {pool.name}
            </h1>
            {pool.description && (
              <p className="text-sm text-white/90 max-w-2xl mb-4">
                {pool.description}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-3 text-xs text-white/90">
              <div>
                <p className="mb-1 text-white/70">Contribution per seat</p>
                <p className="text-lg font-semibold">
                  ${pool.contribution_amount} {pool.coin_type}
                </p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Duration</p>
                <p className="text-lg font-semibold">
                  {pool.duration_days} days
                </p>
              </div>
              <div>
                <p className="mb-1 text-white/70">Available seats</p>
                <p className="text-lg font-semibold">
                  {pool.available_seats}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300">
              <h2 className="mb-3 text-sm font-semibold text-white">
                Pool details
              </h2>
              <dl className="space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Status</dt>
                  <dd className="font-medium capitalize">{pool.status}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Max members</dt>
                  <dd className="font-medium">{pool.max_members}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Verified members</dt>
                  <dd className="font-medium">{pool.verified_members_count}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Reserved seats</dt>
                  <dd className="font-medium">{pool.reserved_seats_count}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Pool fee</dt>
                  <dd className="font-medium">{pool.pool_fee_percent}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Payment window</dt>
                  <dd className="font-medium">
                    {pool.payment_window_minutes} minutes
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 text-sm text-slate-300 space-y-4">
              <h2 className="text-sm font-semibold text-white">
                Payment instructions
              </h2>
              <p className="text-xs text-slate-400">
                In Phase 1C you will be able to reserve a seat and upload your
                Binance transfer proof directly from here.
              </p>
              <div className="rounded-lg bg-[--color-surface-alt] px-4 py-3 text-xs">
                <p className="mb-1 text-slate-400">Admin Binance UID</p>
                <p className="font-mono text-sm text-white">
                  {pool.admin_binance_uid || "Not configured"}
                </p>
              </div>
              <button
                disabled
                className="w-full rounded-lg bg-[#fc4f02]/60 px-4 py-2 text-sm font-semibold text-white cursor-not-allowed"
              >
                Join pool (coming in Phase 1C)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

