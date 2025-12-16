"use client";

import { useEffect, useState } from "react";
import { useTestnetStore } from "@/state/testnet-store";
import { binanceTestnetService } from "@/lib/api/binance-testnet.service";
import { TradingPanel } from "./components/trading-panel";
import styles from "./page.module.css";

interface Order {
  orderId: number;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price: number;
  status: string;
  timestamp: number;
}

export default function PaperTradingPage() {
  const { setBalance, setOpenOrdersCount, setLoadingBalance } = useTestnetStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  // Load status and account data on mount
  useEffect(() => {
    const init = async () => {
      await loadStatus();
    };
    
    init();
  }, []);

  // Load account data when status changes and is configured
  useEffect(() => {
    if (status && status.configured) {
      loadAccountData();
      const interval = setInterval(loadAccountData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [status?.configured]);

  const loadStatus = async () => {
    try {
      const testnetStatus = await binanceTestnetService.getStatus();
      setStatus(testnetStatus);

      if (!testnetStatus.configured) {
        setError("Binance testnet not configured. Please set TESTNET_API_KEY and TESTNET_API_SECRET environment variables.");
      }
    } catch (err: any) {
      console.error("Failed to load testnet status:", err);
    }
  };

  const loadAccountData = async () => {
    try {
      setLoadingBalance(true);
      const [balance, openOrders] = await Promise.all([
        binanceTestnetService.getAccountBalance(),
        binanceTestnetService.getOpenOrders(),
      ]);

      setBalance(balance.totalBalanceUSD, balance.totalBalanceUSD);
      setOrders(openOrders);
      setOpenOrdersCount(openOrders.length);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load account data:", err);
      setError(err.message || "Failed to load account data");
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleCancelOrder = async (orderId: number, symbol: string) => {
    try {
      setIsLoadingOrders(true);
      await binanceTestnetService.cancelOrder(orderId.toString(), symbol);

      // Reload orders
      const updated = await binanceTestnetService.getOpenOrders();
      setOrders(updated);
      setOpenOrdersCount(updated.length);
    } catch (err: any) {
      setError(err.message || "Failed to cancel order");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  if (status && !status.configured) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Paper Trading</h1>
          <p>Practice trading on Binance testnet without using real funds</p>
        </div>

        <div className={styles.globalError}>
          ⚠️ {error}
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Set environment variables:<br />
            <code>TESTNET_API_KEY</code> and <code>TESTNET_API_SECRET</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Paper Trading</h1>
        <p>Practice trading on Binance testnet without using real funds</p>
      </div>

      {error && <div className={styles.globalError}>{error}</div>}

      <div className={styles.layout}>
        {/* Trading Panel */}
        <div className={styles.mainContent}>
          <TradingPanel />

          {/* Open Orders Section */}
          <div className={styles.ordersSection}>
            <h2 className={styles.sectionTitle}>Open Orders</h2>

            {isLoadingOrders && <p className={styles.loading}>Loading orders...</p>}

            {orders.length === 0 && !isLoadingOrders && (
              <p className={styles.empty}>No open orders</p>
            )}

            {orders.length > 0 && (
              <div className={styles.ordersTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.col}>Symbol</div>
                  <div className={styles.col}>Side</div>
                  <div className={styles.col}>Type</div>
                  <div className={styles.col}>Quantity</div>
                  <div className={styles.col}>Price</div>
                  <div className={styles.col}>Status</div>
                  <div className={styles.col}>Action</div>
                </div>

                {orders.map((order) => (
                  <div key={order.orderId} className={styles.tableRow}>
                    <div className={styles.col}>{order.symbol}</div>
                    <div className={`${styles.col} ${styles[order.side.toLowerCase()]}`}>
                      {order.side}
                    </div>
                    <div className={styles.col}>{order.type}</div>
                    <div className={styles.col}>{order.quantity.toFixed(8)}</div>
                    <div className={styles.col}>${order.price.toFixed(2)}</div>
                    <div className={styles.col}>
                      <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className={styles.col}>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => handleCancelOrder(order.orderId, order.symbol)}
                        disabled={isLoadingOrders}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
