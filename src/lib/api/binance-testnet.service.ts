import { apiRequest } from "./client";

interface TestnetBalance {
  balances: Array<{
    asset: string;
    free: number;
    locked: number;
  }>;
  totalBalanceUSD: number;
}

interface TestnetOrder {
  orderId: number;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  quantity: number;
  price: number;
  status: "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "REJECTED" | "EXPIRED";
  timestamp: number;
  executedQuantity: number;
  cumulativeQuoteAssetTransacted: number | null;
}

interface PlaceOrderPayload {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  quantity: number;
  price?: number;
}

class BinanceTestnetService {
  private basePath = "/binance-testnet";

  async getStatus() {
    return apiRequest({ path: `${this.basePath}/status` });
  }

  async getAvailableSymbols(): Promise<{ symbols: string[]; count: number; source: string }> {
    return apiRequest({ path: `${this.basePath}/symbols` });
  }

  async verifyConnection(): Promise<{ valid: boolean }> {
    return apiRequest({ path: `${this.basePath}/verify`, method: "POST" });
  }

  async getAccountBalance(): Promise<TestnetBalance> {
    return apiRequest({ path: `${this.basePath}/balance` });
  }

  async getOpenOrders(symbol?: string): Promise<TestnetOrder[]> {
    const params = new URLSearchParams();
    if (symbol) params.append("symbol", symbol);
    return apiRequest({ path: `${this.basePath}/orders${params.toString() ? "?" + params : ""}` });
  }

  async getOrdersFromDB(limit?: number): Promise<{ orders: TestnetOrder[] }> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    return apiRequest({ path: `${this.basePath}/orders/db${params.toString() ? "?" + params : ""}` });
  }

  async getAllOrders(symbol?: string, limit?: number): Promise<TestnetOrder[]> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());

    console.log(`[Binance API] Fetching synced orders: ${this.basePath}/orders/synced?${params.toString()}`);

    const data: any = await apiRequest({ path: `${this.basePath}/orders/synced${params.toString() ? "?" + params : ""}` });

    console.log(`[Binance API] Raw response data:`, data);
    const orders = Array.isArray(data) ? data : data?.orders || [];
    console.log(`[Binance API] Parsed orders count:`, orders.length);
    console.log(`[Binance API] Sample order:`, orders[0]);
    return orders;
  }

  async placeOrder(payload: PlaceOrderPayload): Promise<TestnetOrder> {
    return apiRequest({ path: `${this.basePath}/orders/place`, method: "POST", body: payload });
  }

  async cancelOrder(orderId: string, symbol: string): Promise<TestnetOrder> {
    return apiRequest({ path: `${this.basePath}/orders/${orderId}?symbol=${symbol}`, method: "DELETE" });
  }

  async getTickerPrice(symbol: string): Promise<{ symbol: string; price: number; timestamp: number }> {
    return apiRequest({ path: `${this.basePath}/ticker/${symbol}` });
  }

  async get24hTicker(symbol: string): Promise<any> {
    return apiRequest({ path: `${this.basePath}/ticker24h/${symbol}` });
  }

  async getOrderBook(symbol: string, limit?: number): Promise<{ symbol: string; bids: Array<[number, number]>; asks: Array<[number, number]>; timestamp: number }> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    return apiRequest({ path: `${this.basePath}/orderbook/${symbol}${params.toString() ? "?" + params : ""}` });
  }

  async getRecentTrades(symbol: string, limit?: number): Promise<Array<any>> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    return apiRequest({ path: `${this.basePath}/trades/${symbol}${params.toString() ? "?" + params : ""}` });
  }

  async getCandlestick(symbol: string, interval?: string, limit?: number): Promise<Array<any>> {
    const params = new URLSearchParams();
    if (interval) params.append("interval", interval);
    if (limit) params.append("limit", limit.toString());
    return apiRequest({ path: `${this.basePath}/candles/${symbol}${params.toString() ? "?" + params : ""}` });
  }

  async getDashboardData(symbols: string[] = ["BTCUSDT", "ETHUSDT"]): Promise<any> {
    const params = new URLSearchParams();
    params.append("symbols", symbols.join(","));
    return apiRequest({ path: `${this.basePath}/dashboard?${params}` });
  }

  // ==========================================
  // CRYPTO AUTO-TRADING ENDPOINTS
  // ==========================================

  async getCryptoAutoTradingStatus(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/status` });
  }

  async getCryptoAutoTradingStats(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/stats` });
  }

  async getCryptoAutoTradingSummary(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/summary` });
  }

  async getCryptoAutoTradingTrades(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/trades` });
  }

  async getCryptoAutoTradingMessages(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/messages` });
  }

  async getCryptoOcoOrders(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/oco-orders` });
  }

  async startCryptoAutoTrading(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/start`, method: "POST" });
  }

  async pauseCryptoAutoTrading(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/pause`, method: "POST" });
  }

  async resumeCryptoAutoTrading(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/resume`, method: "POST" });
  }

  async stopCryptoAutoTrading(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/stop`, method: "POST" });
  }

  async resetCryptoAutoTrading(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/reset`, method: "POST" });
  }

  async executeCryptoAutoTradeNow(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/execute-now`, method: "POST" });
  }

  async executeCryptoSingleTrade(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/execute-single`, method: "POST" });
  }

  async getCryptoAutoTradingConnection(): Promise<any> {
    return apiRequest({ path: `${this.basePath}/auto-trading/connection` });
  }
}

export const binanceTestnetService = new BinanceTestnetService();
