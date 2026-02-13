"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { OrderBook, RecentTrade } from "@/lib/api/exchanges.service";

// ── Types ────────────────────────────────────────────────────────────────────

interface MarketWebSocketOptions {
  /** Connection ID for the exchange */
  connectionId: string;
  /** Trading pair symbol (e.g., BTCUSDT) */
  symbol: string;
  /** Whether the WebSocket should be active (e.g., only when tab is visible) */
  enabled?: boolean;
}

interface MarketWebSocketState {
  /** Latest order book data */
  orderBook: OrderBook | null;
  /** Latest recent trades */
  trades: RecentTrade[];
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Whether initial data has been loaded */
  isLoading: boolean;
  /** Connection error message */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number | null;
}

interface MarketWebSocketReturn extends MarketWebSocketState {
  /** Manually reconnect */
  reconnect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000;

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook for real-time market data via WebSocket.
 * Replaces the 30-second polling pattern used in TradingDataTab.
 *
 * Backend Phase 6: WebSocket Gateway at /market namespace
 *
 * Events:
 *  - subscribe:orderbook   → orderbook:update
 *  - subscribe:trades      → trades:update
 *  - unsubscribe:orderbook
 *  - unsubscribe:trades
 */
export function useMarketWebSocket({
  connectionId,
  symbol,
  enabled = true,
}: MarketWebSocketOptions): MarketWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const reconnectCountRef = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<MarketWebSocketState>({
    orderBook: null,
    trades: [],
    isConnected: false,
    isLoading: true,
    error: null,
    lastUpdate: null,
  });

  // ── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!connectionId || !symbol || !enabled) return;

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(`${WS_URL}/market`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 10000,
      auth: {
        connectionId,
      },
      withCredentials: true,
    });

    socketRef.current = socket;

    // ── Connection Events ────────────────────────────────────────────────

    socket.on("connect", () => {
      console.log("[WS] Connected to /market namespace");
      reconnectCountRef.current = 0;
      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
      }));

      // Subscribe to order book and trades
      socket.emit("subscribe:orderbook", {
        connectionId,
        symbol,
        limit: 20,
      });

      socket.emit("subscribe:trades", {
        connectionId,
        symbol,
        limit: 50,
      });

      // Start heartbeat
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        if (socket.connected) {
          socket.emit("ping");
        }
      }, HEARTBEAT_INTERVAL);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
      setState((prev) => ({
        ...prev,
        isConnected: false,
      }));

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[WS] Connection error:", err.message);
      reconnectCountRef.current += 1;

      if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setState((prev) => ({
          ...prev,
          error: "Unable to establish real-time connection. Using polling fallback.",
          isConnected: false,
        }));
      }
    });

    // ── Data Events ──────────────────────────────────────────────────────

    socket.on("orderbook:update", (data: OrderBook) => {
      setState((prev) => ({
        ...prev,
        orderBook: data,
        isLoading: false,
        lastUpdate: Date.now(),
      }));
    });

    socket.on("trades:update", (data: RecentTrade[]) => {
      setState((prev) => ({
        ...prev,
        trades: data,
        isLoading: false,
        lastUpdate: Date.now(),
      }));
    });

    // Handle initial data snapshot
    socket.on("orderbook:snapshot", (data: OrderBook) => {
      setState((prev) => ({
        ...prev,
        orderBook: data,
        isLoading: false,
        lastUpdate: Date.now(),
      }));
    });

    socket.on("trades:snapshot", (data: RecentTrade[]) => {
      setState((prev) => ({
        ...prev,
        trades: data,
        isLoading: false,
        lastUpdate: Date.now(),
      }));
    });

    socket.on("error", (error: { message: string }) => {
      console.error("[WS] Server error:", error.message);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    });
  }, [connectionId, symbol, enabled]);

  // ── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Unsubscribe before disconnecting
      socketRef.current.emit("unsubscribe:orderbook", { symbol });
      socketRef.current.emit("unsubscribe:trades", { symbol });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setState((prev) => ({ ...prev, isConnected: false }));
  }, [symbol]);

  // ── Reconnect ────────────────────────────────────────────────────────────

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    disconnect();
    setTimeout(connect, 500);
  }, [connect, disconnect]);

  // ── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  // ── Tab Visibility ───────────────────────────────────────────────────────
  // Pause WebSocket when tab is hidden to save resources

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        disconnect();
      } else if (enabled) {
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connect, disconnect, enabled]);

  return {
    ...state,
    reconnect,
    disconnect,
  };
}
