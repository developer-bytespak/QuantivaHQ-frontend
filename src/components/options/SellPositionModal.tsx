"use client";

import { useState, useEffect } from "react";
import { optionsService } from "@/lib/api/options.service";
import type { OptionsPosition, OptionTicker } from "@/lib/api/options.service";
import { getUsEquityOptionsSession } from "./MarketHoursBanner";

interface SellPositionModalProps {
  position: OptionsPosition;
  connectionId: string;
  venue?: string;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

function pnlColor(value: number) {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-slate-400";
}

export function SellPositionModal({
  position,
  connectionId,
  venue,
  onClose,
  onSuccess,
}: SellPositionModalProps) {
  const [ticker, setTicker] = useState<OptionTicker | null>(null);
  const [isLoadingTicker, setIsLoadingTicker] = useState(true);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(String(Math.abs(position.quantity)));
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlpaca = venue === "ALPACA";
  const marketClosed = isAlpaca && getUsEquityOptionsSession().state !== "rth";

  // Fetch live ticker on open
  useEffect(() => {
    setIsLoadingTicker(true);
    optionsService
      .getTicker(position.contractSymbol, connectionId)
      .then((t) => {
        setTicker(t);
        // For a sell limit, default to bid if available, then last, then currentPremium
        const defaultPrice =
          t.bidPrice > 0 ? t.bidPrice
          : t.lastPrice > 0 ? t.lastPrice
          : position.currentPremium;
        if (defaultPrice > 0) setPrice(String(defaultPrice));
      })
      .catch(() => {
        if (position.currentPremium > 0) setPrice(String(position.currentPremium));
      })
      .finally(() => setIsLoadingTicker(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const priceNum = parseFloat(price) || 0;
  const qtyNum = parseInt(quantity, 10) || 0;
  const maxQty = Math.abs(position.quantity);
  const side = position.quantity > 0 ? "SELL" : "BUY";
  const isValid = priceNum > 0 && qtyNum > 0 && qtyNum <= maxQty && !marketClosed && !isPlacing;

  const avgPremium = Number(position.avgPremium) || 0;
  const unrealizedPnl = Number(position.unrealizedPnl) || 0;

  let expiryLabel = "—";
  try {
    if (position.expiry) {
      const d = new Date(position.expiry);
      if (!isNaN(d.getTime()))
        expiryLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
  } catch {}

  const handleSubmit = async () => {
    setIsPlacing(true);
    setError(null);
    try {
      const result = await optionsService.placeOrder({
        connectionId,
        contractSymbol: position.contractSymbol,
        underlying: position.underlying,
        strike: Number(position.strike),
        expiry: position.expiry,
        optionType: position.optionType,
        side,
        quantity: qtyNum,
        price: priceNum,
      });
      onSuccess(result.message);
    } catch (err: any) {
      setError(err.message ?? "Order placement failed");
      setIsPlacing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0e0e16] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-slate-100">
              {position.contractSymbol}
            </span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                position.optionType === "CALL"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {position.optionType}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            Strike ${Number(position.strike).toLocaleString()} · Expires {expiryLabel}
          </div>
        </div>

        {/* Position snapshot */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-white/[0.03] p-3 text-center text-xs">
          <div>
            <div className="mb-0.5 uppercase text-slate-500">Avg Buy</div>
            <div className="font-mono text-slate-200">{avgPremium.toFixed(4)}</div>
          </div>
          <div>
            <div className="mb-0.5 uppercase text-slate-500">Qty Held</div>
            <div className="font-mono text-slate-200">{maxQty}</div>
          </div>
          <div>
            <div className="mb-0.5 uppercase text-slate-500">Unrealized P&L</div>
            <div className={`font-mono font-medium ${pnlColor(unrealizedPnl)}`}>
              {unrealizedPnl >= 0 ? "+" : ""}
              {unrealizedPnl.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Live market prices */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Live Market</span>
            {isLoadingTicker && (
              <div className="h-3 w-3 animate-spin rounded-full border border-[var(--primary)] border-t-transparent" />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/[0.03] p-3 text-center text-xs">
            <div>
              <div className="mb-0.5 uppercase text-slate-500">Bid</div>
              <div className={`font-mono ${ticker?.bidPrice ? "text-green-400" : "text-slate-500"}`}>
                {isLoadingTicker ? "…" : ticker?.bidPrice ? ticker.bidPrice.toFixed(4) : "—"}
              </div>
            </div>
            <div>
              <div className="mb-0.5 uppercase text-slate-500">Ask</div>
              <div className={`font-mono ${ticker?.askPrice ? "text-slate-200" : "text-slate-500"}`}>
                {isLoadingTicker ? "…" : ticker?.askPrice ? ticker.askPrice.toFixed(4) : "—"}
              </div>
            </div>
            <div>
              <div className="mb-0.5 uppercase text-slate-500">Last</div>
              <div className="font-mono text-slate-300">
                {isLoadingTicker ? "…" : ticker?.lastPrice ? ticker.lastPrice.toFixed(4) : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Price input */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Limit Price {isAlpaca ? "(USD)" : "(USDT)"}
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.0001"
            min="0.0001"
            placeholder="0.0000"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-slate-100 outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30"
          />
        </div>

        {/* Quantity input */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Quantity (max {maxQty})
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            step="1"
            min="1"
            max={maxQty}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-slate-100 outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/30"
          />
          {qtyNum > maxQty && (
            <p className="mt-1 text-[10px] text-red-400">
              Cannot sell more than {maxQty} contract{maxQty !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Market closed (Alpaca) */}
        {marketClosed && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
            Markets closed — options orders resume at 09:30 ET
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition-all hover:bg-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPlacing ? "Placing Order…" : `${side} ${position.optionType}`}
        </button>
      </div>
    </div>
  );
}
