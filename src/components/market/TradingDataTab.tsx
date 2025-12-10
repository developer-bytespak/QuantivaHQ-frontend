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
      <div className="flex gap-2 rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur p-1">
        <button
          onClick={() => setActiveView("orderbook")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeView === "orderbook"
              ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveView("trades")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeView === "trades"
              ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
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
              <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Spread</p>
                    <p className="text-xl font-bold text-white">
                      ${(orderBook.spread || 0).toFixed(4)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Spread %</p>
                    <p className="text-xl font-bold text-white">
                      {((orderBook.spreadPercent || 0)).toFixed(4)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Book Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Asks (Sell Orders) */}
                <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10">
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-red-400">Asks (Sell)</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-3 border-b border-white/10">
                      <div>Price</div>
                      <div className="text-right">Quantity</div>
                      <div className="text-right">Total</div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                      {orderBook.asks && orderBook.asks.length > 0 ? (
                        orderBook.asks.slice(0, 10).map((ask, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-2 text-sm py-2 hover:bg-white/5 rounded-lg px-2 transition-colors"
                          >
                            <div className="font-semibold text-red-400">{ask.price.toFixed(4)}</div>
                            <div className="text-right text-slate-300 font-medium">
                              {ask.quantity.toFixed(4)}
                            </div>
                            <div className="text-right text-slate-300 font-medium">
                              {ask.total?.toFixed(4) || "0.0000"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-slate-500 py-8 text-center">No sell orders</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bids (Buy Orders) */}
                <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-green-400">Bids (Buy)</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-3 border-b border-white/10">
                      <div>Price</div>
                      <div className="text-right">Quantity</div>
                      <div className="text-right">Total</div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                      {orderBook.bids && orderBook.bids.length > 0 ? (
                        orderBook.bids.slice(0, 10).map((bid, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-2 text-sm py-2 hover:bg-white/5 rounded-lg px-2 transition-colors"
                          >
                            <div className="font-semibold text-green-400">{bid.price.toFixed(4)}</div>
                            <div className="text-right text-slate-300 font-medium">
                              {bid.quantity.toFixed(4)}
                            </div>
                            <div className="text-right text-slate-300 font-medium">
                              {bid.total?.toFixed(4) || "0.0000"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-slate-500 py-8 text-center">No buy orders</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
              <p className="text-sm text-slate-400 text-center">No order book data available</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Trades View */}
      {activeView === "trades" && (
        <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10">
              <svg className="w-4 h-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">Recent Trades</h3>
          </div>
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-3 border-b border-white/10">
              <div>Price</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Time</div>
              <div className="text-right">Side</div>
            </div>
            <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
              {trades.slice(0, 50).map((trade, index) => (
                <div
                  key={`${trade.id}-${index}`}
                  className="grid grid-cols-4 gap-2 text-sm py-2.5 hover:bg-white/5 rounded-lg px-2 transition-colors"
                >
                  <div
                    className={`font-semibold ${
                      trade.isBuyerMaker ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    ${trade.price.toFixed(4)}
                  </div>
                  <div className="text-right text-slate-300 font-medium">
                    {trade.quantity.toFixed(4)}
                  </div>
                  <div className="text-right text-slate-400 text-xs">
                    {formatTime(trade.time)}
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        trade.isBuyerMaker
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {trade.isBuyerMaker ? "BUY" : "SELL"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

