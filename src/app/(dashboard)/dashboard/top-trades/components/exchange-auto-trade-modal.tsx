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
  side?: "BUY" | "SELL";
}

export function ExchangeAutoTradeModal({
  connectionId,
  signal,
  onClose,
  onSuccess,
  strategy,
  side: sideProp,
}: ExchangeAutoTradeModalProps) {
  const vcPoolId = useTopTradeVcPoolId();
  const [balance, setBalance] = useState(0);
  const [quoteAsset, setQuoteAsset] = useState("USDT");
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [usdtAmount, setUsdtAmount] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPoolTrade = !!vcPoolId;

  const pair = signal?.pair ?? "";
  const base = (pair.split(/\s*\/\s*/)[0] ?? "").replace(/\s+/g, "");
  const normalizedBase = base.toUpperCase();
  const knownQuotes = ["USDT", "USDC", "BUSD", "TUSD", "USDP", "DAI", "FDUSD", "USD"];
  const currentQuote = knownQuotes.find((q) => normalizedBase.endsWith(q));
  const baseAsset = currentQuote ? normalizedBase.slice(0, normalizedBase.length - currentQuote.length) : normalizedBase;
  const symbol = `${baseAsset}${quoteAsset}`;
  const entryPrice = Number(signal?.entryPrice ?? signal?.entry ?? 0) || 0;
  const side: "BUY" | "SELL" = sideProp ?? (signal?.type?.toUpperCase() === "SELL" ? "SELL" : "BUY");

  /** Round quantity to a step size that aligns with Binance LOT_SIZE for the asset's price range.
   *  BTC ($10k+): 5 decimals (step 0.00001)
   *  ETH/BNB ($100+): 4 decimals (step 0.0001)
   *  Altcoins ($1+): 3 decimals (step 0.001)
   *  Micro-caps (< $1): 0 decimals (whole units) */
  const roundToLotSize = (qty: number, price: number): number => {
    if (price >= 10000) return Math.floor(qty * 1e5) / 1e5;
    if (price >= 100)   return Math.floor(qty * 1e4) / 1e4;
    if (price >= 1)     return Math.floor(qty * 1e3) / 1e3;
    return Math.floor(qty);
  };

  const defaultStopLoss = strategy?.stop_loss_value ?? 5;
  const defaultTakeProfit = strategy?.take_profit_value ?? 10;
  const stopLossPercent = parsePercent(String(signal?.stopLoss ?? signal?.stop_loss_pct ?? defaultStopLoss)) || defaultStopLoss;
  const takeProfitPercent = parsePercent(String(signal?.takeProfit1 ?? signal?.take_profit_pct ?? defaultTakeProfit)) || defaultTakeProfit;

  const BINANCE_FEE_RATE = 0.001; // 0.1% standard taker fee

  const amountNum = parseFloat(usdtAmount) || 0;
  const binanceFee = amountNum * BINANCE_FEE_RATE;
  const netOrderValue = amountNum - binanceFee;
  const quantity = entryPrice > 0 ? netOrderValue / entryPrice : 0;
  const prices = calculatePrices(entryPrice, stopLossPercent, takeProfitPercent, side);
  const maxLossAmount = netOrderValue * (stopLossPercent / 100);
  const potentialGainAmount = netOrderValue * (takeProfitPercent / 100);
  const riskRewardRatio = calculateRiskRewardRatio(maxLossAmount, potentialGainAmount);
  const quantityDisplay = quantity > 0 ? quantity.toFixed(8).replace(/\.?0+$/, "") : "—";
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
      const assets = res.data.assets as Array<{ symbol: string; free: string; locked: string }>;
      const findAsset = (symbol: string) => assets.find((a) => a.symbol === symbol);

      const selectedAsset =
        findAsset("USDT") ||
        findAsset("USD") ||
        findAsset("USDC") ||
        findAsset("BUSD") ||
        findAsset("TUSD") ||
        findAsset("USDP") ||
        findAsset("DAI") ||
        findAsset("FDUSD");

      if (selectedAsset) {
        setQuoteAsset(selectedAsset.symbol);
        setBalance(parseFloat(selectedAsset.free || "0") + parseFloat(selectedAsset.locked || "0"));
      } else {
        setQuoteAsset("USDT");
        setBalance(0);
      }
    }).catch(() => { if (!cancelled) setBalance(0); })
      .finally(() => { if (!cancelled) setLoadingBalance(false); });
    return () => { cancelled = true; };
  }, [connectionId, isPoolTrade]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amountNum || amountNum <= 0) {
      setError(`Enter a valid ${quoteAsset} amount.`);
      return;
    }
    if (amountNum < 6) {
      setError(`Minimum order value is $6 ${quoteAsset}. Please increase the amount.`);
      return;
    }
    if (!isPoolTrade && amountNum > balance) {
      setError(`Insufficient balance — need ${formatCurrency(amountNum)} but only ${formatCurrency(balance)} available.`);
      return;
    }
    if (!entryPrice || entryPrice <= 0) {
      setError("Cannot determine entry price. Please refresh and try again.");
      return;
    }
    if (quantity < 0.00001) {
      setError(`Amount too small — increase the ${quoteAsset} amount and try again.`);
      return;
    }
    try {
      setExecuting(true);

      if (isPoolTrade) {
        // Pool trade: call admin API, no exchange connection needed
        await adminCreateTrade(vcPoolId!, {
          asset_pair: symbol,
          action: side,
          quantity: roundToLotSize(quantity, entryPrice),
          entry_price_usdt: entryPrice,
          notes: `From top-trades signal: ${pair}`,
        });
        onSuccess();
        onClose();
      } else {
        const response = await exchangesService.placeOrder(connectionId, {
          symbol,
          side,
          type: "MARKET",
          quantity: roundToLotSize(quantity, entryPrice),
          source: "top_trade",  // 👈 Signal backend to auto-place OCO
        });
        if (response?.success) {
          // Show a warning if the OCO (stop-loss / take-profit) order failed
          if ((response as any).ocoError) {
            setError(`✅ Order filled — but OCO protection failed: ${(response as any).ocoError}. Set a stop-loss manually.`);
            onSuccess();
          } else {
            onSuccess();
            onClose();
          }
        } else {
          const failMsg = (response as any)?.message || (response as any)?.error || "Order was rejected by the exchange.";
          setError(failMsg);
        }
      }
    } catch (err: any) {
      // Extract the message from the axios response body first, then fall back to err.message
      const data = err?.response?.data;
      const raw: string = data?.message || data?.error || data?.detail || data?.msg || err?.message || "Failed to place order";
      const status: number = err?.response?.status ?? 0;
      // Whether the backend provided a specific, non-generic message
      const hasBackendMessage = !!(data?.message || data?.error || data?.detail || data?.msg);

      let msg = raw;
      if (raw.includes("MIN_NOTIONAL") || raw.includes("min_notional") || raw.includes("notional") || raw.toLowerCase().includes("minimum required")) {
        msg = `Order value is below the minimum. Increase the ${quoteAsset} amount and try again.`;
      } else if (raw.includes("MARKET_LOT_SIZE") || raw.includes("LOT_SIZE") || raw.includes("filter failure")) {
        msg = "Quantity doesn't meet Binance's step size requirements. Try a slightly different amount.";
      } else if (raw.includes("PERCENT_PRICE") || raw.includes("percent_price")) {
        msg = "Order price deviates too far from the current market price. The price may have moved — try refreshing.";
      } else if (raw.includes("PRICE_FILTER") || raw.includes("price_filter")) {
        msg = "Price is outside the allowed range for this pair.";
      } else if (raw.includes("MAX_NUM_ORDERS") || raw.includes("max_num_orders")) {
        msg = "You've reached the maximum open orders limit on your exchange account. Cancel some orders first.";
      } else if (raw.toLowerCase().includes("capital") || raw.toLowerCase().includes("pool")) {
        msg = "Insufficient pool capital. The pool may not have enough available funds for this trade.";
      } else if (raw.includes("INSUFFICIENT") || raw.includes("insufficient") || raw.toLowerCase().includes("balance")) {
        msg = isPoolTrade ? "Insufficient pool capital for this trade." : "Insufficient balance in your exchange account.";
      } else if (status === 401 || status === 403) {
        msg = "Exchange connection expired or unauthorized. Please reconnect your exchange.";
      } else if (status === 429) {
        msg = "Too many requests. Wait a moment and try again.";
      } else if (status >= 500 && !hasBackendMessage) {
        // Only use generic message when backend sent no useful detail
        msg = "Exchange service is temporarily unavailable. Please try again shortly.";
      }
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
        </div>

        {/* Amount (USDT) */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Amount ({quoteAsset}):
          </label>
          <input
            type="number"
            step="any"
            min="0"
            placeholder="0.00"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-4 py-3 text-white placeholder-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
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
              <span className="text-slate-400">Binance fee (0.1%):</span>
              <span className="font-medium text-amber-400">-{formatCurrency(binanceFee)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-700 pb-2">
              <span className="text-slate-300 font-medium">Net order value:</span>
              <span className="font-semibold text-white">{formatCurrency(netOrderValue)}</span>
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
            {amountNum > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1">
                  Platform Fee ({tradeFeePercent}%)
                  <span className="relative group">
                    <svg className="w-3.5 h-3.5 text-slate-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg bg-black/95 px-3 py-2 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">0.1% fee on every executed trade. Billed monthly via Stripe.</span>
                  </span>
                </span>
                <span className="font-medium text-amber-400">${tradeFeeAmount}</span>
              </div>
            )}
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
            className="flex-1 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.3)] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {executing ? "Executing..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
