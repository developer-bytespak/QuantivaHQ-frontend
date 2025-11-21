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
  {
    id: 6,
    pair: "ADA / USDT",
    type: "SELL",
    confidence: "LOW",
    ext: "0.48",
    entry: "0.475",
    stopLoss: "0.490",
    progressMin: 500,
    progressMax: 350,
    progressValue: 58,
    entryPrice: "$0.475",
    stopLossPrice: "$0.490",
    takeProfit1: "$0.450",
    target: "45,200-",
    insights: [
      "Overbought conditions on RSI",
      "Weak volume on recent rally",
      "Approaching resistance zone",
    ],
    profit: "+5.26%",
    profitValue: 5.26,
    volume: "$4,750",
    volumeValue: 4750,
    winRate: "78%",
    winRateValue: 78,
    hoursAgo: 20,
  },
  {
    id: 7,
    pair: "DOGE / USDT",
    type: "BUY",
    confidence: "MEDIUM",
    ext: "0.082",
    entry: "0.081",
    stopLoss: "0.078",
    progressMin: 650,
    progressMax: 200,
    progressValue: 72,
    entryPrice: "$0.081",
    stopLossPrice: "$0.078",
    takeProfit1: "$0.089",
    target: "88,500-",
    insights: [
      "Meme coin momentum building",
      "High retail interest returning",
      "Breakout from consolidation",
    ],
    profit: "+9.88%",
    profitValue: 9.88,
    volume: "$8,100",
    volumeValue: 8100,
    winRate: "75%",
    winRateValue: 75,
    hoursAgo: 24,
  },
  {
    id: 8,
    pair: "MATIC / USDT",
    type: "BUY",
    confidence: "HIGH",
    ext: "0.85",
    entry: "0.845",
    stopLoss: "0.820",
    progressMin: 700,
    progressMax: 180,
    progressValue: 79,
    entryPrice: "$0.845",
    stopLossPrice: "$0.820",
    takeProfit1: "$0.880",
    target: "87,200-",
    insights: [
      "Strong fundamentals support",
      "Partnership announcements pending",
      "Technical breakout confirmed",
    ],
    profit: "+4.14%",
    profitValue: 4.14,
    volume: "$16,900",
    volumeValue: 16900,
    winRate: "80%",
    winRateValue: 80,
    hoursAgo: 30,
  },
  {
    id: 9,
    pair: "LINK / USDT",
    type: "BUY",
    confidence: "HIGH",
    ext: "14.20",
    entry: "14.15",
    stopLoss: "13.80",
    progressMin: 720,
    progressMax: 200,
    progressValue: 76,
    entryPrice: "$14.15",
    stopLossPrice: "$13.80",
    takeProfit1: "$15.10",
    target: "15,050-",
    insights: [
      "Oracle network growth accelerating",
      "Institutional adoption increasing",
      "Strong technical setup",
    ],
    profit: "+6.71%",
    profitValue: 6.71,
    volume: "$14,150",
    volumeValue: 14150,
    winRate: "88%",
    winRateValue: 88,
    hoursAgo: 36,
  },
  {
    id: 10,
    pair: "AVAX / USDT",
    type: "BUY",
    confidence: "MEDIUM",
    ext: "36.50",
    entry: "36.20",
    stopLoss: "35.00",
    progressMin: 680,
    progressMax: 250,
    progressValue: 71,
    entryPrice: "$36.20",
    stopLossPrice: "$35.00",
    takeProfit1: "$38.90",
    target: "38,500-",
    insights: [
      "Ecosystem expansion continues",
      "TVL growth supporting price",
      "Bullish chart pattern forming",
    ],
    profit: "+7.46%",
    profitValue: 7.46,
    volume: "$36,200",
    volumeValue: 36200,
    winRate: "91%",
    winRateValue: 91,
    hoursAgo: 42,
  },
];

export default function TopTradesPage() {
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [sortBy, setSortBy] = useState<"profit" | "volume" | "winrate">("profit");

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
          <h1 className="text-2xl font-bold text-white">Top Trades</h1>
          <p className="mt-1 text-sm text-slate-400">Track your best performing trades and strategies</p>
        </div>
        
        {/* Time Filter */}
        <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
          {(["24h", "7d", "30d", "all"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${
                timeFilter === period
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
          <div key={index} className="group cursor-pointer rounded-xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
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
          <div className="space-y-4">
            {filteredAndSortedTrades.map((trade) => (
              <div
                key={trade.id}
                className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.01]"
              >
                {/* Header */}
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${
                      trade.type === "BUY"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                        : "bg-gradient-to-r from-red-500 to-rose-500"
                    }`}
                  >
                    {trade.type}
                  </span>
                  <span className="text-sm font-medium text-white">{trade.pair}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      trade.confidence === "HIGH"
                        ? "bg-green-500/20 text-green-400"
                        : trade.confidence === "MEDIUM"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {trade.confidence}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Left Column - Trade Parameters */}
                  <div className="space-y-4">
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
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${trade.progressValue}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Trade Details */}
                  <div className="space-y-4">
                    <div className="group/details cursor-pointer space-y-2 rounded-lg border border-[--color-border] bg-[--color-surface]/60 p-3 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Entry</span>
                        <span className="text-white">{trade.entryPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Stop-Loss</span>
                        <span className="text-white">{trade.stopLossPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Take Profit 1</span>
                        <span className="text-white">{trade.takeProfit1}</span>
                      </div>
                      <div className="text-xs text-slate-500">{trade.target}</div>
                    </div>
                  </div>

                  {/* Right Column - Insights & Actions */}
                  <div className="space-y-4">
                    {/* Insights */}
                    <div className="space-y-2">
                      {trade.insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                          <p className="text-xs text-slate-300">{insight}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                        Approve Trade
                      </button>
                      <button className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#fc4f02]/50 hover:text-white">
                        View Details
                      </button>
                    </div>

                    {/* Performance Metrics */}
                    <div className="flex items-center gap-4 pt-2 text-xs">
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
    </div>
  );
}
