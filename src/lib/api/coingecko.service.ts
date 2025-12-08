/**
 * CoinGecko API Service
 * Fetches cryptocurrency market data from CoinGecko Pro API
 */

// Use backend proxy to avoid CORS issues and keep API key secure
const USE_PROXY = true; // Set to false to use direct API calls
const COINGECKO_API_URL = USE_PROXY ? "/api/coingecko" : "https://api.coingecko.com/api/v3";
// Check both NEXT_PUBLIC_COINGECKO_API_KEY and COINGECKO_API_KEY
// Note: In Next.js, client-side code can only access NEXT_PUBLIC_ prefixed vars
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY || "";

// Debug: Log API key status (only in development, and don't log the actual key)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("CoinGecko API Configuration:", {
    useProxy: USE_PROXY,
    hasKey: !!COINGECKO_API_KEY,
    keyLength: COINGECKO_API_KEY?.length || 0,
    hasNextPublic: !!process.env.NEXT_PUBLIC_COINGECKO_API_KEY,
  });
}

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

    let url: string;
    let requestHeaders = headers;

    if (USE_PROXY) {
      // Use backend proxy - API key is handled server-side
      url = `${COINGECKO_API_URL}?endpoint=coins/markets&vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
      // Remove API key from headers when using proxy (it's handled server-side)
      requestHeaders = {
        "Content-Type": "application/json",
      };
    } else {
      // Direct API call
      url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: requestHeaders,
      cache: "no-store",
    }).catch((fetchError) => {
      // Handle network errors (CORS, connection issues, etc.)
      console.error("Network error fetching from CoinGecko:", fetchError);
      const errorMsg = fetchError.message || "Failed to connect to CoinGecko API";
      
      if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
        throw new Error(`Network error: Unable to connect to CoinGecko API. ${USE_PROXY ? "Backend proxy may be unavailable." : "This could be due to CORS restrictions or network issues."}`);
      }
      
      throw new Error(`Network error: ${errorMsg}`);
    });

    if (!response.ok) {
      // Get error details from response body
      let errorMessage = `CoinGecko API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        // If we can't parse error, use default message
      }

      // If using proxy and got an error, provide helpful message
      if (USE_PROXY && response.status === 500) {
        errorMessage = "Backend proxy error. Please ensure COINGECKO_API_KEY is set in your server environment variables (.env.local file).";
      }

      // If 400 or 401 and we have an API key (and not using proxy), try fallback approaches
      if (!USE_PROXY && (response.status === 400 || response.status === 401) && hasApiKey) {
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

    let url: string;
    let requestHeaders = headers;

    if (USE_PROXY) {
      // Use backend proxy - API key is handled server-side
      url = `${COINGECKO_API_URL}?endpoint=coins/markets&vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false&price_change_percentage=24h`;
      // Remove API key from headers when using proxy (it's handled server-side)
      requestHeaders = {
        "Content-Type": "application/json",
      };
    } else {
      // Direct API call
      url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false&price_change_percentage=24h`;
    }

    // Log request details in development
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.log("CoinGecko API Request:", {
        url,
        useProxy: USE_PROXY,
        hasApiKey: hasApiKey && !USE_PROXY,
        headers: Object.keys(requestHeaders),
      });
    }

    const response = await fetch(url, {
      method: "GET",
      headers: requestHeaders,
      cache: "no-store",
    }).catch((fetchError) => {
      // Handle network errors (CORS, connection issues, etc.)
      console.error("Network error fetching from CoinGecko:", fetchError);
      const errorMsg = fetchError.message || "Failed to connect to CoinGecko API";
      
      // Provide more specific error messages
      if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
        throw new Error(`Network error: Unable to connect to CoinGecko API. This could be due to:
1. CORS restrictions (try using a backend proxy)
2. Network connectivity issues
3. Browser extension blocking the request
4. API key not configured (check NEXT_PUBLIC_COINGECKO_API_KEY in .env.local)`);
      }
      
      throw new Error(`Network error: ${errorMsg}`);
    });

    if (!response.ok) {
      // Get error details from response body
      let errorMessage = `CoinGecko API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        // If we can't parse error, use default message
      }

      // If using proxy and got an error, provide helpful message
      if (USE_PROXY && response.status === 500) {
        errorMessage = "Backend proxy error. Please ensure COINGECKO_API_KEY is set in your server environment variables (.env.local file).";
      }

      // If 400 or 401 and we have an API key (and not using proxy), try fallback approaches
      if (!USE_PROXY && (response.status === 400 || response.status === 401) && hasApiKey) {
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
  } catch (error: any) {
    console.error("Failed to fetch top 500 coins from CoinGecko:", error);
    // Provide more helpful error messages
    if (error.message?.includes("Network error") || error.message?.includes("Failed to fetch")) {
      if (USE_PROXY) {
        throw new Error("Unable to connect to CoinGecko API via backend proxy. Please ensure COINGECKO_API_KEY is set in your .env.local file and restart the development server.");
      }
      throw new Error("Unable to connect to CoinGecko API. This may be due to network issues, CORS restrictions, or API rate limits. Please try again later.");
    }
    throw error;
  }
}

