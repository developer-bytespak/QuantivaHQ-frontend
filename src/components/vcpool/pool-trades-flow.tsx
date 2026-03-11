"use client";

import { useState } from "react";
import type {
  AdminPoolTrade,
  AdminTradesSummary,
  AdminOpenTradeRequest,
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

// --- Open Trade Modal ---
function OpenTradeModal({
  open,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: AdminOpenTradeRequest) => void;
  saving: boolean;
}) {
  const [assetPair, setAssetPair] = useState("BTCUSDT");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(quantity);
    const p = Number(entryPrice);
    if (!assetPair.trim() || (action !== "BUY" && action !== "SELL") || !(q > 0) || !(p > 0)) return;
    onSubmit({
      asset_pair: assetPair.trim(),
      action,
      quantity: q,
      entry_price_usdt: p,
      notes: notes.trim() || null,
    });
    onClose();
    setQuantity("");
    setEntryPrice("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Open trade</h3>
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
          <label className="block text-sm text-slate-400">
            Asset pair
            <input
              type="text"
              value={assetPair}
              onChange={(e) => setAssetPair(e.target.value)}
              placeholder="e.g. BTCUSDT"
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Action
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as "BUY" | "SELL")}
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm text-slate-400">
              Quantity
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.001"
                className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Entry price (USDT)
              <input
                type="number"
                step="any"
                min="0"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="60000"
                className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
              />
            </label>
          </div>
          <label className="block text-sm text-slate-400">
            Notes (optional)
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Test BTC buy"
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#fc4f02] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Opening…" : "Open trade"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
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

  if (!open || !trade) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(exitPrice);
    if (!(p > 0)) return;
    onSubmit(trade.trade_id, p);
    onClose();
    setExitPrice("");
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
          <label className="block text-sm text-slate-400">
            Exit price (USDT)
            <input
              type="number"
              step="any"
              min="0"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="e.g. 62000"
              className="mt-1.5 w-full rounded-lg border border-[--color-border] bg-[--color-surface-alt] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
              autoFocus
            />
          </label>
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
  onOpenTrade: (body: AdminOpenTradeRequest) => void;
  onCloseTrade: (tradeId: string, exitPrice: number) => void;
  saving: boolean;
  actionSubmitting: string | null;
}

