"use client";

import { useState } from "react";
import type { OptionType, OptionContract } from "@/lib/api/options.service";
import { InfoTip } from "./Tooltip";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionOrderFormProps {
  selectedContract: OptionContract | null;
  orderForm: {
    optionType: OptionType;
    side: "BUY" | "SELL";
    quantity: number;
    price: number;
  };
  onFormChange: (form: Partial<OptionOrderFormProps["orderForm"]>) => void;
  onSubmit: () => void;
  isPlacing: boolean;
  accountBalance?: number;
  userPositionQty?: number | null; // qty user holds for selected contract (null = no position)
}

// ── Component ────────────────────────────────────────────────────────────────

export function OptionOrderForm({
  selectedContract,
  orderForm,
  onFormChange,
  onSubmit,
  isPlacing,
  accountBalance,
  userPositionQty,
}: OptionOrderFormProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const maxLoss = orderForm.side === "BUY" ? orderForm.price * orderForm.quantity : null;
  const insufficientBalance = accountBalance !== undefined && maxLoss !== null && maxLoss > accountBalance;

  // Sell-to-close: check if user owns this contract
  const isSell = orderForm.side === "SELL";
  const hasPosition = userPositionQty !== null && userPositionQty !== undefined && userPositionQty > 0;
  const sellBlocked = isSell && !hasPosition;

  const handleSubmit = () => {
    if (!selectedContract) return;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onSubmit();
  };

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Place Order</h3>

      {/* Contract info */}
      {selectedContract ? (
        <div className="mb-4 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-300">
              {selectedContract.symbol}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                selectedContract.type === "CALL"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {selectedContract.type}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
            <span>Strike: ${selectedContract.strike.toLocaleString()}</span>
            <span>Bid: {selectedContract.bidPrice}</span>
            <span>Ask: {selectedContract.askPrice}</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-lg border border-dashed border-[--color-border] p-4 text-center text-xs text-slate-500">
          Select a contract from the options chain
        </div>
      )}

      {/* Side toggle */}
      <div className="mb-3">
        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Side
          <InfoTip content="BUY = pay premium to acquire the option. SELL = collect premium but take on obligation. Beginners should start with BUY." position="right" />
        </label>
        <div className="flex gap-1">
          {(["BUY", "SELL"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onFormChange({ side: s })}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
                orderForm.side === s
                  ? s === "BUY"
                    ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.15)] font-bold"
                    : "bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] font-bold"
                  : "bg-white/[0.03] text-slate-500 hover:bg-white/[0.06]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sell-to-close info */}
      {isSell && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${
          sellBlocked
            ? "border border-red-500/20 bg-red-500/5 text-red-400"
            : "border border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
        }`}>
          {sellBlocked
            ? "You don't own this contract — only sell-to-close is allowed."
            : `You hold ${userPositionQty} contract${userPositionQty === 1 ? "" : "s"} — selling to close.`}
        </div>
      )}

      {/* Quantity */}
      <div className="mb-3">
        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Quantity (contracts)
          <InfoTip content="Number of option contracts to trade. Each contract gives you the right to buy/sell the underlying. Start with 1 to limit risk." position="right" />
        </label>
        <input
          type="number"
          min={1}
          max={isSell && hasPosition ? userPositionQty! : 10}
          step={1}
          value={orderForm.quantity}
          onChange={(e) => {
            const maxQty = isSell && hasPosition ? userPositionQty! : 10;
            onFormChange({ quantity: Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)) });
          }}
          disabled={sellBlocked}
          className="w-full rounded-lg border border-[--color-border] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none ring-[var(--primary)]/30 focus:ring-1 disabled:opacity-50"
        />
      </div>

      {/* Price */}
      <div className="mb-4">
        <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Price (USDT)
          <InfoTip content="The premium you'll pay (BUY) or receive (SELL) per contract. Use Bid/Ask/Mark buttons below for quick market pricing." position="right" />
        </label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={orderForm.price}
          onChange={(e) => onFormChange({ price: Math.max(0, parseFloat(e.target.value) || 0) })}
          className="w-full rounded-lg border border-[--color-border] bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none ring-[var(--primary)]/30 focus:ring-1"
        />
        {selectedContract && (
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => onFormChange({ price: selectedContract.bidPrice })}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Bid ({selectedContract.bidPrice})
            </button>
            <button
              onClick={() => onFormChange({ price: selectedContract.askPrice })}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Ask ({selectedContract.askPrice})
            </button>
            <button
              onClick={() => onFormChange({ price: selectedContract.markPrice })}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Mark ({selectedContract.markPrice})
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {maxLoss !== null && maxLoss > 0 && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/8 p-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-yellow-400">
            Max {orderForm.side === "BUY" ? "Loss" : "Risk"}: {maxLoss.toFixed(2)} USDT
            <InfoTip content="Maximum amount you could lose on this trade. For buyers, this equals the total premium paid. The option can expire worthless." position="right" />
          </p>
          {insufficientBalance && (
            <p className="mt-1 text-[10px] text-red-400">
              ⚠ Exceeds available balance ({accountBalance?.toFixed(2)} USDT)
            </p>
          )}
        </div>
      )}

      {/* Platform fee estimate */}
      {selectedContract && orderForm.price > 0 && orderForm.quantity > 0 && (
        <div className="mb-3 flex items-center justify-between text-[10px] text-slate-500">
          <span>Platform Fee (0.03%)</span>
          <span className="font-mono text-slate-400">
            ${(orderForm.price * orderForm.quantity * 0.0003).toFixed(4)} USDT
          </span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedContract || isPlacing || insufficientBalance || sellBlocked}
        className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
          !selectedContract || isPlacing || insufficientBalance || sellBlocked
            ? "cursor-not-allowed bg-white/[0.04] text-slate-600"
            : orderForm.side === "BUY"
              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              : "bg-gradient-to-r from-red-600 to-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
        }`}
      >
        {isPlacing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Placing…
          </span>
        ) : (
          `${orderForm.side} ${selectedContract?.type ?? "Option"}`
        )}
      </button>

      {/* Confirmation Modal */}
      {confirmOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[--color-border] bg-[--color-surface]/60 p-6 shadow-2xl">
            <h4 className="mb-4 text-base font-semibold text-slate-200">Confirm Order</h4>
            <div className="mb-4 space-y-2 text-sm text-slate-400">
              <p>
                <span className="text-slate-500">Contract:</span>{" "}
                <span className="font-mono text-slate-300">{selectedContract.symbol}</span>
              </p>
              <p>
                <span className="text-slate-500">Side:</span>{" "}
                <span className={orderForm.side === "BUY" ? "text-green-400" : "text-red-400"}>
                  {orderForm.side}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Qty:</span>{" "}
                <span className="text-slate-300">{orderForm.quantity}</span>
              </p>
              <p>
                <span className="text-slate-500">Price:</span>{" "}
                <span className="text-slate-300">{orderForm.price} USDT</span>
              </p>
              {maxLoss !== null && (
                <p>
                  <span className="text-slate-500">Max Loss:</span>{" "}
                  <span className="text-yellow-400">{maxLoss.toFixed(2)} USDT</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg border border-[--color-border] py-2 text-sm text-slate-400 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                  orderForm.side === "BUY"
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                }`}
              >
                Confirm {orderForm.side}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
