"use client";

import { useState, useEffect } from "react";
import { alpacaPaperTradingService, type PlaceOrderParams } from "@/lib/api/alpaca-paper-trading.service";

interface StockManualTradeModalProps {
  signal: any;
  balance: number;
  onClose: () => void;
  onSuccess: (order?: any) => void;
  marketOpen: boolean;
  strategy?: any;
}

type OrderType = "market" | "limit" | "stop" | "stop_limit" | "trailing_stop";
type PositionMode = "shares" | "dollars" | "percent";

const ORDER_TYPES = [
  { value: "market", label: "Market Order", description: "Execute immediately at current market price" },
  { value: "limit", label: "Limit Order", description: "Execute only at your specified price or better" },
  { value: "stop", label: "Stop Order", description: "Trigger a market order when price reaches stop price" },
  { value: "stop_limit", label: "Stop Limit Order", description: "Trigger a limit order when price reaches stop price" },
  { value: "trailing_stop", label: "Trailing Stop", description: "Dynamic stop that follows price movements" },
];

const TIME_IN_FORCE_OPTIONS = [
  { value: "day", label: "Day", description: "Valid for current trading day only" },
  { value: "gtc", label: "GTC", description: "Good till canceled" },
  { value: "ioc", label: "IOC", description: "Immediate or cancel" },
  { value: "fok", label: "FOK", description: "Fill or kill" },
];

