"use client";

import { useState, useEffect, useCallback } from "react";

export interface MarketStock {
  rank: number;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number | null;
  volume24h: number;
  timestamp?: string;
}

export interface MarketDataResponse {
  items: MarketStock[];
  timestamp: string;
  warnings?: string[];
}

interface UseStocksMarketOptions {
  limit?: number;
  symbols?: string[];
  search?: string;
  sector?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseStocksMarketResult {
  data: MarketStock[];
  loading: boolean;
  error: string | null;
  warnings: string[];
  timestamp: string | null;
  refresh: () => Promise<void>;
  nextRefreshIn: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useStocksMarket(
  options: UseStocksMarketOptions = {}
): UseStocksMarketResult {
  const {
    limit = 20,
    symbols,
    search,
    sector,
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [data, setData] = useState<MarketStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      params.append("limit", limit.toString());

      if (symbols && symbols.length > 0) {
        params.append("symbols", symbols.join(","));
      }

      if (search) {
        params.append("search", search);
      }

      if (sector) {
        params.append("sector", sector);
      }

      const url = `${API_BASE_URL}/api/stocks-market/stocks?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch stocks: ${response.statusText}`);
      }

      const result: MarketDataResponse = await response.json();

      setData(result.items || []);
      setTimestamp(result.timestamp);
      setWarnings(result.warnings || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching stocks market data:", err);
      setError(err.message || "Failed to fetch market data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit, symbols, search, sector]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh with countdown
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    let refreshTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    // Set up refresh
    const startRefreshCycle = () => {
      // Set next refresh time
      setNextRefreshIn(refreshInterval);

      // Countdown interval (every second)
      countdownInterval = setInterval(() => {
        setNextRefreshIn((prev) => {
          if (prev === null) return null;
          const next = prev - 1000;
          return next > 0 ? next : 0;
        });
      }, 1000);

      // Actual refresh
      refreshTimer = setTimeout(() => {
        fetchData();
        startRefreshCycle(); // Restart cycle
      }, refreshInterval);
    };

    startRefreshCycle();

    return () => {
      clearTimeout(refreshTimer);
      clearInterval(countdownInterval);
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    warnings,
    timestamp,
    refresh: fetchData,
    nextRefreshIn,
  };
}

/**
 * Hook for fetching available sectors
 */
export function useStocksSectors() {
  const [sectors, setSectors] = useState<Array<{ name: string; count: number }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const url = `${API_BASE_URL}/api/stocks-market/sectors`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch sectors");
        }

        const result = await response.json();
        setSectors(result.sectors || []);
      } catch (err: any) {
        console.error("Error fetching sectors:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSectors();
  }, []);

  return { sectors, loading, error };
}

/**
 * Hook for health check
 */
export function useStocksMarketHealth() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const url = `${API_BASE_URL}/api/stocks-market/health`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Health check failed");
        }

        const result = await response.json();
        setHealth(result);
      } catch (err: any) {
        console.error("Health check error:", err);
        setHealth({ status: "unhealthy" });
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();

    // Refresh every minute
    const interval = setInterval(fetchHealth, 60000);

    return () => clearInterval(interval);
  }, []);

  return { health, loading };
}
