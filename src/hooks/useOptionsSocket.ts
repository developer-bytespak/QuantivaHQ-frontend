"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { OptionContract } from "@/lib/api/options.service";

// ── Types ────────────────────────────────────────────────────────────────────

interface OptionsSocketOptions {
  /** Underlying asset to subscribe to (e.g. "BTC") */
  underlying: string | null;
  /** Connection ID for the exchange */
  connectionId: string | null;
  /** Whether the WebSocket should be active */
  enabled?: boolean;
}

interface OptionsSocketState {
  /** Latest options chain data from WS */
  chainUpdate: OptionContract[] | null;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Connection error message */
  error: string | null;
  /** Last update timestamp */
  lastUpdate: number | null;
}

interface OptionsSocketReturn extends OptionsSocketState {
  reconnect: () => void;
  disconnect: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000;

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Custom hook for real-time options data via WebSocket.
 * Connects to the /options namespace on the backend Socket.IO gateway.
 *
 * Events emitted:
 *  - subscribe   { underlying, connectionId }
 *  - unsubscribe { underlying }
 *
 * Events received:
 *  - chain-update  { underlying, chain: OptionsChainResponseDto, timestamp }
 *  - ticker-update { underlying, price, change24h, changePercent24h, timestamp }
 */
export function useOptionsSocket({
  underlying,
  connectionId,
  enabled = true,
}: OptionsSocketOptions): OptionsSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const reconnectCountRef = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<OptionsSocketState>({
    chainUpdate: null,
    isConnected: false,
    error: null,
    lastUpdate: null,
  });

  // ── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!underlying || !connectionId || !enabled) return;

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('quantivahq_access_token') : null;
    const socket = io(`${WS_URL}/options`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 10000,
      auth: { token: accessToken, connectionId },
      withCredentials: true,
    });

    socketRef.current = socket;

    // ── Connection Events ────────────────────────────────────────────────

    socket.on("connect", () => {
      console.log("[OptionsWS] Connected to /options namespace");
      reconnectCountRef.current = 0;
      setState((prev) => ({ ...prev, isConnected: true, error: null }));

      // Subscribe to underlying (userId is derived from connection on backend)
      socket.emit("subscribe", { underlying, connectionId });

      // Start heartbeat
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        if (socket.connected) socket.emit("ping");
      }, HEARTBEAT_INTERVAL);
    });

    socket.on("disconnect", (reason) => {
      console.log("[OptionsWS] Disconnected:", reason);
      setState((prev) => ({ ...prev, isConnected: false }));
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    });

    socket.on("connect_error", (err) => {
      console.error("[OptionsWS] Connection error:", err.message);
      reconnectCountRef.current += 1;
      if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setState((prev) => ({
          ...prev,
          error: "Unable to connect to options data stream.",
          isConnected: false,
        }));
      }
    });

    // ── Data Events ──────────────────────────────────────────────────────

    socket.on("chain-update", (data: { underlying: string; chain: { contracts: OptionContract[] }; timestamp: number }) => {
      setState((prev) => ({
        ...prev,
        chainUpdate: data.chain?.contracts ?? null,
        lastUpdate: data.timestamp || Date.now(),
      }));
    });

    socket.on("ticker-update", (data: { underlying: string; price: number; change24h: number; changePercent24h: number; timestamp: number }) => {
      // Ticker updates provide underlying price info — no direct chain merge needed
      // The chain-update already refreshes every 15s with full data
      setState((prev) => ({
        ...prev,
        lastUpdate: data.timestamp || Date.now(),
      }));
    });

    socket.on("error", (msg: { message: string } | string) => {
      const errorMsg = typeof msg === "string" ? msg : msg.message;
      console.error("[OptionsWS] Server error:", errorMsg);
      setState((prev) => ({ ...prev, error: errorMsg }));
    });
  }, [underlying, connectionId, enabled]);

  // ── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (underlying) {
        socketRef.current.emit("unsubscribe", { underlying });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    setState({ chainUpdate: null, isConnected: false, error: null, lastUpdate: null });
  }, [underlying]);

  // ── Reconnect ────────────────────────────────────────────────────────────

  const reconnect = useCallback(() => {
    disconnect();
    reconnectCountRef.current = 0;
    connect();
  }, [disconnect, connect]);

  // ── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { ...state, reconnect, disconnect };
}
