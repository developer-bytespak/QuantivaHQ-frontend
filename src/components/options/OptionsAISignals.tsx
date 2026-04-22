"use client";

import { useState, useMemo } from "react";
import type { AiOptionsSignal } from "@/lib/api/options.service";
import { useOptionsStore } from "@/state/options-store";

// ── Direction badge colours ─────────────────────────────────────────────────

const DIRECTION_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  bullish: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  bearish: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  neutral: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
};

// ── Strategy display names ──────────────────────────────────────────────────

const STRATEGY_LABELS: Record<string, string> = {
  long_call: "Long Call",
  long_put: "Long Put",
  bull_call_spread: "Bull Call Spread",
  bear_put_spread: "Bear Put Spread",
  iron_condor: "Iron Condor",
  long_straddle: "Long Straddle",
  long_strangle: "Long Strangle",
  long_butterfly: "Long Butterfly",
  calendar_spread: "Calendar Spread",
  short_put: "Short Put",
};

// ── Signal Card ─────────────────────────────────────────────────────────────

function SignalCard({ signal, onExecute }: { signal: AiOptionsSignal; onExecute?: (signal: AiOptionsSignal) => void }) {
  const dir = DIRECTION_STYLES[signal.direction] ?? DIRECTION_STYLES.neutral;
  const expiresAt = new Date(signal.expires_at);
  const isExpired = expiresAt < new Date();
  const createdAt = new Date(signal.created_at);

  // Alpaca users need Level 3 approval to place multi-leg orders. Single-leg
  // strategies (long_call, long_put) are placeable at Level 2+.
  const venue = useOptionsStore((s) => s.venue);
  const approvalLevel = useOptionsStore((s) => s.approvalLevel);
  const legCount = signal.legs?.length ?? 0;
  const isMultiLeg = legCount > 1;
  const mlegBlocked = venue === "ALPACA" && isMultiLeg && approvalLevel < 3;

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4 transition-all hover:scale-[1.01] hover:border-[--color-border] hover:shadow-lg">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-100">{signal.underlying}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${dir.bg} ${dir.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dir.dot}`} />
            {signal.direction}
          </span>
        </div>

        {/* Confidence badge */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-slate-500">Confidence</span>
          <span className="text-sm font-semibold tabular-nums text-slate-200">
            {(Number(signal.confidence) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Strategy name */}
      <p className="mt-2 text-sm font-medium text-[var(--primary)]">
        {STRATEGY_LABELS[signal.strategy] ?? signal.strategy}
      </p>

      {/* Legs */}
      {signal.legs && signal.legs.length > 0 && (
        <div className="mt-2 space-y-1">
          {signal.legs.map((leg, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-xs"
            >
              <span className={leg.side === "BUY" ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                {leg.side}
              </span>
              <span className="text-slate-300">{leg.type}</span>
              <span className="text-slate-400">@</span>
              <span className="font-mono text-slate-200">
                ${Number(leg.strike).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Reasoning */}
      {signal.reasoning && (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">{signal.reasoning}</p>
      )}

      {/* Risk / Reward row */}
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[--color-border] pt-3">
        <div>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">R:R</span>
          <p className="text-xs font-medium text-slate-300">{signal.risk_reward ?? "—"}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Max Profit</span>
          <p className="text-xs font-medium text-emerald-400">{signal.max_profit ?? "—"}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Max Loss</span>
          <p className="text-xs font-medium text-red-400">{signal.max_loss ?? "—"}</p>
        </div>
      </div>

      {/* IV + Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-[--color-border] pt-3 text-[10px] text-slate-500">
        <div className="flex gap-3">
          {signal.iv_rank !== null && (
            <span>IV Rank: <span className="text-slate-300">{(Number(signal.iv_rank) * 100).toFixed(0)}%</span></span>
          )}
          {signal.spot_price !== null && (
            <span>Spot: <span className="text-slate-300">${Number(signal.spot_price).toLocaleString()}</span></span>
          )}
        </div>
        <span className={isExpired ? "text-red-400" : ""}>
          {isExpired ? "Expired" : `Expires ${expiresAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          {" · "}
          {createdAt.toLocaleDateString([], { month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Execute button + Alpaca Level 3 gate for multi-leg strategies */}
      {onExecute && !isExpired && legCount > 0 && (
        <div className="mt-3 space-y-1.5">
          <button
            onClick={() => onExecute(signal)}
            disabled={mlegBlocked}
            title={
              mlegBlocked
                ? "Requires Level 3 options approval on Alpaca"
                : isMultiLeg
                ? `Place as ${legCount}-leg order`
                : "Execute signal"
            }
            className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              mlegBlocked
                ? "cursor-not-allowed bg-white/[0.04] text-slate-500"
                : "bg-[var(--primary)] text-white hover:bg-[var(--primary-light)]"
            }`}
          >
            {mlegBlocked
              ? `Level 3 Required (${legCount} legs)`
              : isMultiLeg
              ? `Place as ${legCount}-leg Order`
              : "Execute Signal"}
          </button>
          {mlegBlocked && (
            <p className="text-[10px] leading-relaxed text-slate-500">
              Multi-leg strategies require Alpaca options Level 3 approval. Enable it in
              your Alpaca account, or dismiss this signal.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function OptionsAISignals({
  signals,
  isLoading,
  onExecute,
}: {
  signals: AiOptionsSignal[];
  isLoading: boolean;
  onExecute?: (signal: AiOptionsSignal) => void;
}) {
  const [filter, setFilter] = useState<string>("all");

  // Derive unique underlyings from signal data
  const underlyings = useMemo(
    () => Array.from(new Set(signals.map((s) => s.underlying))).sort(),
    [signals],
  );

  const filtered = useMemo(
    () => (filter === "all" ? signals : signals.filter((s) => s.underlying === filter)),
    [signals, filter],
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-[--color-border] bg-[--color-surface]/60" />
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10">
            <svg className="h-6 w-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No AI Signals</h3>
          <p className="mt-1 text-xs text-slate-500">
            AI-generated options signals will appear here once the engine produces them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Coin filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-[var(--primary)] text-white"
              : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
          }`}
        >
          All
        </button>
        {underlyings.map((u) => (
          <button
            key={u}
            onClick={() => setFilter(u)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === u
                ? "bg-[var(--primary)] text-white"
                : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      {/* Signal cards */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No signals for {filter}.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sig) => (
            <SignalCard key={sig.id} signal={sig} onExecute={onExecute} />
          ))}
        </div>
      )}
    </div>
  );
}
