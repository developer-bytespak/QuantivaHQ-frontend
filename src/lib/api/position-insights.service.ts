import { apiRequest } from "./client";

export type PositionAssetType = "crypto" | "stock";

export interface PositionInsightItem {
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string | null;
  sentiment: {
    label: string;
    score: number;
    confidence: number;
  };
}

export interface PositionInsightResponse {
  symbol: string;
  assetType: PositionAssetType;
  news_items: PositionInsightItem[];
  sentimentSummary: {
    positive: number;
    negative: number;
    neutral: number;
  };
  marketMood: "bullish" | "bearish" | "neutral";
  refreshing: boolean;
  generatedAt: string;
  freshness?: string;
  lastUpdatedAt?: string | null;
}

const TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, { data: PositionInsightResponse; ts: number }>();
const inflight = new Map<string, Promise<PositionInsightResponse>>();

export async function getPositionInsight(
  symbol: string,
  assetType: PositionAssetType,
): Promise<PositionInsightResponse> {
  const key = `${assetType}:${symbol.toUpperCase()}`;
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && now - cached.ts < TTL_MS) return cached.data;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = apiRequest<never, PositionInsightResponse>({
    path: `/insights/position?symbol=${encodeURIComponent(symbol)}&assetType=${assetType}`,
    method: "GET",
  })
    .then((res) => {
      // Don't cache cold-refresh responses — we want subsequent polls to
      // hit the backend so they see the eventually-warm data.
      if (!res.refreshing) {
        cache.set(key, { data: res, ts: Date.now() });
      }
      return res;
    })
    .catch((err) => {
      if (cached) return cached.data;
      throw err;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
