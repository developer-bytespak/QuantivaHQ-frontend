/**
 * CoinGecko API Service
 * Fetches cryptocurrency market data from CoinGecko Pro API
 */

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
// Check both NEXT_PUBLIC_COINGECKO_API_KEY and COINGECKO_API_KEY
// Note: In Next.js, client-side code can only access NEXT_PUBLIC_ prefixed vars
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY || "";

// Use API route proxy to avoid CORS issues
const USE_API_PROXY = true; // Set to false to use direct API calls

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
  // Use API proxy to avoid CORS issues
  if (USE_API_PROXY) {
    try {
      const proxyUrl = `/api/coingecko?endpoint=markets&limit=${limit}`;
      const response = await fetch(proxyUrl, {
        method: "GET",
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as CoinGeckoCoin[];
    } catch (error: any) {
      console.error("CoinGecko API proxy failed, trying direct fetch:", error);
      // Fall through to direct fetch
    }
  }

  // Direct API fetch (fallback or if proxy is disabled)
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const hasApiKey = COINGECKO_API_KEY && 
                    COINGECKO_API_KEY !== "x-cg-demo-api-key" && 
                    COINGECKO_API_KEY !== "x-cg-pro-api-key" &&
                    COINGECKO_API_KEY.length > 10;
  
  if (hasApiKey) {
    headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
  }

  const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
  
  // Try multiple approaches to fetch data
  const fetchAttempts = [
    // First attempt: with API key if available
    async () => {
      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    },
    
    // Second attempt: with demo API key header (if we have an API key)
    ...(hasApiKey ? [async () => {
      const demoHeaders: HeadersInit = {
        "Content-Type": "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY,
      };
      const response = await fetch(url, {
        method: "GET",
        headers: demoHeaders,
        cache: "no-store",
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }] : []),
    
    // Third attempt: without API key (free tier)
    async () => {
      const freeHeaders: HeadersInit = {
        "Content-Type": "application/json",
      };
      const response = await fetch(url, {
        method: "GET",
        headers: freeHeaders,
        cache: "no-store",
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    },
  ];

  // Try each fetch attempt
  for (let i = 0; i < fetchAttempts.length; i++) {
    try {
      const data = await fetchAttempts[i]();
      return data as CoinGeckoCoin[];
    } catch (error: any) {
      const isLastAttempt = i === fetchAttempts.length - 1;
      
      if (isLastAttempt) {
        console.error(`CoinGecko API fetch attempt ${i + 1} failed:`, error);
        
        if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
          throw new Error("Network error: Unable to connect to CoinGecko API. Please check your internet connection.");
        }
        
        throw error;
      } else {
        console.warn(`CoinGecko API fetch attempt ${i + 1} failed, trying next approach...`, error.message);
      }
    }
  }

  throw new Error("All CoinGecko API fetch attempts failed");
}

/**
 * Fetch top 500 cryptocurrencies by market cap
 */
export async function getTop500Coins(): Promise<CoinGeckoCoin[]> {
  // Use API proxy to avoid CORS issues
  if (USE_API_PROXY) {
    try {
      const proxyUrl = `/api/coingecko?endpoint=markets&limit=500`;
      const response = await fetch(proxyUrl, {
        method: "GET",
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as CoinGeckoCoin[];
    } catch (error: any) {
      console.error("CoinGecko API proxy failed, trying direct fetch:", error);
      // Fall through to direct fetch
    }
  }

  // Direct API fetch (fallback or if proxy is disabled)
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const hasApiKey = COINGECKO_API_KEY && 
                    COINGECKO_API_KEY !== "x-cg-demo-api-key" && 
                    COINGECKO_API_KEY !== "x-cg-pro-api-key" &&
                    COINGECKO_API_KEY.length > 10;
  
  if (hasApiKey) {
    headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
  }

  const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false&price_change_percentage=24h`;
  
  // Try multiple approaches to fetch data
  const fetchAttempts = [
    // First attempt: with API key if available
    async () => {
      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    },
    
    // Second attempt: with demo API key header (if we have an API key)
    ...(hasApiKey ? [async () => {
      const demoHeaders: HeadersInit = {
        "Content-Type": "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY,
      };
      const response = await fetch(url, {
        method: "GET",
        headers: demoHeaders,
        cache: "no-store",
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }] : []),
    
    // Third attempt: without API key (free tier)
    async () => {
      const freeHeaders: HeadersInit = {
        "Content-Type": "application/json",
      };
      const response = await fetch(url, {
        method: "GET",
        headers: freeHeaders,
        cache: "no-store",
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    },
  ];

  // Try each fetch attempt
  for (let i = 0; i < fetchAttempts.length; i++) {
    try {
      const data = await fetchAttempts[i]();
      return data as CoinGeckoCoin[];
    } catch (error: any) {
      const isLastAttempt = i === fetchAttempts.length - 1;
      
      if (isLastAttempt) {
        console.error(`CoinGecko API fetch attempt ${i + 1} failed:`, error);
        
        if (error.message?.includes("Failed to fetch") || error.name === "TypeError") {
          throw new Error("Network error: Unable to connect to CoinGecko API. Please check your internet connection and try again.");
        }
        
        throw error;
      } else {
        console.warn(`CoinGecko API fetch attempt ${i + 1} failed, trying next approach...`, error.message);
      }
    }
  }

  throw new Error("All CoinGecko API fetch attempts failed");
}
