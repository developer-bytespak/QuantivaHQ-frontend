"use client";

import { useState, useMemo } from "react";

interface Trade {
  id: number;
  symbol: string;
  type: "BUY" | "SELL";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  entryPrice: string;
  stopLossPrice: string;
  takeProfit1: string;
  takeProfit2: string;
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
    symbol: "AAPL",
    type: "BUY",
    confidence: "HIGH",
    entryPrice: "$182.45",
    stopLossPrice: "$176.20",
    takeProfit1: "$189.50",
    takeProfit2: "$195.00",
    insights: [
      "Earnings beat, guidance raised 12%",
      "Breakout above 200-day MA with volume",
      "Sentiment improving: 78% positive mentions",
    ],
    profit: "+8.20%",
    profitValue: 8.2,
    volume: "$27,367",
    volumeValue: 27367,
    winRate: "92%",
    winRateValue: 92,
    hoursAgo: 2,
  },
  {
    id: 2,
    symbol: "MSFT",
    type: "BUY",
    confidence: "HIGH",
    entryPrice: "$203.64",
    stopLossPrice: "$198.00",
    takeProfit1: "$210.00",
    takeProfit2: "$218.50",
    insights: [
      "Azure cloud revenue surges 25% YoY",
      "AI integration driving enterprise adoption",
      "Strong technical breakout pattern",
    ],
    profit: "+4.27%",
    profitValue: 4.27,
    volume: "$24,436",
    volumeValue: 24436,
    winRate: "88%",
    winRateValue: 88,
    hoursAgo: 5,
  },
  {
    id: 3,
    symbol: "NVDA",
    type: "BUY",
    confidence: "HIGH",
    entryPrice: "$254.86",
    stopLossPrice: "$245.00",
    takeProfit1: "$265.00",
    takeProfit2: "$275.00",
    insights: [
      "AI chip demand accelerating",
      "Data center revenue up 32%",
      "Strong support at $250 level",
    ],
    profit: "+3.77%",
    profitValue: 3.77,
    volume: "$20,388",
    volumeValue: 20388,
    winRate: "90%",
    winRateValue: 90,
    hoursAgo: 8,
  },
  {
    id: 4,
    symbol: "GOOGL",
    type: "BUY",
    confidence: "MEDIUM",
    entryPrice: "$122.93",
    stopLossPrice: "$118.00",
    takeProfit1: "$128.50",
    takeProfit2: "$135.00",
    insights: [
      "YouTube ad revenue recovery",
      "Cloud growth stabilizing",
      "Attractive valuation metrics",
    ],
    profit: "+2.02%",
    profitValue: 2.02,
    volume: "$17,210",
    volumeValue: 17210,
    winRate: "85%",
    winRateValue: 85,
    hoursAgo: 12,
  },
  {
    id: 5,
    symbol: "AMZN",
    type: "BUY",
    confidence: "HIGH",
    entryPrice: "$150.93",
    stopLossPrice: "$145.00",
    takeProfit1: "$158.00",
    takeProfit2: "$165.00",
    insights: [
      "AWS margins expanding",
      "E-commerce holiday season strong",
      "Breakout from consolidation",
    ],
    profit: "+1.84%",
    profitValue: 1.84,
    volume: "$13,584",
    volumeValue: 13584,
    winRate: "87%",
    winRateValue: 87,
    hoursAgo: 15,
  },
];

