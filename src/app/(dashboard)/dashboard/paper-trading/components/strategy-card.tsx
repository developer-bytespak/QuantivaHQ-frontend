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
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-6 backdrop-blur transition-all duration-300 hover:from-white/[0.12] hover:shadow-xl hover:shadow-[#fc4f02]/20">
      <div className="absolute inset-0 bg-gradient-to-br from-[#fc4f02]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{signal.pair}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  signal.type === "BUY"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {signal.type}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  signal.confidence === "HIGH"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : signal.confidence === "MEDIUM"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {signal.confidence}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">
              {signal.hoursAgo > 0 ? `${signal.hoursAgo}h ago` : "Just now"}
            </p>
          </div>
        </div>

        {/* Trend & Volume Badges */}
        <div className="flex gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${trendBadge.color}`}>
            #{trendBadge.number} {trendBadge.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${volBadge.color}`}>
            #{volBadge.number} {volBadge.label}
          </span>
        </div>

        {/* Price Details */}
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Current: {formatCurrency(signal.entryPrice ?? signal.entry)}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Entry</span>
            <span className="font-medium text-white">
              {formatCurrency(signal.entryPrice ?? signal.entry)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Stop Loss</span>
            <span className="font-medium text-red-400">
              {signal.stopLoss ? `${formatPercent(signal.stopLoss)}` : "—"}
              {signal.stopLossPrice && ` (${formatCurrency(signal.stopLossPrice)})`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Take Profit</span>
            <span className="font-medium text-green-400">
              {signal.takeProfit1 ? `${formatPercent(signal.takeProfit1)}` : "—"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
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

        {/* Metrics */}
        <div className="relative flex items-center gap-4 text-xs pt-3">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#fc4f02]/30" />
          <div>
            <span className="text-slate-400">Profit: </span>
            <span className="font-medium text-green-400">{signal.profit ?? "—"}</span>
          </div>
          <div>
            <span className="text-slate-400">Volume: </span>
            <span className="font-medium text-white">
              {formatNumberCompact(signal.volumeValue ?? signal.volume)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Win Rate: </span>
            <span className="font-medium text-green-400">
              {formatPercent(signal.winRateValue ?? signal.winRate)}
            </span>
          </div>
        </div>

        {/* Trend Score */}
        {signal.trend_score !== undefined && (
          <div className="relative flex items-center gap-4 text-xs pt-2">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-700/50" />
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
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!hideTradeButtons && onAutoTrade && (
            <button
              onClick={onAutoTrade}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isStockMode 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-500/30 hover:shadow-blue-500/40' 
                  : 'bg-gradient-to-r from-[#fc4f02] to-[#fda300] shadow-[#fc4f02]/30 hover:shadow-[#fc4f02]/40'
              }`}
            >
              {isStockMode ? '🤖 Auto Trade' : 'Auto Trade'}
            </button>
          )}
          {!hideTradeButtons && onManualTrade && (
            <button
              onClick={onManualTrade}
              className="flex-1 rounded-xl bg-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:bg-slate-700 hover:text-white"
            >
              {isStockMode ? '✋ Manual' : 'Manual'}
            </button>
          )}
          <button
            onClick={onViewDetails}
            className={`rounded-xl bg-[--color-surface] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:text-white ${hideTradeButtons ? 'flex-1' : ''}`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
