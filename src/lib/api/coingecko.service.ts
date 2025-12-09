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
  // Use API proxy to avoid CORS issues
  if (USE_PROXY) {
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

  // Direct fetch attempts (if proxy failed or not using proxy)
  const hasApiKey = !!COINGECKO_API_KEY;
  let url: string;
  let requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (USE_PROXY) {
    // Use backend proxy - API key is handled server-side
    url = `${COINGECKO_API_URL}?endpoint=coins/markets&vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
  } else {
    // Direct API call
    url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    if (hasApiKey) {
      requestHeaders = {
        ...requestHeaders,
        "x-cg-pro-api-key": COINGECKO_API_KEY,
      };
    }
  }

  // Try multiple fetch strategies
  const fetchStrategies = [
    // First attempt: with current headers
    async () => {
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
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    
    // Second attempt: with demo API key header (if we have an API key and not using proxy)
    ...(hasApiKey && !USE_PROXY ? [async () => {
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
    
    // Third attempt: without API key (free tier, only if not using proxy)
    ...(!USE_PROXY ? [async () => {
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
    }] : []),
  ];

  // Try each strategy in sequence
  for (const strategy of fetchStrategies) {
    try {
      const data = await strategy();
      return data as CoinGeckoCoin[];
    } catch (error: any) {
      // If this is the last strategy, throw the error
      if (fetchStrategies.indexOf(strategy) === fetchStrategies.length - 1) {
        throw error;
      }
      // Otherwise, continue to next strategy
      console.warn("Fetch strategy failed, trying next:", error.message);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("All fetch strategies failed");
}

/**
 * Fetch top 500 cryptocurrencies by market cap
 */
export async function getTop500Coins(): Promise<CoinGeckoCoin[]> {
  // Use API proxy to avoid CORS issues
  if (USE_PROXY) {
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

  // Direct fetch attempts (if proxy failed or not using proxy)
  const hasApiKey = !!COINGECKO_API_KEY;
  let url: string;
  let requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (USE_PROXY) {
    // Use backend proxy - API key is handled server-side
    url = `${COINGECKO_API_URL}?endpoint=coins/markets&vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false&price_change_percentage=24h`;
  } else {
    // Direct API call
    url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=500&page=1&sparkline=false&price_change_percentage=24h`;
    if (hasApiKey) {
      requestHeaders = {
        ...requestHeaders,
        "x-cg-pro-api-key": COINGECKO_API_KEY,
      };
    }
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

  // Try multiple fetch strategies
  const fetchStrategies = [
    // First attempt: with current headers
    async () => {
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
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    },
    
    // Second attempt: with demo API key header (if we have an API key and not using proxy)
    ...(hasApiKey && !USE_PROXY ? [async () => {
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
    
    // Third attempt: without API key (free tier, only if not using proxy)
    ...(!USE_PROXY ? [async () => {
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
    }] : []),
  ];

  // Try each strategy in sequence
  for (const strategy of fetchStrategies) {
    try {
      const data = await strategy();
      return data as CoinGeckoCoin[];
    } catch (error: any) {
      // If this is the last strategy, throw the error
      if (fetchStrategies.indexOf(strategy) === fetchStrategies.length - 1) {
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
      // Otherwise, continue to next strategy
      console.warn("Fetch strategy failed, trying next:", error.message);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("All fetch strategies failed");
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

  throw new Error("All CoinGecko API fetch attempts failed");
}
