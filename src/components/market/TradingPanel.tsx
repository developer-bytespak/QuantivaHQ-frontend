"use client";

import { useState, useEffect } from "react";
import { exchangesService } from "@/lib/api/exchanges.service";

interface TradingPanelProps {
  connectionId: string;
  symbol: string;
  baseSymbol: string;
  currentPrice: number;
  availableBalance: number;
  quoteCurrency: string;
}

export default function TradingPanel({
  connectionId,
  symbol,
  baseSymbol,
  currentPrice,
  availableBalance,
  quoteCurrency,
}: TradingPanelProps) {
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>(currentPrice.toFixed(2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canTrade, setCanTrade] = useState<boolean | null>(null);

  useEffect(() => {
    // Check trading permissions
    const checkPermissions = async () => {
      try {
        const response = await exchangesService.checkTradingPermissions(connectionId);
        if (response.success && response.data) {
          setCanTrade(response.data.canTrade);
        }
      } catch (err) {
        console.error("Failed to check trading permissions:", err);
        setCanTrade(false);
      }
    };

    checkPermissions();
  }, [connectionId]);

  useEffect(() => {
    setPrice(currentPrice.toFixed(2));
  }, [currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canTrade) {
      setError("Trading is not enabled for your account");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (!quantityNum || quantityNum <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (orderType === "LIMIT") {
      const priceNum = parseFloat(price);
      if (!priceNum || priceNum <= 0) {
        setError("Please enter a valid price for LIMIT orders");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const orderData = {
        symbol,
        side,
        type: orderType,
        quantity: quantityNum,
        price: orderType === "LIMIT" ? parseFloat(price) : undefined,
      };

      const response = await exchangesService.placeOrder(connectionId, orderData);

      if (response.success) {
        setSuccess(`Order placed successfully! Order ID: ${response.data.orderId}`);
        setQuantity("");
        // Refresh balance after order
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError("Failed to place order");
      }
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = orderType === "MARKET" ? currentPrice : parseFloat(price) || 0;
    return (qty * prc).toFixed(2);
  };

  const setPercentage = (percent: number) => {
    const maxAmount = availableBalance;
    const amount = (maxAmount * percent) / 100;
    const qty = orderType === "MARKET" ? amount / currentPrice : amount / (parseFloat(price) || currentPrice);
    setQuantity(qty.toFixed(8));
  };

  if (canTrade === null) {
    return (
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-6">
        <div className="flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-700/30 border-t-[#fc4f02]"></div>
        </div>
      </div>
    );
  }

  if (canTrade === false) {
    return (
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-6">
        <div className="rounded-lg border-l-4 border-yellow-500/50 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-200">
            Trading is not enabled for your account. Please enable trading in your exchange connection settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface]/60 p-6">
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setSide("BUY")}
          className={`flex-1 rounded-lg px-4 py-3 font-medium transition-colors ${
            side === "BUY"
              ? "bg-green-600 text-white"
              : "border border-[--color-border] bg-[--color-surface] text-slate-300"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("SELL")}
          className={`flex-1 rounded-lg px-4 py-3 font-medium transition-colors ${
            side === "SELL"
              ? "bg-red-600 text-white"
              : "border border-[--color-border] bg-[--color-surface] text-slate-300"
          }`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Order Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOrderType("MARKET")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                orderType === "MARKET"
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white"
                  : "border border-[--color-border] bg-[--color-surface] text-slate-300"
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => setOrderType("LIMIT")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                orderType === "LIMIT"
                  ? "bg-gradient-to-r from-[#fc4f02] to-[#fda300] text-white"
                  : "border border-[--color-border] bg-[--color-surface] text-slate-300"
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Price (for LIMIT orders) */}
        {orderType === "LIMIT" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Price ({quoteCurrency})</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Quantity ({baseSymbol})
          </label>
          <input
            type="number"
            step="0.00000001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-[--color-border] bg-[--color-surface] px-4 py-2 text-white placeholder-slate-500 focus:border-[#fc4f02] focus:outline-none"
            placeholder="0.00"
            required
          />
          <div className="mt-2 flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                type="button"
                onClick={() => setPercentage(percent)}
                className="rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-1 text-xs text-slate-300 transition-colors hover:border-[#fc4f02]/50"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="rounded-lg border border-[--color-border] bg-[--color-surface] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total</span>
            <span className="text-lg font-semibold text-white">
              {calculateTotal()} {quoteCurrency}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Available</span>
            <span className="text-sm text-slate-300">
              {availableBalance.toFixed(2)} {quoteCurrency}
            </span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-lg border-l-4 border-red-500/50 bg-red-500/10 p-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border-l-4 border-green-500/50 bg-green-500/10 p-3">
            <p className="text-sm text-green-200">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full rounded-lg px-4 py-3 font-medium text-white transition-colors ${
            side === "BUY"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? "Placing Order..." : `${side} ${baseSymbol}`}
        </button>
      </form>
    </div>
  );
}

