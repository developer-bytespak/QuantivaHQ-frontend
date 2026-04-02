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
}

export function StrategyCard({
  signal,
  index,
  onAutoTrade,
  onManualTrade,
  onViewDetails,
  hideTradeButtons = false,
  isStockMode = false,
}: StrategyCardProps) {
  // Helper to get trend direction badge
  const getTrendDirectionBadge = (direction?: string) => {
    switch (direction) {
      case "TRENDING_UP":
        return { color: "bg-green-500/20 text-green-400", number: "1", label: "UP" };
      case "TRENDING_DOWN":
        return { color: "bg-red-500/20 text-red-400", number: "2", label: "DOWN" };
      default:
        return { color: "bg-slate-500/20 text-slate-300", number: "3", label: "STABLE" };
    }
  };

  // Helper to get volume status badge
  const getVolumeStatusBadge = (status?: string) => {
    switch (status) {
      case "MASSIVE_SURGE":
        return { color: "bg-purple-500/20 text-purple-300", number: "1", label: "SURGE" };
      case "VOLUME_SURGE":
        return { color: "bg-blue-500/20 text-blue-300", number: "2", label: "SURGE" };
      default:
        return { color: "bg-slate-600/20 text-slate-400", number: "3", label: "NORMAL" };
    }
  };

  const trendBadge = getTrendDirectionBadge(signal.trend_direction);
  const volBadge = getVolumeStatusBadge(signal.volume_status);

  return (
    <div className="rounded-lg sm:rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-4 sm:p-6 backdrop-blur">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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

          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${trendBadge.color}`}>
            #{trendBadge.number} {trendBadge.label}
          </span>

          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${volBadge.color}`}>
            #{volBadge.number} {volBadge.label}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Ext. {signal.ext ? formatCurrency(signal.ext) : "—"}
          </p>
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
            <span>${signal.progressMin}</span>
            <span>${signal.progressMax}</span>
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
          </div>
          <button
            className="w-full rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-600/50 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:from-[var(--primary)]/20 hover:to-[var(--primary-light)]/20 hover:text-white border border-slate-600/30 hover:border-[var(--primary)]/50"
          >
            Generate AI Insight
          </button>
        </div>

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
      </div>
    </div>
  );
}
