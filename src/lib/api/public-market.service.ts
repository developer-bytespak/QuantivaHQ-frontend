/**
 * Public Binance market data — no exchange connection required.
 *
 * Backed by /api/market/binance/* endpoints which proxy Binance's public
 * REST endpoints via the backend BinanceService (TTL-cached, IP-rate-limit
 * aware). Used by the market-detail page when the user hasn't connected an
 * exchange yet, so they can still see prices, charts, order book and recent
 * trades for crypto symbols. Trading actions still require a connection.
 */

import { apiRequest } from "./client";
import type { OrderBook, RecentTrade, CandleData } from "./exchanges.service";

export interface PublicTickerResponse {
  price: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

export async function getPublicTicker(symbol: string): Promise<PublicTickerResponse> {
  return apiRequest<undefined, PublicTickerResponse>({
    path: `/api/market/binance/ticker?symbol=${encodeURIComponent(symbol)}`,
    method: "GET",
  });
}

export async function getPublicKlines(
  symbol: string,
  interval: string = "1h",
  limit: number = 200,
): Promise<CandleData[]> {
  return apiRequest<undefined, CandleData[]>({
    path: `/api/market/binance/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
    method: "GET",
  });
}

export async function getPublicDepth(
  symbol: string,
  limit: number = 20,
): Promise<OrderBook> {
  return apiRequest<undefined, OrderBook>({
    path: `/api/market/binance/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
    method: "GET",
  });
}

export async function getPublicTrades(
  symbol: string,
  limit: number = 50,
): Promise<RecentTrade[]> {
  return apiRequest<undefined, RecentTrade[]>({
    path: `/api/market/binance/trades?symbol=${encodeURIComponent(symbol)}&limit=${limit}`,
    method: "GET",
  });
}
