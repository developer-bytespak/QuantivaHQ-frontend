"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminExchangesService } from "@/lib/api/admin-exchanges.service";
import TopTradesPage from "@/app/(dashboard)/dashboard/top-trades/page";

export default function AdminPoolTopTradePage() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const poolId = String(params?.poolId ?? "");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<"crypto" | "stocks" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!poolId) {
      setLoading(false);
      return;
    }
    adminExchangesService
      .getActiveConnectionByType("crypto")
      .then((res) => {
        if (res?.data?.connection_id && res?.data?.exchange) {
          setConnectionId(res.data.connection_id);
          setConnectionType("crypto");
          return undefined;
        }
        return adminExchangesService.getActiveConnectionByType("stocks");
      })
      .then((res) => {
        if (res?.data?.connection_id && res?.data?.exchange) {
          setConnectionId(res.data.connection_id);
          setConnectionType("stocks");
        }
      })
      .finally(() => setLoading(false));
  }, [poolId]);

  if (!poolId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-slate-400">Invalid pool.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(`/admin/pools/${poolId}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-[--color-border] bg-[--color-surface]/50 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-[--color-surface] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to pool
        </button>
        <span className="text-xs text-slate-400">
          Trades will be linked to this VC Pool
        </span>
      </div>
      {!connectionId && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Connect an exchange in Admin Settings → Exchange Configuration to place pool trades from this screen.
        </div>
      )}
      <TopTradesPage
        vcPoolId={poolId}
        connectionId={connectionId ?? undefined}
        connectionType={connectionType ?? undefined}
      />
    </div>
  );
}
