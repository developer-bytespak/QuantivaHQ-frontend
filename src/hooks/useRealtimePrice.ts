"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// ── Types ────────────────────────────────────────────────────────────────────

interface RealtimePriceOptions {
  /** Trading pair symbol (e.g., BTCUSDT) */
  symbol: string;
  /** Connection ID for the exchange */
  connectionId: string;
  /** Whether the hook should be active */
  enabled?: boolean;
  /** Initial price (from REST API) to show while WebSocket connects */
  initialPrice?: number;
}

interface PriceUpdate {
  price: number;
  change24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  timestamp: number;
}

interface RealtimePriceReturn {
  /** Latest price (from WebSocket or initial) */
  price: number | null;
  /** 24h change amount */
  change24h: number | null;
  /** 24h change percentage */
  changePercent24h: number | null;
  /** Whether WebSocket is connected */
  isConnected: boolean;
  /** Last update timestamp */
  lastUpdate: number | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook for real-time price streaming via WebSocket.
 * 
 * Backend Phase 6: Listens for `price:update` events from the /market gateway.
 * Updates the displayed price in real-time without polling.
 */
export function useRealtimePrice({
  symbol,
  connectionId,
  enabled = true,
  initialPrice,
}: RealtimePriceOptions): RealtimePriceReturn {
  const socketRef = useRef<Socket | null>(null);

  const [state, setState] = useState<{
    price: number | null;
    change24h: number | null;
    changePercent24h: number | null;
    isConnected: boolean;
    lastUpdate: number | null;
  }>({
    price: initialPrice ?? null,
    change24h: null,
    changePercent24h: null,
    isConnected: false,
    lastUpdate: null,
  });

  const connect = useCallback(() => {
    if (!symbol || !connectionId || !enabled) return;

    // If already connected, reuse
    if (socketRef.current?.connected) return;

    // Clean up
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(`${WS_URL}/market`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
      timeout: 10000,
      auth: { connectionId },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setState((prev) => ({ ...prev, isConnected: true }));

      // Subscribe to price stream
      socket.emit("subscribe:price", {
        connectionId,
        symbol,
      });
    });

    socket.on("disconnect", () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    // Listen for price updates
    socket.on("price:update", (data: PriceUpdate) => {
      setState((prev) => ({
        ...prev,
        price: data.price,
        change24h: data.change24h ?? prev.change24h,
        changePercent24h: data.changePercent24h ?? prev.changePercent24h,
        lastUpdate: data.timestamp || Date.now(),
      }));
    });

    // Also accept ticker updates (some backends use this format)
    socket.on("ticker:update", (data: PriceUpdate) => {
      setState((prev) => ({
        ...prev,
        price: data.price,
        change24h: data.change24h ?? prev.change24h,
        changePercent24h: data.changePercent24h ?? prev.changePercent24h,
        lastUpdate: data.timestamp || Date.now(),
      }));
    });
  }, [symbol, connectionId, enabled]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("unsubscribe:price", { symbol });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState((prev) => ({ ...prev, isConnected: false }));
  }, [symbol]);

  // Connect/disconnect on mount/unmount
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

  // Update initial price if it changes
  useEffect(() => {
    if (initialPrice && !state.lastUpdate) {
      setState((prev) => ({ ...prev, price: initialPrice }));
    }
  }, [initialPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tab visibility — pause when hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        disconnect();
      } else if (enabled) {
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [connect, disconnect, enabled]);

  return state;
}
