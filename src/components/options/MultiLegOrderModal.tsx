"use client";

import { useEffect, useMemo, useState } from "react";
import {
  optionsService,
  type AiOptionsSignal,
  type AiSignalLeg,
  type MultiLegPositionIntent,
  type PlaceMultiLegOrderRequest,
} from "@/lib/api/options.service";
import { getUsEquityOptionsSession } from "./MarketHoursBanner";

// ── Types ────────────────────────────────────────────────────────────────────

interface MultiLegOrderModalProps {
  isOpen: boolean;
  signal: AiOptionsSignal | null;
  connectionId: string;
  venue?: string;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

type LegQuote = {
  bid: number;
  ask: number;
  last: number;
  mid: number;
  /** `null` while the fetch is in flight, `'error'` on failure. */
  state: "loading" | "ok" | "error";
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function positionIntentFor(side: "BUY" | "SELL"): MultiLegPositionIntent {
  return side === "BUY" ? "buy_to_open" : "sell_to_open";
}

/**
 * Net debit (positive) or credit (negative) for the package, per 1 unit of
 * quantity (before multiplying by contract size × qty). BUY legs add to the
 * debit (you pay the ask), SELL legs subtract (you collect the bid).
 */
function computeNetPerUnit(legs: AiSignalLeg[], quotes: Record<string, LegQuote>): number {
  let net = 0;
  for (const leg of legs) {
    if (!leg.symbol) continue;
    const q = quotes[leg.symbol];
    if (!q || q.state !== "ok") continue;
    // BUYing crosses the ask; SELLing gets hit at the bid.
    const fill = leg.side === "BUY" ? q.ask : q.bid;
    if (!(fill > 0)) continue;
    net += (leg.side === "BUY" ? fill : -fill) * leg.ratio;
  }
  return net;
}

// ── Component ────────────────────────────────────────────────────────────────

export function MultiLegOrderModal({
  isOpen,
  signal,
  connectionId,
  venue,
  onClose,
  onSuccess,
}: MultiLegOrderModalProps) {
  const [quotes, setQuotes] = useState<Record<string, LegQuote>>({});
  const [qty, setQty] = useState<string>("1");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketSession, setMarketSession] = useState(() => getUsEquityOptionsSession());

  const legs = signal?.legs ?? [];
  const legsMissingSymbol = legs.some((l) => !l.symbol);
  const isAlpaca = venue === "ALPACA";
  const marketClosed = isAlpaca && marketSession.state !== "rth";

  // Refresh market-hours check every 30s while the modal is open (Alpaca only).
  useEffect(() => {
    if (!isOpen || !isAlpaca) return;
    const id = setInterval(() => setMarketSession(getUsEquityOptionsSession()), 30_000);
    return () => clearInterval(id);
  }, [isOpen, isAlpaca]);

  // Fetch live quotes for every leg on open.
  useEffect(() => {
    if (!isOpen || !signal) return;
    let cancelled = false;

    const seed: Record<string, LegQuote> = {};
    for (const leg of legs) {
      if (leg.symbol) seed[leg.symbol] = { bid: 0, ask: 0, last: 0, mid: 0, state: "loading" };
    }
    setQuotes(seed);
    setError(null);
    setIsPlacing(false);

    (async () => {
      const results = await Promise.all(
        legs.map(async (leg) => {
          if (!leg.symbol) return null;
          try {
            const t = await optionsService.getTicker(leg.symbol, connectionId);
            return {
              symbol: leg.symbol,
              quote: {
                bid: Number(t.bidPrice) || 0,
                ask: Number(t.askPrice) || 0,
                last: Number(t.lastPrice) || 0,
                mid: ((Number(t.bidPrice) || 0) + (Number(t.askPrice) || 0)) / 2,
                state: "ok" as const,
              },
            };
          } catch {
            return {
              symbol: leg.symbol,
              quote: { bid: 0, ask: 0, last: 0, mid: 0, state: "error" as const },
            };
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, LegQuote> = {};
      for (const r of results) if (r) next[r.symbol] = r.quote;
      setQuotes(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, signal, connectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const quotesReady = useMemo(
    () => legs.every((l) => l.symbol && quotes[l.symbol]?.state === "ok"),
    [legs, quotes],
  );

  const netPerUnit = useMemo(() => computeNetPerUnit(legs, quotes), [legs, quotes]);
  const isDebit = netPerUnit >= 0;
  const absNet = Math.abs(netPerUnit);

  // Auto-populate limit price with the computed net (absolute) once quotes arrive.
  useEffect(() => {
    if (quotesReady && limitPrice === "") {
      setLimitPrice(absNet > 0 ? absNet.toFixed(2) : "");
    }
  }, [quotesReady, absNet, limitPrice]);

  const qtyNum = Math.max(1, Math.floor(Number(qty) || 0));
  const limitNum = Number(limitPrice);
  const limitValid = limitNum > 0 && Number.isFinite(limitNum);

  // Package cost (debit) or credit, for 1 contract = 100 shares × qty.
  const packageValueUsd = absNet * 100 * qtyNum;

  const canSubmit =
    !!signal &&
    !legsMissingSymbol &&
    quotesReady &&
    limitValid &&
    qtyNum >= 1 &&
    !isPlacing &&
    !marketClosed;

  const handleConfirm = async () => {
    if (!signal || !canSubmit) return;
    setIsPlacing(true);
    setError(null);
    try {
      const body: PlaceMultiLegOrderRequest = {
        connectionId,
        underlying: signal.underlying,
        qty: qtyNum,
        type: "limit",
        limitPrice: limitNum,
        timeInForce: "day",
        signalId: signal.id,
        legs: legs.map((l) => ({
          contractSymbol: l.symbol!,
          side: l.side.toLowerCase() as "buy" | "sell",
          ratioQty: Math.max(1, Math.floor(l.ratio)),
          positionIntent: positionIntentFor(l.side),
        })),
      };
      const result = await optionsService.placeMultiLegOrder(body);
      onSuccess(
        `${signal.strategy.replace(/_/g, " ")} (${legs.length}-leg) order placed — broker id ${result.brokerOrderId}`,
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to place multi-leg order");
      setIsPlacing(false);
    }
  };

  if (!isOpen || !signal) return null;

  const strategyLabel = signal.strategy.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => !isPlacing && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{strategyLabel}</h3>
            <p className="text-xs text-slate-400">
              {signal.underlying} · {legs.length}-leg {isAlpaca ? "Alpaca mleg" : "multi-leg"} order
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPlacing}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Leg breakdown */}
        <div className="mb-4 overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[48px_56px_1fr_72px_72px] items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">
            <span>Side</span>
            <span>Type</span>
            <span>Contract</span>
            <span className="text-right">Bid</span>
            <span className="text-right">Ask</span>
          </div>
          {legs.map((leg, i) => {
            const q = leg.symbol ? quotes[leg.symbol] : undefined;
            const sideColor = leg.side === "BUY" ? "text-emerald-400" : "text-rose-400";
            return (
              <div
                key={`${leg.symbol ?? i}-${i}`}
                className="grid grid-cols-[48px_56px_1fr_72px_72px] items-center gap-2 border-b border-white/[0.04] px-3 py-2 text-xs last:border-b-0"
              >
                <span className={`font-mono font-semibold ${sideColor}`}>{leg.side}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-bold ${
                    leg.type === "CALL" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {leg.type}
                </span>
                <span className="truncate font-mono text-[11px] text-slate-200">
                  {leg.symbol ?? `${leg.type} @ ${leg.strike}`}
                </span>
                <span className="text-right font-mono text-slate-300">
                  {q?.state === "ok" ? q.bid.toFixed(2) : q?.state === "loading" ? "…" : "—"}
                </span>
                <span className="text-right font-mono text-slate-300">
                  {q?.state === "ok" ? q.ask.toFixed(2) : q?.state === "loading" ? "…" : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Package summary */}
        <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Net {isDebit ? "Debit" : "Credit"} (per unit)</span>
            <span className={`font-mono font-semibold ${isDebit ? "text-amber-300" : "text-emerald-400"}`}>
              {quotesReady ? (isDebit ? "" : "+") + formatUSD(isDebit ? -absNet : absNet) : "…"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">
              {isDebit ? "You pay" : "You receive"} (× 100 × {qtyNum})
            </span>
            <span className={`font-mono font-semibold ${isDebit ? "text-amber-300" : "text-emerald-400"}`}>
              {quotesReady ? formatUSD(packageValueUsd) : "…"}
            </span>
          </div>
          {signal.max_profit && (
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
              <span className="text-slate-400">Max profit (per unit)</span>
              <span className="font-mono text-emerald-400">{signal.max_profit}</span>
            </div>
          )}
          {signal.max_loss && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Max loss (per unit)</span>
              <span className="font-mono text-rose-400">{signal.max_loss}</span>
            </div>
          )}
          {signal.risk_reward && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Risk / Reward</span>
              <span className="font-mono text-slate-200">{signal.risk_reward}</span>
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Quantity (packages)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Limit ({isDebit ? "debit" : "credit"}, USD)
            </label>
            <input
              type="number"
              step={0.01}
              min={0.01}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={quotesReady ? absNet.toFixed(2) : "…"}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30"
            />
          </div>
        </div>

        {/* Info banners */}
        {legsMissingSymbol && (
          <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            This signal is missing contract symbols for some legs and can't be executed directly.
          </div>
        )}
        {marketClosed && (
          <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Markets closed — Alpaca options orders resume at 09:30 ET.
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isPlacing}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.08] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 disabled:cursor-not-allowed disabled:bg-white/[0.04] disabled:bg-none disabled:text-slate-600 disabled:shadow-none"
          >
            {isPlacing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/40 border-t-slate-950" />
                Placing…
              </span>
            ) : (
              `Confirm ${legs.length}-leg Order`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
