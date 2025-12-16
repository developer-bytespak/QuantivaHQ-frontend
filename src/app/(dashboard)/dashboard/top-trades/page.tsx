"use client";

import { useState, useMemo, useEffect } from "react";
import { apiRequest } from "@/lib/api/client";
import type { Strategy } from "@/lib/api/strategies";

interface Trade {
  id: number;
  pair: string;
  type: "BUY" | "SELL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  ext: string;
  entry: string;
  stopLoss: string;
  progressMin: number;
  progressMax: number;
  progressValue: number;
  entryPrice: string;
  stopLossPrice: string;
  takeProfit1: string;
  target: string;
  insights: string[];
  profit: string;
  profitValue: number;
  volume: string;
  volumeValue: number;
  winRate: string;
  winRateValue: number;
  hoursAgo: number;
}

const topTradesData: Trade[] = [
  {
    id: 1,
    pair: "ETH / USDT",
    type: "BUY",
    confidence: "HIGH",
    ext: "22,000",
    entry: "1,020",
    stopLoss: "1.317 $",
    progressMin: 790,
    progressMax: 200,
    progressValue: 75,
    entryPrice: "$2,120",
    stopLossPrice: "$120",
    takeProfit1: "$240",
    target: "20,045-",
    insights: [
      "Bullish momentum on 1h and 4h charts",
      "Sentiment improved 20% in last 3 hours",
      "High liquidity reduces execution risk",
    ],
    profit: "+5.83%",
    profitValue: 5.83,
    volume: "$42,350",
    volumeValue: 42350,
    winRate: "92%",
    winRateValue: 92,
    hoursAgo: 2,
  },
  {
    id: 2,
    pair: "BTC / USDT",
    type: "BUY",
    confidence: "HIGH",
    ext: "34,500",
    entry: "34,200",
    stopLoss: "33,800",
    progressMin: 800,
    progressMax: 150,
    progressValue: 80,
    entryPrice: "$34,200",
    stopLossPrice: "$33,800",
    takeProfit1: "$35,500",
    target: "35,200-",
    insights: [
      "Strong support level at $34,000",
      "Volume spike indicates accumulation",
      "RSI showing bullish divergence",
    ],
    profit: "+4.12%",
    profitValue: 4.12,
    volume: "$68,400",
    volumeValue: 68400,
    winRate: "88%",
    winRateValue: 88,
    hoursAgo: 5,
  },
  {
    id: 3,
    pair: "SOL / USDT",
    type: "SELL",
    confidence: "MEDIUM",
    ext: "98.50",
    entry: "98.20",
    stopLoss: "100.50",
    progressMin: 600,
    progressMax: 300,
    progressValue: 65,
    entryPrice: "$98.20",
    stopLossPrice: "$100.50",
    takeProfit1: "$95.00",
    target: "94,500-",
    insights: [
      "Resistance level at $100 holding strong",
      "Bearish divergence on MACD",
      "Decreasing volume suggests weakness",
    ],
    profit: "+3.25%",
    profitValue: 3.25,
    volume: "$19,640",
    volumeValue: 19640,
    winRate: "85%",
    winRateValue: 85,
    hoursAgo: 8,
  },
  {
    id: 4,
    pair: "BNB / USDT",
    type: "BUY",
    confidence: "HIGH",
    ext: "315",
    entry: "314",
    stopLoss: "310",
    progressMin: 750,
    progressMax: 200,
    progressValue: 78,
    entryPrice: "$314",
    stopLossPrice: "$310",
    takeProfit1: "$325",
    target: "32,200-",
    insights: [
      "Breakout above key resistance",
      "Institutional buying detected",
      "Positive funding rate shift",
    ],
    profit: "+3.50%",
    profitValue: 3.5,
    volume: "$31,400",
    volumeValue: 31400,
    winRate: "90%",
    winRateValue: 90,
    hoursAgo: 12,
  },
  {
    id: 5,
    pair: "XRP / USDT",
    type: "BUY",
    confidence: "MEDIUM",
    ext: "0.58",
    entry: "0.575",
    stopLoss: "0.550",
    progressMin: 550,
    progressMax: 250,
    progressValue: 68,
    entryPrice: "$0.575",
    stopLossPrice: "$0.550",
    takeProfit1: "$0.610",
    target: "60,500-",
    insights: [
      "Support bounce from $0.55 level",
      "Increasing social sentiment",
      "Low volatility entry point",
    ],
    profit: "+6.09%",
    profitValue: 6.09,
    volume: "$11,500",
    volumeValue: 11500,
    winRate: "82%",
    winRateValue: 82,
    hoursAgo: 15,
  },
];

