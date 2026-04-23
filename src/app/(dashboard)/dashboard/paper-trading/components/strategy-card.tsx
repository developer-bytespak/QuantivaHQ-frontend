"use client";

import {
  formatCurrency,
  formatPercent,
  formatNumberCompact,
} from "@/lib/trading/paper-trading-utils";

interface StrategyCardProps {
  signal: any;
  index: number;
  onAutoTrade?: () => void;
  onManualTrade?: () => void;
  onViewDetails: () => void;
  hideTradeButtons?: boolean;
  isStockMode?: boolean;
  aiInsight?: { text: string; timestamp: number } | null;
  onGenerateInsight?: () => void;
  isGeneratingInsight?: boolean;
  onViewChart?: () => void;
}

function formatInsightTimeAgo(timestamp: number) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StrategyCard({
  signal,
  index,
  onAutoTrade,
  onManualTrade,
  onViewDetails,
  hideTradeButtons = false,
  isStockMode = false,
  aiInsight = null,
  onGenerateInsight,
  isGeneratingInsight = false,
  onViewChart,
}: StrategyCardProps) {
  return (
    <div className="rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3">
          {signal.logoUrl ? (
            <img
              src={signal.logoUrl}
              alt={signal.name || signal.pair}
              className="h-9 w-9 rounded-full bg-slate-800 object-cover ring-1 ring-white/10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
              }}
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-slate-800 ring-1 ring-white/10" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`rounded-lg px-3 py-1 text-sm font-semibold text-white ${
                  signal.type === "BUY"
                    ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]"
                    : "bg-gradient-to-r from-red-500 to-red-600"
                }`}
              >
                {signal.type}
              </span>
              <span className="text-sm font-medium text-white">{signal.pair}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs text-slate-300 ${
                  signal.confidence === "HIGH"
                    ? "bg-slate-700"
                    : signal.confidence === "MEDIUM"
                    ? "bg-slate-600"
                    : "bg-slate-500"
                }`}
              >
                {signal.confidence}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Entry</span>
            <span className="font-medium text-white">
              {formatCurrency(signal.entryPrice ?? signal.entry)}
            </span>
            <span className="text-slate-500">&gt;</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Stop Loss</span>
            <span className="font-medium text-white">
              {signal.stopLoss && signal.stopLoss !== "—"
                ? `${formatPercent(signal.stopLoss)}${
                    signal.stopLossPrice && signal.stopLossPrice !== "—"
                      ? ` (${formatCurrency(signal.stopLossPrice)})`
                      : ""
                  }`
                : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Take Profit</span>
            <span className="font-medium text-white">
              {signal.takeProfit1 && signal.takeProfit1 !== "—"
                ? `${formatPercent(signal.takeProfit1)}${
                    signal.takeProfitPrice && signal.takeProfitPrice !== "—"
                      ? ` (${formatCurrency(signal.takeProfitPrice)})`
                      : ""
                  }`
                : "—"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Signal Score</span>
            <span className="text-slate-300">{signal.progressValue}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full bg-gradient-to-r ${
                signal.type === "BUY"
                  ? "from-green-500 to-emerald-500"
                  : "from-red-500 to-red-600"
              }`}
              style={{ width: `${signal.progressValue}%` }}
            />
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-xs pt-3">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-[var(--primary)]/30"></div>
          <div>
            <span className="text-slate-400">Profit: </span>
            <span className="font-medium text-green-400">
              {signal.profitValue ? formatPercent(signal.profitValue) : signal.profit ?? "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Volume: </span>
            <span className="font-medium text-white">
              {formatNumberCompact(signal.volumeValue ?? signal.volume)}
            </span>
          </div>
        </div>

        <div className="relative flex items-center gap-4 text-xs pt-2">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-700/50"></div>
          <div>
            <span className="text-slate-400">Trend Score: </span>
            <span className="font-medium text-cyan-400">
              {signal.trend_score?.toFixed(2) ?? "0.00"}
            </span>
          </div>
          {signal.score_change !== undefined && signal.score_change !== 0 && (
            <div>
              <span className="text-slate-400">Change: </span>
              <span
                className={`font-medium ${
                  signal.score_change > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {signal.score_change > 0 ? "+" : ""}
                {signal.score_change?.toFixed(2) ?? "0.00"} pts
              </span>
            </div>
          )}
          {signal.volume_ratio !== undefined && signal.volume_ratio !== 1 && (
            <div>
              <span className="text-slate-400">Vol. Ratio: </span>
              <span className="font-medium text-slate-300">
                {signal.volume_ratio?.toFixed(2)}x
              </span>
            </div>
          )}
        </div>

        <div className="relative pt-3 space-y-2">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-[var(--primary)]/30"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-semibold text-[var(--primary)]">AI Insight</span>
            </div>
            {aiInsight && onGenerateInsight && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{formatInsightTimeAgo(aiInsight.timestamp)}</span>
                <button
                  onClick={onGenerateInsight}
                  disabled={isGeneratingInsight}
                  className="text-slate-400 hover:text-[var(--primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh insight"
                >
                  <svg className={`w-3.5 h-3.5 ${isGeneratingInsight ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {aiInsight ? (
            <div className="rounded-lg bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary-light)]/5 p-3 text-xs text-slate-300 leading-relaxed border border-[var(--primary)]/20">
              {aiInsight.text}
            </div>
          ) : (
            <button
              onClick={onGenerateInsight}
              disabled={!onGenerateInsight || isGeneratingInsight}
              className="w-full rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-600/50 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:from-[var(--primary)]/20 hover:to-[var(--primary-light)]/20 hover:text-white border border-slate-600/30 hover:border-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingInsight ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating insight...
                </span>
              ) : (
                "Generate AI Insight"
              )}
            </button>
          )}
        </div>

        {onViewChart ? (
          <div className="space-y-2 pt-2">
            {!hideTradeButtons && onAutoTrade && (
              <button
                onClick={onAutoTrade}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)]/30 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.3)]/40 active:translate-y-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
                Auto Trade
              </button>
            )}
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-700/40 bg-slate-900/40 p-1">
              <button
                onClick={onViewChart}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-800/60 px-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:bg-slate-700/70 hover:text-white"
              >
                <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 5.656m1.414-7.07l4.95-4.95a4 4 0 115.657 5.657l-4.95 4.95m-7.07 1.414l-4.95 4.95a4 4 0 01-5.657-5.657l4.95-4.95" />
                </svg>
                View Chart Detail
              </button>
              <button
                onClick={onViewDetails}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-slate-800/60 px-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:bg-slate-700/70 hover:text-white"
              >
                <svg className="h-4 w-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 pt-2">
            {!hideTradeButtons && onAutoTrade && (
              <button
                onClick={onAutoTrade}
                className="flex-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[rgba(var(--primary-rgb),0.4)]"
              >
                Auto Trade
              </button>
            )}
            <button
              onClick={onViewDetails}
              className="rounded-xl bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white"
            >
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
