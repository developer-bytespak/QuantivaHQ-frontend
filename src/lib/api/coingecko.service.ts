/**
 * CoinGecko API Service
 * Fetches cryptocurrency market data from CoinGecko Demo API
 */

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";

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
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add API key header if available and valid (not the header name itself)
    if (COINGECKO_API_KEY && COINGECKO_API_KEY !== "x-cg-demo-api-key" && COINGECKO_API_KEY.length > 10) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
    }

    const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      // If 401 and we have an API key, it might be invalid - try without it
      if (response.status === 401 && COINGECKO_API_KEY) {
        console.warn("CoinGecko API key authentication failed, trying without API key...");
        const retryResponse = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        
        if (!retryResponse.ok) {
          throw new Error(`CoinGecko API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const data = await retryResponse.json();
        return data as CoinGeckoCoin[];
      }
      
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as CoinGeckoCoin[];
  } catch (error) {
    console.error("Failed to fetch top coins from CoinGecko:", error);
    throw error;
  }
}

/**
 * Fetch top 500 cryptocurrencies by market cap
 */
export async function getTop500Coins(): Promise<CoinGeckoCoin[]> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add API key header if available and valid (not the header name itself)
    if (COINGECKO_API_KEY && COINGECKO_API_KEY !== "x-cg-demo-api-key" && COINGECKO_API_KEY.length > 10) {
      headers["x-cg-demo-api-key"] = COINGECKO_API_KEY;
    }

    const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false&price_change_percentage=24h`;
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      // If 401 and we have an API key, it might be invalid - try without it
      if (response.status === 401 && COINGECKO_API_KEY) {
        console.warn("CoinGecko API key authentication failed, trying without API key...");
        const retryResponse = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        
        if (!retryResponse.ok) {
          throw new Error(`CoinGecko API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        const data = await retryResponse.json();
        return data as CoinGeckoCoin[];
      }
      
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as CoinGeckoCoin[];
  } catch (error) {
    console.error("Failed to fetch top 500 coins from CoinGecko:", error);
    throw error;
  }
}

