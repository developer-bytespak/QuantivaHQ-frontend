"use client";

import { useState, useEffect } from "react";
import { exchangesService, OrderBook, RecentTrade } from "@/lib/api/exchanges.service";

interface TradingDataTabProps {
  connectionId: string;
  symbol: string;
}

export default function TradingDataTab({ connectionId, symbol }: TradingDataTabProps) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"orderbook" | "trades">("orderbook");

  useEffect(() => {
    const fetchData = async () => {
      if (!connectionId || !symbol) return;

      setIsLoading(true);
      setError(null);

      try {
        const [orderBookRes, tradesRes] = await Promise.all([
          exchangesService.getOrderBook(connectionId, symbol, 20),
          exchangesService.getRecentTrades(connectionId, symbol, 50),
        ]);

        console.log("Order Book Response:", orderBookRes);
        console.log("Trades Response:", tradesRes);

        if (orderBookRes.success && orderBookRes.data) {
          console.log("Order Book Data:", orderBookRes.data);
          setOrderBook(orderBookRes.data);
        } else {
          console.error("Order Book Error:", orderBookRes.message || "Unknown error");
          setError(orderBookRes.message || "Failed to load order book data");
        }

        if (tradesRes.success && tradesRes.data) {
          setTrades(tradesRes.data);
        } else {
          console.error("Trades Error:", tradesRes.message || "Unknown error");
        }
      } catch (err: any) {
        console.error("Failed to fetch trading data:", err);
        setError(err.message || "Failed to load trading data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [connectionId, symbol]);

  if (isLoading && !orderBook && trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-4">
        <p className="text-sm text-red-200">{error}</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 border-b border-[--color-border]">
        <button
          onClick={() => setActiveView("orderbook")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeView === "orderbook"
              ? "text-[#fc4f02] border-b-2 border-[#fc4f02]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveView("trades")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeView === "trades"
              ? "text-[#fc4f02] border-b-2 border-[#fc4f02]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Recent Trades
        </button>
      </div>

      {/* Order Book View */}
      {activeView === "orderbook" && (
        <div className="space-y-4">
          {orderBook ? (
            <>
              {/* Spread Info */}
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Spread</p>
                    <p className="text-lg font-semibold text-white">
                      ${(orderBook.spread || 0).toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Spread %</p>
                    <p className="text-lg font-semibold text-white">
                      {((orderBook.spreadPercent || 0)).toFixed(4)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Book Table */}
              <div className="grid grid-cols-2 gap-4">
                {/* Asks (Sell Orders) */}
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-3">Asks (Sell)</h3>
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 mb-2 pb-2 border-b border-[--color-border]">
                      <div>Price</div>
                      <div className="text-right">Quantity</div>
                      <div className="text-right">Total</div>
                    </div>
                    {orderBook.asks && orderBook.asks.length > 0 ? (
                      orderBook.asks.slice(0, 10).map((ask, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-3 gap-2 text-xs hover:bg-[--color-surface] p-1 rounded"
                        >
                          <div className="text-red-400">{ask.price.toFixed(4)}</div>
                          <div className="text-right text-slate-300">
                            {ask.quantity.toFixed(4)}
                          </div>
                          <div className="text-right text-slate-300">
                            {ask.total?.toFixed(4) || "0.0000"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 py-4 text-center">No sell orders</div>
                    )}
                  </div>
                </div>

                {/* Bids (Buy Orders) */}
                <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                  <h3 className="text-sm font-semibold text-green-400 mb-3">Bids (Buy)</h3>
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 mb-2 pb-2 border-b border-[--color-border]">
                      <div>Price</div>
                      <div className="text-right">Quantity</div>
                      <div className="text-right">Total</div>
                    </div>
                    {orderBook.bids && orderBook.bids.length > 0 ? (
                      orderBook.bids.slice(0, 10).map((bid, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-3 gap-2 text-xs hover:bg-[--color-surface] p-1 rounded"
                        >
                          <div className="text-green-400">{bid.price.toFixed(4)}</div>
                          <div className="text-right text-slate-300">
                            {bid.quantity.toFixed(4)}
                          </div>
                          <div className="text-right text-slate-300">
                            {bid.total?.toFixed(4) || "0.0000"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 py-4 text-center">No buy orders</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
              <p className="text-sm text-slate-400 text-center">No order book data available</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Trades View */}
      {activeView === "trades" && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Trades</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2 text-xs text-slate-400 mb-2 pb-2 border-b border-[--color-border] sticky top-0 bg-[--color-surface]/60">
              <div>Price</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Time</div>
              <div className="text-right">Side</div>
            </div>
            {trades.slice(0, 50).map((trade, index) => (
              <div
                key={`${trade.id}-${index}`}
                className="grid grid-cols-4 gap-2 text-xs hover:bg-[--color-surface] p-1 rounded"
              >
                <div
                  className={
                    trade.isBuyerMaker ? "text-green-400" : "text-red-400"
                  }
                >
                  ${trade.price.toFixed(4)}
                </div>
                <div className="text-right text-slate-300">
                  {trade.quantity.toFixed(4)}
                </div>
                <div className="text-right text-slate-400">
                  {formatTime(trade.time)}
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      trade.isBuyerMaker
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {trade.isBuyerMaker ? "BUY" : "SELL"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

