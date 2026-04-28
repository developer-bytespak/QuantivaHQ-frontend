"use client";

import { useEffect, useState, useCallback } from "react";
import type { OrderBook, RecentTrade } from "@/lib/api/exchanges.service";
import { getPublicDepth, getPublicTrades } from "@/lib/api/public-market.service";

interface Props {
  /** Trading pair, e.g. "BTCUSDT". */
  symbol: string;
  initialOrderBook?: OrderBook | null;
  initialTrades?: RecentTrade[];
}

const REFRESH_INTERVAL_MS = 10_000;

/**
 * Read-only Trading Data tab for the public (no-connection) market preview.
 * Polls /api/market/binance/depth and /trades every 10s — no WebSocket here
 * because Binance's depth WS is diff-based and would need a snapshot+sync
 * routine, which is overkill for a preview surface. The Price tab already
 * has live price via `useBinancePublicPrice`.
 */
export default function PublicTradingDataTab({ symbol, initialOrderBook, initialTrades }: Props) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(initialOrderBook ?? null);
  const [trades, setTrades] = useState<RecentTrade[]>(initialTrades ?? []);
  const [activeView, setActiveView] = useState<"orderbook" | "trades">("orderbook");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [nextDepth, nextTrades] = await Promise.all([
        getPublicDepth(symbol, 20).catch(() => null),
        getPublicTrades(symbol, 50).catch(() => []),
      ]);
      if (nextDepth) setOrderBook(nextDepth);
      if (nextTrades && nextTrades.length > 0) setTrades(nextTrades);
    } finally {
      setIsRefreshing(false);
    }
  }, [symbol]);

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const formatPrice = (p: number) =>
    p >= 1
      ? p.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : p.toLocaleString(undefined, { maximumFractionDigits: 8 });
  const formatQty = (q: number) =>
    q >= 1 ? q.toLocaleString(undefined, { maximumFractionDigits: 4 }) : q.toFixed(6);
  const formatTime = (ms: number) => new Date(ms).toLocaleTimeString();

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4 sm:p-6 backdrop-blur">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          <button
            onClick={() => setActiveView("orderbook")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              activeView === "orderbook"
                ? "bg-[var(--primary)] text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveView("trades")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              activeView === "trades"
                ? "bg-[var(--primary)] text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Recent Trades
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500/80" />
          <span>Live snapshot · refreshes every 10s</span>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-slate-300 transition-colors hover:border-white/30 hover:bg-white/[0.06] hover:text-white disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {activeView === "orderbook" && (
        orderBook ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Bids</div>
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-1 text-left font-medium">Price</th>
                    <th className="py-1 text-right font-medium">Quantity</th>
                    <th className="py-1 text-right font-medium hidden sm:table-cell">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderBook.bids.slice(0, 15).map((bid, i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="py-0.5 text-emerald-400 tabular-nums">{formatPrice(bid.price)}</td>
                      <td className="py-0.5 text-right tabular-nums">{formatQty(bid.quantity)}</td>
                      <td className="py-0.5 text-right tabular-nums text-slate-500 hidden sm:table-cell">
                        {bid.total ? formatQty(bid.total) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-400">Asks</div>
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="py-1 text-left font-medium">Price</th>
                    <th className="py-1 text-right font-medium">Quantity</th>
                    <th className="py-1 text-right font-medium hidden sm:table-cell">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderBook.asks.slice(0, 15).map((ask, i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="py-0.5 text-rose-400 tabular-nums">{formatPrice(ask.price)}</td>
                      <td className="py-0.5 text-right tabular-nums">{formatQty(ask.quantity)}</td>
                      <td className="py-0.5 text-right tabular-nums text-slate-500 hidden sm:table-cell">
                        {ask.total ? formatQty(ask.total) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No order book data.</p>
        )
      )}

      {activeView === "trades" && (
        trades.length > 0 ? (
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-1 text-left font-medium">Time</th>
                <th className="py-1 text-right font-medium">Price</th>
                <th className="py-1 text-right font-medium">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 20).map((t) => (
                <tr key={t.id} className="text-slate-300">
                  <td className="py-0.5 tabular-nums text-slate-500">{formatTime(t.time)}</td>
                  <td
                    className={`py-0.5 text-right tabular-nums ${
                      t.isBuyerMaker ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {formatPrice(t.price)}
                  </td>
                  <td className="py-0.5 text-right tabular-nums">{formatQty(t.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No recent trades.</p>
        )
      )}
    </div>
  );
}
