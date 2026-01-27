"use client";

import { useState, useEffect } from "react";
import { alpacaPaperTradingService, PlaceOrderParams, AlpacaBalance } from "@/lib/api/alpaca-paper-trading.service";

interface StockTradingPanelProps {
  symbol: string;
  currentPrice: number;
  stockName?: string;
}

export default function StockTradingPanel({
  symbol,
  currentPrice,
  stockName,
}: StockTradingPanelProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState<string>("");
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toFixed(2));
  const [timeInForce, setTimeInForce] = useState<"day" | "gtc">("day");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [balance, setBalance] = useState<AlpacaBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null);

  // Fetch account balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoadingBalance(true);
        const dashboard = await alpacaPaperTradingService.getDashboard();
        setBalance(dashboard.balance);
        setMarketOpen(dashboard.clock?.isOpen ?? null);
      } catch (err: any) {
        console.error("Failed to fetch balance:", err);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, []);

  useEffect(() => {
    setLimitPrice(currentPrice.toFixed(2));
  }, [currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const quantityNum = parseInt(quantity, 10);
    if (!quantityNum || quantityNum < 1) {
      setError("Please enter a valid quantity (minimum 1 share)");
      return;
    }

    if (orderType === "limit") {
      const priceNum = parseFloat(limitPrice);
      if (!priceNum || priceNum <= 0) {
        setError("Please enter a valid limit price");
        return;
      }
    }

    // Check if user has enough buying power
    const estimatedCost = quantityNum * (orderType === "limit" ? parseFloat(limitPrice) : currentPrice);
    if (side === "buy" && balance && estimatedCost > balance.buyingPower) {
      setError(`Insufficient buying power. Need $${estimatedCost.toFixed(2)} but only have $${balance.buyingPower.toFixed(2)}`);
      return;
    }

    try {
      setIsSubmitting(true);

      const orderParams: PlaceOrderParams = {
        symbol: symbol.toUpperCase(),
        qty: quantityNum,
        side,
        type: orderType,
        time_in_force: timeInForce,
      };

      if (orderType === "limit") {
        orderParams.limit_price = parseFloat(limitPrice);
      }

      console.log(" Placing stock order:", orderParams);
      const result = await alpacaPaperTradingService.placeOrder(orderParams);
      console.log(" Order placed:", result);

      setSuccess(`Order placed successfully! ${side.toUpperCase()} ${quantityNum} shares of ${symbol}`);
      setQuantity("");

      // Refresh balance after order
      const dashboard = await alpacaPaperTradingService.getDashboard();
      setBalance(dashboard.balance);
    } catch (err: any) {
      console.error("Failed to place order:", err);
      setError(err.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const qty = parseInt(quantity, 10) || 0;
    const price = orderType === "market" ? currentPrice : parseFloat(limitPrice) || 0;
    return (qty * price).toFixed(2);
  };

  const setPercentage = (percent: number) => {
    if (!balance) return;
    const maxAmount = balance.buyingPower;
    const price = orderType === "market" ? currentPrice : parseFloat(limitPrice) || currentPrice;
    const amount = (maxAmount * percent) / 100;
    const qty = Math.floor(amount / price);
    setQuantity(qty > 0 ? qty.toString() : "1");
  };

  if (isLoadingBalance) {
    return (
      <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(252,79,2,0.08),0_0_30px_rgba(253,163,0,0.06)] bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
        <div className="rounded-lg border-l-4 border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-200">
            Unable to connect to Alpaca paper trading. Please check your API configuration in Settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${
      side === "buy" 
        ? "shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(34,197,94,0.15),0_0_30px_rgba(34,197,94,0.08)]"
        : "shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_0_20px_rgba(239,68,68,0.15),0_0_30px_rgba(239,68,68,0.08)]"
    }`}>
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        side === "buy" 
          ? "bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-100"
          : "bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-100"
      }`}></div>

      <div className="relative bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Paper Trade {symbol}</h3>
            <div className="flex items-center gap-2">
              {marketOpen !== null && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  marketOpen 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                }`}>
                  {marketOpen ? "Market Open" : "Market Closed"}
                </span>
              )}
              <div className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                side === "buy"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {side === "buy" ? "↗ Buy" : "↘ Sell"}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {stockName || symbol} • Paper Trading via Alpaca
          </p>
        </div>

        {/* Buy/Sell Toggle */}
        <div className="mb-6 relative">
          <div className="flex gap-2 p-1 bg-gradient-to-br from-white/[0.08] to-transparent rounded-xl backdrop-blur-sm">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 relative rounded-lg px-4 py-3.5 font-semibold text-sm transition-all duration-300 overflow-hidden group ${
                side === "buy"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/40 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {side === "buy" && (
                <span className="relative flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Buy
                </span>
              )}
              {side !== "buy" && <span>Buy</span>}
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 relative rounded-lg px-4 py-3.5 font-semibold text-sm transition-all duration-300 overflow-hidden group ${
                side === "sell"
                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/40 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {side === "sell" && (
                <span className="relative flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  Sell
                </span>
              )}
              {side !== "sell" && <span>Sell</span>}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Order Type */}
          <div>
            <label className="mb-2.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Order Type
            </label>
            <div className="flex gap-2 p-1 bg-gradient-to-br from-white/[0.08] to-transparent rounded-lg backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setOrderType("market")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  orderType === "market"
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-md shadow-[#fc4f02]/40 scale-105"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType("limit")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  orderType === "limit"
                    ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white shadow-md shadow-[#fc4f02]/40 scale-105"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Limit Price */}
          {orderType === "limit" && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Limit Price
                </label>
                <span className="text-xs text-slate-500">USD</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full rounded-lg bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 transition-all"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setLimitPrice(currentPrice.toFixed(2))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#fc4f02] hover:text-[#fda300] font-medium"
                >
                  Market
                </button>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quantity (Shares)
              </label>
              <span className="text-xs text-slate-500">{symbol}</span>
            </div>
            <input
              type="number"
              step="1"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg bg-gradient-to-br from-white/[0.07] to-transparent backdrop-blur px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4f02]/50 transition-all"
              placeholder="0"
              required
            />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setPercentage(percent)}
                  className={`rounded-lg backdrop-blur px-3 py-2 text-xs font-medium transition-all duration-300 ${
                    side === "buy"
                      ? "bg-gradient-to-br from-green-500/10 to-transparent text-slate-300 hover:text-white hover:from-green-500/20"
                      : "bg-gradient-to-br from-red-500/10 to-transparent text-slate-300 hover:text-white hover:from-red-500/20"
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Time in Force */}
          <div>
            <label className="mb-2.5 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Time in Force
            </label>
            <div className="flex gap-2 p-1 bg-gradient-to-br from-white/[0.08] to-transparent rounded-lg backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setTimeInForce("day")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  timeInForce === "day"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setTimeInForce("gtc")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  timeInForce === "gtc"
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                GTC
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className={`rounded-xl backdrop-blur p-4 space-y-3 transition-all duration-300 ${
            side === "buy"
              ? "bg-gradient-to-br from-green-500/10 via-white/[0.05] to-transparent border border-green-500/20"
              : "bg-gradient-to-br from-red-500/10 via-white/[0.05] to-transparent border border-red-500/20"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Estimated Total</span>
              <span className={`text-lg font-bold transition-colors duration-300 ${
                side === "buy" ? "text-green-400" : "text-red-400"
              }`}>
                ${calculateTotal()} <span className="text-sm font-normal text-slate-400">USD</span>
              </span>
            </div>
            <div className={`h-px bg-gradient-to-r from-transparent ${
              side === "buy" ? "via-green-500/20" : "via-red-500/20"
            } to-transparent`}></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Buying Power</span>
              <span className="text-sm font-semibold text-slate-300">
                ${balance.buyingPower.toFixed(2)} <span className="text-slate-500">USD</span>
              </span>
            </div>
            {orderType === "market" && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-slate-400">Est. Price</span>
                <span className="text-sm font-semibold text-slate-300">
                  ${currentPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-lg bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur border border-red-500/20 p-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur border border-green-500/20 p-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-200">{success}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full relative rounded-lg px-4 py-4 font-bold text-white transition-all duration-300 shadow-lg overflow-hidden group ${
              side === "buy"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:shadow-xl hover:shadow-green-500/50"
                : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 hover:shadow-xl hover:shadow-red-500/50"
            } hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {isSubmitting ? (
              <span className="relative flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Placing Order...
              </span>
            ) : (
              <span className="relative flex items-center justify-center gap-2">
                {side === "buy" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                {side.toUpperCase()} {symbol}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

