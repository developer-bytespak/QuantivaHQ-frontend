"use client";

import { useState, useRef, useEffect } from "react";
import type { Greeks } from "@/lib/api/options.service";

// ── Types ────────────────────────────────────────────────────────────────────

interface GreeksPanelProps {
  greeks: Greeks | null;
  contractSymbol?: string;
  isLoading?: boolean;
}

// ── Greeks Explanations ──────────────────────────────────────────────────────

const GREEKS_HELP = [
  {
    symbol: "Δ",
    name: "Delta",
    color: "text-green-400",
    description: "Measures how much an option's price changes for a $1 move in the underlying. Range: 0 to 1 (calls) or 0 to -1 (puts).",
  },
  {
    symbol: "Γ",
    name: "Gamma",
    color: "text-blue-400",
    description: "Rate of change of Delta per $1 move. High gamma means Delta shifts rapidly — position risk can change quickly near the strike.",
  },
  {
    symbol: "Θ",
    name: "Theta",
    color: "text-amber-400",
    description: "Time decay — how much value the option loses each day, all else equal. Negative for buyers (you lose), positive for sellers.",
  },
  {
    symbol: "ν",
    name: "Vega",
    color: "text-purple-400",
    description: "Sensitivity to implied volatility. Shows how much the option price changes per 1% IV change. High vega = sensitive to market fear.",
  },
  {
    symbol: "IV",
    name: "Implied Volatility",
    color: "text-[var(--primary)]",
    description: "Market's forecast of future price movement. High IV = expensive premiums (market expects big moves). Low IV = cheaper options.",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function greekColor(value: number, positive: "green" | "red" = "green"): string {
  if (value > 0) return positive === "green" ? "text-green-400" : "text-red-400";
  if (value < 0) return positive === "green" ? "text-red-400" : "text-green-400";
  return "text-slate-400";
}

function formatGreek(value: number): string {
  if (Math.abs(value) >= 1) return value.toFixed(2);
  if (Math.abs(value) >= 0.01) return value.toFixed(4);
  return value.toFixed(4);
}

function formatIV(value: number): string {
  if (value === 0) return "—";
  if (value > 1) return `${value.toFixed(1)}%`;
  return `${(value * 100).toFixed(1)}%`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function GreeksPanel({ greeks, contractSymbol, isLoading }: GreeksPanelProps) {
  const [showHelp, setShowHelp] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Close help on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelp(false);
      }
    };
    if (showHelp) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showHelp]);

  const iv = greeks?.impliedVolatility ?? 0;

  const items = greeks
    ? [
        { symbol: "Δ", label: "Delta", value: formatGreek(greeks.delta), color: greekColor(greeks.delta) },
        { symbol: "Γ", label: "Gamma", value: formatGreek(greeks.gamma), color: "text-blue-400" },
        { symbol: "Θ", label: "Theta", value: formatGreek(greeks.theta), color: greekColor(greeks.theta) },
        { symbol: "ν", label: "Vega", value: formatGreek(greeks.vega), color: "text-purple-400" },
        { symbol: "IV", label: "IV", value: formatIV(iv), color: "text-[var(--primary)]" },
      ]
    : null;

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 px-4 py-3">
      {/* Header row with help */}
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-200">Greeks</h3>

        {/* Help button */}
        <div ref={helpRef} className="relative">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/[0.1] text-[10px] font-bold text-slate-500 transition-colors hover:border-white/[0.2] hover:text-slate-300"
            aria-label="Learn about Greeks"
          >
            ?
          </button>

          {/* Help popup */}
          {showHelp && (
            <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-xl border border-white/[0.08] bg-[--color-surface]/60 p-4 shadow-2xl sm:w-96">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">Understanding Greeks</h4>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {GREEKS_HELP.map((g) => (
                  <div key={g.name} className="flex gap-2.5">
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-bold ${g.color}`}
                    >
                      {g.symbol}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-300">{g.name}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{g.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contract symbol badge */}
        {contractSymbol && (
          <span className="ml-auto max-w-[200px] truncate rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-slate-400">
            {contractSymbol}
          </span>
        )}
      </div>

      {/* Values — single horizontal row */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          Loading…
        </div>
      ) : items ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-lg border border-[--color-border]/40 bg-[--color-surface]/40 px-3 py-2 ${
                i === items.length - 1 ? "bg-[var(--primary)]/[0.04]" : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-slate-400">
                  {item.symbol}
                </span>
                <span className="hidden text-[11px] text-slate-500 sm:inline">{item.label}</span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Select a contract to view Greeks.</p>
      )}
    </div>
  );
}
