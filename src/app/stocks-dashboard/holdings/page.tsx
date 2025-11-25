"use client";

import { useState } from "react";

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  pl: number;
  plPercent: number;
  dayChange: number;
  weight: number;
}

const holdingsData: Holding[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    quantity: 150,
    avgCost: 168.50,
    currentPrice: 182.45,
    marketValue: 27367,
    pl: 2092,
    plPercent: 8.20,
    dayChange: 0.62,
    weight: 11.0,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    quantity: 120,
    avgCost: 195.30,
    currentPrice: 203.64,
    marketValue: 24437,
    pl: 1000,
    plPercent: 4.27,
    dayChange: 0.45,
    weight: 9.8,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    quantity: 80,
    avgCost: 245.60,
    currentPrice: 254.86,
    marketValue: 20389,
    pl: 741,
    plPercent: 3.77,
    dayChange: 1.23,
    weight: 8.2,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    quantity: 140,
    avgCost: 120.50,
    currentPrice: 122.93,
    marketValue: 17210,
    pl: 340,
    plPercent: 2.02,
    dayChange: 0.28,
    weight: 6.9,
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    quantity: 90,
    avgCost: 148.20,
    currentPrice: 150.93,
    marketValue: 13584,
    pl: 246,
    plPercent: 1.84,
    dayChange: 0.51,
    weight: 5.5,
  },
];

const sectors = [
  { name: "Technology", percentage: 28.5, color: "bg-blue-500" },
  { name: "Healthcare", percentage: 18.2, color: "bg-green-500" },
  { name: "Financials", percentage: 15.7, color: "bg-orange-500" },
  { name: "Consumer", percentage: 12.3, color: "bg-purple-500" },
  { name: "Industrials", percentage: 9.8, color: "bg-red-500" },
  { name: "Others", percentage: 15.5, color: "bg-slate-400" },
];

const topHoldings = [
  { symbol: "AAPL", percentage: 11.0, value: 27366 },
  { symbol: "MSFT", percentage: 9.8, value: 24437 },
  { symbol: "NVDA", percentage: 8.2, value: 20389 },
  { symbol: "GOOGL", percentage: 6.9, value: 17210 },
  { symbol: "AMZN", percentage: 5.5, value: 13584 },
];

export default function HoldingsPage() {
  const [filter, setFilter] = useState<"All" | "Stocks" | "ETFs">("All");
  const [grouping, setGrouping] = useState<"None" | "Sector">("None");

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Holdings</h1>
          <p className="text-sm text-slate-500">Manage and track your stock portfolio</p>
        </div>

        <div className="flex gap-3">
          {/* Grouping Toggle */}
          <div className="flex gap-1 rounded-lg border border-slate-300 bg-white p-1">
            <button
              onClick={() => setGrouping("None")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                grouping === "None"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              No grouping
            </button>
            <button
              onClick={() => setGrouping("Sector")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                grouping === "Sector"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Sector grouping
            </button>
          </div>

          {/* Filter */}
          <div className="flex gap-1 rounded-lg border border-slate-300 bg-white p-1">
            <button
              onClick={() => setFilter("All")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === "All"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("Stocks")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === "Stocks"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Stocks
            </button>
            <button
              onClick={() => setFilter("ETFs")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                filter === "ETFs"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              ETFs
            </button>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Avg Cost</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Market Value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">P/L</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Day Change</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Weight</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {holdingsData.map((holding, index) => (
                <tr key={holding.symbol} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                        {holding.symbol[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{holding.symbol}</div>
                        <div className="text-xs text-slate-500">{holding.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{holding.quantity}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">${holding.avgCost.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">${holding.currentPrice.toFixed(2)}</span>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                    ${holding.marketValue.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-semibold text-green-600">
                      +${holding.pl.toLocaleString()} ({holding.plPercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-medium text-green-600">+{holding.dayChange.toFixed(2)}%</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">{holding.weight.toFixed(1)}%</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800">...</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sector Allocation */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-sm font-semibold text-slate-600">Sector Allocation</h3>
          <div className="space-y-3">
            {sectors.map((sector) => (
              <div key={sector.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{sector.name}</span>
                  <span className="font-semibold text-slate-900">{sector.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full ${sector.color}`}
                    style={{ width: `${sector.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Dotted overlay vs S&P 500 average for over/under weight (visual layer to be added in charts)
          </p>
        </div>

        {/* Top Holdings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-sm font-semibold text-slate-600">Top Holdings</h3>
          <div className="space-y-3">
            {topHoldings.map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{holding.symbol}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">{holding.percentage}%</div>
                  <div className="text-xs text-slate-500">${holding.value.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-xs font-medium text-slate-600">Moderate Concentration</p>
            <p className="text-xs text-slate-500">Top 5 = 41.4% of portfolio</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-sm font-semibold text-slate-600">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-xs text-slate-500">Total Return</div>
              <div className="text-lg font-bold text-green-600">+24.2%</div>
              <div className="text-xs text-slate-500">+$48,340</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">vs S&P 500</div>
              <div className="text-lg font-bold text-green-600">+8.7%</div>
              <div className="text-xs text-slate-500">outperformance</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Sharpe Ratio</div>
              <div className="text-lg font-bold text-slate-900">1.42</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Max Drawdown</div>
              <div className="text-lg font-bold text-red-600">-12.3%</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-slate-500">Win Rate</div>
              <div className="text-lg font-bold text-slate-900">67%</div>
              <div className="text-xs text-slate-500">of trades</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

