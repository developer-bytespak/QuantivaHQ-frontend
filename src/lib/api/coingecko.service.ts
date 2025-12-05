/**
 * CoinGecko API Service
 * Fetches cryptocurrency market data from CoinGecko Pro API
 */

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
// Check both NEXT_PUBLIC_COINGECKO_API_KEY and COINGECKO_API_KEY
// Note: In Next.js, client-side code can only access NEXT_PUBLIC_ prefixed vars
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY || "";

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
    const hasApiKey = COINGECKO_API_KEY && 
                      COINGECKO_API_KEY !== "x-cg-demo-api-key" && 
                      COINGECKO_API_KEY !== "x-cg-pro-api-key" &&
                      COINGECKO_API_KEY.length > 10;
    
    if (hasApiKey) {
      // Use Pro API key header for paid accounts
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
    }

    const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      // Get error details from response body
      let errorMessage = `CoinGecko API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorMessage += ` - ${errorData.error || errorData.message}`;
        }
      } catch {
        // If we can't parse error, use default message
      }

      // If 400 or 401 and we have an API key, try fallback approaches
      if ((response.status === 400 || response.status === 401) && hasApiKey) {
        // Try with demo API key header (in case it's actually a demo key)
        console.warn("CoinGecko Pro API key failed, trying demo API key format...");
        const demoHeaders: HeadersInit = {
          "Content-Type": "application/json",
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        };
        
        const demoResponse = await fetch(url, {
          method: "GET",
          headers: demoHeaders,
          cache: "no-store",
        });
        
        if (demoResponse.ok) {
          const data = await demoResponse.json();
          return data as CoinGeckoCoin[];
        }
        
        // If demo key also fails, try without API key (fallback to free tier)
        console.warn("CoinGecko API key authentication failed, trying without API key (free tier)...");
        const retryResponse = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        
        if (!retryResponse.ok) {
          let retryError = `CoinGecko API error: ${retryResponse.status} ${retryResponse.statusText}`;
          try {
            const retryErrorData = await retryResponse.json();
            if (retryErrorData.error || retryErrorData.message) {
              retryError += ` - ${retryErrorData.error || retryErrorData.message}`;
            }
          } catch {
            // If we can't parse error, use default message
          }
          throw new Error(retryError);
        }
        
        const data = await retryResponse.json();
        return data as CoinGeckoCoin[];
      }
      
      throw new Error(errorMessage);
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
    const hasApiKey = COINGECKO_API_KEY && 
                      COINGECKO_API_KEY !== "x-cg-demo-api-key" && 
                      COINGECKO_API_KEY !== "x-cg-pro-api-key" &&
                      COINGECKO_API_KEY.length > 10;
    
    if (hasApiKey) {
      // Use Pro API key header for paid accounts
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
    }

    const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false&price_change_percentage=24h`;
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      // Get error details from response body
      let errorMessage = `CoinGecko API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorMessage += ` - ${errorData.error || errorData.message}`;
        }
      } catch {
        // If we can't parse error, use default message
      }

      // If 400 or 401 and we have an API key, try fallback approaches
      if ((response.status === 400 || response.status === 401) && hasApiKey) {
        // Try with demo API key header (in case it's actually a demo key)
        console.warn("CoinGecko Pro API key failed, trying demo API key format...");
        const demoHeaders: HeadersInit = {
          "Content-Type": "application/json",
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        };
        
        const demoResponse = await fetch(url, {
          method: "GET",
          headers: demoHeaders,
          cache: "no-store",
        });
        
        if (demoResponse.ok) {
          const data = await demoResponse.json();
          return data as CoinGeckoCoin[];
        }
        
        // If demo key also fails, try without API key (fallback to free tier)
        console.warn("CoinGecko API key authentication failed, trying without API key (free tier)...");
        const retryResponse = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        
        if (!retryResponse.ok) {
          let retryError = `CoinGecko API error: ${retryResponse.status} ${retryResponse.statusText}`;
          try {
            const retryErrorData = await retryResponse.json();
            if (retryErrorData.error || retryErrorData.message) {
              retryError += ` - ${retryErrorData.error || retryErrorData.message}`;
            }
          } catch {
            // If we can't parse error, use default message
          }
          throw new Error(retryError);
        }
        
        const data = await retryResponse.json();
        return data as CoinGeckoCoin[];
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as CoinGeckoCoin[];
  } catch (error) {
    console.error("Failed to fetch top 500 coins from CoinGecko:", error);
    throw error;
  }
}
