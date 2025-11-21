"use client";

import { useState } from "react";

export default function AIInsightsPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>("all");

  const aiInsights = [
    {
      id: 1,
      asset: "BTC",
      sentiment: "Bullish",
      confidence: 87,
      title: "Bitcoin Momentum Building",
      description: "BTC liquidity returning 90% in last 48 hours. Strong support at $34,500. May break out if BTC sustains above $34,500. Market momentum on 15m timeframe shows bullish divergence.",
      recommendation: "BUY",
      priceTarget: "$36,200",
      stopLoss: "$34,200",
      timeHorizon: "24-48 hours",
      riskLevel: "Medium",
      timestamp: "2 min ago",
      indicators: ["RSI oversold recovery", "Volume spike", "Support level hold"],
    },
    {
      id: 2,
      asset: "ETH",
      sentiment: "Bullish",
      confidence: 82,
      title: "Ethereum Sentiment Improved 20%",
      description: "Bullish momentum on 1h and 4h charts. Sentiment improved 20% in last 3 hours. High liquidity reduces execution risk. Potential breakout above $2,500 resistance.",
      recommendation: "BUY",
      priceTarget: "$2,580",
      stopLoss: "$2,420",
      timeHorizon: "12-24 hours",
      riskLevel: "Low",
      timestamp: "15 min ago",
      indicators: ["MACD bullish crossover", "Sentiment shift", "High liquidity"],
    },
    {
      id: 3,
      asset: "SOL",
      sentiment: "Neutral",
      confidence: 65,
      title: "Solana Consolidation Phase",
      description: "SOL trading in tight range between $95-$105. Waiting for breakout confirmation. Volume decreasing suggests accumulation phase. Monitor for directional move.",
      recommendation: "HOLD",
      priceTarget: "$105",
      stopLoss: "$95",
      timeHorizon: "48-72 hours",
      riskLevel: "Medium",
      timestamp: "1 hour ago",
      indicators: ["Range-bound trading", "Volume decline", "Accumulation pattern"],
    },
    {
      id: 4,
      asset: "XRP",
      sentiment: "Bearish",
      confidence: 75,
      title: "XRP Sentiment Spike Down",
      description: "XRP sentiment spike down 18% in last 6 hours. Breaking below key support at $0.58. Risk of further decline if support fails. Consider short position or wait for reversal.",
      recommendation: "SELL",
      priceTarget: "$0.52",
      stopLoss: "$0.60",
      timeHorizon: "24 hours",
      riskLevel: "High",
      timestamp: "2 hours ago",
      indicators: ["Support break", "Sentiment decline", "Volume increase"],
    },
  ];

  const marketOverview = [
    { label: "Market Sentiment", value: "Bullish", change: "+5.2%", positive: true, icon: "trending-up" },
    { label: "AI Confidence", value: "84%", change: "+2.1%", positive: true, icon: "brain" },
    { label: "Active Signals", value: "12", change: "+3", positive: true, icon: "signal" },
    { label: "Success Rate", value: "78.5%", change: "+4.2%", positive: true, icon: "target" },
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "bullish":
        return "text-green-400 bg-green-500/20";
      case "bearish":
        return "text-red-400 bg-red-500/20";
      default:
        return "text-yellow-400 bg-yellow-500/20";
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "BUY":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "SELL":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    }
  };

  const filteredInsights = selectedAsset === "all" 
    ? aiInsights 
    : aiInsights.filter(insight => insight.asset === selectedAsset);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Insights</h1>
          <p className="mt-1 text-sm text-slate-400">AI-powered market analysis and trading recommendations</p>
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

      {/* Market Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {marketOverview.map((stat, index) => (
          <div key={index} className="group cursor-pointer rounded-xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-4 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-slate-400">{stat.label}</p>
              {stat.icon === "trending-up" && (
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {stat.icon === "brain" && (
                <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              {stat.icon === "signal" && (
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {stat.icon === "target" && (
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
            </div>
            <p className="mb-2 text-2xl font-bold text-white">{stat.value}</p>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                {stat.change}
              </span>
              <span className="text-xs text-slate-500">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredInsights.map((insight) => (
          <div
            key={insight.id}
            className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.02]"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
                  <span className="text-sm font-bold text-[#fc4f02]">{insight.asset}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{insight.title}</h3>
                  <p className="text-xs text-slate-400">{insight.timestamp}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSentimentColor(insight.sentiment)}`}>
                  {insight.sentiment}
                </span>
                <span className="text-xs text-slate-400">{insight.confidence}% confidence</span>
              </div>
            </div>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-slate-300">{insight.description}</p>

            {/* Recommendation Card */}
            <div className={`mb-4 rounded-xl border p-4 ${getRecommendationColor(insight.recommendation)}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Recommendation</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                  {insight.recommendation}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Price Target</span>
                  <p className="font-semibold text-white">{insight.priceTarget}</p>
                </div>
                <div>
                  <span className="text-slate-400">Stop Loss</span>
                  <p className="font-semibold text-white">{insight.stopLoss}</p>
                </div>
                <div>
                  <span className="text-slate-400">Time Horizon</span>
                  <p className="font-semibold text-white">{insight.timeHorizon}</p>
                </div>
                <div>
                  <span className="text-slate-400">Risk Level</span>
                  <p className="font-semibold text-white">{insight.riskLevel}</p>
                </div>
              </div>
            </div>

            {/* Indicators */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-slate-400">Key Indicators</p>
              <div className="flex flex-wrap gap-2">
                {insight.indicators.map((indicator, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-[--color-border] bg-[--color-surface]/60 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {indicator}
                  </span>
                ))}
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">AI Confidence</span>
                <span className="font-medium text-white">{insight.confidence}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-[#fc4f02] to-[#fda300] transition-all duration-500"
                  style={{ width: `${insight.confidence}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#fc4f02]/40">
                Execute Trade
              </button>
              <button className="rounded-xl border border-[--color-border] bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-[#fc4f02]/50 hover:text-white">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Analysis Summary */}
      <div className="group cursor-pointer rounded-2xl border border-[--color-border] bg-gradient-to-br from-[--color-surface-alt]/80 to-[--color-surface-alt]/60 p-6 backdrop-blur shadow-xl shadow-blue-900/10 transition-all duration-300 hover:border-[#fc4f02]/50 hover:shadow-2xl hover:shadow-[#fc4f02]/20 hover:scale-[1.01]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#fc4f02]/20 to-[#fda300]/20">
              <svg className="h-5 w-5 text-[#fc4f02]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">AI Market Analysis Summary</h2>
          </div>
          <span className="text-xs text-slate-400">Updated 2 min ago</span>
        </div>
        
        <div className="space-y-4">
          <div className="cursor-pointer rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span className="text-sm font-semibold text-white">Overall Market Sentiment: Bullish</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              The AI analysis indicates a bullish market sentiment with 78% confidence. Major cryptocurrencies are showing 
              positive momentum, with BTC leading the charge. Liquidity has improved significantly in the last 48 hours, 
              suggesting institutional interest. Key support levels are holding strong, and breakout patterns are forming 
              on multiple timeframes.
            </p>
          </div>

          <div className="cursor-pointer rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-400"></div>
              <span className="text-sm font-semibold text-white">Top Opportunity: BTC/USDT</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Bitcoin shows the strongest AI confidence score at 87%. The analysis suggests a potential breakout above 
              $34,500 with a target of $36,200. Risk-reward ratio is favorable at 1:2.5. Multiple technical indicators 
              align with bullish sentiment, including RSI recovery and volume spike.
            </p>
          </div>

          <div className="cursor-pointer rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all duration-300 hover:border-[#fc4f02]/30 hover:bg-[--color-surface]/80">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
              <span className="text-sm font-semibold text-white">Risk Warning: XRP/USDT</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              XRP is showing bearish signals with sentiment declining 18% in the last 6 hours. The asset is testing 
              critical support at $0.58. If support fails, further decline to $0.52 is likely. Consider reducing exposure 
              or setting tight stop-loss orders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