export function StockManualTradeModal({
  signal,
  balance,
  onClose,
  onSuccess,
  marketOpen,
  strategy,
}: StockManualTradeModalProps) {
  const [step, setStep] = useState(1);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Step 1: Position Size
  const [positionMode, setPositionMode] = useState<PositionMode>("dollars");
  const [shareCount, setShareCount] = useState<string>("10");
  const [dollarAmount, setDollarAmount] = useState<string>("500");
  const [percentAmount, setPercentAmount] = useState<string>("2");

  // Step 2: Order Type
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [stopPrice, setStopPrice] = useState<string>("");
  const [trailPercent, setTrailPercent] = useState<string>("2");
  const [trailPrice, setTrailPrice] = useState<string>("");
  const [timeInForce, setTimeInForce] = useState<"day" | "gtc" | "ioc" | "fok">("day");
  const [extendedHours, setExtendedHours] = useState(false);

  // Step 3: Risk Management
  const [enableBracket, setEnableBracket] = useState(true);
  const [useSignalSL, setUseSignalSL] = useState(true);
  const [customSL, setCustomSL] = useState<string>("");
  const [useSignalTP, setUseSignalTP] = useState(true);
  const [customTP, setCustomTP] = useState<string>("");

  // Extract symbol from signal
  const symbol = signal.symbol || signal.assetId || signal.pair?.replace(/\s*\/.*$/, '').trim() || '';
  const side = signal.type?.toUpperCase() === "SELL" ? "sell" : "buy";

  // Fetch current price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoadingPrice(true);
        const signalPrice = parseFloat(signal.entryPrice) || parseFloat(signal.entry) || parseFloat(signal.ext) || 0;
        
        if (signal.realtime_data?.price) {
          setCurrentPrice(signal.realtime_data.price);
          setLimitPrice(signal.realtime_data.price.toFixed(2));
          setStopPrice((signal.realtime_data.price * (side === "buy" ? 0.98 : 1.02)).toFixed(2));
        } else {
          setCurrentPrice(signalPrice || 100);
          setLimitPrice((signalPrice || 100).toFixed(2));
          setStopPrice(((signalPrice || 100) * (side === "buy" ? 0.98 : 1.02)).toFixed(2));
        }
      } catch (err: any) {
        console.error("Failed to fetch price:", err);
        setCurrentPrice(100);
        setLimitPrice("100.00");
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [signal, side]);

  // Calculate quantity based on position mode
  const calculateQuantity = (): number => {
    if (positionMode === "shares") {
      return parseInt(shareCount) || 0;
    } else if (positionMode === "dollars") {
      const dollars = parseFloat(dollarAmount) || 0;
      const price = orderType === "limit" ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
      return Math.floor(dollars / price);
    } else {
      const percent = parseFloat(percentAmount) || 0;
      const price = orderType === "limit" ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
      return Math.floor((balance * percent / 100) / price);
    }
  };

  const quantity = calculateQuantity();
  const entryPrice = orderType === "limit" ? parseFloat(limitPrice) || currentPrice : currentPrice;
  const totalCost = quantity * entryPrice;

  // Get SL and TP values - use strategy defaults as fallback
  const defaultStopLoss = strategy?.stop_loss_value ?? 5;
  const defaultTakeProfit = strategy?.take_profit_value ?? 10;
  const stopLossPercent = useSignalSL
    ? parsePercent(signal.stopLoss) || defaultStopLoss
    : parseFloat(customSL) || defaultStopLoss;
  const takeProfitPercent = useSignalTP
    ? parsePercent(signal.takeProfit1) || defaultTakeProfit
    : parseFloat(customTP) || defaultTakeProfit;

  const stopLossPrice = side === "buy"
    ? entryPrice * (1 - stopLossPercent / 100)
    : entryPrice * (1 + stopLossPercent / 100);
  const takeProfitPrice = side === "buy"
    ? entryPrice * (1 + takeProfitPercent / 100)
    : entryPrice * (1 - takeProfitPercent / 100);

  const maxLossAmount = totalCost * stopLossPercent / 100;
  const potentialGainAmount = totalCost * takeProfitPercent / 100;
  const riskRewardRatio = maxLossAmount > 0 ? (potentialGainAmount / maxLossAmount).toFixed(2) : "N/A";

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (quantity <= 0) {
        setError("Please enter a valid position size");
        return;
      }
      if (totalCost > balance) {
        setError("Position size exceeds available buying power");
        return;
      }
    }

    if (step === 2) {
      if (orderType === "limit" && (!parseFloat(limitPrice) || parseFloat(limitPrice) <= 0)) {
        setError("Please enter a valid limit price");
        return;
      }
      if ((orderType === "stop" || orderType === "stop_limit") && (!parseFloat(stopPrice) || parseFloat(stopPrice) <= 0)) {
        setError("Please enter a valid stop price");
        return;
      }
      if (orderType === "trailing_stop" && !parseFloat(trailPercent) && !parseFloat(trailPrice)) {
        setError("Please enter either trail percent or trail price");
        return;
      }
    }

    if (step === 3) {
      if (enableBracket) {
        if (!useSignalSL && (!parseFloat(customSL) || parseFloat(customSL) <= 0 || parseFloat(customSL) > 100)) {
          setError("Please enter a valid stop loss percentage (0-100)");
          return;
        }
        if (!useSignalTP && (!parseFloat(customTP) || parseFloat(customTP) <= 0 || parseFloat(customTP) > 100)) {
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

      if (!symbol) {
        throw new Error("Invalid stock symbol");
      }

      if (quantity < 1) {
        throw new Error("Quantity must be at least 1 share");
      }

      if (totalCost > balance) {
        throw new Error(`Insufficient buying power. Need $${totalCost.toFixed(2)} but only have $${balance.toFixed(2)}`);
      }

      // Build order parameters
      const orderParams: PlaceOrderParams = {
        symbol: symbol.toUpperCase(),
        qty: quantity,
        side: side as "buy" | "sell",
        type: orderType,
        // For bracket orders, use GTC so child orders don't expire at end of day
        time_in_force: (enableBracket && orderType === "market") ? "gtc" : timeInForce,
        extended_hours: extendedHours,
      };

      // Add price parameters based on order type
      if (orderType === "limit" || orderType === "stop_limit") {
        orderParams.limit_price = parseFloat(limitPrice);
      }
      if (orderType === "stop" || orderType === "stop_limit") {
        orderParams.stop_price = parseFloat(stopPrice);
      }
      if (orderType === "trailing_stop") {
        if (parseFloat(trailPercent)) {
          orderParams.trail_percent = parseFloat(trailPercent);
        } else if (parseFloat(trailPrice)) {
          orderParams.trail_price = parseFloat(trailPrice);
        }
      }

      // Add bracket order if enabled and order type supports it
      if (enableBracket && orderType === "market") {
        orderParams.order_class = "bracket";
        orderParams.take_profit = { 
          limit_price: parseFloat(takeProfitPrice.toFixed(2)) 
        };
        orderParams.stop_loss = { 
          stop_price: parseFloat(stopLossPrice.toFixed(2)) 
        };
      }

      console.log("📊 Placing Alpaca manual trade:", orderParams);

      const result = await alpacaPaperTradingService.placeOrder(orderParams);

      console.log("✅ Order placed successfully:", result);

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
      
      if (errorMessage.includes("insufficient")) {
        errorMessage = "Insufficient buying power to complete this trade.";
      } else if (errorMessage.includes("market is closed")) {
        errorMessage = "Market is currently closed. Try again during market hours or enable extended hours.";
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
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>✋</span> Manual Trade Setup
              <span className="text-sm font-normal text-slate-400">({step}/4)</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {symbol} • {side.toUpperCase()} • Alpaca Paper Trading
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

        {/* Progress Bar */}
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-blue-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-6 min-h-[280px]">
          {/* Step 1: Position Size */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">How many shares do you want to {side}?</h3>

              <div className="space-y-3">
                {/* Shares */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
                    positionMode === "shares"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="positionMode"
                    checked={positionMode === "shares"}
                    onChange={() => setPositionMode("shares")}
                    className="mt-1 h-4 w-4 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="mb-2 text-sm text-slate-200">Number of Shares</div>
                    {positionMode === "shares" && (
                      <input
                        type="number"
                        value={shareCount}
                        onChange={(e) => setShareCount(e.target.value)}
                        placeholder="10"
                        min="1"
                        step="1"
                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                </label>

                {/* Dollars */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
                    positionMode === "dollars"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="positionMode"
                    checked={positionMode === "dollars"}
                    onChange={() => setPositionMode("dollars")}
                    className="mt-1 h-4 w-4 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="mb-2 text-sm text-slate-200">Dollar Amount</div>
                    {positionMode === "dollars" && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">$</span>
                        <input
                          type="number"
                          value={dollarAmount}
                          onChange={(e) => setDollarAmount(e.target.value)}
                          placeholder="500"
                          min="0"
                          step="0.01"
                          className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </label>

                {/* Percent */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all ${
                    positionMode === "percent"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="positionMode"
                    checked={positionMode === "percent"}
                    onChange={() => setPositionMode("percent")}
                    className="mt-1 h-4 w-4 accent-blue-500"
                  />
                  <div className="flex-1">
                    <div className="mb-2 text-sm text-slate-200">Percentage of Buying Power</div>
                    {positionMode === "percent" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={percentAmount}
                          onChange={(e) => setPercentAmount(e.target.value)}
                          placeholder="2"
                          min="0"
                          max="100"
                          step="0.1"
                          className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Buying Power:</span>
                  <span className="font-medium text-white">${balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-slate-400">Current Price:</span>
                  <span className="font-medium text-white">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Shares:</span>
                  <span className="font-medium text-cyan-400">{quantity}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-slate-400">Estimated Cost:</span>
                  <span className="font-medium text-cyan-400">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Order Type */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Choose your order type</h3>

              <div className="space-y-2">
                {ORDER_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-all ${
                      orderType === type.value
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="orderType"
                        value={type.value}
                        checked={orderType === type.value}
                        onChange={(e) => setOrderType(e.target.value as OrderType)}
                        className="h-4 w-4 accent-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-200">{type.label}</span>
                    </div>
                    <p className="ml-7 text-xs text-slate-400">{type.description}</p>
                  </label>
                ))}
              </div>

              {/* Price inputs based on order type */}
              {(orderType === "limit" || orderType === "stop_limit") && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Limit Price:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder={currentPrice.toFixed(2)}
                      step="0.01"
                      className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {(orderType === "stop" || orderType === "stop_limit") && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Stop Price:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      value={stopPrice}
                      onChange={(e) => setStopPrice(e.target.value)}
                      placeholder={(currentPrice * 0.98).toFixed(2)}
                      step="0.01"
                      className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {orderType === "trailing_stop" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Trail Percent (%):</label>
                    <input
                      type="number"
                      value={trailPercent}
                      onChange={(e) => { setTrailPercent(e.target.value); setTrailPrice(""); }}
                      placeholder="2"
                      step="0.1"
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="text-center text-slate-500">— or —</div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Trail Price ($):</label>
                    <input
                      type="number"
                      value={trailPrice}
                      onChange={(e) => { setTrailPrice(e.target.value); setTrailPercent(""); }}
                      placeholder="5.00"
                      step="0.01"
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Time in Force & Extended Hours */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Time In Force:</label>
                  <select
                    value={(enableBracket && orderType === "market") ? "gtc" : timeInForce}
                    onChange={(e) => {
                      if (enableBracket && orderType === "market") {
                        // Bracket orders require GTC - don't allow change
                        return;
                      }
                      setTimeInForce(e.target.value as "day" | "gtc" | "ioc" | "fok");
                    }}
                    disabled={enableBracket && orderType === "market"}
                    className={`w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none ${
                      enableBracket && orderType === "market" ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {TIME_IN_FORCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {enableBracket && orderType === "market" && (
                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Bracket orders use GTC to keep protective orders active
                    </p>
                  )}
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2">
                    <input
                      type="checkbox"
                      checked={extendedHours}
                      onChange={(e) => setExtendedHours(e.target.checked)}
                      className="h-4 w-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">Extended Hours</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Risk Management */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Set your risk parameters</h3>

              {/* Bracket Order Toggle (only for market orders) */}
              {orderType === "market" && (
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-700 p-3 bg-slate-800/30">
                  <input
                    type="checkbox"
                    checked={enableBracket}
                    onChange={(e) => setEnableBracket(e.target.checked)}
                    className="h-4 w-4 accent-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-200">Enable Bracket Order</span>
                    <p className="text-xs text-slate-400">Automatically set stop-loss and take-profit orders</p>
                  </div>
                </label>
              )}

              {(enableBracket || orderType !== "market") && (
                <>
                  {/* Stop Loss */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Stop Loss:</label>
                    <div className="space-y-2">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                          useSignalSL
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          checked={useSignalSL}
                          onChange={() => setUseSignalSL(true)}
                          className="h-4 w-4 accent-blue-500"
                        />
                        <span className="text-sm text-slate-200">
                          Use Signal's SL ({parsePercent(signal.stopLoss) || defaultStopLoss}%)
                        </span>
                      </label>

                      <label
                        className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all ${
                          !useSignalSL
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={!useSignalSL}
                            onChange={() => setUseSignalSL(false)}
                            className="h-4 w-4 accent-blue-500"
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
                              className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Take Profit */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Take Profit:</label>
                    <div className="space-y-2">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                          useSignalTP
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          checked={useSignalTP}
                          onChange={() => setUseSignalTP(true)}
                          className="h-4 w-4 accent-blue-500"
                        />
                        <span className="text-sm text-slate-200">
                          Use Signal's TP ({parsePercent(signal.takeProfit1) || defaultTakeProfit}%)
                        </span>
                      </label>

                      <label
                        className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all ${
                          !useSignalTP
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={!useSignalTP}
                            onChange={() => setUseSignalTP(false)}
                            className="h-4 w-4 accent-blue-500"
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
                              className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Review & Confirm Order</h3>

              {/* Market Status */}
              <div className={`rounded-lg p-3 flex items-center gap-2 ${
                marketOpen 
                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                  : "bg-yellow-500/10 border border-yellow-500/30"
              }`}>
                <div className={`h-2 w-2 rounded-full ${marketOpen ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"}`} />
                <span className={`text-sm ${marketOpen ? "text-emerald-300" : "text-yellow-300"}`}>
                  {marketOpen ? "Market OPEN" : "Market CLOSED - Order will queue"}
                </span>
              </div>

              <div className="rounded-lg bg-slate-800/50 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Symbol:</span>
                  <span className="font-semibold text-white">{symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Side:</span>
                  <span className={`font-semibold ${side === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {side.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Type:</span>
                  <span className="font-medium text-white">{orderType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shares:</span>
                  <span className="font-medium text-white">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry Price:</span>
                  <span className="font-medium text-white">
                    ${entryPrice.toFixed(2)}
                    {orderType === "market" && " (market)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Cost:</span>
                  <span className="font-medium text-white">${totalCost.toFixed(2)}</span>
                </div>

                {enableBracket && orderType === "market" && (
                  <>
                    <div className="flex justify-between border-t border-slate-700 pt-3">
                      <span className="text-slate-400">Stop Loss ({stopLossPercent}%):</span>
                      <span className="font-medium text-red-400">${stopLossPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Take Profit ({takeProfitPercent}%):</span>
                      <span className="font-medium text-emerald-400">${takeProfitPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="border-t border-slate-700 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Loss:</span>
                    <span className="font-medium text-red-400">-${maxLossAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Potential Gain:</span>
                    <span className="font-medium text-emerald-400">+${potentialGainAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk/Reward:</span>
                    <span className="font-medium text-cyan-400">1:{riskRewardRatio}</span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-3 text-xs text-slate-500">
                  <p>Time In Force: {timeInForce.toUpperCase()}</p>
                  {extendedHours && <p>Extended Hours: Enabled</p>}
                </div>
              </div>
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
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl disabled:opacity-50"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl disabled:opacity-50"
            >
              {executing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Executing...
                </span>
              ) : (
                "Execute Trade"
              )}
            </button>
          )}
        </div>
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

