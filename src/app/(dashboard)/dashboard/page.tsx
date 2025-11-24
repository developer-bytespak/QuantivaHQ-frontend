"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Activity {
  id: number;
  type: "buy" | "sell" | "tp" | "sentiment";
  title: string;
  description: string;
  timestamp: string;
  iconColor: string;
  iconBg: string;
}

const allActivities: Activity[] = [
  {
    id: 1,
    type: "buy",
    title: "BUY QI executed at 58.20",
    description: "New Signal. BTC high confidence",
    timestamp: "2m ago",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
  },
  {
    id: 2,
    type: "tp",
    title: "ETH TP1 Hit (+2.1%)",
    description: "5/0jm 12 min ago",
    timestamp: "15m ago",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    id: 3,
    type: "sentiment",
    title: "XRP sentiment spike (-18%)",
    description: "",
    timestamp: "22m ago",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
  },
  {
    id: 4,
    type: "buy",
    title: "BUY BTC executed at $34,500",
    description: "Strong support level. High confidence signal",
    timestamp: "1h ago",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
  },
  {
    id: 5,
    type: "tp",
    title: "SOL TP2 Hit (+5.3%)",
    description: "Take profit target reached",
    timestamp: "2h ago",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    id: 6,
    type: "sell",
    title: "SELL ADA executed at $0.45",
    description: "Stop loss triggered. Risk management",
    timestamp: "3h ago",
    iconColor: "text-red-400",
    iconBg: "bg-red-500/20",
  },
  {
    id: 7,
    type: "sentiment",
    title: "BTC sentiment improved (+12%)",
    description: "Positive market sentiment shift detected",
    timestamp: "4h ago",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
  },
  {
    id: 8,
    type: "buy",
    title: "BUY ETH executed at $2,120",
    description: "Bullish momentum on 1h and 4h charts",
    timestamp: "5h ago",
    iconColor: "text-green-400",
    iconBg: "bg-green-500/20",
  },
  {
    id: 9,
    type: "tp",
    title: "XRP TP1 Hit (+3.2%)",
    description: "First take profit level reached",
    timestamp: "6h ago",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    id: 10,
    type: "sentiment",
    title: "Market volatility spike detected",
    description: "Increased volatility in crypto markets",
    timestamp: "8h ago",
    iconColor: "text-yellow-400",
    iconBg: "bg-yellow-500/20",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"holdings" | "market">("holdings");
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showNewsOverlay, setShowNewsOverlay] = useState(false);
  const [showTradeOverlay, setShowTradeOverlay] = useState(false);
  const [selectedNews, setSelectedNews] = useState<number>(0);
  const [selectedTrade, setSelectedTrade] = useState<number>(0);

  const newsItems = [
    {
      id: 1,
      title: "Bitcoin Momentum Building",
      description: "Market momentum on 15 U CV in BTC and BTC liquidity returning 90% in last 48 hours. BTC may break out if BTC sustains above $34.500",
      timestamp: "2 min ago",
    },
    {
      id: 2,
      title: "Ethereum Network Upgrade Success",
      description: "ETH network successfully completed its latest upgrade, reducing gas fees by 40% and improving transaction speed. Validators report 99.9% uptime during transition.",
      timestamp: "15 min ago",
    },
  ];

  const trades = [
    {
      id: 1,
      pair: "ETH / USDT",
      type: "BUY",
      confidence: "HIGH",
      entry: "$2,120",
      stopLoss: "$120",
      takeProfit1: "$240",
      additionalInfo: "20,045-",
      ext: "22,000",
      entryShort: "1,020",
      stopLossShort: "1.317 $",
      progressMin: "$790",
      progressMax: "$200",
      progressPercent: 75,
      reasons: [
        "Bullish momentum on 1h and 4h charts",
        "Sentiment improved 20% in last 3 hours",
        "High liquidity reduces execution risk"
      ]
    },
    {
      id: 2,
      pair: "BTC / USDT",
      type: "SELL",
      confidence: "MEDIUM",
      entry: "$34,500",
      stopLoss: "$35,200",
      takeProfit1: "$33,800",
      additionalInfo: "15,230-",
      ext: "18,500",
      entryShort: "34,500",
      stopLossShort: "35,200 $",
      progressMin: "$520",
      progressMax: "$150",
      progressPercent: 60,
      reasons: [
        "Resistance level at $35,000 showing strong rejection",
        "Volume declining on upward moves",
        "RSI showing bearish divergence on 4h timeframe"
      ]
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio - Main Box with Two Inner Boxes */}
          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
            <h2 className="mb-4 text-lg font-semibold text-white">Portfolio</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Total Profit Value Inner Box */}
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <p className="mb-2 text-xs text-slate-400">Total Profit Value</p>
                <p className="mb-2 text-2xl font-bold text-white">$12,340.52</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-400">+3742.10</span>
                  <span className="text-sm text-green-400">(+3.1% today)</span>
                </div>
              </div>

              {/* Active Strategies Inner Box */}
              <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <p className="mb-2 text-xs text-slate-400">Active Strategies</p>
                <p className="mb-2 text-2xl font-bold text-white">$7,480</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-400">+8%</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">3 active strategies</p>
              </div>
            </div>
          </div>

          {/* Action Center - Recent Activities */}
          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Action Center</h2>
              <button
                onClick={() => setShowAllActivities(true)}
                className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
              >
                View All Activity
              </button>
            </div>
            <div className="space-y-4">
              {/* Activity Item 1 */}
              <div className="cursor-pointer flex items-start gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">BUY QI executed at 58.20</p>
                  <p className="text-xs text-slate-400">New Signal. BTC high confidence</p>
                  <p className="mt-1 text-xs text-slate-500">2m ago</p>
                </div>
              </div>

              {/* Activity Item 2 */}
              <div className="cursor-pointer flex items-start gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">ETH TP1 Hit (+2.1%)</p>
                  <p className="text-xs text-slate-400">5/0jm 12 min ago</p>
                  <p className="mt-1 text-xs text-slate-500">15m ago</p>
                </div>
              </div>

              {/* Activity Item 3 */}
              <div className="cursor-pointer flex items-start gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
                  <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">XRP sentiment spike (-18%)</p>
                  <p className="mt-1 text-xs text-slate-500">22m ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Holdings & Market */}
          <div className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 backdrop-blur shadow-xl shadow-blue-900/10">
            <div className="border-b border-[--color-border] p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Holdings & Market</h2>
                <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
                  <button
                    onClick={() => setActiveTab("holdings")}
                    className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === "holdings"
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    My Holdings
                  </button>
                  <button
                    onClick={() => setActiveTab("market")}
                    className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${activeTab === "market"
                      ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    Market
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Asset</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Holdings</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Value</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">Entry price</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">P/L</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase text-slate-400">About</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  <tr className="hover:bg-[--color-surface]/40 transition-colors">
                    <td className="py-3 text-sm font-medium text-white">BTC</td>
                    <td className="py-3 text-sm text-slate-300">2.20 ETH</td>
                    <td className="py-3 text-sm text-slate-300">$5,114.50</td>
                    <td className="py-3 text-sm text-slate-300">$2,890</td>
                    <td className="py-3 text-sm font-medium text-green-400">+0.94%</td>
                    <td className="py-3 text-sm text-slate-400">244</td>
                  </tr>
                  <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                    <td className="py-3 text-sm font-medium text-white">ETH</td>
                    <td className="py-3 text-sm text-slate-300">$2,1114</td>
                    <td className="py-3 text-sm text-slate-300">$2,045</td>
                    <td className="py-3 text-sm text-slate-300">12.045</td>
                    <td className="py-3 text-sm font-medium text-red-400">-1.37%</td>
                    <td className="py-3 text-sm text-slate-400">4,144</td>
                  </tr>
                  <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                    <td className="py-3 text-sm font-medium text-white">SOL</td>
                    <td className="py-3 text-sm text-slate-300">$2,114</td>
                    <td className="py-3 text-sm text-slate-300">$1,114</td>
                    <td className="py-3 text-sm text-slate-300">$343</td>
                    <td className="py-3 text-sm font-medium text-red-400">-1.13%</td>
                    <td className="py-3 text-sm text-slate-400">-</td>
                  </tr>
                  <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                    <td className="py-3 text-sm font-medium text-white">XRP</td>
                    <td className="py-3 text-sm text-slate-300">5.485</td>
                    <td className="py-3 text-sm text-slate-300">$1,094</td>
                    <td className="py-3 text-sm text-slate-300">$2,048</td>
                    <td className="py-3 text-sm font-medium text-red-400">-1.3%</td>
                    <td className="py-3 text-sm text-slate-400">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Trade & AI Insights */}
        <div className="space-y-6">
          {/* Trade Section */}
          <div className="space-y-2">
            {/* Trade Header - Outside Box */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Trade</h2>
              <button
                onClick={() => router.push("/dashboard/top-trades")}
                className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
              >
                View All Trades
              </button>
            </div>

            {/* Trade Cards */}
            <div className="space-y-3">
              {trades.map((trade, index) => (
                <div key={trade.id} className="rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10">
                  {/* Top Trade Opportunity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${trade.type === "BUY"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}>
                        {trade.type}
                      </span>
                      <span className="text-sm font-medium text-white">{trade.pair}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs text-slate-300 ${trade.confidence === "HIGH" ? "bg-slate-700" : "bg-slate-600"
                        }`}>{trade.confidence}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Ext. {trade.ext}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Entry</span>
                        <span className="font-medium text-white">{trade.entryShort}</span>
                        <span className="text-slate-500">&gt;</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Stop Loss</span>
                        <span className="font-medium text-white">{trade.stopLossShort}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{trade.progressMin}</span>
                        <span>{trade.progressMax}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full bg-gradient-to-r ${trade.type === "BUY"
                            ? "from-green-500 to-emerald-500"
                            : "from-red-500 to-red-600"
                            }`}
                          style={{ width: `${trade.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                        Auto Trade
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTrade(index);
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
          </div>

          {/* AI Insights Section */}
          <div className="space-y-2">
            {/* AI Insights Header - Outside Box */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">AI Insights</h2>
              <button
                onClick={() => router.push("/dashboard/ai-insights")}
                className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 hover:text-white hover:scale-105 shadow-lg shadow-[#fc4f02]/30"
              >
                View All AI Insights
              </button>
            </div>

            {/* AI Insights News Cards */}
            <div className="space-y-3">
              {newsItems.map((news, index) => (
                <div
                  key={news.id}
                  onClick={() => {
                    setSelectedNews(index);
                    setShowNewsOverlay(true);
                  }}
                  className="cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{news.timestamp}</span>
                      <button className="text-slate-400 hover:text-white transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* News Heading */}
                    <h3 className="text-base font-semibold text-white">{news.title}</h3>

                    {/* Description */}
                    <div className="space-y-2 text-sm text-slate-300">
                      <p className="line-clamp-2">
                        {news.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* News Overlay */}
      {showNewsOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowNewsOverlay(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{newsItems[selectedNews].title}</h2>
              <button
                onClick={() => setShowNewsOverlay(false)}
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

            {/* Timestamp */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-slate-400">{newsItems[selectedNews].timestamp}</span>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                <p>{newsItems[selectedNews].description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Details Overlay */}
      {showTradeOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
                <span className={`rounded-lg px-4 py-2 text-base font-semibold text-white ${trades[selectedTrade].type === "BUY"
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300]"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}>
                  {trades[selectedTrade].type}
                </span>
                <span className="text-lg font-medium text-white">{trades[selectedTrade].pair}</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{trades[selectedTrade].confidence}</span>
              </div>

              {/* Trade Details */}
              <div className="space-y-4 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Entry</span>
                  <span className="text-base font-medium text-white">{trades[selectedTrade].entry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Stop-Loss</span>
                  <span className="text-base font-medium text-white">{trades[selectedTrade].stopLoss}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Take Profit 1</span>
                  <span className="text-base font-medium text-white">{trades[selectedTrade].takeProfit1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Additional Info</span>
                  <span className="text-base font-medium text-slate-300">{trades[selectedTrade].additionalInfo}</span>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Reasons</h3>
                {trades[selectedTrade].reasons.map((reason: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-400" />
                    <p className="text-sm text-slate-300">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Activities Overlay */}
      {showAllActivities && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAllActivities(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">All Activities</h2>
              <button
                onClick={() => setShowAllActivities(false)}
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

            {/* Activities List */}
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
              {allActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="group/item cursor-pointer flex items-start gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activity.iconBg}`}
                  >
                    {activity.type === "buy" || activity.type === "sell" ? (
                      <svg
                        className={`h-4 w-4 ${activity.iconColor}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={activity.type === "buy" ? "M5 13l4 4L19 7" : "M19 13l-4 4L5 7"}
                        />
                      </svg>
                    ) : activity.type === "tp" ? (
                      <svg
                        className={`h-4 w-4 ${activity.iconColor}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className={`h-4 w-4 ${activity.iconColor}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    {activity.description && (
                      <p className="mt-1 text-xs text-slate-400">{activity.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">{activity.timestamp}</p>
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

