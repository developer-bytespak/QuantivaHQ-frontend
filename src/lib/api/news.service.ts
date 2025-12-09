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

/**
 * Fetch cryptocurrency news with sentiment analysis and social metrics
 * @param symbol - Optional. If not provided, fetches general crypto news
 */
export async function getCryptoNews(
  symbol?: string,
  limit: number = 2
): Promise<CryptoNewsResponse> {
  try {
    // If no symbol provided, use "CRYPTO" for general news or make it optional
    const symbolParam = symbol ? `&symbol=${encodeURIComponent(symbol)}` : '';
    const response = await apiRequest<never, CryptoNewsResponse>({
      path: `/news/crypto?limit=${limit}${symbolParam}`,
      method: "GET",
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    throw error;
  }
}

/**
 * Fetch general cryptocurrency news (not specific to any coin)
 */
export async function getGeneralCryptoNews(
  limit: number = 20
): Promise<CryptoNewsResponse> {
  try {
    // Use BTC as a general crypto news source, or we can modify backend to support general news
    const response = await apiRequest<never, CryptoNewsResponse>({
      path: `/news/crypto?symbol=BTC&limit=${limit}`,
      method: "GET",
    });
    // Override symbol to show it's general news
    return {
      ...response,
      symbol: "CRYPTO",
    };
  } catch (error) {
    console.error("Failed to fetch general crypto news:", error);
    throw error;
  }
}

