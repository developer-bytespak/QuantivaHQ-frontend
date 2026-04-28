"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  /** Trading pair, e.g. "BTCUSDT". Auto-lowercased for the WS topic. */
  symbol: string;
  /** Whether the hook is active. Pass false to disable (e.g. on stocks pages). */
  enabled?: boolean;
  /** Initial price (from REST) shown until the WS sends its first tick. */
  initialPrice?: number;
}

interface State {
  price: number | null;
  change24h: number | null;
  changePercent24h: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  isConnected: boolean;
  lastUpdate: number | null;
}

/**
 * Real-time price stream from Binance's public WebSocket — no auth needed.
 * Connects directly from the browser to wss://stream.binance.com:9443 so it
 * works for users without an exchange connection. Falls back to REST-provided
 * `initialPrice` until the first tick arrives, and reconnects with backoff
 * if the socket drops.
 *
 * Topic: `<symbol>@ticker` (24h rolling stats, ~1 update/sec).
 */
export function useBinancePublicPrice({
  symbol,
  enabled = true,
  initialPrice,
}: Options): State {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByCleanupRef = useRef(false);

  const [state, setState] = useState<State>({
    price: initialPrice ?? null,
    change24h: null,
    changePercent24h: null,
    high24h: null,
    low24h: null,
    volume24h: null,
    isConnected: false,
    lastUpdate: null,
  });

  useEffect(() => {
    if (!enabled || !symbol) return;

    closedByCleanupRef.current = false;
    reconnectAttemptRef.current = 0;

    const connect = () => {
      const stream = `${symbol.toLowerCase()}@ticker`;
      const url = `wss://stream.binance.com:9443/ws/${stream}`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        console.warn("[useBinancePublicPrice] WebSocket construction failed:", err);
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setState((s) => ({ ...s, isConnected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          // Binance @ticker payload uses single-letter keys.
          // c = close (last price), p = price change (abs), P = % change,
          // h = high, l = low, v = base asset volume.
          const price = parseFloat(data.c);
          if (Number.isFinite(price)) {
            setState({
              price,
              change24h: parseFloat(data.p) || 0,
              changePercent24h: parseFloat(data.P) || 0,
              high24h: parseFloat(data.h) || null,
              low24h: parseFloat(data.l) || null,
              volume24h: parseFloat(data.v) || null,
              isConnected: true,
              lastUpdate: Date.now(),
            });
          }
        } catch {
          // Ignore malformed frames — Binance occasionally sends
          // pings/pongs we don't care about.
        }
      };

      ws.onerror = () => {
        // onerror always fires before onclose; let onclose handle reconnect.
      };

      ws.onclose = () => {
        setState((s) => ({ ...s, isConnected: false }));
        if (!closedByCleanupRef.current) {
          scheduleReconnect();
        }
      };
    };

    const scheduleReconnect = () => {
      if (closedByCleanupRef.current) return;
      const attempt = reconnectAttemptRef.current++;
      // Cap backoff at 30s. 0.5s, 1s, 2s, 4s, 8s, 16s, 30s, 30s, …
      const delay = Math.min(500 * 2 ** attempt, 30_000);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closedByCleanupRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [symbol, enabled]);

  return state;
}