/**
 * Search for a coin by symbol and return its ID
 */
async function searchCoinBySymbol(symbol: string): Promise<string | null> {
  try {
    let url: string;
    if (USE_PROXY) {
      url = `${COINGECKO_API_URL}?endpoint=search&query=${encodeURIComponent(symbol)}`;
    } else {
      const isProApiKey = COINGECKO_API_KEY && COINGECKO_API_KEY.startsWith("CG-");
      const baseUrl = isProApiKey 
        ? "https://pro-api.coingecko.com/api/v3"
        : "https://api.coingecko.com/api/v3";
      url = `${baseUrl}/search?query=${encodeURIComponent(symbol)}`;
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (!USE_PROXY && COINGECKO_API_KEY && COINGECKO_API_KEY.length > 10) {
      const isProApiKey = COINGECKO_API_KEY.startsWith("CG-");
      if (isProApiKey) {
        headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // CoinGecko search API returns: { coins: [{ id, name, symbol, ... }, ...] }
    const coins = data.coins || [];
    
    if (coins.length === 0) {
      return null;
    }
    
    // First, try exact symbol match (case-insensitive)
    const symbolMatch = coins.find((c: any) => 
      c.symbol?.toLowerCase() === symbol.toLowerCase()
    );
    
    if (symbolMatch) {
      return symbolMatch.id;
    }
    
    // If no exact symbol match, try to find by name or ID
    const nameOrIdMatch = coins.find((c: any) => 
      c.name?.toLowerCase() === symbol.toLowerCase() ||
      c.id?.toLowerCase() === symbol.toLowerCase()
    );
    
    if (nameOrIdMatch) {
      return nameOrIdMatch.id;
    }
    
    // If still no match, return the first result (best match from search)
    return coins[0]?.id || null;
  } catch (error) {
    console.error("Failed to search coin by symbol:", error);
    return null;
  }
}

/**
 * Fetch detailed information about a specific coin
 * Accepts either coin ID (e.g., "bitcoin") or symbol (e.g., "BTC")
 */
export async function getCoinDetails(coinIdOrSymbol: string): Promise<any> {
  try {
    let coinId = coinIdOrSymbol.toLowerCase();
    
    // Always try to search by symbol first if it looks like a symbol
    // Symbols are typically 2-5 characters and uppercase
    const isLikelySymbol = coinIdOrSymbol.length >= 2 && 
                          coinIdOrSymbol.length <= 5 && 
                          coinIdOrSymbol === coinIdOrSymbol.toUpperCase();
    
    if (isLikelySymbol) {
      const foundId = await searchCoinBySymbol(coinIdOrSymbol);
      if (foundId) {
        coinId = foundId;
      } else {
        // If search failed, try the lowercase version as coin ID (fallback)
        // Some coins might have symbol-like IDs
      }
    }

    let url: string;
    if (USE_PROXY) {
      url = `${COINGECKO_API_URL}?endpoint=coins/${coinId}&localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`;
    } else {
      const isProApiKey = COINGECKO_API_KEY && COINGECKO_API_KEY.startsWith("CG-");
      const baseUrl = isProApiKey 
        ? "https://pro-api.coingecko.com/api/v3"
        : "https://api.coingecko.com/api/v3";
      url = `${baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`;
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    if (!USE_PROXY && COINGECKO_API_KEY && COINGECKO_API_KEY.length > 10) {
      const isProApiKey = COINGECKO_API_KEY.startsWith("CG-");
      if (isProApiKey) {
        headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    }).catch((fetchError) => {
      throw new Error(`Network error: ${fetchError.message || "Failed to connect to CoinGecko API"}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      // If coin not found and we tried a symbol, provide helpful error
      if (response.status === 404) {
        throw new Error(`Coin "${coinIdOrSymbol}" not found. Please check if the symbol is correct.`);
      }
      
      throw new Error(errorData.error || errorData.message || `CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Failed to fetch coin details from CoinGecko:", error);
    throw error;
  }
}
