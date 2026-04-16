"use client";

import type { OptionsPosition } from "@/lib/api/options.service";
import { Tooltip } from "./Tooltip";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionsPositionsTableProps {
  positions: OptionsPosition[];
  isLoading?: boolean;
  showClosed?: boolean;
  onClose?: (position: OptionsPosition) => void;
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
  onClose,
}: OptionsPositionsTableProps) {
  const filtered = showClosed ? positions : positions.filter((p) => p.isOpen);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
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

  // Grid template: 7 or 8 columns depending on Action visibility (Delta column removed)
  const gridCols = onClose
    ? "minmax(180px,2fr) 80px 70px 110px 100px minmax(120px,1.5fr) 110px 90px"
    : "minmax(180px,2fr) 80px 70px 110px 100px minmax(120px,1.5fr) 110px";
  const minWidth = onClose ? "860px" : "770px";

  return (
    <div className="overflow-x-auto rounded-xl border border-[--color-border]">
      <div className="text-xs" style={{ minWidth }}>
        {/* Header */}
        <div
          className="grid items-center gap-2 border-b border-[--color-border] bg-[--color-surface]/40 px-3 py-2.5 font-medium uppercase text-slate-400"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="text-left">
            <Tooltip content="The options contract — underlying asset, strike price, and expiration date" position="top">
              <span>Contract</span>
            </Tooltip>
          </div>
          <div className="text-left">
            <Tooltip content="CALL = right to buy. PUT = right to sell. Shows the type of option you hold." position="top">
              <span>Type</span>
            </Tooltip>
          </div>
          <div className="text-right">
            <Tooltip content="Number of contracts you currently hold in this position" position="top">
              <span>Qty</span>
            </Tooltip>
          </div>
          <div className="text-right">
            <Tooltip content="Average premium paid per contract when you entered this position" position="top">
              <span>Avg Premium</span>
            </Tooltip>
          </div>
          <div className="text-right">
            <Tooltip content="Current market premium for this contract" position="top">
              <span>Current</span>
            </Tooltip>
          </div>
          <div className="text-right">
            <Tooltip content="Profit/loss if you were to close this position now. Not locked in until you sell." position="top">
              <span>Unrealized PnL</span>
            </Tooltip>
          </div>
          <div className="text-right">
            <Tooltip content="Actual profit/loss from portions of this position already closed" position="top">
              <span>Realized PnL</span>
            </Tooltip>
          </div>
          {onClose && <div className="text-right">Action</div>}
        </div>

        {/* Rows */}
        {filtered.map((pos, i) => {
          const strike = Number(pos.strike) || 0;
          const quantity = Number(pos.quantity) || 0;
          const avgPremium = Number(pos.avgPremium) || 0;
          const currentPremium = Number(pos.currentPremium) || 0;
          const unrealizedPnl = Number(pos.unrealizedPnl) || 0;
          const realizedPnl = Number(pos.realizedPnl) || 0;

          const pnlPct = avgPremium > 0 ? ((currentPremium - avgPremium) / avgPremium) * 100 : 0;

          let expiryLabel = "—";
          try {
            if (pos.expiry) {
              const d = new Date(pos.expiry);
              if (!isNaN(d.getTime())) {
                expiryLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }
            }
          } catch {}

          return (
            <div
              key={pos.positionId ?? i}
              className="grid items-center gap-2 border-b border-[--color-border]/30 px-3 py-2.5 transition-colors hover:bg-[--color-surface]/40"
              style={{ gridTemplateColumns: gridCols }}
            >
              {/* Contract */}
              <div className="text-left">
                <div className="font-mono text-slate-200">{pos.underlying ?? "—"}</div>
                <div className="text-[10px] text-slate-500">
                  ${strike.toLocaleString()} · {expiryLabel}
                </div>
              </div>

              {/* Type */}
              <div className="text-left">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                    pos.optionType === "CALL"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {pos.optionType ?? "—"}
                </span>
              </div>

              {/* Qty */}
              <div className="text-right font-mono text-slate-300">{quantity}</div>

              {/* Avg Premium */}
              <div className="text-right font-mono text-slate-300">{avgPremium.toFixed(2)}</div>

              {/* Current */}
              <div className="text-right font-mono text-slate-300">{currentPremium.toFixed(2)}</div>

              {/* Unrealized PnL */}
              <div className="text-right">
                <div className={`font-mono font-medium ${pnlColor(unrealizedPnl)}`}>
                  {unrealizedPnl >= 0 ? "+" : ""}
                  {unrealizedPnl.toFixed(2)}
                </div>
                <div className={`text-[10px] ${pnlColor(pnlPct)}`}>
                  {pnlPct >= 0 ? "+" : ""}
                  {pnlPct.toFixed(1)}%
                </div>
              </div>

              {/* Realized PnL */}
              <div className={`text-right font-mono ${pnlColor(realizedPnl)}`}>
                {realizedPnl >= 0 ? "+" : ""}
                {realizedPnl.toFixed(2)}
              </div>

              {/* Action (optional) */}
              {onClose && pos.isOpen && (
                <div className="text-right">
                  <button
                    onClick={() => onClose(pos)}
                    className="rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    Close
                  </button>
                </div>
              )}
              {onClose && !pos.isOpen && (
                <div className="text-right text-[10px] text-slate-500">Closed</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
