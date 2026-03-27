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
  onSuccess: () => void;
  strategy?: { stop_loss_value?: number; take_profit_value?: number };
}

export function StockExchangeAutoTradeModal({
  connectionId,
  signal,
  onClose,
  onSuccess,
  strategy,
}: StockExchangeAutoTradeModalProps) {
  const vcPoolId = useTopTradeVcPoolId();
  const isPoolTrade = !!vcPoolId;
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [usdAmount, setUsdAmount] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pair = signal?.pair ?? "";
  const base = (pair.split(/\s*\/\s*/)[0] ?? "").replace(/\s+/g, "");
  const symbol = base;
  const entryPrice = Number(signal?.entryPrice ?? signal?.entry ?? 0) || 0;

  const defaultStopLoss = strategy?.stop_loss_value ?? 5;
  const defaultTakeProfit = strategy?.take_profit_value ?? 10;
  const stopLossPercent = parsePercent(String(signal?.stopLoss ?? signal?.stop_loss_pct ?? defaultStopLoss)) || defaultStopLoss;
  const takeProfitPercent = parsePercent(String(signal?.takeProfit1 ?? signal?.take_profit_pct ?? defaultTakeProfit)) || defaultTakeProfit;

  const amountNum = parseFloat(usdAmount) || 0;
  const quantity = entryPrice > 0 ? amountNum / entryPrice : 0;
  const prices = calculatePrices(entryPrice, stopLossPercent, takeProfitPercent, "BUY");
  const maxLossAmount = amountNum * (stopLossPercent / 100);
  const potentialGainAmount = amountNum * (takeProfitPercent / 100);
  const riskRewardRatio = calculateRiskRewardRatio(maxLossAmount, potentialGainAmount);
  const quantityDisplay = quantity > 0 ? quantity.toFixed(4).replace(/\.?0+$/, "") : "—";
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
    if (!amountNum || amountNum <= 0) {
      setError("Enter a valid USD amount");
      return;
    }
    if (!isPoolTrade && amountNum > balance) {
      setError(`Insufficient balance. Need ${formatCurrency(amountNum)} but only have ${formatCurrency(balance)}`);
      return;
    }
    if (!entryPrice || entryPrice <= 0) {
      setError("Invalid entry price");
      return;
    }
    const shares = Math.floor(quantity * 10000) / 10000;
    if (shares < 0.0001) {
      setError("Amount too small. Minimum order value may apply.");
      return;
    }
    try {
      setExecuting(true);
      if (vcPoolId) {
        await adminCreateTrade(vcPoolId, {
          asset_pair: symbol,
          action: "BUY",
          quantity: shares,
          entry_price_usdt: entryPrice,
          notes: null,
        });
        onSuccess();
        onClose();
      } else {
        const response = await exchangesService.placeOrder(connectionId, {
          symbol,
          side: "BUY",
          type: "MARKET",
          quantity: shares,
          autoOco: true,
        });
        if (response?.success) {
          onSuccess();
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
            <span className="rounded-full px-3 py-1 text-sm font-semibold bg-green-500/20 text-green-400">
              BUY
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
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Amount (USD):
          </label>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-3 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20"
          />
          {!loadingBalance && (
            <p className="mt-2 text-xs text-slate-500">Available: {formatCurrency(balance)} USD</p>
          )}
        </div>

        <div className="mb-6 rounded-lg bg-slate-800/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Calculated Trade:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Investment:</span>
              <span className="font-medium text-white">{formatCurrency(amountNum)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Shares:</span>
              <span className="font-medium text-white">{quantityDisplay}</span>
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
            disabled={executing || loadingBalance || !amountNum}
            className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {executing ? "Executing..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
