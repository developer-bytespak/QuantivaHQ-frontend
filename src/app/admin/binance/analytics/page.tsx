"use client";

import { useEffect, useState } from "react";
import {
  adminBinanceSummary,
  type BinanceSummary,
} from "@/lib/api/vcpool-admin";
import { useNotification, Notification } from "@/components/common/notification";

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.05] to-transparent p-5">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[--color-border] last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function DepositStatusBadge({ status }: { status: number }) {
  const map: Record<number, { label: string; cls: string }> = {
    0: { label: "Pending", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
    1: { label: "Success", cls: "bg-green-500/20 text-green-300 border-green-500/30" },
    6: { label: "Completed", cls: "bg-green-500/20 text-green-300 border-green-500/30" },
  };
  const s = map[status] ?? { label: `Status ${status}`, cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function AdminAnalyticsPage() {
  const { notification, showNotification, hideNotification } = useNotification();
  const [summary, setSummary] = useState<BinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);

    adminBinanceSummary()
      .then((res) => {
        setSummary(res.data);
      })
      .catch((err: unknown) => {
        const e = err as { response?: { status?: number }; message?: string };
        let msg = "Failed to load analytics";
        if (e?.response?.status === 404) msg = "API endpoint not found (404).";
        else if (e?.response?.status === 401) msg = "Unauthorized (401). Check admin authentication.";
        else if (e?.message) msg = e.message;
        setError(msg);
        showNotification(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const netAmount = summary
    ? (summary.summary?.total_deposit_amount ?? 0) - (summary.summary?.total_withdrawal_amount ?? 0)
    : 0;

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#fc4f02] to-[#fda300] bg-clip-text text-transparent mb-1">
            Binance Analytics
          </h1>
          <p className="text-sm text-slate-300">
            Summary of your Binance account activity and balances
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="shrink-0 rounded-xl border border-[--color-border] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 disabled:opacity-60 transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          <p className="font-semibold mb-1">Error Loading Analytics</p>
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={() => { setError(null); fetchData(); }}
            className="mt-3 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {summary && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Total Value (USD)"
              value={`$${(summary.account_info?.totalValueUSD ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              color="text-white"
            />
            <KpiCard
              label="Net Flow"
              value={`$${netAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
              color={netAmount >= 0 ? "text-green-400" : "text-red-400"}
            />
            <KpiCard
              label="Total Deposits"
              value={summary.summary?.total_deposits ?? 0}
              sub={`$${(summary.summary?.total_deposit_amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
              color="text-green-400"
            />
            <KpiCard
              label="Total Withdrawals"
              value={summary.summary?.total_withdrawals ?? 0}
              sub={`$${(summary.summary?.total_withdrawal_amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
              color="text-blue-400"
            />
            <KpiCard
              label="Assets"
              value={summary.account_info?.assets?.length ?? 0}
              sub="tracked coins"
              color="text-[#fda300]"
            />
          </div>

          {/* Summary stats row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Transaction Summary</h2>
              <StatRow label="Total Deposits" value={summary.summary?.total_deposits ?? "—"} />
              <StatRow
                label="Total Deposited"
                value={`$${(summary.summary?.total_deposit_amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
              />
              <StatRow label="Total Withdrawals" value={summary.summary?.total_withdrawals ?? "—"} />
              <StatRow
                label="Total Withdrawn"
                value={`$${(summary.summary?.total_withdrawal_amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
              />
              <StatRow
                label="Net Amount"
                value={`$${netAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
              />
            </div>

            {/* Asset Balances */}
            {(summary.account_info?.assets?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
                <h2 className="text-lg font-semibold text-white mb-4">Asset Balances</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[--color-border]">
                        <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Asset</th>
                        <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Free</th>
                        <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Locked</th>
                        <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.account_info.assets.map((a) => (
                        <tr key={a.symbol} className="border-b border-[--color-border] hover:bg-white/[0.02]">
                          <td className="py-3 font-semibold text-white">{a.symbol}</td>
                          <td className="py-3 font-mono text-slate-300">{a.free}</td>
                          <td className="py-3 font-mono text-slate-300">{a.locked}</td>
                          <td className="py-3 font-mono text-white font-semibold">{a.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Recent Deposits */}
          {(summary.deposits?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Recent Deposits
                <span className="ml-2 text-sm font-normal text-slate-400">({summary.deposits.length})</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[--color-border]">
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Coin</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Amount</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Network</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">TX ID</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Status</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.deposits.map((d) => (
                      <tr key={d.id} className="border-b border-[--color-border] hover:bg-white/[0.02]">
                        <td className="py-3 font-semibold text-white">{d.coin}</td>
                        <td className="py-3 font-mono text-white">{d.amount}</td>
                        <td className="py-3 text-slate-300">{d.network}</td>
                        <td className="py-3 font-mono text-slate-400 max-w-[160px] truncate" title={d.txId}>
                          {d.txId.slice(0, 24)}...
                        </td>
                        <td className="py-3"><DepositStatusBadge status={d.status} /></td>
                        <td className="py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(d.insertTime).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Withdrawals */}
          {(summary.withdrawals?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Recent Withdrawals
                <span className="ml-2 text-sm font-normal text-slate-400">({summary.withdrawals.length})</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[--color-border]">
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Coin</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Amount</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Network</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Address</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Status</th>
                      <th className="pb-3 text-xs font-semibold uppercase text-slate-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-[--color-border] hover:bg-white/[0.02]">
                        <td className="py-3 font-semibold text-white">{w.coin}</td>
                        <td className="py-3 font-mono text-white">{w.amount}</td>
                        <td className="py-3 text-slate-300">{w.network}</td>
                        <td className="py-3 font-mono text-slate-400 max-w-[120px] truncate" title={w.address}>
                          {w.address.slice(0, 14)}...
                        </td>
                        <td className="py-3"><DepositStatusBadge status={w.status} /></td>
                        <td className="py-3 text-xs text-slate-400 whitespace-nowrap">
                          {w.completeTime || w.applyTime || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}