// --- Trade detail overlay (Top Trades style): shows poolId + trade for tracking ---
function TradeDetailOverlay({
  open,
  trade,
  poolName,
  poolId,
  onClose,
  onCloseTrade,
  actionSubmitting,
  formatUsdt,
  formatDate,
}: {
  open: boolean;
  trade: AdminPoolTrade | null;
  poolName: string | null;
  poolId: string;
  onClose: () => void;
  onRequestCloseTrade: (t: AdminPoolTrade) => void;
  actionSubmitting: string | null;
  formatUsdt: (v: string | number | null | undefined) => string;
  formatDate: (v: string | null | undefined) => string;
}) {
  if (!open || !trade) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-white/[0.15] to-white/[0.05] p-4 sm:p-6 shadow-2xl shadow-black/50 backdrop-blur border border-[--color-border]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Trade Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* VC Pool badge: poolId + trade for differentiation */}
        <div className="mb-4 rounded-xl bg-[#fc4f02]/15 border border-[#fc4f02]/30 px-4 py-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider">VC Pool</p>
          <p className="font-semibold text-white mt-0.5">
            {poolName || poolId} <span className="text-slate-400 font-normal">· {trade.asset_pair}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Pool ID: {poolId}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                trade.action === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {trade.action}
            </span>
            <span className="text-sm font-medium text-white">{trade.asset_pair}</span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                trade.is_open ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-300"
              }`}
            >
              {trade.is_open ? "Open" : "Closed"}
            </span>
          </div>
          <div className="rounded-xl bg-white/[0.06] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity</span>
              <span className="text-white font-medium">{trade.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Entry (USDT)</span>
              <span className="text-white font-medium">{formatUsdt(trade.entry_price_usdt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Exit (USDT)</span>
              <span className="text-white font-medium">{trade.exit_price_usdt ? formatUsdt(trade.exit_price_usdt) : "—"}</span>
            </div>
            {trade.pnl_usdt != null && !trade.is_open && (
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-slate-400">PnL</span>
                <span className={Number(trade.pnl_usdt) >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
                  {formatUsdt(trade.pnl_usdt)} USDT
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Traded at</span>
              <span className="text-slate-300">{formatDate(trade.traded_at)}</span>
            </div>
            {trade.closed_at && (
              <div className="flex justify-between">
                <span className="text-slate-400">Closed at</span>
                <span className="text-slate-300">{formatDate(trade.closed_at)}</span>
              </div>
            )}
            {trade.notes && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-slate-400 block mb-1">Notes</span>
                <p className="text-slate-300 text-xs">{trade.notes}</p>
              </div>
            )}
          </div>
          {trade.is_open && (
            <button
              type="button"
              onClick={() => onRequestCloseTrade(trade)}
              disabled={actionSubmitting !== null}
              className="w-full rounded-xl bg-amber-600/20 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-600/30 disabled:opacity-60"
            >
              {actionSubmitting === trade.trade_id ? "Closing…" : "Close trade"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PoolTradesFlow({
  pool,
  trades,
  tradesSummary,
  tradesLoading,
  tradeStatusFilter,
  onFilterChange,
  onOpenTrade,
  onCloseTrade,
  saving,
  actionSubmitting,
}: PoolTradesFlowProps) {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [closeModalTrade, setCloseModalTrade] = useState<AdminPoolTrade | null>(null);
  const [detailTrade, setDetailTrade] = useState<AdminPoolTrade | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Trades · Pool name (admin pool context only) */}
      <div className="border-b border-[--color-border] pb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          {pool?.name ? (
            <>
              <span className="text-[#fc4f02]">Top Trades</span>
              <span className="text-slate-400 font-normal mx-2">·</span>
              <span>{pool.name}</span>
            </>
          ) : (
            <span className="text-[#fc4f02]">Top Trades</span>
          )}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Open and close manual trades for this pool. Pool value updates after each closed trade.
        </p>
      </div>
      {/* CTA row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden sm:block" aria-hidden />
        <button
          type="button"
          onClick={() => setShowOpenModal(true)}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 hover:opacity-90 disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Open trade
        </button>
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
          <p className="mt-1 text-xs text-slate-500">Open a trade to start tracking pool performance.</p>
          <button
            type="button"
            onClick={() => setShowOpenModal(true)}
            disabled={saving}
            className="mt-4 rounded-xl bg-[#fc4f02] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            Open trade
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-[--color-border] bg-[--color-surface]/50 md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[--color-border] text-slate-400">
                  <th className="px-4 py-3 font-medium">Pool</th>
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
                  <tr
                    key={t.trade_id}
                    onClick={() => setDetailTrade(t)}
                    className="border-b border-[--color-border]/50 hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-[#fc4f02]/20 text-[#fda300]">
                        {pool?.name ?? t.pool_id}
                      </span>
                    </td>
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
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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

          {/* Mobile cards (Top Trades style, click to open detail) */}
          <div className="space-y-3 md:hidden">
            {trades.map((t) => (
              <div
                key={t.trade_id}
                onClick={() => setDetailTrade(t)}
                className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 p-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-[#fc4f02]/20 text-[#fda300] mb-1.5">
                      {pool?.name ?? t.pool_id}
                    </span>
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
                      onClick={(e) => { e.stopPropagation(); setCloseModalTrade(t); }}
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

      <OpenTradeModal
        open={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onSubmit={onOpenTrade}
        saving={saving}
      />
      <CloseTradeModal
        open={!!closeModalTrade}
        trade={closeModalTrade}
        onClose={() => setCloseModalTrade(null)}
        onSubmit={onCloseTrade}
        submitting={actionSubmitting !== null}
      />
      <TradeDetailOverlay
        open={!!detailTrade}
        trade={detailTrade}
        poolName={pool?.name ?? null}
        poolId={pool?.pool_id ?? detailTrade?.pool_id ?? ""}
        onClose={() => setDetailTrade(null)}
        onRequestCloseTrade={(t) => {
          setDetailTrade(null);
          setCloseModalTrade(t);
        }}
        actionSubmitting={actionSubmitting}
        formatUsdt={formatUsdt}
        formatDate={formatDate}
      />
    </div>
  );
}