export default function TopTradesPage() {
  // trending trades state (initial fallback uses the static sample data)
  const [trendingTrades, setTrendingTrades] = useState<Trade[]>(topTradesData);
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);

  // Filter and sort trades based on selected criteria
  const filteredAndSortedTrades = useMemo(() => {
    // First, filter by time
    let filtered = [...trendingTrades];

    if (timeFilter !== "all") {
      const hoursLimit = timeFilter === "24h" ? 24 : timeFilter === "7d" ? 168 : 720; // 30d = 720 hours
      filtered = filtered.filter((trade) => trade.hoursAgo <= hoursLimit);
    }

    // Then, sort by selected criteria
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "profit":
          return b.profitValue - a.profitValue; // Descending order (highest first)
        case "volume":
          return b.volumeValue - a.volumeValue; // Descending order (highest first)
        case "winrate":
          return b.winRateValue - a.winRateValue; // Descending order (highest first)
        default:
          return 0;
      }
    });
  }, [timeFilter, sortBy]);

  // Fetch trending assets using the backend endpoint and map into `Trade[]`.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // request a large limit so backend returns all available trending assets
        const data = await apiRequest<never, any[]>({ path: "/strategies/trending-assets?limit=9999", method: "GET" });
        if (!mounted) return;
        if (!data || !Array.isArray(data) || data.length === 0) return;

        const mapped: Trade[] = data.map((item: any, idx: number) => {
          // expected fields from backend: asset_id, symbol, price, final_score, etc.
          const symbol = item.symbol ?? item.asset_symbol ?? item.asset_id ?? `ASSET-${idx}`;
          const pair = item.pair ?? `${symbol} / USDT`;
          const score = Number(item.final_score ?? item.score ?? 0);
          const confidence: Trade["confidence"] = score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";
          const price = item.price ?? item.last_price ?? item.quote ?? null;

          return {
            id: idx + 1,
            pair,
            type: (item.action && item.action.toUpperCase() === 'SELL') ? 'SELL' : 'BUY',
            confidence,
            ext: price ? String(price) : "",
            entry: price ? String(price) : (item.entry || ""),
            stopLoss: item.stop_loss || item.stopLoss || "—",
            progressMin: 0,
            progressMax: 100,
            progressValue: Math.min(100, Math.max(0, Math.floor((score || 0) * 100))),
            entryPrice: item.entryPrice ? String(item.entryPrice) : price ? String(price) : "—",
            stopLossPrice: item.stopLossPrice ? String(item.stopLossPrice) : item.stop_loss ? String(item.stop_loss) : "—",
            takeProfit1: item.take_profit || item.takeProfit || "—",
            target: item.target || "",
            insights: item.insights || item.reasons || [],
            profit: item.changePercent ? `${item.changePercent}%` : (item.profit ? String(item.profit) : "0%"),
            profitValue: Number(String(item.changePercent ?? item.profit ?? 0)).valueOf() || 0,
            volume: item.volume ? String(item.volume) : (item.volumeValue ? String(item.volumeValue) : "—"),
            volumeValue: Number(item.volume) || Number(item.volumeValue) || 0,
            winRate: item.winRate ? `${item.winRate}%` : (item.win_rate ? `${item.win_rate}%` : "—"),
            winRateValue: Number(item.winRate ?? item.win_rate ?? 0) || 0,
            hoursAgo: Number(item.hoursAgo ?? item.age_hours ?? 0) || 0,
          } as Trade;
        });

        setTrendingTrades(mapped);
      } catch (err) {
        // keep fallback sample data on error
        console.error('Failed to load trending assets from /strategies/trending-assets', err);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Pagination for Top Trades list
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTrades.length / ITEMS_PER_PAGE));
  const paginatedTrades = filteredAndSortedTrades.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, sortBy, trendingTrades.length]);

  // Apply strategy: generate signals then use pre-built strategy
  const applyStrategy = async (strategyId: string) => {
    if (applyingIds.includes(strategyId)) return;
    setApplyingIds((p) => [...p, strategyId]);
    setApplyErrors((prev) => { const c = { ...prev }; delete c[strategyId]; return c; });
    try {
      const signals = await apiRequest<unknown, any[]>({ path: `/strategies/${strategyId}/generate-signals`, method: 'POST', body: {} });
      setGeneratedSignals((prev) => ({ ...prev, [strategyId]: signals || [] }));

      const assetIds = (signals || []).map((s: any) => s.asset?.asset_id ?? s.asset_id ?? s.asset?.id ?? s.asset);
      await apiRequest<unknown, any>({ path: `/strategies/pre-built/${strategyId}/use`, method: 'POST', body: { targetAssets: assetIds || [], config: {} } });
    } catch (err: any) {
      setApplyErrors((prev) => ({ ...prev, [strategyId]: err?.message || String(err) }));
    } finally {
      setApplyingIds((p) => p.filter((x) => x !== strategyId));
    }
  };

  // Fetch pre-built strategies and show their full info (only admin type)
  const [preBuiltStrategies, setPreBuiltStrategies] = useState<Strategy[]>([]);
  const [loadingPreBuilt, setLoadingPreBuilt] = useState(false);
  const [preBuiltError, setPreBuiltError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingPreBuilt(true);
        setPreBuiltError(null);
        const data = await apiRequest<never, Strategy[]>({ path: "/strategies/pre-built", method: "GET" });
        if (!mounted) return;
        // only show admin templates
        const adminOnly = (data || []).filter((s) => s?.type === "admin");
        setPreBuiltStrategies(adminOnly);
      } catch (err: any) {
        if (!mounted) return;
        const msg = err?.message || String(err);
        console.error("Failed to load pre-built strategies:", msg);
        setPreBuiltError(msg);
      } finally {
        if (mounted) setLoadingPreBuilt(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // which pre-built strategies are expanded to show details (allow multiple)
  const [expandedStrategyIds, setExpandedStrategyIds] = useState<string[]>([]);
  // selected strategies (multiple selection allowed)
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [applyingIds, setApplyingIds] = useState<string[]>([]);
  const [generatedSignals, setGeneratedSignals] = useState<Record<string, any[]>>({});
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Track your best performing trades and strategies</p>
        </div>

        {/* Time Filter */}
        <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
          {(["24h", "7d", "30d", "all"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${timeFilter === period
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                : "text-slate-400 hover:text-white"
                }`}
            >
              {period === "all" ? "All Time" : period}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-built Strategies (replaces stats) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingPreBuilt ? (
          <div className="col-span-full rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-6 text-center">
            <p className="text-sm text-slate-400">Loading templates...</p>
          </div>
        ) : preBuiltError ? (
          <div className="col-span-full rounded-xl bg-red-600/10 p-6 text-center">
            <p className="text-sm text-red-300">Failed to load templates: {preBuiltError}</p>
          </div>
        ) : preBuiltStrategies.length > 0 ? (
          preBuiltStrategies.map((s, idx) => {
            const id = s.strategy_id || String(idx);
            const isSelected = selectedStrategyIds.includes(id);
            const isExpanded = expandedStrategyIds.includes(id);

            return (
              <div key={id} className={`rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] ${isSelected ? 'ring-2 ring-[#fc4f02]/40' : ''}`}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-xs text-slate-400">Template</p>
                    <p className="text-2xl font-bold text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">Risk: <span className="text-white">{s.risk_level}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedStrategyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${isSelected ? 'bg-[#fc4f02] text-white' : 'bg-[--color-surface] text-slate-300 hover:text-white'}`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </button>

                    <button
                      onClick={() => {
                        setExpandedStrategyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
                      }}
                      className="rounded-lg bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
                    >
                      {isExpanded ? 'Hide' : 'Info'}
                    </button>

                    <button
                      onClick={() => applyStrategy(id)}
                      disabled={applyingIds.includes(id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${applyingIds.includes(id) ? 'bg-[#999] text-white' : 'bg-gradient-to-r from-[#10b981] to-[#06b6d4] text-white'}`}
                    >
                      {applyingIds.includes(id) ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-2 rounded-md bg-[--color-surface] p-3 text-xs text-slate-300">
                    <div>
                      <p className="text-sm text-white font-semibold">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.description || "No description"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Risk Level</p>
                      <p className="text-sm text-white">{s.risk_level}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Entry Rules</p>
                      {s.entry_rules && s.entry_rules.length > 0 ? (
                        <ul className="ml-3 list-disc">
                          {s.entry_rules.map((r, i) => (
                            <li key={i} className="text-xs text-slate-300">{r.indicator} {r.operator} {String(r.value)}{r.timeframe ? ` (${r.timeframe})` : ''}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">None</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Exit Rules</p>
                      {s.exit_rules && s.exit_rules.length > 0 ? (
                        <ul className="ml-3 list-disc">
                          {s.exit_rules.map((r, i) => (
                            <li key={i} className="text-xs text-slate-300">{r.indicator} {r.operator} {String(r.value)}{r.timeframe ? ` (${r.timeframe})` : ''}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">None</p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Stop Loss</p>
                        <p className="text-sm text-white">{s.stop_loss_type || '—'} {s.stop_loss_value ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Take Profit</p>
                        <p className="text-sm text-white">{s.take_profit_type || '—'} {s.take_profit_value ?? '—'}</p>
                      </div>
                    </div>

                    {generatedSignals[id] && (
                      <div className="mt-3 space-y-2 rounded-md bg-[--color-surface]/80 p-3 text-xs text-slate-200">
                        <p className="text-sm font-semibold text-white">Generated Signals</p>
                        {(generatedSignals[id] || []).length === 0 ? (
                          <p className="text-xs text-slate-400">No signals returned</p>
                        ) : (
                          <div className="space-y-2">
                            {generatedSignals[id].map((sig: any, i: number) => (
                              <div key={i} className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs text-slate-400">{sig.asset?.symbol ?? sig.asset_id ?? sig.asset?.asset_id ?? 'ASSET'}</p>
                                  <p className="text-sm font-medium text-white">{(sig.action || sig.final_action || sig.recommendation || 'HOLD').toString()}</p>
                                  <p className="text-xs text-slate-400">Score: {sig.final_score ?? sig.score ?? sig.confidence ?? '—'}</p>
                                </div>
                                <div className="max-w-[60%] text-xs text-slate-300">
                                  {sig.explanations && sig.explanations.length > 0 ? sig.explanations[0].text : sig.explanation || sig.summary || 'No explanation'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {applyErrors[id] && <p className="text-xs text-red-300">Error: {applyErrors[id]}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent p-6 text-center">
            <p className="text-sm text-slate-400">No pre-built admin templates available</p>
          </div>
        )}
      </div>

      {/* Top Trades List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Top Performing Trades</h2>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "profit" | "volume" | "winrate")}
              className="rounded-lg  bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20"
            >
              <option value="profit">Profit</option>
              <option value="volume">Volume</option>
              <option value="winrate">Win Rate</option>
            </select>
          </div>
        </div>

        {filteredAndSortedTrades.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {paginatedTrades.map((trade, index) => (
              <div
                key={trade.id}
                className="rounded-2xl  bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]"
              >
                {/* Trade Card Content */}
                <div className="space-y-4">
                  {/* Header with Type, Pair, and Confidence */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${trade.type === "BUY"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                    >
                      {trade.type}
                    </span>
                    <span className="text-sm font-medium text-white">{trade.pair}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs text-slate-300 ${trade.confidence === "HIGH" ? "bg-slate-700" : trade.confidence === "MEDIUM" ? "bg-slate-600" : "bg-slate-500"
                        }`}
                    >
                      {trade.confidence}
                    </span>
                  </div>

                  {/* Entry and Stop Loss Info */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Ext. {trade.ext}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Entry</span>
                      <span className="font-medium text-white">{trade.entry}</span>
                      <span className="text-slate-500">&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Stop Loss</span>
                      <span className="font-medium text-white">{trade.stopLoss}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>${trade.progressMin}</span>
                      <span>${trade.progressMax}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full bg-gradient-to-r ${trade.type === "BUY"
                          ? "from-green-500 to-emerald-500"
                          : "from-red-500 to-red-600"
                          }`}
                        style={{ width: `${trade.progressValue}%` }}
                      />
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="relative flex items-center gap-4 text-xs pt-3">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30"></div>
                    <div>
                      <span className="text-slate-400">Profit: </span>
                      <span className="font-medium text-green-400">{trade.profit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Volume: </span>
                      <span className="font-medium text-white">{trade.volume}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Win Rate: </span>
                      <span className="font-medium text-green-400">{trade.winRate}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                      Auto Trade
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTradeIndex(index);
                        setShowTradeOverlay(true);
                      }}
                      className="rounded-xl  bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300  hover:text-white"
                    >
                      View Trade
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md bg-[--color-surface] px-3 py-1 text-xs text-slate-300 disabled:opacity-40"
                >
                  Prev
                </button>

                <div className="text-xs text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md bg-[--color-surface] px-3 py-1 text-xs text-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl  bg-gradient-to-br from-white/[0.07] to-transparent p-8 text-center backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
            <p className="text-sm text-slate-400">No trades found for the selected time period</p>
          </div>
        )}
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && filteredAndSortedTrades[selectedTradeIndex] && (
        <div
          className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowTradeOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl  bg-gradient-to-br from-white/[0.07] to-transparent p-6 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Trade Details</h2>
              <button
                onClick={() => setShowTradeOverlay(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Trade Info */}
            <div className="space-y-6">
              {/* Pair and Type */}
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${filteredAndSortedTrades[selectedTradeIndex].type === "BUY"
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                    }`}
                >
                  {filteredAndSortedTrades[selectedTradeIndex].type}
                </span>
                <span className="text-lg font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].pair}</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].confidence}</span>
              </div>

              {/* Trade Details */}
              <div className="space-y-4 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Entry</span>
                  <span className="text-base font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].entryPrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Stop-Loss</span>
                  <span className="text-base font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].stopLossPrice}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Take Profit 1</span>
                  <span className="text-base font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].takeProfit1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Additional Info</span>
                  <span className="text-base font-medium text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].target}</span>
                </div>
              </div>

              {/* Insights/Reasons */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Insights</h3>
                {filteredAndSortedTrades[selectedTradeIndex].insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                    <p className="text-sm text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>

              {/* Performance Metrics */}
              <div className="flex items-center gap-6 rounded-xl bg-gradient-to-br from-white/[0.07] to-transparent p-4">
                <div>
                  <p className="text-xs text-slate-400">Profit</p>
                  <p className="text-lg font-semibold text-green-400">{filteredAndSortedTrades[selectedTradeIndex].profit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Volume</p>
                  <p className="text-lg font-semibold text-white">{filteredAndSortedTrades[selectedTradeIndex].volume}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Win Rate</p>
                  <p className="text-lg font-semibold text-green-400">{filteredAndSortedTrades[selectedTradeIndex].winRate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
