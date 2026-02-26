"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListPools,
  type AdminPoolSummary,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

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
  }, [showNotification]);

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Pools</h1>
          <p className="text-sm text-slate-400">
            Create, publish, and clone VC pools.
          </p>
        </div>
        <Link
          href="/admin/pools/create"
          className="rounded-xl bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + New pool
        </Link>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {!loading && pools.length === 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-6 text-sm text-slate-300">
          No pools yet. Create your first pool to get started.
        </div>
      )}

      {!loading && pools.length > 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] overflow-hidden">
          <div className="grid grid-cols-5 gap-4 border-b border-[--color-border] px-4 py-3 text-xs text-slate-400">
            <div>Name</div>
            <div>Status</div>
            <div>Contribution</div>
            <div>Members</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-[--color-border]">
            {pools.map((pool) => (
              <Link
                key={pool.pool_id}
                href={`/admin/pools/${pool.pool_id}`}
                className="grid grid-cols-5 gap-4 px-4 py-3 text-sm text-slate-200 hover:bg-[--color-surface-alt]"
              >
                <div className="truncate font-medium">{pool.name}</div>
                <div className="capitalize text-xs text-slate-300">
                  {pool.status}
                </div>
                <div className="text-xs text-slate-300">
                  ${pool.contribution_amount} {pool.coin_type}
                </div>
                <div className="text-xs text-slate-300">
                  {pool.verified_members_count}/{pool.max_members}
                </div>
                <div className="text-right text-xs text-[#fc4f02]">
                  View
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

