"use client";

import { useState, useEffect } from "react";
import { alpacaPaperTradingService, type PlaceOrderParams } from "@/lib/api/alpaca-paper-trading.service";

interface StockAutoTradeModalProps {
  signal: any;
  balance: number;
  onClose: () => void;
  onSuccess: (order?: any) => void;
  marketOpen: boolean;
}

type RiskLevel = "conservative" | "moderate" | "aggressive";
type OrderClass = "simple" | "bracket" | "oco" | "oto";

const RISK_LEVELS: Record<RiskLevel, { percent: number; label: string; description: string }> = {
  conservative: { 
    percent: 1, 
    label: "Conservative (1%)", 
    description: "Lower risk with smaller position sizes"
  },
  moderate: { 
    percent: 2.5, 
    label: "Moderate (2.5%)", 
    description: "Balanced risk-reward approach"
  },
  aggressive: { 
    percent: 5, 
    label: "Aggressive (5%)", 
    description: "Higher potential returns with more risk"
  },
};

const TIME_IN_FORCE_OPTIONS = [
  { value: "day", label: "Day", description: "Order valid for current trading day" },
  { value: "gtc", label: "GTC (Good Till Canceled)", description: "Order remains active until filled or canceled" },
  { value: "ioc", label: "IOC (Immediate or Cancel)", description: "Fill immediately or cancel" },
  { value: "fok", label: "FOK (Fill or Kill)", description: "Fill entire order immediately or cancel" },
];

