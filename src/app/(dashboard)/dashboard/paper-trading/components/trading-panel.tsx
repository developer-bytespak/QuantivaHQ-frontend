"use client";

import { useState } from "react";
import { useTestnetStore } from "@/state/testnet-store";
import { binanceTestnetService } from "@/lib/api/binance-testnet.service";
import styles from "./trading-panel.module.css";

export function TradingPanel() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { totalBalance } = useTestnetStore();

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantity || quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (type === "LIMIT" && (!price || price <= 0)) {
      setError("Please enter a valid price for limit orders");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await binanceTestnetService.placeOrder({
        symbol,
        side,
        type,
        quantity,
        price: type === "LIMIT" ? price : undefined,
      });

      setSuccess(`${side} order placed for ${quantity} ${symbol}`);
      setQuantity(0);
      setPrice(0);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Place Order</h2>

      <form onSubmit={handlePlaceOrder} className={styles.form}>
        <div className={styles.section}>
          <label>Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g., BTCUSDT"
            disabled={isLoading}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.section}>
            <label>Side</label>
            <select value={side} onChange={(e) => setSide(e.target.value as "BUY" | "SELL")} disabled={isLoading}>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>

          <div className={styles.section}>
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as "MARKET" | "LIMIT")} disabled={isLoading}>
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <label>Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
            placeholder="0"
            step="0.00000001"
            disabled={isLoading}
          />
        </div>

        {type === "LIMIT" && (
          <div className={styles.section}>
            <label>Price (USDT)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              placeholder="0"
              step="0.01"
              disabled={isLoading}
            />
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.submitBtn} ${styles[side.toLowerCase()]}`}
        >
          {isLoading ? "Processing..." : `${side} ${symbol}`}
        </button>
      </form>

      <div className={styles.info}>
        <p className={styles.balance}>
          Available Balance: <strong>${totalBalance.toFixed(2)}</strong>
        </p>
        <p className={styles.warning}>⚠️ This is a testnet. No real funds are at risk.</p>
      </div>
    </div>
  );
}
