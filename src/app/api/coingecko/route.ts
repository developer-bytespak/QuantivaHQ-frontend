import { NextRequest, NextResponse } from "next/server";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get("endpoint");
    const limit = searchParams.get("limit") || "5";
    
    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

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

    let url = "";
    
    if (endpoint === "markets") {
      const ids = searchParams.get("ids");
      const perPage = searchParams.get("per_page") || limit;
      url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h${ids ? `&ids=${ids}` : ""}`;
    } else if (endpoint === "coin") {
      const coinId = searchParams.get("coinId");
      if (!coinId) {
        return NextResponse.json(
          { error: "coinId parameter is required for coin endpoint" },
          { status: 400 }
        );
      }
      url = `${COINGECKO_API_URL}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
    } else {
      return NextResponse.json(
        { error: "Invalid endpoint" },
        { status: 400 }
      );
    }

    // Try multiple authentication approaches
    const fetchAttempts = [
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
        return NextResponse.json(data);
      } catch (error: any) {
        const isLastAttempt = i === fetchAttempts.length - 1;
        
        if (isLastAttempt) {
          console.error(`CoinGecko API proxy attempt ${i + 1} failed:`, error);
          return NextResponse.json(
            { error: error.message || "Failed to fetch data from CoinGecko API" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "All fetch attempts failed" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("CoinGecko API proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

