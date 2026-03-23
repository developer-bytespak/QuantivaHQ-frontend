"use client";

import { useState } from "react";
import type {
  AdminExchangeOrder,
  AdminExchangeOrdersSummary,
} from "@/lib/api/vcpool-admin";

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

// --- Close Order Modal ---
function CloseOrderModal({
  open,
  order,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  order: AdminExchangeOrder | null;
  onClose: () => void;
  onSubmit: (orderId: string, exitPrice: number) => void;
  submitting: boolean;
}) {
  const [exitPrice, setExitPrice] = useState("");

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-xl">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h3 className="text-lg font-semibold text-white">Close order — {order.symbol}</h3>
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const p = Number(exitPrice);
            if (!(p > 0)) return;
            onSubmit(order.order_id, p);
          }}
          className="p-5 space-y-4"
        >
          <p className="text-sm text-slate-400">
            Entry:{" "}
            <span className="text-white font-medium">${formatUsdt(order.entry_price_usdt)}</span> · Qty:{" "}
            <span className="text-white font-medium">{order.quantity}</span>
          </p>
          <label className="block">
            <span className="text-xs font-medium text-slate-400">Exit Price (USDT)</span>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="e.g. 72000"
              min="0"
              step="any"
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

export interface PoolExchangeOrdersProps {
  orders: AdminExchangeOrder[];
  ordersSummary: AdminExchangeOrdersSummary | null;
  ordersLoading: boolean;
  ordersStatusFilter: "open" | "closed" | "all";
  onFilterChange: (f: "open" | "closed" | "all") => void;
  onCloseOrder: (orderId: string, exitPrice: number) => void;
  saving: boolean;
  actionSubmitting: string | null;
}

export function PoolExchangeOrders({
  orders,
  ordersSummary,
  ordersLoading,
  ordersStatusFilter,
  onFilterChange,
  onCloseOrder,
  saving,
  actionSubmitting,
}: PoolExchangeOrdersProps) {
  const [closeModalOrder, setCloseModalOrder] = useState<AdminExchangeOrder | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-white">Order History</h3>
        <p className="text-xs sm:text-sm text-slate-400">
          Exchange orders placed on Binance via Top Trades. Tracked separately from manual trades.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
          <p className="text-xs text-slate-400">Open positions</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {ordersSummary !== null ? ordersSummary.open_positions : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
          <p className="text-xs text-slate-400">Closed positions</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {ordersSummary !== null ? ordersSummary.closed_positions : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[--color-border] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
          <p className="text-xs text-slate-400">Realized PnL</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              ordersSummary && ordersSummary.realized_pnl_usdt >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {ordersSummary !== null ? `${formatUsdt(ordersSummary.realized_pnl_usdt)} USDT` : "—"}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-[--color-surface-alt]/60 p-1.5">
        {(["open", "closed", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all capitalize ${
              ordersStatusFilter === f
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {ordersLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[--color-border] bg-[--color-surface]/50 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
          <span className="text-sm text-slate-400">Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 py-16 text-center">
          <p className="text-sm text-slate-400">No exchange orders yet.</p>
          <p className="mt-1 text-xs text-slate-500">Use the Top Trade screen to execute orders for this pool.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-[--color-border] bg-[--color-surface]/50 md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[--color-border] text-slate-400">
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Entry (USDT)</th>
                  <th className="px-4 py-3 font-medium">Exit (USDT)</th>
                  <th className="px-4 py-3 font-medium">PnL</th>
                  <th className="px-4 py-3 font-medium">Binance ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_id} className="border-b border-[--color-border]/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{o.symbol}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          o.side === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {o.side}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300">
                        {o.order_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{o.quantity}</td>
                    <td className="px-4 py-3 text-slate-300">{formatUsdt(o.entry_price_usdt)}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {o.exit_price_usdt != null ? formatUsdt(o.exit_price_usdt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {o.realized_pnl_usdt != null ? (
                        <span className={Number(o.realized_pnl_usdt) >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {formatUsdt(o.realized_pnl_usdt)} USDT
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {o.exchange_order_id
                        ? `#${o.exchange_order_id.length > 10 ? o.exchange_order_id.slice(0, 10) + "…" : o.exchange_order_id}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          o.is_open ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {o.is_open ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(o.is_open ? o.opened_at : o.closed_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.is_open && (
                        <button
                          type="button"
                          onClick={() => setCloseModalOrder(o)}
                          disabled={actionSubmitting !== null}
                          className="rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-600/30 disabled:opacity-60"
                        >
                          {actionSubmitting === o.order_id ? "…" : "Close"}
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
            {orders.map((o) => (
              <div
                key={o.order_id}
                className="rounded-xl border border-[--color-border] bg-[--color-surface]/50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{o.symbol}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          o.side === "BUY" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {o.side}
                      </span>
                      <span className="rounded-full px-2 py-0.5 bg-blue-500/20 text-blue-300 font-medium">
                        {o.order_type}
                      </span>
                      <span>
                        {o.quantity} @ {formatUsdt(o.entry_price_usdt)}
                      </span>
                      <span className={o.is_open ? "text-amber-400" : "text-slate-400"}>
                        {o.is_open ? "Open" : "Closed"}
                      </span>
                    </p>
                    {o.realized_pnl_usdt != null && !o.is_open && (
                      <p
                        className={`mt-1 text-sm font-medium ${
                          Number(o.realized_pnl_usdt) >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        PnL: {formatUsdt(o.realized_pnl_usdt)} USDT
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(o.is_open ? o.opened_at : o.closed_at)}
                    </p>
                    {o.exchange_order_id && (
                      <p className="mt-1 font-mono text-xs text-slate-500">#{o.exchange_order_id}</p>
                    )}
                  </div>
                  {o.is_open && (
                    <button
                      type="button"
                      onClick={() => setCloseModalOrder(o)}
                      disabled={actionSubmitting !== null}
                      className="shrink-0 rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-600/30 disabled:opacity-60"
                    >
                      {actionSubmitting === o.order_id ? "…" : "Close"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CloseOrderModal
        open={!!closeModalOrder}
        order={closeModalOrder}
        onClose={() => setCloseModalOrder(null)}
        onSubmit={onCloseOrder}
        submitting={actionSubmitting !== null}
      />
    </div>
  );
}
