"use client";

import { Tooltip } from "./Tooltip";

// ── Types ───────────────────────────────────────────────────────────────────

interface PortfolioGreeks {
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
  totalUnrealizedPnl: number;
  totalMaxLoss: number;
  positionCount: number;
  exposureByUnderlying: Record<string, { delta: number; positions: number }>;
}

interface PortfolioGreeksDashboardProps {
  data: PortfolioGreeks | null;
  isLoading: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function greekColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-slate-400";
}

// ── Component ───────────────────────────────────────────────────────────────

export function PortfolioGreeksDashboard({ data, isLoading }: PortfolioGreeksDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-[--color-border] bg-[--color-surface]/60" />
        ))}
      </div>
    );
  }

  if (!data || data.positionCount === 0) return null;

  const cards = [
    { label: "Net Delta", symbol: "\u0394", value: data.totalDelta, decimals: 4, tip: "Portfolio sensitivity to $1 move in underlying" },
    { label: "Net Gamma", symbol: "\u0393", value: data.totalGamma, decimals: 6, tip: "Rate of delta change — acceleration risk" },
    { label: "Net Theta", symbol: "\u0398", value: data.totalTheta, decimals: 4, tip: "Daily time decay — positive means you earn theta" },
    { label: "Net Vega", symbol: "\u03BD", value: data.totalVega, decimals: 4, tip: "Sensitivity to 1% IV change across all positions" },
    { label: "Unrealized PnL", symbol: "", value: data.totalUnrealizedPnl, decimals: 2, tip: "Total unrealized profit/loss across open positions", prefix: "$" },
    { label: "Total Max Loss", symbol: "", value: -Math.abs(data.totalMaxLoss), decimals: 2, tip: "Maximum potential loss across all open orders", prefix: "$" },
  ];

  const underlyings = Object.entries(data.exposureByUnderlying);

  return (
    <div className="space-y-3">
      {/* Greek cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Tooltip key={card.label} content={card.tip} position="top">
            <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 px-3 py-2.5 shadow-card transition-shadow hover:shadow-card-hover">
              <div className="flex items-center gap-1.5">
                {card.symbol && (
                  <span className="text-base text-[var(--primary)]">{card.symbol}</span>
                )}
                <span className="text-[10px] uppercase tracking-wide text-slate-500">{card.label}</span>
              </div>
              <p className={`mt-1 text-sm font-bold tabular-nums ${greekColor(card.value)}`}>
                {card.prefix ?? ""}{card.value >= 0 ? "+" : ""}{card.value.toFixed(card.decimals)}
              </p>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Exposure by underlying */}
      {underlyings.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {underlyings.map(([sym, info]) => (
            <div
              key={sym}
              className="inline-flex items-center gap-2 rounded-lg border border-[--color-border] bg-white/[0.02] px-2.5 py-1.5 text-[11px]"
            >
              <span className="font-semibold text-slate-200">{sym}</span>
              <span className={`tabular-nums ${greekColor(info.delta)}`}>
                {"\u0394"} {info.delta >= 0 ? "+" : ""}{info.delta.toFixed(4)}
              </span>
              <span className="text-slate-500">{info.positions} pos</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
