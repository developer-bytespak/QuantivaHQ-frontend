import { NextRequest, NextResponse } from "next/server";

// Strict allowlist of permitted CoinGecko endpoints to prevent SSRF
const ALLOWED_STATIC_ENDPOINTS = new Set([
  "coins/markets",
  "coins/list",
  "search/trending",
  "simple/price",
  "simple/supported_vs_currencies",
  "global",
  "search",
]);

// Pattern for coin detail endpoints: coins/{id} where id is alphanumeric with hyphens
const COIN_DETAIL_REGEX = /^coins\/[a-z0-9-]+$/;

/**
 * CoinGecko API Proxy
 * This endpoint proxies requests to CoinGecko API to avoid CORS issues
 * and keep the API key secure on the server side.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let endpoint = searchParams.get("endpoint") || "coins/markets";
    const params = new URLSearchParams();

    // Handle special case where endpoint contains path parameters (e.g., coins/bitcoin)
    if (endpoint.includes("/") && !endpoint.startsWith("coins/markets")) {
      const endpointParts = endpoint.split("/");
      if (endpointParts[0] === "coins" && endpointParts.length > 1) {
        endpoint = `coins/${endpointParts[1]}`;
      }
    }

    // Validate endpoint against allowlist to prevent SSRF
    if (!ALLOWED_STATIC_ENDPOINTS.has(endpoint) && !COIN_DETAIL_REGEX.test(endpoint)) {
      return NextResponse.json(
        { error: "Invalid endpoint" },
        { status: 400 }
      );
    }

    // Copy all query parameters except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== "endpoint") {
        params.append(key, value);
      }
    });

    // Get API key from server-side environment variable
    const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "";

    // Determine if this is a Pro API key (starts with CG-)
    const isProApiKey = COINGECKO_API_KEY && COINGECKO_API_KEY.startsWith("CG-");
    
    // Use pro-api.coingecko.com for Pro API keys, api.coingecko.com for free/demo keys
    const baseUrl = isProApiKey 
      ? "https://pro-api.coingecko.com/api/v3"
      : "https://api.coingecko.com/api/v3";

    // Debug logging in development (no sensitive data)
    if (process.env.NODE_ENV === "development") {
      console.log("CoinGecko Proxy Request:", {
        endpoint,
        hasApiKey: !!COINGECKO_API_KEY,
        isProApiKey,
      });
    }

    const url = `${baseUrl}/${endpoint}?${params.toString()}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    // Add API key if available - try Pro API key header first
    if (COINGECKO_API_KEY && COINGECKO_API_KEY.length > 10) {
      // CoinGecko Pro API uses x-cg-pro-api-key header
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
    } else {
      console.warn("CoinGecko API key not found or invalid. Make sure COINGECKO_API_KEY is set in .env.local");
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // Log detailed error in development
      if (process.env.NODE_ENV === "development") {
        console.error("CoinGecko API Error:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500), // First 500 chars of error
          error: errorData.error || errorData.message || errorData.status?.error_message,
          errorData: errorData,
          hasApiKey: !!COINGECKO_API_KEY,
          url: url.substring(0, 200), // First 200 chars of URL
        });
      }

      // Extract the actual error message from CoinGecko
      const errorMessage = errorData.status?.error_message || 
                          errorData.error || 
                          errorData.message || 
                          errorText ||
                          `CoinGecko API error: ${response.status} ${response.statusText}`;

      // If 400 Bad Request and we have an API key, try with demo API key header format
      // Some CoinGecko accounts might use x-cg-demo-api-key instead
      if (response.status === 400 && COINGECKO_API_KEY && COINGECKO_API_KEY.length > 10) {
        if (process.env.NODE_ENV === "development") {
          console.log("Trying with x-cg-demo-api-key header format...");
        }
        
        const demoHeaders: HeadersInit = {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        };

        try {
          const retryResponse = await fetch(url, {
            method: "GET",
            headers: demoHeaders,
            cache: "no-store",
          });

          if (retryResponse.ok) {
            const data = await retryResponse.json();
            if (process.env.NODE_ENV === "development") {
              console.log("Success with x-cg-demo-api-key header format");
            }
            return NextResponse.json(data);
          }
        } catch (retryError) {
          console.error("Retry with demo header failed:", retryError);
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          status: response.status,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("CoinGecko proxy error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch data from CoinGecko API",
      },
      { status: 500 }
    );
  }
}

