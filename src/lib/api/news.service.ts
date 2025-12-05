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
 */
export async function getCryptoNews(
  symbol: string,
  limit: number = 2
): Promise<CryptoNewsResponse> {
  try {
    const response = await apiRequest<never, CryptoNewsResponse>({
      path: `/news/crypto?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
      method: "GET",
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    throw error;
  }
}