export function StockAutoTradeModal({
  signal,
  balance,
  onClose,
  onSuccess,
  marketOpen,
}: StockAutoTradeModalProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("conservative");
  const [orderClass, setOrderClass] = useState<OrderClass>("bracket");
  const [timeInForce, setTimeInForce] = useState<"day" | "gtc" | "ioc" | "fok">("day");
  const [extendedHours, setExtendedHours] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [orderPreview, setOrderPreview] = useState<any>(null);

  // Extract symbol from signal
  const symbol = signal.symbol || signal.assetId || signal.pair?.replace(/\s*\/.*$/, '').trim() || '';

  // Get signal's SL/TP percentages (fallback to defaults)
  const stopLossPercent = parsePercent(signal.stopLoss) || 5;
  const takeProfitPercent = parsePercent(signal.takeProfit1) || 10;

  // Fetch current price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoadingPrice(true);
        // Try to get price from signal first
        const signalPrice = parseFloat(signal.entryPrice) || parseFloat(signal.entry) || parseFloat(signal.ext) || 0;
        
        // Use real-time price from signal's realtime_data if available
        if (signal.realtime_data?.price) {
          setCurrentPrice(signal.realtime_data.price);
        } else {
          setCurrentPrice(signalPrice || 100); // Default fallback
        }
      } catch (err: any) {
        console.error("Failed to fetch price:", err);
        setCurrentPrice(100);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [signal]);

  // Calculate position and prices
  const riskPercent = RISK_LEVELS[riskLevel].percent;
  const investmentAmount = (balance * riskPercent) / 100;
  const quantity = Math.floor(investmentAmount / currentPrice);
  const totalCost = quantity * currentPrice;

  // Calculate SL/TP prices
  const side = signal.type?.toUpperCase() === "SELL" ? "sell" : "buy";
  const stopLossPrice = side === "buy" 
    ? currentPrice * (1 - stopLossPercent / 100)
    : currentPrice * (1 + stopLossPercent / 100);
  const takeProfitPrice = side === "buy"
    ? currentPrice * (1 + takeProfitPercent / 100)
    : currentPrice * (1 - takeProfitPercent / 100);

  const maxLossAmount = Math.abs(totalCost * stopLossPercent / 100);
  const potentialGainAmount = totalCost * takeProfitPercent / 100;
  const riskRewardRatio = maxLossAmount > 0 ? (potentialGainAmount / maxLossAmount).toFixed(2) : "N/A";

  // Generate order preview when parameters change
  useEffect(() => {
    if (quantity > 0 && currentPrice > 0) {
      const preview: any = {
        symbol,
        side,
        type: "market",
        qty: quantity,
        time_in_force: timeInForce,
        extended_hours: extendedHours,
      };

      if (orderClass === "bracket") {
        preview.order_class = "bracket";
        preview.take_profit = { limit_price: parseFloat(takeProfitPrice.toFixed(2)) };
        preview.stop_loss = { stop_price: parseFloat(stopLossPrice.toFixed(2)) };
      }

      setOrderPreview(preview);
    }
  }, [symbol, side, quantity, currentPrice, orderClass, timeInForce, extendedHours, takeProfitPrice, stopLossPrice]);

  const handleExecute = async () => {
    try {
      setExecuting(true);
      setError(null);

      if (!symbol) {
        throw new Error("Invalid stock symbol");
      }

      if (quantity < 1) {
        throw new Error("Quantity must be at least 1 share");
      }

      if (totalCost > balance) {
        throw new Error(`Insufficient balance. Need $${totalCost.toFixed(2)} but only have $${balance.toFixed(2)}`);
      }

      // Build order parameters matching Alpaca API
      const orderParams: PlaceOrderParams = {
        symbol: symbol.toUpperCase(),
        qty: quantity,
        side: side as "buy" | "sell",
        type: "market",
        time_in_force: timeInForce,
        extended_hours: extendedHours,
      };

      // Add bracket order legs if selected
      if (orderClass === "bracket") {
        orderParams.order_class = "bracket";
        orderParams.take_profit = { 
          limit_price: parseFloat(takeProfitPrice.toFixed(2)) 
        };
        orderParams.stop_loss = { 
          stop_price: parseFloat(stopLossPrice.toFixed(2)) 
        };
      }

      console.log("📊 Placing Alpaca paper trade:", orderParams);

      // Place the order via Alpaca API
      const result = await alpacaPaperTradingService.placeOrder(orderParams);

      console.log("✅ Order placed successfully:", result);

      // Success callback with order details
      onSuccess({
        order: result,
        signal,
        investmentAmount: totalCost,
        quantity,
        type: side.toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      console.error("❌ Failed to execute trade:", err);
      
      let errorMessage = err.message || "Failed to execute trade";
      
      // Handle common Alpaca errors
      if (errorMessage.includes("insufficient")) {
        errorMessage = "Insufficient buying power to complete this trade.";
      } else if (errorMessage.includes("market is closed")) {
        errorMessage = "Market is currently closed. Try again during market hours or enable extended hours trading.";
      } else if (errorMessage.includes("invalid symbol")) {
        errorMessage = `Symbol "${symbol}" is not tradeable on Alpaca.`;
      }
      
      setError(errorMessage);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📈</span> Stock Paper Trade
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Execute via Alpaca Paper Trading API
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Market Status Banner */}
        <div className={`mb-4 rounded-lg p-3 flex items-center gap-2 ${
          marketOpen 
            ? "bg-green-500/10 border border-green-500/30" 
            : "bg-yellow-500/10 border border-yellow-500/30"
        }`}>
          <div className={`h-2 w-2 rounded-full ${marketOpen ? "bg-green-500" : "bg-yellow-500"} ${!marketOpen && "animate-pulse"}`} />
          <span className={`text-sm ${marketOpen ? "text-green-300" : "text-yellow-300"}`}>
            {marketOpen 
              ? "Market is OPEN - Orders will execute immediately" 
              : "Market is CLOSED - Orders will queue for next market open"
            }
          </span>
        </div>

        {/* Signal Summary */}
        <div className="mb-6 rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">{symbol}</span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  side === "buy"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {side.toUpperCase()}
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              signal.confidence === "HIGH" 
                ? "bg-emerald-500/20 text-emerald-400" 
                : signal.confidence === "MEDIUM"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-slate-500/20 text-slate-400"
            }`}>
              {signal.confidence || "MEDIUM"} Confidence
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Current Price</span>
              <p className="font-semibold text-white">
                {loadingPrice ? "Loading..." : `$${currentPrice.toFixed(2)}`}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Stop Loss ({stopLossPercent}%)</span>
              <p className="font-semibold text-red-400">${stopLossPrice.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-slate-400">Take Profit ({takeProfitPercent}%)</span>
              <p className="font-semibold text-emerald-400">${takeProfitPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Risk Level Selection */}
        <div className="mb-5">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Position Size (% of buying power):
          </label>
          <div className="space-y-2">
            {(Object.keys(RISK_LEVELS) as RiskLevel[]).map((level) => (
              <label
                key={level}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                  riskLevel === level
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="riskLevel"
                  value={level}
                  checked={riskLevel === level}
                  onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                  className="h-4 w-4 text-blue-500 accent-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-200">{RISK_LEVELS[level].label}</span>
                  <p className="text-xs text-slate-500">{RISK_LEVELS[level].description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Order Settings */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          {/* Order Class */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Order Type:
            </label>
            <select
              value={orderClass}
              onChange={(e) => setOrderClass(e.target.value as OrderClass)}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="simple">Simple (Market Only)</option>
              <option value="bracket">Bracket (With SL + TP)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {orderClass === "bracket" 
                ? "Automatically sets stop-loss and take-profit" 
                : "Single market order without protection"
              }
            </p>
          </div>

          {/* Time In Force */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Time In Force:
            </label>
            <select
              value={timeInForce}
              onChange={(e) => setTimeInForce(e.target.value as "day" | "gtc" | "ioc" | "fok")}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            >
              {TIME_IN_FORCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Extended Hours Toggle */}
        <div className="mb-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={extendedHours}
                onChange={(e) => setExtendedHours(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:bg-blue-500 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-200">Extended Hours Trading</span>
              <p className="text-xs text-slate-500">Trade during pre-market (4am-9:30am) and after-hours (4pm-8pm ET)</p>
            </div>
          </label>
        </div>

        {/* Order Preview */}
        <div className="mb-5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order Preview
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Investment Amount:</span>
              <span className="font-semibold text-white">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Shares:</span>
              <span className="font-semibold text-white">{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Loss:</span>
              <span className="font-semibold text-red-400">-${maxLossAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Potential Gain:</span>
              <span className="font-semibold text-emerald-400">+${potentialGainAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2">
              <span className="text-slate-400">Risk/Reward:</span>
              <span className="font-semibold text-cyan-400">1:{riskRewardRatio}</span>
            </div>
          </div>

          {/* Order Details JSON Preview */}
          {orderPreview && (
            <div className="mt-4 rounded-lg bg-slate-900/80 p-3">
              <p className="text-xs text-slate-500 mb-2">API Request Preview:</p>
              <pre className="text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(orderPreview, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
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
            disabled={executing || loadingPrice || quantity < 1}
            className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:hover:shadow-lg"
          >
            {executing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Executing...
              </span>
            ) : loadingPrice ? (
              "Loading..."
            ) : quantity < 1 ? (
              "Insufficient Funds"
            ) : (
              `Execute ${side.toUpperCase()} Order`
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-xs text-slate-500">
          ⚠️ Paper trading simulation. No real funds at risk. Orders execute on Alpaca's paper trading environment.
        </p>
      </div>
    </div>
  );
}

// Helper function to parse percent values
function parsePercent(val: any): number {
  if (!val) return 0;
  const str = String(val).replace(/[%+\-]/g, '').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : Math.abs(n);
}

