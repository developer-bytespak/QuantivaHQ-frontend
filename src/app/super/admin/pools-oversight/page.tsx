"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminMe,
  adminSuperListPoolsOversight,
  type SuperAdminPoolOversightRow,
  type SuperAdminPoolsOversightResponse,
} from "@/lib/api/vcpool-admin";
import { Notification, useNotification } from "@/components/common/notification";

type PoolStatusFilter = "all" | "draft" | "open" | "full" | "active" | "completed" | "cancelled";

const STATUS_OPTIONS: Array<{ label: string; value: PoolStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Open", value: "open" },
  { label: "Full", value: "full" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function statusBadge(status: string): string {
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

function formatMoney(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "$0";
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function SuperAdminPoolsOversightPage() {
  const router = useRouter();
  const { notification, showNotification, hideNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<PoolStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SuperAdminPoolsOversightResponse | null>(null);

  const pools = useMemo<SuperAdminPoolOversightRow[]>(() => data?.pools ?? [], [data]);

  const load = async (nextPage: number, nextStatus: PoolStatusFilter) => {
    const res = await adminSuperListPoolsOversight({
      page: nextPage,
      limit: 20,
      status: nextStatus,
    });
    setData(res);
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const me = await adminMe();
        if (!me.is_super_admin) {
          router.replace("/admin/dashboard");
          return;
        }
        await load(1, "all");
      } catch (err: unknown) {
        if (!cancelled) {
          showNotification(
            (err as { message?: string })?.message ?? "Failed to load pools oversight",
            "error"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onStatusChange = async (nextStatus: PoolStatusFilter) => {
    setStatus(nextStatus);
    setPage(1);
    setRefreshing(true);
    try {
      await load(1, nextStatus);
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to filter pools", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load(page, status);
      showNotification("Pools oversight refreshed", "success");
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to refresh pools", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const onPaginate = async (nextPage: number) => {
    setRefreshing(true);
    try {
      await load(nextPage, status);
      setPage(nextPage);
    } catch (err: unknown) {
      showNotification((err as { message?: string })?.message ?? "Failed to load page", "error");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#fc4f02] border-t-transparent" />
      </div>
    );
  }

  const summary = data?.summary;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      <div className="rounded-2xl bg-gradient-to-br from-[#fc4f02] via-[#fd6a00] to-[#fd8a00] p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold">Pools Oversight</h2>
        <p className="mt-1 text-sm text-white/90">
          Super admin view of all pools, owners, status, and performance.
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Pools" value={summary?.total_pools ?? 0} />
        <SummaryCard label="Running" value={(summary?.open ?? 0) + (summary?.full ?? 0) + (summary?.active ?? 0)} />
        <SummaryCard label="Total Invested" value={formatMoney(summary?.total_invested_usdt ?? 0)} />
        <SummaryCard
          label="Total Profit"
          value={formatMoney(summary?.total_profit_usdt ?? 0)}
          valueClassName={(summary?.total_profit_usdt ?? 0) >= 0 ? "text-green-300" : "text-red-300"}
        />
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300" htmlFor="pool-status-filter">
              Status
            </label>
            <select
              id="pool-status-filter"
              value={status}
              onChange={(e) => onStatusChange(e.target.value as PoolStatusFilter)}
              className="rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2 text-sm text-white outline-none focus:border-[#fc4f02]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-lg bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e84700] disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-[--color-border] text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="px-3 py-2">Pool</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Members</th>
                <th className="px-3 py-2">Invested</th>
                <th className="px-3 py-2">Current</th>
                <th className="px-3 py-2">P/L</th>
                {/* <th className="px-3 py-2">Action</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {pools.map((pool) => {
                const profit = Number(pool.total_profit_usdt ?? 0);
                return (
                  <tr key={pool.pool_id} className="text-white/90">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-white">{pool.name}</p>
                      <p className="text-xs text-slate-400">{pool.coin_type} · {pool.duration_days}d</p>
                    </td>
                    <td className="px-3 py-2">
                      <p>{pool.owner_name || "—"}</p>
                      <p className="text-xs text-slate-400">{pool.owner_email}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusBadge(pool.status)}`}>
                        {pool.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {pool.verified_members_count}/{pool.max_members}
                    </td>
                    <td className="px-3 py-2">{formatMoney(pool.total_invested_usdt)}</td>
                    <td className="px-3 py-2">{formatMoney(pool.current_pool_value_usdt)}</td>
                    <td className={`px-3 py-2 font-semibold ${profit >= 0 ? "text-green-300" : "text-red-300"}`}>
                      {profit >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(profit))}
                    </td>
                    {/* <td className="px-3 py-2">
                      <Link
                        href={`/admin/pools/${pool.pool_id}`}
                        className="rounded-md bg-[#fc4f02]/20 px-2 py-1 text-xs font-semibold text-[#ffb08a] hover:bg-[#fc4f02]/30"
                      >
                        View
                      </Link>
                    </td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pools.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No pools found for selected filter.</p>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <p>
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || refreshing}
                onClick={() => onPaginate(pagination.page - 1)}
                className="rounded-lg border border-[--color-border] px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || refreshing}
                onClick={() => onPaginate(pagination.page + 1)}
                className="rounded-lg border border-[--color-border] px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-[#fc4f02]/20 bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10 p-4">
      <p className="text-xs text-slate-300">{label}</p>
      <p className={`mt-1 text-2xl font-bold text-white ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}
