"use client";

import { useState } from "react";

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
  const [activeTab, setActiveTab] = useState<"holdings" | "market">("holdings");
  const [showAllActivities, setShowAllActivities] = useState(false);

  return (
    <div className="space-y-6 pb-8">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Snapshot */}
          <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
            <h2 className="mb-4 text-lg font-semibold text-white">Portfolio Snapshot</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-slate-400">Total Portfolio Value</p>
                <p className="mb-2 text-2xl font-bold text-white">$12,340.52</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-400">+3742.10</span>
                  <span className="text-sm text-green-400">(+3.1% today)</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">Active Strategies</p>
                <p className="mb-2 text-2xl font-bold text-white">$7,480</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-400">+8%</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">3 active strategies</p>
              </div>
            </div>
          </div>

          {/* Action Center - Recent Activities */}
          <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Action Center</h2>
              <button
                onClick={() => setShowAllActivities(true)}
                className="text-xs text-[#fc4f02] hover:text-[#fda300] transition-colors"
              >
                View All Activity
              </button>
            </div>
            <div className="space-y-4">
              {/* Activity Item 1 */}
              <div className="group/item cursor-pointer flex items-start gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
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
              <div className="group/item cursor-pointer flex items-start gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
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
              <div className="group/item cursor-pointer flex items-start gap-3 rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
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
          <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20">
            <div className="border-b border-[--color-border] p-6 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Holdings & Market</h2>
                <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
                  <button
                    onClick={() => setActiveTab("holdings")}
                    className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${
                      activeTab === "holdings"
                        ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    My Holdings
                  </button>
                  <button
                    onClick={() => setActiveTab("market")}
                    className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${
                      activeTab === "market"
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
                  <tr className="group/row relative hover:bg-[--color-surface]/40 transition-colors before:absolute before:left-0 before:top-1/2 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b before:from-[#fc4f02] before:to-[#fda300] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
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
          <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
            <h2 className="mb-4 text-lg font-semibold text-white">Trade</h2>
            
            {/* Top Trade Opportunity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-3 py-1 text-sm font-semibold text-white">
                  BUY
                </span>
                <span className="text-sm font-medium text-white">ETH / USDT</span>
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">HIGH</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400">Ext. 22,000</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Entry</span>
                  <span className="font-medium text-white">1,020</span>
                  <span className="text-slate-500">&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Stop Loss</span>
                  <span className="font-medium text-white">1.317 $</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>$790</span>
                  <span>$200</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-[75%] bg-gradient-to-r from-green-500 to-emerald-500" />
                </div>
              </div>

              {/* Trade Details */}
              <div className="group/details cursor-pointer space-y-2 rounded-lg border border-[--color-border] bg-[--color-surface]/60 p-3 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80 hover:scale-[1.01]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Entry</span>
                  <span className="text-white">$2,120</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Stop-Loss</span>
                  <span className="text-white">$120</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Take Profit 1</span>
                  <span className="text-white">$240</span>
                </div>
                <div className="text-xs text-slate-500">20,045-</div>
              </div>

              {/* Reasons */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-slate-300">Bullish momentum on 1h and 4h charts</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-slate-300">Sentiment improved 20% in last 3 hours</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-slate-300">High liquidity reduces execution risk</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                  Approve Trade
                </button>
                <button className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#fc4f02]/50 hover:text-white">
                  View All Signals
                </button>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">AI Insights</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">2 min</span>
                <button className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">Sentiment:</p>
                <span className="inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                  Bullish
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  Market momentum on 15 U CV in BTC and BTC liquidity returning 90% in last 48 hours. BTC may break out if BTC sustains above $34.500
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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

