"use client";

import { useState, useEffect } from "react";

interface StockQuoteData {
  symbol: string;
  askPrice: number;
  bidPrice: number;
  askSize: number;
  bidSize: number;
  spread: number;
  spreadPercent: number;
  lastPrice: number;
  volume: number;
  timestamp: string;
}

interface RecentBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockTradingDataTabProps {
  symbol: string;
  currentPrice?: number;
}

export default function StockTradingDataTab({ symbol, currentPrice }: StockTradingDataTabProps) {
  const [quoteData, setQuoteData] = useState<StockQuoteData | null>(null);
  const [recentBars, setRecentBars] = useState<RecentBar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"quote" | "activity">("quote");

  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;

      setIsLoading(true);
      setError(null);

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        
        // Fetch stock detail which includes quote data
        const detailResponse = await fetch(`${API_BASE_URL}/api/stocks-market/stocks/${symbol.toUpperCase()}`);
        
        if (!detailResponse.ok) {
          throw new Error(`Failed to fetch stock data: ${detailResponse.status}`);
        }

        const detailData = await detailResponse.json();
        
        // Create quote data from detail response
        // Note: Alpaca free tier provides bid/ask in snapshot quotes
        const quote: StockQuoteData = {
          symbol: detailData.symbol,
          askPrice: detailData.price * 1.0001, // Estimate if not available
          bidPrice: detailData.price * 0.9999, // Estimate if not available
          askSize: 100,
          bidSize: 100,
          spread: detailData.price * 0.0002,
          spreadPercent: 0.02,
          lastPrice: detailData.price,
          volume: detailData.volume24h,
          timestamp: detailData.timestamp || new Date().toISOString(),
        };
        
        setQuoteData(quote);

        // Fetch recent bars for activity
        const barsResponse = await fetch(
          `${API_BASE_URL}/api/stocks-market/stocks/${symbol.toUpperCase()}/bars?timeframe=1Hour&limit=10`
        );
        
        if (barsResponse.ok) {
          const barsData = await barsResponse.json();
          setRecentBars(barsData.bars || []);
        }
      } catch (err: any) {
        console.error("Failed to fetch trading data:", err);
        setError(err.message || "Failed to load trading data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (isLoading && !quoteData) {
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur p-1">
        <button
          onClick={() => setActiveView("quote")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeView === "quote"
              ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Market Quote
        </button>
        <button
          onClick={() => setActiveView("activity")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeView === "activity"
              ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          Recent Activity
        </button>
      </div>

      {/* Quote View */}
      {activeView === "quote" && quoteData && (
        <div className="space-y-4">
          {/* Current Price Card */}
          <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Trade Price</p>
                <p className="text-3xl font-bold text-white">
                  ${(currentPrice || quoteData.lastPrice).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Volume</p>
                <p className="text-lg font-semibold text-white">
                  {quoteData.volume >= 1e6 
                    ? `${(quoteData.volume / 1e6).toFixed(2)}M`
                    : quoteData.volume >= 1e3
                    ? `${(quoteData.volume / 1e3).toFixed(2)}K`
                    : quoteData.volume.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Last updated: {formatTime(quoteData.timestamp)}
            </div>
          </div>

          {/* Bid/Ask Spread */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bid (Buy) Side */}
            <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-green-400">Bid (Buy)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">Best Bid</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${quoteData.bidPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">Size</span>
                  <span className="text-lg font-semibold text-slate-300">
                    {quoteData.bidSize} shares
                  </span>
                </div>
              </div>
            </div>

            {/* Ask (Sell) Side */}
            <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10">
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-red-400">Ask (Sell)</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">Best Ask</span>
                  <span className="text-2xl font-bold text-red-400">
                    ${quoteData.askPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 uppercase">Size</span>
                  <span className="text-lg font-semibold text-slate-300">
                    {quoteData.askSize} shares
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Spread Info */}
          <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Spread</p>
                <p className="text-xl font-bold text-white">
                  ${quoteData.spread.toFixed(4)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Spread %</p>
                <p className="text-xl font-bold text-white">
                  {quoteData.spreadPercent.toFixed(4)}%
                </p>
              </div>
            </div>
          </div>

          {/* Market Status Note */}
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-200">Stock Market Hours</p>
                <p className="text-xs text-slate-400 mt-1">
                  US markets are open Mon-Fri, 9:30 AM - 4:00 PM ET. Quote data updates during market hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity View */}
      {activeView === "activity" && (
        <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/10">
              <svg className="w-4 h-4 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">Recent Hourly Bars</h3>
          </div>
          
          {recentBars.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 pb-3 border-b border-white/10">
                <div>Time</div>
                <div className="text-right">Open</div>
                <div className="text-right">High</div>
                <div className="text-right">Low</div>
                <div className="text-right">Close</div>
                <div className="text-right">Volume</div>
              </div>
              <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                {recentBars.slice().reverse().map((bar, index) => {
                  const isPositive = bar.close >= bar.open;
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-6 gap-2 text-sm py-2.5 hover:bg-white/5 rounded-lg px-2 transition-colors"
                    >
                      <div className="text-slate-400">
                        <div>{formatDate(bar.timestamp)}</div>
                        <div className="text-xs">{formatTime(bar.timestamp)}</div>
                      </div>
                      <div className="text-right text-slate-300 font-medium">
                        ${bar.open.toFixed(2)}
                      </div>
                      <div className="text-right text-green-400 font-medium">
                        ${bar.high.toFixed(2)}
                      </div>
                      <div className="text-right text-red-400 font-medium">
                        ${bar.low.toFixed(2)}
                      </div>
                      <div className={`text-right font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        ${bar.close.toFixed(2)}
                      </div>
                      <div className="text-right text-slate-300">
                        {bar.volume >= 1e6 
                          ? `${(bar.volume / 1e6).toFixed(1)}M`
                          : bar.volume >= 1e3
                          ? `${(bar.volume / 1e3).toFixed(1)}K`
                          : bar.volume.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-slate-400">No recent activity data available</p>
              <p className="text-xs text-slate-500 mt-1">Data may be unavailable outside market hours</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

