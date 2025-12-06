"use client";

import { useState } from "react";

interface NewsItem {
  id: number;
  title: string;
  description: string;
  timestamp: string;
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "Apple Earnings Beat Expectations",
    description: "AAPL reported strong Q4 earnings with revenue up 12%. iPhone sales exceeded forecasts. Guidance raised for next quarter. Strong demand for iPhone 15 Pro models driving margin expansion.",
    timestamp: "2 min ago",
  },
  {
    id: 2,
    title: "Microsoft Cloud Revenue Surges",
    description: "MSFT Azure growth accelerates with enterprise adoption increasing. AI integration driving new contract signings. Positive momentum expected to continue through Q1. Strong demand for Copilot enterprise solutions.",
    timestamp: "15 min ago",
  },
  {
    id: 3,
    title: "NVIDIA AI Chip Demand Accelerating",
    description: "NVDA data center revenue up 32% YoY. AI chip demand from major cloud providers remains strong. New partnerships with enterprise AI companies. H200 GPU shipments starting Q1.",
    timestamp: "1 hour ago",
  },
  {
    id: 4,
    title: "Google Cloud Stabilization",
    description: "GOOGL cloud growth stabilizing with improved margins. YouTube ad revenue recovery stronger than expected. Search advertising revenue resilient. Attractive valuation metrics relative to peers.",
    timestamp: "2 hours ago",
  },
  {
    id: 5,
    title: "Amazon AWS Margins Expanding",
    description: "AMZN AWS margins expanding with optimization efforts. E-commerce holiday season performance strong. Breakout from consolidation pattern. Prime membership growth accelerating.",
    timestamp: "3 hours ago",
  },
  {
    id: 6,
    title: "Tesla Production Ramp Up",
    description: "TSLA production ramp up for Cybertruck continues. Model Y demand remains strong globally. Supercharger network expansion accelerating. Energy storage business growing rapidly.",
    timestamp: "4 hours ago",
  },
  {
    id: 7,
    title: "Meta AI Integration Progress",
    description: "META AI integration across platforms showing early positive signals. Reels monetization improving. Virtual reality investments paying off. Strong user engagement metrics.",
    timestamp: "5 hours ago",
  },
  {
    id: 8,
    title: "Netflix Subscriber Growth",
    description: "NFLX subscriber growth exceeds expectations with password sharing crackdown success. Content investments driving retention. International expansion accelerating. Free cash flow generation improving.",
    timestamp: "6 hours ago",
  },
  {
    id: 9,
    title: "AMD Server Market Share Gains",
    description: "AMD gaining server market share with EPYC processors. AI inference capabilities competitive. Strong positioning in data center refresh cycles. Client segment recovery underway.",
    timestamp: "7 hours ago",
  },
  {
    id: 10,
    title: "Intel Foundry Strategy Update",
    description: "INTC foundry strategy showing progress with major customer wins. Process technology roadmap on track. Data center segment stabilizing. Investment in AI accelerators increasing.",
    timestamp: "8 hours ago",
  },
];

export default function StocksAIInsightsPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
  };

  const handleCloseOverlay = () => {
    setSelectedNews(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">AI-powered stock market news and analysis</p>
        </div>

        {/* Asset Filter */}
        <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
          <button
            onClick={() => setSelectedAsset("all")}
            className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${selectedAsset === "all"
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                : "text-slate-400 hover:text-white"
              }`}
          >
            All Stocks
          </button>
          {["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"].map((asset) => (
            <button
              key={asset}
              onClick={() => setSelectedAsset(asset)}
              className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${selectedAsset === asset
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              {asset}
            </button>
          ))}
        </div>
      </div>

      {/* News Items */}
      <div className="space-y-4">
        {newsItems.map((news) => (
          <div
            key={news.id}
            onClick={() => handleNewsClick(news)}
            className="cursor-pointer rounded-2xl border border-[#fc4f02]/30 bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{news.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{news.timestamp}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 text-sm text-slate-300">
              <p className="line-clamp-2">{news.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* News Overlay */}
      {selectedNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleCloseOverlay}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[#fc4f02]/30 bg-gradient-to-br from-white/[0.07] to-transparent p-6 shadow-2xl shadow-black/50 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{selectedNews.title}</h2>
              <button
                onClick={handleCloseOverlay}
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
              <span className="text-xs text-slate-400">{selectedNews.timestamp}</span>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="space-y-2 text-sm leading-relaxed text-slate-300">
                <p>{selectedNews.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



