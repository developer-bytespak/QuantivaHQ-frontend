"use client";

import { useState, useEffect } from "react";
import { exchangesService } from "@/lib/api/exchanges.service";
import { adminCreateTrade } from "@/lib/api/vcpool-admin";
import { useTopTradeVcPoolId } from "../context/top-trade-vc-pool-context";
import {
  formatCurrency,
  formatPercent,
  parsePercent,
  calculatePrices,
  calculateRiskRewardRatio,
} from "@/lib/trading/paper-trading-utils";

interface StockExchangeAutoTradeModalProps {
  connectionId: string;
  signal: any;
  onClose: () => void;
  /** Optional custom message forwarded to the parent's success toast. When
   *  omitted, the parent shows its default "Trade executed successfully!" copy. */
  onSuccess: (message?: string) => void;
  strategy?: { stop_loss_value?: number; take_profit_value?: number };
  side?: "BUY" | "SELL";
}

export function StockExchangeAutoTradeModal({
  connectionId,
  signal,
  onClose,
  onSuccess,
  strategy,
  side: sideProp,
}: StockExchangeAutoTradeModalProps) {
  const vcPoolId = useTopTradeVcPoolId();
  const isPoolTrade = !!vcPoolId;
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  // Users input whole shares for stocks (not a USD amount). Stocks are
  // naturally thought of in share count, and Alpaca requires whole-share
  // quantities on the protective LIMIT (TP) and STOP (SL) orders — so
  // fractional input would leave a fractional-share sliver unprotected.
  const [sharesAmount, setSharesAmount] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pair = signal?.pair ?? "";
  const base = (pair.split(/\s*\/\s*/)[0] ?? "").replace(/\s+/g, "");
  const symbol = base;
  const entryPrice = Number(signal?.entryPrice ?? signal?.entry ?? 0) || 0;
  const side: "BUY" | "SELL" = sideProp ?? (signal?.type?.toUpperCase() === "SELL" ? "SELL" : "BUY");

  const defaultStopLoss = strategy?.stop_loss_value ?? 5;
  const defaultTakeProfit = strategy?.take_profit_value ?? 10;
  const stopLossPercent = parsePercent(String(signal?.stopLoss ?? signal?.stop_loss_pct ?? defaultStopLoss)) || defaultStopLoss;
  const takeProfitPercent = parsePercent(String(signal?.takeProfit1 ?? signal?.take_profit_pct ?? defaultTakeProfit)) || defaultTakeProfit;

  // Shares drive the math now — USD amount is derived for display/validation.
  const sharesNum = Math.max(0, Math.floor(parseFloat(sharesAmount) || 0));
  const amountNum = sharesNum * entryPrice;
  const prices = calculatePrices(entryPrice, stopLossPercent, takeProfitPercent, side);
  const maxLossAmount = amountNum * (stopLossPercent / 100);
  const potentialGainAmount = amountNum * (takeProfitPercent / 100);
  const riskRewardRatio = calculateRiskRewardRatio(maxLossAmount, potentialGainAmount);
  const quantityDisplay = sharesNum > 0 ? sharesNum.toString() : "—";
  // Max shares the user could afford with their current USD buying power.
  const maxAffordableShares = entryPrice > 0 ? Math.floor(balance / entryPrice) : 0;
  // Platform fee (0.1%)
  const tradeFeePercent = 0.1;
  const tradeFeeAmount = amountNum * (tradeFeePercent / 100);
  useEffect(() => {
    if (isPoolTrade) {
      setLoadingBalance(false);
      return;
    }
    let cancelled = false;
    exchangesService.getBalance(connectionId).then((res) => {
      if (cancelled || !res?.data?.assets) return;
      const usd = res.data.assets.find((a: any) => a.symbol === "USD");
      setBalance(usd ? parseFloat(usd.free || "0") + parseFloat(usd.locked || "0") : 0);
    }).catch(() => { if (!cancelled) setBalance(0); })
      .finally(() => { if (!cancelled) setLoadingBalance(false); });
    return () => { cancelled = true; };
  }, [connectionId, isPoolTrade]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sharesNum || sharesNum < 1) {
      setError("Enter at least 1 share");
      return;
    }
    if (!entryPrice || entryPrice <= 0) {
      setError("Invalid entry price");
      return;
    }
    if (!isPoolTrade && amountNum > balance) {
      setError(
        `Insufficient balance. ${sharesNum} share${sharesNum === 1 ? "" : "s"} at ${formatCurrency(entryPrice)} = ${formatCurrency(amountNum)}, but you only have ${formatCurrency(balance)}.`,
      );
      return;
    }
    try {
      setExecuting(true);
      if (vcPoolId) {
        await adminCreateTrade(vcPoolId, {
          asset_pair: symbol,
          action: side,
          quantity: sharesNum,
          entry_price_usdt: entryPrice,
          notes: null,
        });
        onSuccess();
        onClose();
      } else {
        const response = await exchangesService.placeOrder(connectionId, {
          symbol,
          side,
          type: "MARKET",
          quantity: sharesNum,
          autoOco: true,
          source: "top_trade",
          takeProfit: takeProfitPercent / 100,
          stopLoss: stopLossPercent / 100,
        });
        if (response?.success) {
          // The backend can respond in several shapes depending on market state:
          //   1. { queued: true }             — market fully closed (weekend/holiday).
          //                                     Trade stored in DB queue; cron submits
          //                                     at next market open.
          //   2. { delayedProtection: {...} } — buy ACCEPTED by Alpaca but not yet
          //                                     filled (weekday pre/post-market). Cron
          //                                     will attach TP/SL at fill.
          //   3. { oco: {...} }               — happy path: buy filled + TP/SL live now.
          //   4. { ocoError }                 — buy placed, TP/SL unattachable.
          // Forward a human-readable message to the parent's green success toast
          // for each case instead of blocking the UI with alert().
          const r = response as any;
          let toastMsg: string;

          // Alpaca rejects same-day sells for PDT-flagged accounts. That blocks
          // the TP/SL sell orders, but the buy itself is fine. Detect the PDT
          // error text (can come via ocoError or delayedProtection.message)
          // and tell the user plainly that protection will attach overnight.
          const pdtSignal = String(
            r?.ocoError || r?.delayedProtection?.message || "",
          ).toLowerCase();
          const isPdtBlocked =
            pdtSignal.includes("pattern day trading") || pdtSignal.includes("pdt");

          if (r?.queued === true) {
            toastMsg =
              r?.message ||
              `Markets are closed. Your ${side === "BUY" ? "buy" : "sell"} of ${sharesNum} ${symbol} is queued and will submit automatically at the next market open.`;
          } else if (isPdtBlocked) {
            toastMsg =
              `Your ${side === "BUY" ? "buy" : "sell"} of ${sharesNum} ${symbol} was placed successfully. Take-Profit and Stop-Loss could not be attached yet because your broker (Alpaca) blocks same-day sells under its Pattern Day Trading (PDT) rule. Your protection orders will attach automatically once the position becomes an overnight hold — usually at the next market open. No action needed on your side.`;
          } else if (r?.delayedProtection) {
            toastMsg =
              r?.delayedProtection?.message ||
              `Your ${sharesNum} ${symbol} ${side.toLowerCase()} is accepted but hasn't filled yet (pre/post-market). Take-Profit and Stop-Loss will attach automatically when it fills at market open.`;
          } else if (r?.ocoError) {
            toastMsg = `Trade placed for ${sharesNum} ${symbol}, but Take-Profit / Stop-Loss could not be attached: ${r.ocoError}. Please add protection manually once the position opens.`;
          } else if (r?.oco) {
            toastMsg = `Bought ${sharesNum} ${symbol}. Take-Profit and Stop-Loss are attached (${takeProfitPercent}% / ${stopLossPercent}%).`;
          } else {
            toastMsg = `Trade executed: ${side} ${sharesNum} ${symbol}.`;
          }

          onSuccess(toastMsg);
          onClose();
        } else {
          setError("Order failed");
        }
      }
    } catch (err: any) {
      let msg = err?.message ?? "Failed to place order";
      if (msg.includes("insufficient") || msg.includes("balance")) msg = "Insufficient balance.";
      setError(msg);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-6 shadow-2xl shadow-black/50 backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">🤖 Auto Execute Trade</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-slate-800/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-white">{pair}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${side === "SELL" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
              {side}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Price:</span>
              <span className="font-medium text-white">{formatCurrency(entryPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stop Loss:</span>
              <span className="font-medium text-red-400">
                {formatPercent(stopLossPercent)} ({formatCurrency(prices.stopLossPrice)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Take Profit:</span>
              <span className="font-medium text-green-400">
                {formatPercent(takeProfitPercent)} ({formatCurrency(prices.takeProfitPrice)})
              </span>
            </div>
          </div>
          {/* Issue 6 disclosure — stop-market orders can fill at a worse
              price than the trigger when the market gaps overnight or
              during illiquid sessions. Users should know this going in. */}
          <div className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-500/[0.06] border border-amber-500/20 px-2.5 py-2 text-[10px] leading-relaxed text-amber-200/80">
            <svg className="w-3.5 h-3.5 mt-px flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              Stop-loss may fill at a lower price than shown if the stock gaps down overnight or during illiquid sessions. For most liquid stocks during regular hours, the fill is within pennies of the stop price.
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Shares:
          </label>
          <input
            type="number"
            step="1"
            min="1"
            max={!isPoolTrade && maxAffordableShares > 0 ? maxAffordableShares : undefined}
            placeholder="0"
            value={sharesAmount}
            onChange={(e) => {
              // Accept only non-negative whole numbers; strip decimals and signs.
              const raw = e.target.value;
              const cleaned = raw.replace(/[^\d]/g, "");
              setSharesAmount(cleaned);
            }}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-3 text-white placeholder-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
          {!loadingBalance && (
            <p className="mt-2 text-xs text-slate-500">
              Available: {formatCurrency(balance)} USD
              {entryPrice > 0 && maxAffordableShares > 0 && (
                <> · max {maxAffordableShares} share{maxAffordableShares === 1 ? "" : "s"} at {formatCurrency(entryPrice)} each</>
              )}
            </p>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-slate-800/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Calculated Trade:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Shares:</span>
              <span className="font-medium text-white">{quantityDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Cost:</span>
              <span className="font-medium text-white">{formatCurrency(amountNum)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Loss:</span>
              <span className="font-medium text-red-400">-{formatCurrency(maxLossAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Potential Gain:</span>
              <span className="font-medium text-green-400">+{formatCurrency(potentialGainAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="text-slate-400">Risk/Reward:</span>
              <span className="font-medium text-cyan-400">{riskRewardRatio}</span>
            </div>
            {amountNum > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  Platform Fee ({tradeFeePercent}%)
                  <span className="relative group">
                    <svg className="w-3.5 h-3.5 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg bg-black/95 px-3 py-2 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">0.1% fee on every executed trade. Billed monthly via Stripe.</span>
                  </span>
                </span>
                <span className="font-medium text-amber-400">${tradeFeeAmount.toFixed(5)}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            ❌ {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={executing}
            className="flex-1 rounded-lg bg-slate-700/50 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing || loadingBalance || !sharesNum}
            className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {executing ? "Executing..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
