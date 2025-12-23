/**
 * Trending Assets API Service
 * Fetches top trending coins from backend database (no CoinGecko rate limits)
 */

import { apiRequest } from './client';

export interface TrendingAsset {
  asset_id: string;
  symbol: string;
  name: string;
  logo_url: string | null;
  coingecko_id: string | null;
  asset_type: string;
  price_usd: number;
  price_change_24h: number;
  price_change_24h_usd: number;
  market_cap: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  galaxy_score: number;
  alt_rank: number;
  social_score: number;
  market_volume: number;
  market_cap_rank: number | null;
  poll_timestamp: string;
  
  // Optional realtime data
  realtime_data?: {
    price: number;
    priceChangePercent: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    quoteVolume24h: number;
  };
}

/**
 * Fetch top N trending assets from backend database
 * @param limit - Number of assets to fetch (default: 20)
 * @param realtime - Whether to enrich with realtime Binance data (default: true)
 */
export async function getTrendingAssets(
  limit: number = 20,
  realtime: boolean = true
): Promise<TrendingAsset[]> {
  try {
    const data = await apiRequest<never, TrendingAsset[]>({
      path: `/strategies/trending-assets?limit=${limit}&realtime=${realtime ? 'true' : 'false'}`,
      method: 'GET',
      timeout: 30000,
    });
    return data || [];
  } catch (error: any) {
    console.error('Failed to fetch trending assets:', error);
    throw new Error(
      error.message || 'Failed to fetch trending assets. Please try again later.',
    );
  }
}

/**
 * Map TrendingAsset to display format for UI components
 */
export function mapTrendingAssetToDisplay(asset: TrendingAsset) {
  return {
    id: asset.asset_id,
    symbol: asset.symbol,
    name: asset.name,
    logoUrl: asset.logo_url,
    price: asset.realtime_data?.price || asset.price_usd,
    change24h: asset.realtime_data?.priceChangePercent || asset.price_change_24h,
    marketCap: asset.market_cap,
    volume24h: asset.realtime_data?.volume24h || asset.volume_24h,
    high24h: asset.realtime_data?.high24h || asset.high_24h,
    low24h: asset.realtime_data?.low24h || asset.low_24h,
  };
}

/**
 * Generate CoinGecko CDN logo URL fallback (client-side)
 * Used when logo_url is not available in database
 */
const COINGECKO_IMAGE_CDN = "https://assets.coingecko.com/coins/images";

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  BNB: "binancecoin",
  ADA: "cardano",
  DOGE: "dogecoin",
  MATIC: "matic-network",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  TRX: "tron",
  TRON: "tron",
  DOT: "polkadot",
  SHIB: "shiba-inu",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  XLM: "stellar",
  ALGO: "algorand",
};

const COIN_IMAGE_IDS: Record<string, number> = {
  BTC: 1,
  ETH: 279,
  SOL: 4128,
  XRP: 52,
  BNB: 1839,
  ADA: 2010,
  DOGE: 5,
  MATIC: 4713,
  LINK: 1975,
  AVAX: 12559,
  TRX: 1958,
  TRON: 1958,
  DOT: 4128,
  SHIB: 11939,
  UNI: 7083,
  ATOM: 3794,
  LTC: 2,
  BCH: 1831,
  XLM: 516,
  ALGO: 4030,
};

export function getCoinGeckoLogoUrl(symbol: string): string | null {
  const s = symbol.toUpperCase();
  const imageId = COIN_IMAGE_IDS[s];
  const coinId = SYMBOL_TO_COINGECKO_ID[s];
  if (imageId && coinId) {
    return `${COINGECKO_IMAGE_CDN}/${imageId}/large/${coinId}.png`;
  }
  return null;
}
