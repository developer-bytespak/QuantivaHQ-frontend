/**
 * CoinGecko API Service
 * Fetches cryptocurrency market data from NestJS backend (which calls CoinGecko API)
 * API key is stored securely in backend .env file
 */

import { apiRequest } from './client';

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

/**
 * Fetch top N cryptocurrencies by market cap
 */
export async function getTopCoins(limit: number = 5): Promise<CoinGeckoCoin[]> {
  try {
    const data = await apiRequest<never, CoinGeckoCoin[]>({
      path: `/api/market/coins/top?limit=${limit}`,
      method: 'GET',
      timeout: 30000,
    });
    return data;
  } catch (error: any) {
    console.error('Failed to fetch top coins from backend:', error);
    throw new Error(
      error.message || 'Failed to fetch top coins. Please ensure the backend is running and COINGECKO_API_KEY is configured.',
    );
  }
}

/**
 * Fetch top 500 cryptocurrencies by market cap
 */
export async function getTop500Coins(): Promise<CoinGeckoCoin[]> {
  try {
    const data = await apiRequest<never, CoinGeckoCoin[]>({
      path: '/api/market/coins/top500',
      method: 'GET',
      timeout: 30000,
    });
    return data;
  } catch (error: any) {
    console.error('Failed to fetch top 500 coins from backend:', error);
    throw new Error(
      error.message || 'Failed to fetch top 500 coins. Please ensure the backend is running and COINGECKO_API_KEY is configured.',
    );
  }
}

/**
 * Fetch cached market data from database (updated every 5 minutes)
 * Much faster than live CoinGecko API calls
 */
export async function getCachedMarketData(
  limit: number = 500,
  search?: string,
): Promise<{ coins: CoinGeckoCoin[]; lastSyncTime: string | null }> {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    if (search) {
      queryParams.append('search', search);
    }

    const data = await apiRequest<never, { coins: CoinGeckoCoin[]; lastSyncTime: string | null }>({
      path: `/api/market/coins/cached?${queryParams.toString()}`,
      method: 'GET',
      timeout: 10000, // Faster timeout since it's from database
    });
    return data;
  } catch (error: any) {
    console.error('Failed to fetch cached market data from backend:', error);
    throw new Error(
      error.message || 'Failed to fetch market data from database. Please ensure the backend is running.',
    );
  }
}

/**
 * Search for a coin by symbol and return its ID
 */
async function searchCoinBySymbol(symbol: string): Promise<string | null> {
  try {
    const response = await apiRequest<never, { coinId: string | null }>({
      path: `/api/market/coins/search?query=${encodeURIComponent(symbol)}`,
      method: 'GET',
      timeout: 10000,
    });
    return response.coinId;
  } catch (error) {
    console.error('Failed to search coin by symbol:', error);
    return null;
  }
}

/**
 * Fetch detailed information about a specific coin
 * Accepts either coin ID (e.g., "bitcoin") or symbol (e.g., "BTC")
 */
export async function getCoinDetails(coinIdOrSymbol: string): Promise<any> {
  try {
    const data = await apiRequest<never, any>({
      path: `/api/market/coins/${encodeURIComponent(coinIdOrSymbol)}`,
      method: 'GET',
      timeout: 30000,
    });
    return data;
  } catch (error: any) {
    console.error('Failed to fetch coin details from backend:', error);
    throw new Error(
      error.message || `Failed to fetch coin details for "${coinIdOrSymbol}". Please ensure the backend is running and COINGECKO_API_KEY is configured.`,
    );
  }
}

/**
 * Fetch all coins available on Binance from CoinGecko exchange endpoint
 * Uses CoinGecko Pro API to get all trading pairs on Binance
 * Returns a set of coin IDs for easy lookup
 */
export async function getBinanceCoins(): Promise<Set<string>> {
  try {
    console.log('Calling backend endpoint: /api/market/exchanges/binance/coins');
    
    const data = await apiRequest<never, { coins: string[] }>({
      path: '/api/market/exchanges/binance/coins',
      method: 'GET',
      timeout: 30000,
    });
    
    console.log(`✅ Backend response received with ${data.coins.length} coins`);
    
    if (!data.coins || data.coins.length === 0) {
      console.warn('⚠️ Backend returned empty coins array');
      return new Set();
    }
    
    const coinsSet = new Set(data.coins);
    console.log(`📊 Created Set with ${coinsSet.size} unique coins`);
    console.log(`📋 Sample coins from backend:`, Array.from(coinsSet).slice(0, 5));
    
    return coinsSet;
    
  } catch (error: any) {
    console.error('❌ Failed to fetch Binance coins from backend');
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
    });
    throw new Error(
      error.message || 'Failed to fetch Binance coins. Please ensure the backend is running and endpoint /api/market/exchanges/binance/coins exists.',
    );
  }
}
