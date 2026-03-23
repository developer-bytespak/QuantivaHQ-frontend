"use client";

import type { OptionsPosition } from "@/lib/api/options.service";
import { Tooltip } from "./Tooltip";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionsPositionsTableProps {
  positions: OptionsPosition[];
  isLoading?: boolean;
  showClosed?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pnlColor(value: number): string {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-slate-400";
}

// ── Component ────────────────────────────────────────────────────────────────

export function OptionsPositionsTable({
  positions,
  isLoading,
  showClosed = false,
}: OptionsPositionsTableProps) {
  const filtered = showClosed ? positions : positions.filter((p) => p.isOpen);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#fc4f02] border-t-transparent" />
        <span className="ml-3 text-sm text-slate-400">Loading positions…</span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-500">
        <svg className="mb-3 h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        No {showClosed ? "" : "open "}positions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <th className="px-3 py-2.5 text-left font-medium text-slate-400">
              <Tooltip content="The options contract — underlying asset, strike price, and expiration date" position="top">
                <span>Contract</span>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-left font-medium text-slate-400">
              <Tooltip content="CALL = right to buy. PUT = right to sell. Shows the type of option you hold." position="top">
                <span>Type</span>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-slate-400">
              <Tooltip content="Number of contracts you currently hold in this position" position="top">
                <span>Qty</span>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-slate-400">
              <Tooltip content="Average premium paid per contract when you entered this position" position="top">
                <span>Avg Premium</span>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-slate-400">
              <Tooltip content="Current market premium for this contract" position="top">
                <span>Current</span>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-slate-400">
              <Tooltip content="Profit/loss if you were to close this position now. Not locked in until you sell." position="top">
                <span>Unrealized PnL</span>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-slate-400">
              <Tooltip content="Actual profit/loss from portions of this position already closed" position="top">
                <span>Realized PnL</span>
              </Tooltip>
            </th>
            <th className="px-3 py-2.5 text-right font-medium text-slate-400">
              <Tooltip content="Delta: How much this position's value changes per $1 move in the underlying asset" position="top">
                <span>Delta</span>
              </Tooltip>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((pos, i) => {
            const pnlPct =
              pos.avgPremium > 0
                ? (((pos.currentPremium ?? 0) - pos.avgPremium) / pos.avgPremium) * 100
                : 0;
            return (
              <tr
                key={pos.positionId ?? i}
                className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-slate-200">{pos.underlying}</span>
                    <span className="text-[10px] text-slate-500">
                      ${pos.strike.toLocaleString()} · {new Date(pos.expiry).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      pos.optionType === "CALL"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {pos.optionType}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                  {pos.quantity}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                  {pos.avgPremium.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                  {(pos.currentPremium ?? 0).toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-mono font-medium ${pnlColor(pos.unrealizedPnl)}`}>
                      {pos.unrealizedPnl >= 0 ? "+" : ""}
                      {pos.unrealizedPnl.toFixed(2)}
                    </span>
                    <span className={`text-[10px] ${pnlColor(pnlPct)}`}>
                      {pnlPct >= 0 ? "+" : ""}
                      {pnlPct.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`font-mono ${pnlColor(pos.realizedPnl)}`}>
                    {pos.realizedPnl >= 0 ? "+" : ""}
                    {pos.realizedPnl.toFixed(2)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-blue-400">
                  {pos.greeks?.delta?.toFixed(4) ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
