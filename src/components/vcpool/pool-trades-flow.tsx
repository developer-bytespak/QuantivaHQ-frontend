"use client";

import { useState } from "react";
import type {
  AdminPoolTrade,
  AdminTradesSummary,
  AdminPoolCapital,
  AdminPoolDetails,
} from "@/lib/api/vcpool-admin";

// --- Format helpers (Top Trades style) ---
function formatUsdt(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = Number(String(value));
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// --- Close Trade Modal ---
function CloseTradeModal({
  open,
  trade,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  trade: AdminPoolTrade | null;
  onClose: () => void;
  onSubmit: (tradeId: string, exitPrice: number) => void;
  submitting: boolean;
}) {
  const [exitPrice, setExitPrice] = useState("");
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  if (!open || !trade) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(exitPrice);
    if (!(p > 0)) return;
    onSubmit(trade.trade_id, p);
    onClose();
    setExitPrice("");
  };

  const handleFetchCurrentPrice = async () => {
    const symbol = trade.asset_pair.replace(/\s*\/\s*/g, "").replace(/\s+/g, "").toUpperCase();
    const pair = symbol.endsWith("USDT") ? symbol : symbol + "USDT";
    setFetchingPrice(true);
    setPriceError(null);
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.price) throw new Error("No price in response");
      setExitPrice(String(parseFloat(data.price)));
    } catch {
      setPriceError("Could not fetch price. Enter manually.");
    } finally {
      setFetchingPrice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Close trade</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-slate-400">
            {trade.asset_pair} · {trade.action} · qty {trade.quantity} @ {formatUsdt(trade.entry_price_usdt)} USDT
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Exit price (USDT)</label>
              <button
                type="button"
                onClick={handleFetchCurrentPrice}
                disabled={fetchingPrice || submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
              >
                {fetchingPrice ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-blue-300 border-t-transparent" />
                    Fetching…
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Use current price
                  </>
                )}
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="0"
              value={exitPrice}
              onChange={(e) => { setExitPrice(e.target.value); setPriceError(null); }}
              placeholder="e.g. 62000"
              className="w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
              autoFocus
            />
            {priceError && (
              <p className="text-xs text-red-400">{priceError}</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !exitPrice || Number(exitPrice) <= 0}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? "Closing…" : "Confirm close"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[--color-border] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface PoolTradesFlowProps {
  pool: AdminPoolDetails | null;
  trades: AdminPoolTrade[];
  tradesSummary: AdminTradesSummary | null;
  tradesLoading: boolean;
  tradeStatusFilter: "open" | "closed" | "all";
  onFilterChange: (f: "open" | "closed" | "all") => void;
  onCloseTrade: (tradeId: string, exitPrice: number) => void;
  saving: boolean;
  actionSubmitting: string | null;
  poolCapital?: AdminPoolCapital | null;
}

export function PoolTradesFlow({
  pool,
  trades,
  tradesSummary,
  tradesLoading,
  tradeStatusFilter,
  onFilterChange,
  onCloseTrade,
  saving,
  actionSubmitting,
  poolCapital,
}: PoolTradesFlowProps) {
  const [closeModalTrade, setCloseModalTrade] = useState<AdminPoolTrade | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs sm:text-sm text-slate-400">
          Trade history for this pool. Use Top Trades to execute new trades.
        </p>
      </div>

      {/* Summary cards (Top Trades style) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
          <p className="text-xs text-slate-400">Open trades</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {tradesSummary !== null ? tradesSummary.open_trades : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
          <p className="text-xs text-slate-400">Closed trades</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {tradesSummary !== null ? tradesSummary.closed_trades : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
          <p className="text-xs text-slate-400">Realized PnL</p>
          <p className={`mt-1 text-xl font-semibold ${tradesSummary && tradesSummary.realized_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {tradesSummary !== null ? `${formatUsdt(tradesSummary.realized_pnl)} USDT` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
          <p className="text-xs text-slate-400">Pool value</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {pool ? `${formatUsdt(pool.current_pool_value_usdt)} USDT` : "—"}
          </p>
        </div>
      </div>

      {/* Capital utilization bar */}
      {poolCapital && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface-alt]/60 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-2">
            <span className="text-slate-400">Capital</span>
            <span className="text-xs text-slate-500">
              <span className="text-white font-medium">${formatUsdt(poolCapital.total_usdt)}</span> total
              &nbsp;·&nbsp;
              <span className="text-amber-400 font-medium">${formatUsdt(poolCapital.allocated_usdt)}</span> allocated
              &nbsp;·&nbsp;
              <span className="text-emerald-400 font-medium">${formatUsdt(poolCapital.available_usdt)}</span> available
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all"
              style={{ width: `${Math.min(100, poolCapital.utilization_pct)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">
            {poolCapital.utilization_pct.toFixed(1)}% utilized
          </p>
        </div>
      )}

      {/* Filter pills (Top Trades style) */}
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-[--color-surface-alt]/60 p-1.5">
        {(["open", "closed", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all capitalize ${
              tradeStatusFilter === f
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Trades table (desktop) / cards (mobile) */}
      {tradesLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[--color-border] bg-[--color-surface]/50 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
          <span className="text-sm text-slate-400">Loading trades…</span>
        </div>
      ) : trades.length === 0 ? (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 py-16 text-center">
          <p className="text-sm text-slate-400">No trades yet.</p>
          <p className="mt-1 text-xs text-slate-500">Use the Top Trade screen to execute trades for this pool.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-[--color-border] bg-[--color-surface]/50 md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[--color-border] text-slate-400">
                  <th className="px-4 py-3 font-medium">Pair</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Entry (USDT)</th>
                  <th className="px-4 py-3 font-medium">Exit (USDT)</th>
                  <th className="px-4 py-3 font-medium">PnL</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.trade_id} className="border-b border-[--color-border]/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{t.asset_pair}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.action === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {t.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.quantity}</td>
                    <td className="px-4 py-3 text-slate-300">{formatUsdt(t.entry_price_usdt)}</td>
                    <td className="px-4 py-3 text-slate-300">{t.exit_price_usdt ? formatUsdt(t.exit_price_usdt) : "—"}</td>
                    <td className="px-4 py-3">
                      {t.pnl_usdt != null ? (
                        <span className={Number(t.pnl_usdt) >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {formatUsdt(t.pnl_usdt)} USDT
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${t.is_open ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-300"}`}>
                        {t.is_open ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(t.is_open ? t.traded_at : t.closed_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {t.is_open && (
                        <button
                          type="button"
                          onClick={() => setCloseModalTrade(t)}
                          disabled={actionSubmitting !== null}
                          className="rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-600/30 disabled:opacity-60"
                        >
                          {actionSubmitting === t.trade_id ? "…" : "Close"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {trades.map((t) => (
              <div
                key={t.trade_id}
                className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{t.asset_pair}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${t.action === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {t.action}
                      </span>
                      <span>{t.quantity} @ {formatUsdt(t.entry_price_usdt)}</span>
                      <span className={t.is_open ? "text-amber-400" : "text-slate-400"}>{t.is_open ? "Open" : "Closed"}</span>
                    </p>
                    {t.pnl_usdt != null && !t.is_open && (
                      <p className={`mt-1 text-sm font-medium ${Number(t.pnl_usdt) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        PnL: {formatUsdt(t.pnl_usdt)} USDT
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">{formatDate(t.is_open ? t.traded_at : t.closed_at)}</p>
                  </div>
                  {t.is_open && (
                    <button
                      type="button"
                      onClick={() => setCloseModalTrade(t)}
                      disabled={actionSubmitting !== null}
                      className="shrink-0 rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-600/30 disabled:opacity-60"
                    >
                      {actionSubmitting === t.trade_id ? "…" : "Close"}
                    </button>
                  )}
                </div>
                {t.notes && <p className="mt-2 text-xs text-slate-500 border-t border-[--color-border]/50 pt-2">{t.notes}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      <CloseTradeModal
        open={!!closeModalTrade}
        trade={closeModalTrade}
        onClose={() => setCloseModalTrade(null)}
        onSubmit={onCloseTrade}
        submitting={actionSubmitting !== null}
      />
    </div>
  );
}
