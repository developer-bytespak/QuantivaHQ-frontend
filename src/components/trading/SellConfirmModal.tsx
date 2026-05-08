"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Sell modal supporting both full and partial position closes.
 *
 * The user can either accept the pre-filled max quantity (full close) or
 * type a smaller amount (partial sell). The "Max" button restores the full
 * position size. `onConfirm` receives the final qty plus a boolean flagging
 * whether the sell is the entire position — callers use that to decide
 * whether to set `closePosition: true` on the order (which on crypto also
 * cancels any open TP/SL and reads live free balance).
 *
 * The "View in Market" link is an escape hatch for users who want chart /
 * orderbook context before committing — it routes to /dashboard/market/<sym>
 * which hosts the full trading panel.
 */
interface SellConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Confirm callback.
   * @param quantity     Final qty to sell (≤ held). Whole-shares-normalized
   *                     by the modal when quantityPrecision=0 (Alpaca stocks).
   * @param isFullClose  True when quantity equals the held position. Caller
   *                     should pass closePosition=true on the order in that
   *                     case so the backend cancels TP/SL and uses live qty.
   */
  onConfirm: (quantity: number, isFullClose: boolean) => Promise<void>;
  symbol: string;
  /** Quantity currently held — the "max" the user can sell. */
  quantity: number;
  currentPrice?: number;
  exchangeLabel?: string;
  quantityLabel?: string;
  quantityPrecision?: number;
  /** Symbol used for the "View in Market" route. Defaults to `symbol`. */
  marketSymbol?: string;
}

export default function SellConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  symbol,
  quantity,
  currentPrice,
  exchangeLabel,
  quantityLabel = "Quantity",
  quantityPrecision = 6,
  marketSymbol,
}: SellConfirmModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // qtyInput stays as a string (not a number) so partial typing like "1." or
  // an empty field doesn't get coerced to NaN/0 mid-edit. Parse at validate
  // / submit time only.
  const [qtyInput, setQtyInput] = useState("");

  // On open: reset error/submitting and pre-fill with the full held quantity.
  useEffect(() => {
    if (!isOpen) {
      setSubmitting(false);
      setError(null);
      return;
    }
    setQtyInput(quantity > 0 ? quantity.toFixed(quantityPrecision) : "");
  }, [isOpen, quantity, quantityPrecision]);

  const parsedQty = useMemo(() => {
    const n = Number.parseFloat(qtyInput);
    return Number.isFinite(n) ? n : 0;
  }, [qtyInput]);

  // For stocks (precision=0), enforce whole shares — Alpaca rejects fractional
  // sells on the equity side. For crypto, trust the precision the caller set.
  const effectiveQty = useMemo(() => {
    if (quantityPrecision === 0) return Math.floor(parsedQty);
    return parsedQty;
  }, [parsedQty, quantityPrecision]);

  const isFullClose = effectiveQty > 0 && effectiveQty >= quantity;
  const validationError =
    effectiveQty <= 0
      ? "Enter a quantity greater than zero."
      : effectiveQty > quantity
        ? `You hold ${quantity.toFixed(quantityPrecision)} — cannot sell more.`
        : null;

  if (!isOpen) return null;

  const formatUSD = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

  const estProceeds = currentPrice ? currentPrice * effectiveQty : null;

  // Use the raw quantity (full precision) instead of toFixed. toFixed rounds
  // to nearest, which can round UP — e.g. quantity=0.00010987 with
  // precision=6 becomes "0.000110", which when parsed back is 0.00011 >
  // 0.00010987 and trips the "cannot sell more" validation. String(quantity)
  // round-trips losslessly, so Max is always exactly the held amount.
  const setMax = () => setQtyInput(String(quantity));

  const goToMarket = () => {
    const sym = (marketSymbol || symbol).toUpperCase();
    router.push(`/dashboard/market/${sym}`);
  };

  const handleConfirm = async () => {
    if (submitting || validationError) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(effectiveQty, isFullClose);
      onClose();
    } catch (e: any) {
      const msg =
        e?.message ||
        e?.error ||
        (typeof e === "string" ? e : "Failed to place sell order");
      setError(String(msg));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[11500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20">
              <svg
                className="h-4 w-4 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 13l-5 5m0 0l-5-5m5 5V6"
                />
              </svg>
            </span>
            Sell {symbol}
          </h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="mb-5 text-sm text-slate-300">
          {isFullClose
            ? "You're closing this position fully at the current market price. Any active Take-Profit / Stop-Loss will be cancelled first."
            : "You're selling part of this position at the current market price. The rest stays open."}
        </p>

        <div className="mb-4 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              You hold
            </span>
            <span className="text-sm font-semibold text-white">
              {quantity.toFixed(quantityPrecision)} {quantityLabel.toLowerCase()}
            </span>
          </div>
          {currentPrice !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400">
                Market Price
              </span>
              <span className="text-sm text-slate-200">
                {formatUSD(currentPrice)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Order Type
            </span>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-200">
              MARKET
            </span>
          </div>
          {exchangeLabel && (
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400">
                Venue
              </span>
              <span className="text-xs font-medium text-slate-300">
                {exchangeLabel}
              </span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="sell-qty"
            className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400"
          >
            {quantityLabel} to sell
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id="sell-qty"
              type="number"
              inputMode="decimal"
              step={quantityPrecision === 0 ? "1" : "any"}
              min="0"
              max={quantity}
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              disabled={submitting}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/30 disabled:opacity-50"
              placeholder={`0.${"0".repeat(quantityPrecision)}`}
            />
            <button
              type="button"
              onClick={setMax}
              disabled={submitting}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[0.1] disabled:opacity-50"
            >
              Max
            </button>
          </div>
          {estProceeds !== null && effectiveQty > 0 && !validationError && (
            <p className="mt-2 text-xs text-slate-400">
              ≈ Proceeds:{" "}
              <span className="font-semibold text-emerald-400">
                {formatUSD(estProceeds)}
              </span>
              {!isFullClose && currentPrice && (
                <span className="ml-1 text-slate-500">
                  (of {formatUSD(currentPrice * quantity)} total)
                </span>
              )}
            </p>
          )}
          {validationError && (
            <p className="mt-2 text-xs text-rose-400">{validationError}</p>
          )}
        </div>

        {/* Escape hatch — gives the user the full Market page for chart /
            orderbook context if they don't want to commit from this modal. */}
        <button
          type="button"
          onClick={goToMarket}
          disabled={submitting}
          className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300 disabled:opacity-50"
        >
          View in Market
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7M3 12h18" />
          </svg>
        </button>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.08] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting || !!validationError}
            className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Selling...
              </span>
            ) : isFullClose ? (
              "Sell Entire Position"
            ) : (
              "Sell"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
