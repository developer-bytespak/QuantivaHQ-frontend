"use client";

import { useState, useEffect } from "react";
import { alpacaCryptoService } from "@/lib/api/alpaca-crypto.service";
import {
  calculatePositionSize,
  calculatePrices,
  formatCurrency,
  formatPercent,
  mapToTestnetSymbol,
  getEntryPrice,
  parsePercent,
  calculateRiskRewardRatio,
} from "@/lib/trading/paper-trading-utils";

interface AutoTradeModalProps {
  signal: any;
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
  strategy?: any;
}

type RiskLevel = "conservative" | "moderate" | "aggressive";

const RISK_LEVELS: Record<RiskLevel, { percent: number; label: string }> = {
  conservative: { percent: 1, label: "Conservative (1% of balance)" },
  moderate: { percent: 2.5, label: "Moderate (2.5% of balance)" },
  aggressive: { percent: 5, label: "Aggressive (5% of balance)" },
};

export function AutoTradeModal({ signal, balance, onClose, onSuccess, strategy }: AutoTradeModalProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("conservative");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Extract clean symbol from signal (priority: symbol > assetId > pair)
  const symbol = mapToTestnetSymbol(signal.symbol || signal.assetId || signal.pair || '');

  // Debug logging
  useEffect(() => {
    console.log('AutoTrade - Signal:', signal);
    console.log('AutoTrade - Mapped Symbol:', symbol);
  }, [signal, symbol]);

  // Fetch current price on mount
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoadingPrice(true);
        const entryPrice = getEntryPrice(signal);
        
        // Try to get real-time price from Alpaca
        try {
          const ticker = await alpacaCryptoService.getTickerPrice(symbol);
          setCurrentPrice(ticker.price);
        } catch {
          // Fallback to signal price
          setCurrentPrice(entryPrice);
        }
      } catch (err: any) {
        console.error("Failed to fetch price:", err);
        setCurrentPrice(getEntryPrice(signal));
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [signal, symbol]);

  const riskPercent = RISK_LEVELS[riskLevel].percent;
  // Use strategy values as fallback instead of hardcoded 5 and 10
  const defaultStopLoss = strategy?.stop_loss_value ?? 5;
  const defaultTakeProfit = strategy?.take_profit_value ?? 10;
  const stopLossPercent = parsePercent(signal.stopLoss) || defaultStopLoss;
  const takeProfitPercent = parsePercent(signal.takeProfit1) || defaultTakeProfit;

  const position = calculatePositionSize(balance, riskPercent, currentPrice);
  const prices = calculatePrices(
    currentPrice,
    stopLossPercent,
    takeProfitPercent,
    signal.type
  );

  const maxLossAmount = (position.totalCost * stopLossPercent) / 100;
  const potentialGainAmount = (position.totalCost * takeProfitPercent) / 100;
  const riskRewardRatio = calculateRiskRewardRatio(maxLossAmount, potentialGainAmount);

  const handleExecute = async () => {
    try {
      setExecuting(true);
      setError(null);

      if (!symbol || symbol === 'USDT') {
        throw new Error("Invalid trading symbol");
      }

      if (position.totalCost > balance) {
        throw new Error(`Insufficient balance. Need ${formatCurrency(position.totalCost)} but only have ${formatCurrency(balance)}`);
      }

      // Validate minimum quantity (Binance usually requires > 0.00001)
      if (position.quantity < 0.00001) {
        throw new Error(`Quantity too small. Minimum is 0.00001, got ${position.quantity}`);
      }

      console.log('Placing order with:', {
        symbol,
        side: signal.type,
        type: "MARKET",
        quantity: signal.type === 'BUY' ? position.totalCost : position.quantity, // For BUY, send USDT amount
        balance,
        totalCost: position.totalCost,
      });

      // Place market order on Alpaca
      const result = await alpacaCryptoService.placeOrder({
        symbol,
        side: signal.type,
        type: "MARKET",
        quantity: position.quantity,
      });

      console.log('Order placed successfully:', result);

      // Success!
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to execute auto trade:", err);
      
      // Extract more specific error message
      let errorMessage = err.message || "Failed to execute trade";
      
      // Check for common trading errors
      if (errorMessage.includes('notional') || errorMessage.includes('MIN_NOTIONAL')) {
        errorMessage = "Order value too small. Try increasing your investment amount.";
      } else if (errorMessage.includes('quantity') || errorMessage.includes('LOT_SIZE')) {
        errorMessage = "Invalid quantity size for this trading pair.";
      } else if (errorMessage.includes('INSUFFICIENT') || errorMessage.includes('insufficient')) {
        errorMessage = "Insufficient balance to complete this trade.";
      }
      
      setError(errorMessage);
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
            <span className="text-lg font-semibold text-white">{signal.pair}</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                signal.type === "BUY"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {signal.type}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Price:</span>
              <span className="font-medium text-white">
                {loadingPrice ? "Loading..." : formatCurrency(currentPrice)}
              </span>
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

        {/* Risk Level Selection */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Position Size:
          </label>
          <div className="space-y-2">
            {(Object.keys(RISK_LEVELS) as RiskLevel[]).map((level) => (
              <label
                key={level}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                  riskLevel === level
                    ? "border-[#fc4f02] bg-[#fc4f02]/10"
                    : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="riskLevel"
                  value={level}
                  checked={riskLevel === level}
                  onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                  className="h-4 w-4 text-[#fc4f02]"
                />
                <span className="text-sm text-slate-200">{RISK_LEVELS[level].label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Calculated Values */}
        <div className="mb-6 rounded-lg bg-slate-800/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Calculated Trade:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Investment:</span>
              <span className="font-medium text-white">
                {formatCurrency(position.totalCost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity:</span>
              <span className="font-medium text-white">{position.units}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Loss:</span>
              <span className="font-medium text-red-400">
                -{formatCurrency(maxLossAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Potential Gain:</span>
              <span className="font-medium text-green-400">
                +{formatCurrency(potentialGainAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="text-slate-400">Risk/Reward:</span>
              <span className="font-medium text-cyan-400">{riskRewardRatio}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            ❌ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={executing}
            className="flex-1 rounded-lg bg-slate-700/50 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={executing || loadingPrice}
            className="flex-1 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {executing ? "Executing..." : loadingPrice ? "Loading..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
