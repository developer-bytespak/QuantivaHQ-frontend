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

interface ExchangeAutoTradeModalProps {
  connectionId: string;
  signal: any;
  onClose: () => void;
  onSuccess: () => void;
  strategy?: { stop_loss_value?: number; take_profit_value?: number };
}

export function ExchangeAutoTradeModal({
  connectionId,
  signal,
  onClose,
  onSuccess,
  strategy,
}: ExchangeAutoTradeModalProps) {
  const vcPoolId = useTopTradeVcPoolId();
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [usdtAmount, setUsdtAmount] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPoolTrade = !!vcPoolId;

  const pair = signal?.pair ?? "";
  const base = (pair.split(/\s*\/\s*/)[0] ?? "").replace(/\s+/g, "");
  const symbol = base.endsWith("USDT") ? base : base + "USDT";
  const entryPrice = Number(signal?.entryPrice ?? signal?.entry ?? 0) || 0;

  const defaultStopLoss = strategy?.stop_loss_value ?? 5;
  const defaultTakeProfit = strategy?.take_profit_value ?? 10;
  const stopLossPercent = parsePercent(String(signal?.stopLoss ?? signal?.stop_loss_pct ?? defaultStopLoss)) || defaultStopLoss;
  const takeProfitPercent = parsePercent(String(signal?.takeProfit1 ?? signal?.take_profit_pct ?? defaultTakeProfit)) || defaultTakeProfit;

  const amountNum = parseFloat(usdtAmount) || 0;
  const quantity = entryPrice > 0 ? amountNum / entryPrice : 0;
  const prices = calculatePrices(entryPrice, stopLossPercent, takeProfitPercent, "BUY");
  const maxLossAmount = amountNum * (stopLossPercent / 100);
  const potentialGainAmount = amountNum * (takeProfitPercent / 100);
  const riskRewardRatio = calculateRiskRewardRatio(maxLossAmount, potentialGainAmount);
  const quantityDisplay = quantity > 0 ? quantity.toFixed(8).replace(/\.?0+$/, "") : "—";

  useEffect(() => {
    if (isPoolTrade) {
      setLoadingBalance(false);
      return;
    }
    let cancelled = false;
    exchangesService.getBalance(connectionId).then((res) => {
      if (cancelled || !res?.data?.assets) return;
      const usdt = res.data.assets.find((a: any) => a.symbol === "USDT");
      setBalance(usdt ? parseFloat(usdt.free || "0") + parseFloat(usdt.locked || "0") : 0);
    }).catch(() => { if (!cancelled) setBalance(0); })
      .finally(() => { if (!cancelled) setLoadingBalance(false); });
    return () => { cancelled = true; };
  }, [connectionId, isPoolTrade]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amountNum || amountNum <= 0) {
      setError("Enter a valid USDT amount");
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
    if (quantity < 0.00001) {
      setError("Amount too small. Minimum order value may apply.");
      return;
    }
    try {
      setExecuting(true);
      if (vcPoolId) {
        await adminCreateTrade(vcPoolId, {
          asset_pair: symbol,
          action: "BUY",
          quantity: Math.floor(quantity * 100000000) / 100000000,
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
          quantity: Math.floor(quantity * 100000000) / 100000000,
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
      if (msg.includes("notional") || msg.includes("MIN_NOTIONAL")) msg = "Order value too small. Try increasing the amount.";
      else if (msg.includes("LOT_SIZE") || msg.includes("quantity")) msg = "Invalid quantity size for this pair.";
      else if (msg.includes("INSUFFICIENT") || msg.includes("insufficient")) msg = "Insufficient balance.";
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
        {/* Header */}
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

        {/* Signal Info */}
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

        {/* Amount (USDT) */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Amount (USDT):
          </label>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-3 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/20"
          />
          {!loadingBalance && (
            <p className="mt-2 text-xs text-slate-500">Available: {formatCurrency(balance)} USDT</p>
          )}
        </div>

        {/* Calculated Trade */}
        <div className="mb-6 rounded-lg bg-slate-800/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Calculated Trade:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Investment:</span>
              <span className="font-medium text-white">{formatCurrency(amountNum)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity:</span>
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
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            ❌ {error}
          </div>
        )}

        {/* Actions */}
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
            className="flex-1 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {executing ? "Executing..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
