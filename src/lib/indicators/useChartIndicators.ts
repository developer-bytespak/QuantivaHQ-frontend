"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_INDICATORS } from "./registry";

/**
 * External store backing the chart's active-study selection. Using an external
 * store (rather than useState + a load effect) keeps this compiler-safe under
 * React Compiler: no ref writes during render, no setState inside an effect,
 * and no SSR/hydration mismatch (the server snapshot is always the default,
 * and useSyncExternalStore re-syncs to the persisted value after hydration).
 */
class IndicatorStore {
  private value: string[];
  private listeners = new Set<() => void>();

  constructor(private readonly key: string) {
    this.value = DEFAULT_INDICATORS;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) this.value = parsed;
        }
      } catch {
        /* malformed storage — keep defaults */
      }
    }
  }

  getSnapshot = (): string[] => this.value;

  // Server render always uses the default so hydration matches; the client
  // then re-syncs to `getSnapshot` (the persisted value) automatically.
  getServerSnapshot = (): string[] => DEFAULT_INDICATORS;

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  set = (next: string[]): void => {
    this.value = next;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(this.key, JSON.stringify(next));
      } catch {
        /* storage unavailable (private mode / quota) — non-fatal */
      }
    }
    this.listeners.forEach((l) => l());
  };
}

const stores = new Map<string, IndicatorStore>();

function getStore(key: string): IndicatorStore {
  let store = stores.get(key);
  if (!store) {
    store = new IndicatorStore(key);
    stores.set(key, store);
  }
  return store;
}

/**
 * Holds the set of active studies for a chart, persisted to localStorage so a
 * user's selection sticks between visits. `active` is an ordered array (order
 * controls oscillator pane stacking); `getActive()` reads the latest value
 * from async callbacks (e.g. a data fetch that resolves later).
 */
export function useChartIndicators(storageKey = "quantiva.chart.indicators") {
  const store = getStore(storageKey);
  const active = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const toggle = useCallback(
    (id: string) => {
      const current = store.getSnapshot();
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      store.set(next);
    },
    [store],
  );

  const clear = useCallback(() => store.set([]), [store]);
  const getActive = useCallback(() => store.getSnapshot(), [store]);

  return { active, toggle, clear, getActive };
}
