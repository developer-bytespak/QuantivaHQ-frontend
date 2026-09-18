"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  ChartIntervalId,
  DEFAULT_CHART_INTERVAL,
  isChartIntervalId,
} from "./intervals";

/**
 * External store for the chart's selected candle interval, persisted to
 * localStorage so it sticks between visits. Same shape as the indicator store
 * in lib/indicators/useChartIndicators.ts: safe under React Compiler and free
 * of hydration mismatches (the server snapshot is always the default).
 */
class IntervalStore {
  private value: ChartIntervalId = DEFAULT_CHART_INTERVAL;
  private listeners = new Set<() => void>();

  constructor(private readonly key: string) {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(key);
        if (isChartIntervalId(raw)) this.value = raw;
      } catch {
        /* storage unavailable, keep the default */
      }
    }
  }

  getSnapshot = (): ChartIntervalId => this.value;
  getServerSnapshot = (): ChartIntervalId => DEFAULT_CHART_INTERVAL;

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  set = (next: ChartIntervalId): void => {
    if (next === this.value) return;
    this.value = next;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(this.key, next);
      } catch {
        /* private mode or quota, non-fatal */
      }
    }
    this.listeners.forEach((l) => l());
  };
}

const stores = new Map<string, IntervalStore>();

function getStore(key: string): IntervalStore {
  let store = stores.get(key);
  if (!store) {
    store = new IntervalStore(key);
    stores.set(key, store);
  }
  return store;
}

export function useChartInterval(storageKey = "quantiva.chart.interval") {
  const store = getStore(storageKey);
  const interval = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const setInterval = useCallback(
    (id: ChartIntervalId) => store.set(id),
    [store],
  );
  return { interval, setInterval };
}