export default function StocksTopTradesPage() {
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);

  // Filter and sort trades based on selected criteria
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = [...topTradesData];

    if (timeFilter !== "all") {
      const hoursLimit = timeFilter === "24h" ? 24 : timeFilter === "7d" ? 168 : 720;
      filtered = filtered.filter((trade) => trade.hoursAgo <= hoursLimit);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "profit":
          return b.profitValue - a.profitValue;
        case "volume":
          return b.volumeValue - a.volumeValue;
        case "winrate":
          return b.winRateValue - a.winRateValue;
        default:
          return 0;
      }
    });
  }, [timeFilter, sortBy]);

  // Calculate performance stats
  const performanceStats = useMemo(() => {
    if (filteredAndSortedTrades.length === 0) {
      return [
        { label: "Total Profit", value: "$0", change: "0%", positive: true },
        { label: "Win Rate", value: "0%", change: "0%", positive: true },
        { label: "Total Trades", value: "0", change: "0", positive: true },
        { label: "Avg. Return", value: "0%", change: "0%", positive: true },
      ];
    }

    const totalProfit = filteredAndSortedTrades.reduce((sum, trade) => sum + trade.profitValue, 0);
    const avgWinRate = filteredAndSortedTrades.reduce((sum, trade) => sum + trade.winRateValue, 0) / filteredAndSortedTrades.length;
    const totalTrades = filteredAndSortedTrades.length;
    const avgReturn = filteredAndSortedTrades.reduce((sum, trade) => sum + trade.profitValue, 0) / filteredAndSortedTrades.length;

    return [
      {
        label: "Total Profit",
        value: `+${totalProfit.toFixed(1)}%`,
        change: "+12.5%",
        positive: true
      },
      {
        label: "Win Rate",
        value: `${avgWinRate.toFixed(1)}%`,
        change: "+3.2%",
        positive: true
      },
      {
        label: "Total Trades",
        value: totalTrades.toString(),
        change: "+15",
        positive: true
      },
      {
        label: "Avg. Return",
        value: `+${avgReturn.toFixed(1)}%`,
        change: "+0.8%",
        positive: true
      },
    ];
  }, [filteredAndSortedTrades]);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Track your best performing stock trades and strategies</p>
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

      {/* Performance Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {performanceStats.map((stat, index) => (
          <div key={index} className="rounded-xl bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
            <p className="mb-1 text-xs text-slate-400">{stat.label}</p>
            <p className="mb-2 text-2xl font-bold text-white">{stat.value}</p>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                {stat.change}
              </span>
              <span className="text-xs text-slate-500">vs previous period</span>
            </div>
          </div>
        ))}
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredAndSortedTrades.map((trade, index) => (
              <div
                key={trade.id}
                className="rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${trade.type === "BUY"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                    >
                      {trade.type}
                    </span>
                    <span className="text-sm font-medium text-white">{trade.symbol}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${trade.confidence === "HIGH" ? "bg-green-500/20 text-green-400" : trade.confidence === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-600 text-slate-300"
                        }`}
                    >
                      {trade.confidence}
                    </span>
                  </div>

                  {/* Entry and Stop Loss */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Entry</span>
                      <span className="font-medium text-white">{trade.entryPrice}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Stop Loss</span>
                      <span className="font-medium text-red-400">{trade.stopLossPrice}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">TP1</span>
                      <span className="font-medium text-green-400">{trade.takeProfit1}</span>
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
                      className="rounded-xl  bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#fc4f02]/50 hover:text-white"
                    >
                      View Trade
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl  bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-8 text-center backdrop-blur shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)]">
            <p className="text-sm text-slate-400">No trades found for the selected time period</p>
          </div>
        )}
      </div>

      {/* Trade Details Overlay */}
      {showTradeOverlay && filteredAndSortedTrades[selectedTradeIndex] && (
        <div
          className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowTradeOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-4xl max-h-[700px] rounded-2xl  bg-gradient-to-br from-white/[0.15] to-white/[0.05] p-4 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Trade Details</h2>
              <button
                onClick={() => setShowTradeOverlay(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${filteredAndSortedTrades[selectedTradeIndex].type === "BUY"
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                    }`}
                >
                  {filteredAndSortedTrades[selectedTradeIndex].type}
                </span>
                <span className="text-lg font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].symbol}</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{filteredAndSortedTrades[selectedTradeIndex].confidence}</span>
              </div>

              {/* Two-column layout for details and stats */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left column - Trade Details */}
                <div className="space-y-4 rounded-xl  bg-[--color-surface]/60 p-4">
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
                    <span className="text-sm text-slate-400">Take Profit 2</span>
                    <span className="text-base font-medium text-white">{filteredAndSortedTrades[selectedTradeIndex].takeProfit2}</span>
                  </div>
                </div>

                {/* Right column - Profit & Volume Stats */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Trade Stats</h3>
                  <div className="flex flex-col gap-2 rounded-xl  bg-[--color-surface]/60 p-4">
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
                    <p className="text-lg font-semibold text-white">{filteredAndSortedTrades[selectedTradeIndex].winRate}</p>
                  </div>
                  </div>
                </div>
              </div>

              {/* Insights below - full width */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Insights</h3>
                {filteredAndSortedTrades[selectedTradeIndex].insights.map((insight: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                    <p className="text-sm text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>
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



