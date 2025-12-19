"use client";

import { useState, useEffect } from "react";
import { binanceTestnetService } from "@/lib/api/binance-testnet.service";
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

interface ManualTradeModalProps {
  signal: any;
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}

type OrderType = "MARKET" | "LIMIT";
type PositionMode = "usd" | "percent";

export function ManualTradeModal({
  signal,
  balance,
  onClose,
  onSuccess,
}: ManualTradeModalProps) {
  const [step, setStep] = useState(1);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Step 1: Position Size
  const [positionMode, setPositionMode] = useState<PositionMode>("percent");
  const [usdAmount, setUsdAmount] = useState<string>("50");
  const [percentAmount, setPercentAmount] = useState<string>("1");

  // Step 2: Order Type
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [limitPrice, setLimitPrice] = useState<string>("");

  // Step 3: Risk Management
  const [useSignalSL, setUseSignalSL] = useState(true);
  const [customSL, setCustomSL] = useState<string>("");
  const [useSignalTP, setUseSignalTP] = useState(true);
  const [customTP, setCustomTP] = useState<string>("");

  // Extract clean symbol from signal (priority: symbol > assetId > pair)
  const symbol = mapToTestnetSymbol(signal.symbol || signal.assetId || signal.pair || '');

  // Fetch current price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoadingPrice(true);
        const entryPrice = getEntryPrice(signal);

        try {
          const ticker = await binanceTestnetService.getTickerPrice(symbol);
          setCurrentPrice(ticker.price);
          setLimitPrice(ticker.price.toString());
        } catch {
          setCurrentPrice(entryPrice);
          setLimitPrice(entryPrice.toString());
        }
      } catch (err: any) {
        console.error("Failed to fetch price:", err);
        setCurrentPrice(getEntryPrice(signal));
        setLimitPrice(getEntryPrice(signal).toString());
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [signal, symbol]);

  // Calculate investment amount
  const investmentAmount =
    positionMode === "usd"
      ? parseFloat(usdAmount) || 0
      : (balance * (parseFloat(percentAmount) || 0)) / 100;

  // Calculate quantities
  const entryPrice = orderType === "LIMIT" ? parseFloat(limitPrice) || currentPrice : currentPrice;
  const quantity = investmentAmount / entryPrice;

  // Get SL and TP values
  const stopLossPercent = useSignalSL
    ? parsePercent(signal.stopLoss) || 5
    : parseFloat(customSL) || 5;
  const takeProfitPercent = useSignalTP
    ? parsePercent(signal.takeProfit1) || 10
    : parseFloat(customTP) || 10;

  const prices = calculatePrices(entryPrice, stopLossPercent, takeProfitPercent, signal.type);
  const maxLossAmount = (investmentAmount * stopLossPercent) / 100;
  const potentialGainAmount = (investmentAmount * takeProfitPercent) / 100;
  const riskRewardRatio = calculateRiskRewardRatio(maxLossAmount, potentialGainAmount);

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (investmentAmount <= 0) {
        setError("Please enter a valid investment amount");
        return;
      }
      if (investmentAmount > balance) {
        setError("Investment amount exceeds available balance");
        return;
      }
    }

    if (step === 2) {
      if (orderType === "LIMIT") {
        const price = parseFloat(limitPrice);
        if (!price || price <= 0) {
          setError("Please enter a valid limit price");
          return;
        }
      }
    }

    if (step === 3) {
      if (!useSignalSL) {
        const sl = parseFloat(customSL);
        if (!sl || sl <= 0 || sl > 100) {
          setError("Please enter a valid stop loss percentage (0-100)");
          return;
        }
      }
      if (!useSignalTP) {
        const tp = parseFloat(customTP);
        if (!tp || tp <= 0 || tp > 100) {
          setError("Please enter a valid take profit percentage (0-100)");
          return;
        }
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleExecute = async () => {
    try {
      setExecuting(true);
      setError(null);

      if (!symbol || symbol === 'USDT') {
        throw new Error("Invalid trading symbol");
      }

      if (investmentAmount > balance) {
        throw new Error(`Insufficient balance. Need ${investmentAmount.toFixed(2)} but only have ${balance.toFixed(2)}`);
      }

      // Validate minimum quantity
      if (quantity < 0.00001) {
        throw new Error(`Quantity too small. Minimum is 0.00001, got ${quantity}`);
      }

      console.log('Placing order with:', {
        symbol,
        side: signal.type,
        type: orderType,
        quantity: orderType === 'MARKET' && signal.type === 'BUY' 
          ? investmentAmount // For MARKET BUY, send USDT amount
          : parseFloat(quantity.toFixed(8)), // Otherwise send asset quantity
        price: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        balance,
        investmentAmount,
      });

      // Place order
      // For MARKET BUY orders, send the USDT amount (quoteOrderQty)
      // For MARKET SELL and all LIMIT orders, send the asset quantity
      const result = await binanceTestnetService.placeOrder({
        symbol,
        side: signal.type,
        type: orderType,
        quantity: orderType === 'MARKET' && signal.type === 'BUY'
          ? investmentAmount
          : parseFloat(quantity.toFixed(8)),
        price: orderType === "LIMIT" ? parseFloat(limitPrice) : undefined,
      });

      console.log('Order placed successfully:', result);

      // Success!
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to execute manual trade:", err);
      
      // Extract more specific error message
      let errorMessage = err.message || "Failed to execute trade";
      
      // Check for common Binance errors
      if (errorMessage.includes('MIN_NOTIONAL')) {
        errorMessage = "Order value too small. Try increasing your investment amount.";
      } else if (errorMessage.includes('LOT_SIZE')) {
        errorMessage = "Invalid quantity size for this trading pair.";
      } else if (errorMessage.includes('INSUFFICIENT')) {
        errorMessage = "Insufficient balance to complete this trade.";
      }
      
      setError(errorMessage);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded-2xl bg-gradient-to-br from-white/[0.07] to-transparent p-6 shadow-2xl shadow-black/50 backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            ✋ Manual Trade Setup ({step}/4)
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[--color-surface] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                s <= step ? "bg-[#fc4f02]" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                How much do you want to invest?
              </h3>

              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
                    positionMode === "usd"
                      ? "border-[#fc4f02] bg-[#fc4f02]/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="positionMode"
                    checked={positionMode === "usd"}
                    onChange={() => setPositionMode("usd")}
                    className="mt-1 h-4 w-4 text-[#fc4f02]"
                  />
                  <div className="flex-1">
                    <div className="mb-2 text-sm text-slate-200">Amount in USD</div>
                    {positionMode === "usd" && (
                      <input
                        type="number"
                        value={usdAmount}
                        onChange={(e) => setUsdAmount(e.target.value)}
                        placeholder="100"
                        min="0"
                        step="0.01"
                        className="w-full rounded-md bg-slate-900 px-3 py-2 text-white"
                      />
                    )}
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
                    positionMode === "percent"
                      ? "border-[#fc4f02] bg-[#fc4f02]/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="positionMode"
                    checked={positionMode === "percent"}
                    onChange={() => setPositionMode("percent")}
                    className="mt-1 h-4 w-4 text-[#fc4f02]"
                  />
                  <div className="flex-1">
                    <div className="mb-2 text-sm text-slate-200">Percentage of balance</div>
                    {positionMode === "percent" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={percentAmount}
                          onChange={(e) => setPercentAmount(e.target.value)}
                          placeholder="5"
                          min="0"
                          max="100"
                          step="0.1"
                          className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-white"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Balance:</span>
                  <span className="font-medium text-white">{formatCurrency(balance)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-slate-400">Investment:</span>
                  <span className="font-medium text-cyan-400">
                    {formatCurrency(investmentAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                When should the trade execute?
              </h3>

              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-all ${
                    orderType === "MARKET"
                      ? "border-[#fc4f02] bg-[#fc4f02]/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === "MARKET"}
                      onChange={() => setOrderType("MARKET")}
                      className="h-4 w-4 text-[#fc4f02]"
                    />
                    <div className="text-sm font-medium text-slate-200">MARKET ORDER</div>
                  </div>
                  <p className="ml-7 text-xs text-slate-400">
                    Execute immediately at current market price ({formatCurrency(currentPrice)})
                  </p>
                </label>

                <label
                  className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-all ${
                    orderType === "LIMIT"
                      ? "border-[#fc4f02] bg-[#fc4f02]/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === "LIMIT"}
                      onChange={() => setOrderType("LIMIT")}
                      className="h-4 w-4 text-[#fc4f02]"
                    />
                    <div className="text-sm font-medium text-slate-200">LIMIT ORDER</div>
                  </div>
                  {orderType === "LIMIT" && (
                    <div className="ml-7">
                      <label className="mb-2 block text-xs text-slate-400">Entry Price:</label>
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={currentPrice.toString()}
                        min="0"
                        step="0.01"
                        className="w-full rounded-md bg-slate-900 px-3 py-2 text-white"
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        Execute only at your price or better
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Set your risk parameters</h3>

              {/* Stop Loss */}
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Stop Loss:
                </label>
                <div className="space-y-3">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                      useSignalSL
                        ? "border-[#fc4f02] bg-[#fc4f02]/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={useSignalSL}
                      onChange={() => setUseSignalSL(true)}
                      className="h-4 w-4 text-[#fc4f02]"
                    />
                    <span className="text-sm text-slate-200">
                      Use Signal's SL ({formatPercent(parsePercent(signal.stopLoss) || 5)})
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all ${
                      !useSignalSL
                        ? "border-[#fc4f02] bg-[#fc4f02]/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={!useSignalSL}
                        onChange={() => setUseSignalSL(false)}
                        className="h-4 w-4 text-[#fc4f02]"
                      />
                      <span className="text-sm text-slate-200">Custom</span>
                    </div>
                    {!useSignalSL && (
                      <div className="ml-7 flex items-center gap-2">
                        <input
                          type="number"
                          value={customSL}
                          onChange={(e) => setCustomSL(e.target.value)}
                          placeholder="5"
                          min="0"
                          max="100"
                          step="0.1"
                          className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-white"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Take Profit */}
              <div>
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Take Profit:
                </label>
                <div className="space-y-3">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                      useSignalTP
                        ? "border-[#fc4f02] bg-[#fc4f02]/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      checked={useSignalTP}
                      onChange={() => setUseSignalTP(true)}
                      className="h-4 w-4 text-[#fc4f02]"
                    />
                    <span className="text-sm text-slate-200">
                      Use Signal's TP (
                      {formatPercent(parsePercent(signal.takeProfit1) || 10)})
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all ${
                      !useSignalTP
                        ? "border-[#fc4f02] bg-[#fc4f02]/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={!useSignalTP}
                        onChange={() => setUseSignalTP(false)}
                        className="h-4 w-4 text-[#fc4f02]"
                      />
                      <span className="text-sm text-slate-200">Custom</span>
                    </div>
                    {!useSignalTP && (
                      <div className="ml-7 flex items-center gap-2">
                        <input
                          type="number"
                          value={customTP}
                          onChange={(e) => setCustomTP(e.target.value)}
                          placeholder="10"
                          min="0"
                          max="100"
                          step="0.1"
                          className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-white"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Review & Confirm</h3>

              <div className="rounded-lg bg-slate-800/50 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Signal:</span>
                  <span className="font-medium text-white">
                    {signal.pair} {signal.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Type:</span>
                  <span className="font-medium text-white">{orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Investment:</span>
                  <span className="font-medium text-white">
                    {formatCurrency(investmentAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="font-medium text-white">{quantity.toFixed(8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry Price:</span>
                  <span className="font-medium text-white">
                    {formatCurrency(entryPrice)}
                    {orderType === "MARKET" && " (current)"}
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
                    {formatPercent(takeProfitPercent)} (
                    {formatCurrency(prices.takeProfitPrice)})
                  </span>
                </div>

                <div className="border-t border-slate-700 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk:</span>
                    <span className="font-medium text-red-400">
                      {formatCurrency(maxLossAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reward:</span>
                    <span className="font-medium text-green-400">
                      {formatCurrency(potentialGainAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk/Reward:</span>
                    <span className="font-medium text-cyan-400">{riskRewardRatio}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            onClick={step === 1 ? onClose : handleBack}
            disabled={executing}
            className="flex-1 rounded-lg bg-slate-700/50 px-4 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 disabled:opacity-50"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={loadingPrice}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#fc4f02] to-[#fda300] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#fc4f02]/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {executing ? "Executing..." : "Execute Trade"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
