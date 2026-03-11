"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminGetPool } from "@/lib/api/vcpool-admin";
import TopTradesPage from "@/app/(dashboard)/dashboard/top-trades/page";

export default function AdminPoolTopTradesPage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const poolId = String(params?.poolId ?? "");
  const [poolName, setPoolName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!poolId) {
      setLoading(false);
      setError("Missing pool ID");
      return;
    }
    adminGetPool(poolId)
      .then((pool) => setPoolName(pool.name))
      .catch((err: unknown) => {
        setError((err as { message?: string })?.message ?? "Failed to load pool");
      })
      .finally(() => setLoading(false));
  }, [poolId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  if (error || !poolId) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-6 text-sm text-red-100">
        <p className="font-medium">{error ?? "Invalid pool"}</p>
        <button
          type="button"
          onClick={() => router.push("/admin/pools")}
          className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/30"
        >
          Back to Pools
        </button>
      </div>
    );
  }

  return (
    <TopTradesPage
      poolId={poolId}
      poolName={poolName ?? undefined}
    />
  );
}
