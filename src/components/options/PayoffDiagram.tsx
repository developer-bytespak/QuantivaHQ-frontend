"use client";

import { useMemo, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────────────

interface PayoffLeg {
  type: "CALL" | "PUT";
  side: "BUY" | "SELL";
  strike: number;
  premium: number;
  quantity?: number;
}

interface PayoffDiagramProps {
  legs: PayoffLeg[];
  spotPrice: number;
  compact?: boolean; // smaller version for signal cards
}

// ── Payoff calculation ──────────────────────────────────────────────────────

function calcPayoff(legs: PayoffLeg[], price: number): number {
  let total = 0;
  for (const leg of legs) {
    const qty = leg.quantity ?? 1;
    const mult = leg.side === "BUY" ? 1 : -1;
    let intrinsic = 0;
    if (leg.type === "CALL") {
      intrinsic = Math.max(0, price - leg.strike);
    } else {
      intrinsic = Math.max(0, leg.strike - price);
    }
    total += mult * (intrinsic - leg.premium) * qty;
  }
  return total;
}

function findBreakevens(data: { price: number; pnl: number }[]): number[] {
  const breakevens: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (
      (data[i - 1].pnl <= 0 && data[i].pnl >= 0) ||
      (data[i - 1].pnl >= 0 && data[i].pnl <= 0)
    ) {
      // Linear interpolation
      const ratio = Math.abs(data[i - 1].pnl) / (Math.abs(data[i - 1].pnl) + Math.abs(data[i].pnl));
      breakevens.push(data[i - 1].price + ratio * (data[i].price - data[i - 1].price));
    }
  }
  return breakevens;
}

// ── Component ───────────────────────────────────────────────────────────────

export function PayoffDiagram({ legs, spotPrice, compact = false }: PayoffDiagramProps) {
  // Stabilize legs reference — only recompute when values change
  const legsKey = JSON.stringify(legs);
  const stableLegsRef = useRef(legs);
  if (JSON.stringify(stableLegsRef.current) !== legsKey) {
    stableLegsRef.current = legs;
  }

  const data = useMemo(() => {
    const stableLegs = stableLegsRef.current;
    if (stableLegs.length === 0 || spotPrice <= 0) return [];

    // Range: +/- 20% of spot
    const low = spotPrice * 0.8;
    const high = spotPrice * 1.2;
    const steps = compact ? 60 : 100;
    const step = (high - low) / steps;

    const points: { price: number; pnl: number }[] = [];
    for (let p = low; p <= high; p += step) {
      points.push({ price: Math.round(p * 100) / 100, pnl: Math.round(calcPayoff(stableLegs, p) * 100) / 100 });
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legsKey, spotPrice, compact]);

  if (data.length < 2) return null;

  const pnlValues = data.map((d) => d.pnl).filter((v) => isFinite(v));
  if (pnlValues.length === 0) return null;

  const breakevens = findBreakevens(data);
  const maxProfit = Math.max(...pnlValues);
  const maxLoss = Math.min(...pnlValues);

  const height = compact ? 120 : 200;

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-3">
      {!compact && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">P&L at Expiry</span>
          <div className="flex gap-3 text-[10px]">
            {breakevens.map((be, i) => (
              <span key={i} className="text-slate-400">
                Breakeven: <span className="text-slate-200">${be.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </span>
            ))}
            <span className="text-emerald-400">
              Max Profit: {maxProfit >= 10000000 ? "Unlimited" : `$${maxProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            </span>
            <span className="text-red-400">
              Max Loss: ${Math.abs(maxLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: compact ? 0 : 4 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            {!compact && (
              <XAxis
                dataKey="price"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                interval="preserveStartEnd"
              />
            )}
            {!compact && (
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                width={45}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
            )}
            {!compact && (
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value) => [
                  `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                  "P&L",
                ]}
                labelFormatter={(label) => `Price: $${Number(label).toLocaleString()}`}
              />
            )}
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
            <ReferenceLine x={spotPrice} stroke="#6366f1" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#22c55e"
              fill="url(#profitGrad)"
              strokeWidth={1.5}
              dot={false}
              baseValue={0}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
