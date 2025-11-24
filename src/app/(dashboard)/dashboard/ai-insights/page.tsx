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
    title: "Bitcoin Momentum Building",
    description: "Market momentum on 15 U CV in BTC and BTC liquidity returning 90% in last 48 hours. BTC may break out if BTC sustains above $34.500",
    timestamp: "2 min ago",
  },
  {
    id: 2,
    title: "Ethereum Sentiment Improved 20%",
    description: "Bullish momentum on 1h and 4h charts. Sentiment improved 20% in last 3 hours. High liquidity reduces execution risk. Potential breakout above $2,500 resistance.",
    timestamp: "15 min ago",
  },
  {
    id: 3,
    title: "Solana Consolidation Phase",
    description: "SOL trading in tight range between $95-$105. Waiting for breakout confirmation. Volume decreasing suggests accumulation phase. Monitor for directional move.",
    timestamp: "1 hour ago",
  },
  {
    id: 4,
    title: "XRP Sentiment Spike Down",
    description: "XRP sentiment spike down 18% in last 6 hours. Breaking below key support at $0.58. Risk of further decline if support fails. Consider short position or wait for reversal.",
    timestamp: "2 hours ago",
  },
  {
    id: 5,
    title: "BNB Breakout Above Key Resistance",
    description: "BNB successfully broke above $315 resistance level with strong volume. Institutional buying detected. Positive funding rate shift indicates bullish sentiment. Target set at $325.",
    timestamp: "3 hours ago",
  },
  {
    id: 6,
    title: "ADA Overbought Conditions",
    description: "ADA showing overbought conditions on RSI indicator. Weak volume on recent rally suggests potential pullback. Approaching resistance zone at $0.49. Caution advised for new positions.",
    timestamp: "4 hours ago",
  },
  {
    id: 7,
    title: "DOGE Meme Coin Momentum Building",
    description: "Meme coin momentum building with high retail interest returning. Breakout from consolidation pattern detected. Social sentiment increasing significantly. Watch for volatility spikes.",
    timestamp: "5 hours ago",
  },
  {
    id: 8,
    title: "MATIC Partnership Announcements Pending",
    description: "Strong fundamentals support MATIC price action. Partnership announcements pending which could drive price higher. Technical breakout confirmed above $0.85. Strong buy signal.",
    timestamp: "6 hours ago",
  },
  {
    id: 9,
    title: "LINK Oracle Network Growth Accelerating",
    description: "Oracle network growth accelerating with institutional adoption increasing. Strong technical setup with bullish chart pattern. Price action showing positive momentum above $14.20 support.",
    timestamp: "7 hours ago",
  },
  {
    id: 10,
    title: "AVAX Ecosystem Expansion Continues",
    description: "Ecosystem expansion continues with TVL growth supporting price action. Bullish chart pattern forming on daily timeframe. Strong fundamentals align with technical indicators.",
    timestamp: "8 hours ago",
  },
];

export default function AIInsightsPage() {
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
          <p className="text-sm text-slate-400">AI-powered market news and analysis</p>
        </div>
        
        {/* Asset Filter */}
        <div className="flex gap-2 rounded-lg bg-[--color-surface]/60 p-1">
          <button
            onClick={() => setSelectedAsset("all")}
            className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${
              selectedAsset === "all"
                ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-lg shadow-[#fc4f02]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Assets
          </button>
          {["BTC", "ETH", "SOL", "XRP"].map((asset) => (
            <button
              key={asset}
              onClick={() => setSelectedAsset(asset)}
              className={`rounded-md px-4 py-2 text-xs font-medium transition-all ${
                selectedAsset === asset
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
            className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{news.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{news.timestamp}</span>
                <button className="text-slate-400 hover:text-white transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 text-sm text-slate-300">
              <p>{news.description}</p>
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
            className="relative mx-4 w-full max-w-2xl rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/95 to-[--color-surface-alt]/90 p-6 shadow-2xl shadow-black/50 backdrop-blur"
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
