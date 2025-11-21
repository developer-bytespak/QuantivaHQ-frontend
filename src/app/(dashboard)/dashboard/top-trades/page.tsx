"use client";

import { useState, useMemo } from "react";

const topTradesData = [
    {
      id: 1,
      pair: "BTC/USDT",
      type: "LONG",
      entry: "$42,350",
      exit: "$44,820",
      profit: "+5.83%",
      profitAmount: "+$2,470",
      volume: "$42,350",
      winRate: "92%",
      trades: 24,
      status: "closed",
      time: "2 hours ago",
      positive: true,
      profitValue: 5.83,
      volumeValue: 42350,
      winRateValue: 92,
      hoursAgo: 2,
    },
    {
      id: 2,
      pair: "ETH/USDT",
      type: "LONG",
      entry: "$2,340",
      exit: "$2,480",
      profit: "+5.98%",
      profitAmount: "+$1,400",
      volume: "$23,400",
      winRate: "88%",
      trades: 18,
      status: "closed",
      time: "5 hours ago",
      positive: true,
      profitValue: 5.98,
      volumeValue: 23400,
      winRateValue: 88,
      hoursAgo: 5,
    },
    {
      id: 3,
      pair: "SOL/USDT",
      type: "SHORT",
      entry: "$98.50",
      exit: "$92.20",
      profit: "+6.39%",
      profitAmount: "+$630",
      volume: "$9,850",
      winRate: "85%",
      trades: 12,
      status: "closed",
      time: "8 hours ago",
      positive: true,
      profitValue: 6.39,
      volumeValue: 9850,
      winRateValue: 85,
      hoursAgo: 8,
    },
    {
      id: 4,
      pair: "BNB/USDT",
      type: "LONG",
      entry: "$315",
      exit: "$328",
      profit: "+4.13%",
      profitAmount: "+$1,300",
      volume: "$31,500",
      winRate: "90%",
      trades: 20,
      status: "closed",
      time: "12 hours ago",
      positive: true,
      profitValue: 4.13,
      volumeValue: 31500,
      winRateValue: 90,
      hoursAgo: 12,
    },
    {
      id: 5,
      pair: "XRP/USDT",
      type: "LONG",
      entry: "$0.58",
      exit: "$0.61",
      profit: "+5.17%",
      profitAmount: "+$580",
      volume: "$11,200",
      winRate: "82%",
      trades: 15,
      status: "closed",
      time: "1 day ago",
      positive: true,
      profitValue: 5.17,
      volumeValue: 11200,
      winRateValue: 82,
      hoursAgo: 24,
    },
    {
      id: 6,
      pair: "ADA/USDT",
      type: "SHORT",
      entry: "$0.48",
      exit: "$0.45",
      profit: "+6.25%",
      profitAmount: "+$300",
      volume: "$4,800",
      winRate: "78%",
      trades: 9,
      status: "closed",
      time: "2 days ago",
      positive: true,
      profitValue: 6.25,
      volumeValue: 4800,
      winRateValue: 78,
      hoursAgo: 48,
    },
    {
      id: 7,
      pair: "DOGE/USDT",
      type: "LONG",
      entry: "$0.082",
      exit: "$0.089",
      profit: "+8.54%",
      profitAmount: "+$850",
      volume: "$9,950",
      winRate: "75%",
      trades: 8,
      status: "closed",
      time: "3 days ago",
      positive: true,
      profitValue: 8.54,
      volumeValue: 9950,
      winRateValue: 75,
      hoursAgo: 72,
    },
    {
      id: 8,
      pair: "MATIC/USDT",
      type: "SHORT",
      entry: "$0.85",
      exit: "$0.78",
      profit: "+8.24%",
      profitAmount: "+$700",
      volume: "$8,500",
      winRate: "80%",
      trades: 10,
      status: "closed",
      time: "5 days ago",
      positive: true,
      profitValue: 8.24,
      volumeValue: 8500,
      winRateValue: 80,
      hoursAgo: 120,
    },
    {
      id: 9,
      pair: "LINK/USDT",
      type: "LONG",
      entry: "$14.20",
      exit: "$15.10",
      profit: "+6.34%",
      profitAmount: "+$900",
      volume: "$14,200",
      winRate: "88%",
      trades: 16,
      status: "closed",
      time: "10 days ago",
      positive: true,
      profitValue: 6.34,
      volumeValue: 14200,
      winRateValue: 88,
      hoursAgo: 240,
    },
    {
      id: 10,
      pair: "AVAX/USDT",
      type: "LONG",
      entry: "$36.50",
      exit: "$38.90",
      profit: "+6.58%",
      profitAmount: "+$2,400",
      volume: "$36,500",
      winRate: "91%",
      trades: 22,
      status: "closed",
      time: "15 days ago",
      positive: true,
      profitValue: 6.58,
      volumeValue: 36500,
      winRateValue: 91,
      hoursAgo: 360,
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
      const amount = parseFloat(trade.profitAmount.replace(/[+$,]/g, ""));
      return sum + amount;
    }, 0);

    const avgWinRate = filteredAndSortedTrades.reduce((sum, trade) => sum + trade.winRateValue, 0) / filteredAndSortedTrades.length;
    const totalTrades = filteredAndSortedTrades.reduce((sum, trade) => sum + trade.trades, 0);
    const avgReturn = filteredAndSortedTrades.reduce((sum, trade) => sum + trade.profitValue, 0) / filteredAndSortedTrades.length;

    return [
      { 
        label: "Total Profit", 
        value: `+$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
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

      {/* Top Trades Table */}
      <div className="group rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/30 hover:shadow-2xl hover:shadow-[#fc4f02]/10">
        <div className="border-b border-[--color-border] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[--color-border]">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Pair</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Entry</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Exit</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Profit</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Volume</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Win Rate</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Trades</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase text-slate-400">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {filteredAndSortedTrades.length > 0 ? (
                filteredAndSortedTrades.map((trade) => (
                <tr key={trade.id} className="cursor-pointer transition-all duration-200 hover:bg-[--color-surface]/60 hover:border-l-2 hover:border-[#fc4f02]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{trade.pair}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                        trade.type === "LONG"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{trade.entry}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{trade.exit}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${trade.positive ? "text-green-400" : "text-red-400"}`}>
                        {trade.profit}
                      </span>
                      <span className={`text-xs ${trade.positive ? "text-green-400/70" : "text-red-400/70"}`}>
                        {trade.profitAmount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{trade.volume}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{trade.winRate}</span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: trade.winRate }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{trade.trades}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{trade.time}</td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-400">
                    No trades found for the selected time period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Best Performing Asset */}
        <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
          <h2 className="mb-4 text-lg font-semibold text-white">Best Performing Asset</h2>
          <div className="space-y-4">
            <div className="cursor-pointer rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20 transition-transform duration-300 group-hover:scale-110">
                  <span className="text-lg font-bold text-[#fc4f02]">BTC</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Bitcoin</p>
                  <p className="text-xs text-slate-400">BTC/USDT</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-400">+5.83%</p>
                <p className="text-xs text-slate-400">24 trades</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Profit</span>
                <span className="font-medium text-white">+$2,470</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Win Rate</span>
                <span className="font-medium text-green-400">92%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Avg. Hold Time</span>
                <span className="font-medium text-white">4.2 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Distribution */}
        <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
          <h2 className="mb-4 text-lg font-semibold text-white">Trade Distribution</h2>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Long Positions</span>
                <span className="text-sm font-medium text-white">78%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div className="h-full w-[78%] bg-gradient-to-r from-green-500 to-emerald-500" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Short Positions</span>
                <span className="text-sm font-medium text-white">22%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div className="h-full w-[22%] bg-gradient-to-r from-red-500 to-rose-500" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 group-hover:border-[#fc4f02]/30">
              <div>
                <p className="text-xs text-slate-400">Total Long</p>
                <p className="text-lg font-bold text-green-400">76</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Short</p>
                <p className="text-lg font-bold text-red-400">22</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Top Trades */}
      <div className="group rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.01]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Top Trades</h2>
          <button className="text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {filteredAndSortedTrades.slice(0, 4).map((trade) => (
            <div
              key={trade.id}
              className="cursor-pointer flex items-center justify-between rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    trade.type === "LONG" ? "bg-green-500/20" : "bg-red-500/20"
                  }`}
                >
                  {trade.type === "LONG" ? (
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{trade.pair}</p>
                  <p className="text-xs text-slate-400">{trade.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${trade.positive ? "text-green-400" : "text-red-400"}`}>
                  {trade.profit}
                </p>
                <p className="text-xs text-slate-400">{trade.profitAmount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

