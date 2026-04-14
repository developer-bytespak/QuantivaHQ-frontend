import { apiRequest } from "./client";

export interface CryptoNewsItem {
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

export interface SocialMetrics {
  galaxy_score: number;
  alt_rank: number;
  social_volume: number;
  price: number;
  volume_24h: number;
  market_cap: number;
}

export interface CryptoNewsResponse {
  symbol: string;
  news_items: CryptoNewsItem[];
  social_metrics: SocialMetrics;
  timestamp: string;
}

// Stock News Interfaces
export interface StockNewsItem {
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

export interface StockMarketMetrics {
  total_news_count: number;
  sentiment_summary: {
    positive: number;
    negative: number;
    neutral: number;
  };
  avg_sentiment_score: number;
}

export interface StockNewsResponse {
  symbol: string;
  news_items: StockNewsItem[];
  market_metrics: StockMarketMetrics;
  timestamp: string;
}

// Per-symbol response cache. Collapses duplicate back-to-back calls from
// multiple components rendering at the same time so we don't fan out to the
// backend (and ultimately LunarCrush) on every mount. 2-minute TTL is
// generous enough to cover a user navigating between pages without feeling
// stale.
const CRYPTO_NEWS_TTL_MS = 2 * 60 * 1000;
const cryptoNewsCache = new Map<string, { data: CryptoNewsResponse; ts: number }>();
const cryptoNewsInflight = new Map<string, Promise<CryptoNewsResponse>>();

/**
 * Fetch cryptocurrency news with sentiment analysis and social metrics
 * @param symbol - Optional. If not provided, fetches general crypto news
 */
export async function getCryptoNews(
  symbol?: string,
  limit: number = 2
): Promise<CryptoNewsResponse> {
  const cacheKey = `${symbol ?? "__all__"}:${limit}`;
  const now = Date.now();

  // Fresh cache hit
  const cached = cryptoNewsCache.get(cacheKey);
  if (cached && now - cached.ts < CRYPTO_NEWS_TTL_MS) {
    return cached.data;
  }

  // In-flight dedup: if another caller is already fetching, share its promise
  const pending = cryptoNewsInflight.get(cacheKey);
  if (pending) {
    return pending;
  }

  const symbolParam = symbol ? `&symbol=${encodeURIComponent(symbol)}` : "";
  const promise = apiRequest<never, CryptoNewsResponse>({
    path: `/news/crypto?limit=${limit}${symbolParam}`,
    method: "GET",
  })
    .then((response) => {
      cryptoNewsCache.set(cacheKey, { data: response, ts: Date.now() });
      return response;
    })
    .catch((error) => {
      console.error("Failed to fetch crypto news:", error);
      // Serve stale on error if we have it, otherwise propagate
      if (cached) return cached.data;
      throw error;
    })
    .finally(() => {
      cryptoNewsInflight.delete(cacheKey);
    });

  cryptoNewsInflight.set(cacheKey, promise);
  return promise;
}

/**
 * Fetch general cryptocurrency news (not specific to any coin)
 */
export async function getGeneralCryptoNews(
  limit: number = 20
): Promise<{ total_count: number; news_items: Array<CryptoNewsItem & { symbol: string }>; timestamp: string }> {
  try {
    // Use new /news/all endpoint to get news for all coins
    const response = await apiRequest<never, { total_count: number; news_items: Array<CryptoNewsItem & { symbol: string }>; timestamp: string }>({
      path: `/news/all?limit=${limit}`,
      method: "GET",
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch general crypto news:", error);
    throw error;
  }
}

// ============== STOCK NEWS FUNCTIONS ==============

/**
 * Fetch stock news with sentiment analysis
 * @param symbol - Stock symbol (e.g., AAPL, TSLA)
 * @param limit - Number of news items to return
 */
export async function getStockNews(
  symbol: string,
  limit: number = 10
): Promise<StockNewsResponse> {
  try {
    const response = await apiRequest<never, StockNewsResponse>({
      path: `/news/stocks?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
      method: "GET",
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch stock news:", error);
    throw error;
  }
}

/**
 * Fetch general stock news (not specific to any stock)
 */
export async function getGeneralStockNews(
  limit: number = 20
): Promise<{ total_count: number; news_items: Array<StockNewsItem & { symbol: string }>; timestamp: string }> {
  try {
    const response = await apiRequest<never, { total_count: number; news_items: Array<StockNewsItem & { symbol: string }>; timestamp: string }>({
      path: `/news/stocks/all?limit=${limit}`,
      method: "GET",
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch general stock news:", error);
    throw error;
  }
}

/**
 * Force refresh stock news from Python API
 * @param symbol - Stock symbol to refresh
 */
export async function refreshStockNews(symbol: string): Promise<{ message: string; symbol: string; status: string }> {
  try {
    const response = await apiRequest<never, { message: string; symbol: string; status: string }>({
      path: `/news/stocks/refresh/${encodeURIComponent(symbol)}`,
      method: "POST",
    });
    return response;
  } catch (error) {
    console.error("Failed to refresh stock news:", error);
    throw error;
  }
}

