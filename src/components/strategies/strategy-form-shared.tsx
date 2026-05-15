"use client";

import React, { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";

// Engine-based fields that actually work in the signal generation system.
// These match the pre-built strategies format exactly.
export const RULE_FIELDS = [
  { value: "final_score", label: "Final Score", description: "Combined weighted score from all engines (-1 to 1)" },
  { value: "metadata.engine_details.sentiment.score", label: "Sentiment Score", description: "News & social sentiment analysis (-1 to 1)" },
  { value: "metadata.engine_details.trend.score", label: "Trend Score", description: "Technical trend analysis (-1 to 1)" },
  { value: "metadata.engine_details.fundamental.score", label: "Fundamental Score", description: "Earnings, financials, growth metrics (-1 to 1)" },
  { value: "metadata.engine_details.event_risk.score", label: "Event Risk Score", description: "Earnings events, news risk (-1 to 1)" },
  { value: "metadata.engine_details.liquidity.score", label: "Liquidity Score", description: "Volume & market depth (-1 to 1)" },
] as const;

export const OPERATORS = [
  { value: ">", label: "Greater than (>)" },
  { value: ">=", label: "Greater or equal (≥)" },
] as const;

export const POPULAR_CRYPTO = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX"];
export const POPULAR_STOCKS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD"];

export interface Rule {
  field: string;
  operator: string;
  value: number;
}

export interface EngineWeights {
  sentiment: number;
  trend: number;
  fundamental: number;
  event_risk: number;
  liquidity: number;
}

export interface AssetOption {
  symbol: string;
  name: string;
}

export const DEFAULT_ENGINE_WEIGHTS: EngineWeights = {
  sentiment: 0.35,
  trend: 0.25,
  fundamental: 0.15,
  event_risk: 0.15,
  liquidity: 0.10,
};

export const ENGINE_WEIGHT_ROWS = [
  { key: "sentiment" as const, label: "Sentiment", desc: "News & social media sentiment analysis", icon: "💭" },
  { key: "trend" as const, label: "Trend", desc: "Technical indicators & price momentum", icon: "📈" },
  { key: "fundamental" as const, label: "Fundamental", desc: "Earnings, revenue, financial health", icon: "📊" },
  { key: "event_risk" as const, label: "Event Risk", desc: "Earnings dates, news events, volatility", icon: "⚠️" },
  { key: "liquidity" as const, label: "Liquidity", desc: "Trading volume & market depth", icon: "💧" },
];

export const WEIGHT_PRESETS: { label: string; weights: EngineWeights }[] = [
  { label: "🚀 Momentum (like Tech Momentum)", weights: { sentiment: 0.4, trend: 0.35, fundamental: 0.1, event_risk: 0.1, liquidity: 0.05 } },
  { label: "💎 Value (like Value Investing)", weights: { sentiment: 0.15, trend: 0.1, fundamental: 0.5, event_risk: 0.2, liquidity: 0.05 } },
  { label: "⚖️ Balanced (like Alpha Fusion)", weights: { ...DEFAULT_ENGINE_WEIGHTS } },
];

export function weightsTotal(weights: EngineWeights): number {
  return Object.values(weights).reduce((a, b) => a + b, 0);
}

export function weightsValid(weights: EngineWeights): boolean {
  return Math.abs(weightsTotal(weights) - 1.0) < 0.01;
}

export function getRuleFieldLabel(field: string): string {
  return RULE_FIELDS.find((f) => f.value === field)?.label ?? field;
}

export function StepGuideTooltip({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle: string;
  points: string[];
}) {
  return (
    <div className="relative group shrink-0">
      <div className="w-7 h-7 rounded-full border border-white/15 bg-[#1a1a22] flex items-center justify-center cursor-help transition-all group-hover:border-[var(--primary-light)]/50 group-hover:bg-[var(--primary-light)]/10">
        <svg
          className="w-4 h-4 text-slate-400 group-hover:text-[var(--primary-light)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-[400]">
        <div className="rounded-xl border border-[var(--primary)]/20 bg-gradient-to-br from-[#12121c] via-[#0e0e18] to-[#0a0a14] shadow-[0_12px_40px_rgba(0,0,0,0.8)] p-4">
          <p className="text-white font-semibold text-sm">{title}</p>
          <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
          <div className="mt-3 space-y-1.5">
            {points.map((point) => (
              <p key={point} className="text-xs text-slate-300">
                • {point}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Debounced asset search against the backend strategies endpoints.
 * For crypto, on error falls back to allowing manual entry of the typed symbol.
 */
export function useAssetSearch(query: string, isStocks: boolean) {
  const [results, setResults] = useState<AssetOption[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const endpoint = isStocks
          ? `/strategies/available-stocks?search=${encodeURIComponent(query)}`
          : `/strategies/available-crypto?search=${encodeURIComponent(query)}`;
        const data = await apiRequest<never, AssetOption[]>({ path: endpoint, method: "GET" });
        setResults(data || []);
      } catch (err) {
        console.error("Asset search error:", err);
        if (!isStocks) {
          setResults([{ symbol: query.toUpperCase(), name: query.toUpperCase() }]);
        } else {
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isStocks]);

  return { results, searching, clear: () => setResults([]) };
}

/**
 * Populates the "Quick Add Popular" chips from the real assets API when
 * possible, otherwise falls back to the hardcoded POPULAR_* lists.
 */
export function usePopularAssets(connectionType: string | null | undefined) {
  const [popularCrypto, setPopularCrypto] = useState<string[]>(POPULAR_CRYPTO);
  const [popularStocks, setPopularStocks] = useState<string[]>(POPULAR_STOCKS);

  useEffect(() => {
    if (connectionType !== "stocks" && connectionType !== "crypto") return;
    const assetType = connectionType === "stocks" ? "stock" : "crypto";

    (async () => {
      try {
        const response = await apiRequest<never, any[]>({
          path: `/assets?asset_type=${assetType}&limit=1000`,
          method: "GET",
        });
        if (Array.isArray(response) && response.length > 0) {
          const realSymbols = response.slice(0, 8).map((a: any) => a.symbol || a.asset_id);
          if (assetType === "stock") setPopularStocks(realSymbols);
          else setPopularCrypto(realSymbols);
        }
      } catch (err) {
        console.error(`Failed to fetch real ${assetType} assets:`, err);
      }
    })();
  }, [connectionType]);

  return { popularCrypto, popularStocks };
}
