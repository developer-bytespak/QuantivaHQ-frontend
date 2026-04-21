"use client";

import { useEffect, useState } from "react";

interface SellConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  symbol: string;
  quantity: number;
  currentPrice?: number;
  exchangeLabel?: string;
  quantityLabel?: string;
  quantityPrecision?: number;
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
}: SellConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const estProceeds = currentPrice ? currentPrice * quantity : null;
  const formatUSD = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
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
            Confirm Sell
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
          You're about to fully close this position at the current market price.
          Any active Take-Profit / Stop-Loss on it will be cancelled first.
          This cannot be undone.
        </p>

        <div className="mb-5 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              Asset
            </span>
            <span className="text-sm font-bold text-white">{symbol}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">
              {quantityLabel}
            </span>
            <span className="text-sm font-semibold text-white">
              {quantity.toFixed(quantityPrecision)}
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
          {estProceeds !== null && (
            <div className="flex items-center justify-between border-t border-white/10 pt-2.5">
              <span className="text-xs uppercase tracking-wider text-slate-400">
                Est. Proceeds
              </span>
              <span className="text-sm font-bold text-emerald-400">
                ≈ {formatUSD(estProceeds)}
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
            disabled={submitting}
            className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Selling...
              </span>
            ) : (
              "Confirm Sell"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
