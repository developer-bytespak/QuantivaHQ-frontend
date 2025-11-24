"use client";

import { useState, useMemo } from "react";

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
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState<number>(0);

  // Filter and sort trades based on selected criteria
  const filteredAndSortedTrades = useMemo(() => {
    // First, filter by time
    let filtered = [...topTradesData];

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

  // Calculate performance stats based on filtered trades
  const performanceStats = useMemo(() => {
    if (filteredAndSortedTrades.length === 0) {
      return [
        { label: "Total Profit", value: "$0", change: "0%", positive: true },
        { label: "Win Rate", value: "0%", change: "0%", positive: true },
        { label: "Total Trades", value: "0", change: "0", positive: true },
        { label: "Avg. Return", value: "0%", change: "0%", positive: true },
      ];
    }

    const totalProfit = filteredAndSortedTrades.reduce((sum, trade) => {
      const amount = parseFloat(trade.profit.replace(/[+%,]/g, ""));
      return sum + amount;
    }, 0);

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

      {/* Performance Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {performanceStats.map((stat, index) => (
          <div key={index} className="rounded-xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-xl shadow-blue-900/10">
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
              className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1.5 text-xs font-medium text-white focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20"
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
                className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10"
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
                  <div className="flex items-center gap-4 text-xs border-t border-[--color-border] pt-3">
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
                      className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#fc4f02]/50 hover:text-white"
                    >
                      View Trade
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-8 text-center backdrop-blur shadow-xl shadow-blue-900/10">
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
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
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
              <div className="space-y-4 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
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
              <div className="flex items-center gap-6 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
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
