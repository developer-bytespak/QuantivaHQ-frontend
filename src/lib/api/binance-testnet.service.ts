const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  private baseUrl = `${API_BASE_URL}/binance-testnet`;

  /**
   * Get testnet status
   */
  async getStatus() {
    const response = await fetch(`${this.baseUrl}/status`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get testnet status");
    }

    return response.json();
  }

  /**
   * Get available trading symbols from testnet
   */
  async getAvailableSymbols(): Promise<{ symbols: string[]; count: number; source: string }> {
    const response = await fetch(`${this.baseUrl}/symbols`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get available symbols");
    }

    return response.json();
  }

  /**
   * Verify testnet connection
   */
  async verifyConnection(): Promise<{ valid: boolean }> {
    const response = await fetch(`${this.baseUrl}/verify`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to verify testnet connection");
    }

    return response.json();
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<TestnetBalance> {
    const response = await fetch(`${this.baseUrl}/balance`, {
      credentials: "include",
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch testnet balance";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response body is not JSON, use status text
        errorMessage = `Failed to fetch testnet balance: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string): Promise<TestnetOrder[]> {
    const params = new URLSearchParams();
    if (symbol) params.append("symbol", symbol);

    const response = await fetch(
      `${this.baseUrl}/orders${params.toString() ? "?" + params : ""}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to fetch open orders";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `Failed to fetch open orders: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get all orders from database synced with fresh Binance API data
   */
  async getAllOrders(symbol?: string, limit?: number): Promise<TestnetOrder[]> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());

    console.log(`[Binance API] Fetching synced orders: ${this.baseUrl}/orders/synced?${params.toString()}`);

    const response = await fetch(
      `${this.baseUrl}/orders/synced${params.toString() ? "?" + params : ""}`,
      {
        credentials: "include",
      }
    );

    console.log(`[Binance API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = "Failed to fetch synced orders";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error(`[Binance API] Error response:`, errorData);
      } catch {
        errorMessage = `Failed to fetch orders: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[Binance API] Raw response data:`, data);
    
    // Backend returns { orders: [...] }, extract the array
    const orders = Array.isArray(data) ? data : data?.orders || [];
    console.log(`[Binance API] Parsed orders count:`, orders.length);
    console.log(`[Binance API] Sample order:`, orders[0]);
    
    return orders;
  }

  /**
   * Place an order on testnet
   */
  async placeOrder(payload: PlaceOrderPayload): Promise<TestnetOrder> {
    const response = await fetch(`${this.baseUrl}/orders/place`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to place order");
    }

    return response.json();
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, symbol: string): Promise<TestnetOrder> {
    const response = await fetch(
      `${this.baseUrl}/orders/${orderId}?symbol=${symbol}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to cancel order");
    }

    return response.json();
  }

  /**
   * Get ticker price
   */
  async getTickerPrice(symbol: string): Promise<{
    symbol: string;
    price: number;
    timestamp: number;
  }> {
    const response = await fetch(`${this.baseUrl}/ticker/${symbol}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch ticker price");
    }

    return response.json();
  }

  /**
   * Get 24h ticker data
   */
  async get24hTicker(symbol: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/ticker24h/${symbol}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch 24h ticker");
    }

    return response.json();
  }

  /**
   * Get order book
   */
  async getOrderBook(
    symbol: string,
    limit?: number
  ): Promise<{
    symbol: string;
    bids: Array<[number, number]>;
    asks: Array<[number, number]>;
    timestamp: number;
  }> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(
      `${this.baseUrl}/orderbook/${symbol}${params.toString() ? "?" + params : ""}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch order book");
    }

    return response.json();
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(symbol: string, limit?: number): Promise<Array<any>> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(
      `${this.baseUrl}/trades/${symbol}${params.toString() ? "?" + params : ""}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recent trades");
    }

    return response.json();
  }

  /**
   * Get candlestick data
   */
  async getCandlestick(
    symbol: string,
    interval?: string,
    limit?: number
  ): Promise<Array<any>> {
    const params = new URLSearchParams();
    if (interval) params.append("interval", interval);
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(
      `${this.baseUrl}/candles/${symbol}${params.toString() ? "?" + params : ""}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch candlestick data");
    }

    return response.json();
  }

  /**
   * Get dashboard data (combined)
   */
  async getDashboardData(symbols: string[] = ["BTCUSDT", "ETHUSDT"]): Promise<any> {
    const params = new URLSearchParams();
    params.append("symbols", symbols.join(","));

    const response = await fetch(
      `${this.baseUrl}/dashboard?${params}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    return response.json();
  }

  // ==========================================
  // CRYPTO AUTO-TRADING ENDPOINTS
  // ==========================================

  /**
   * Get crypto auto-trading status (poll every 3 seconds)
   */
  async getCryptoAutoTradingStatus(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/status`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get crypto auto-trading status");
    return response.json();
  }

  /**
   * Get comprehensive crypto auto-trading stats
   */
  async getCryptoAutoTradingStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/stats`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get crypto auto-trading stats");
    return response.json();
  }

  /**
   * Get quick summary (lightweight for fast polling)
   */
  async getCryptoAutoTradingSummary(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/summary`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get crypto auto-trading summary");
    return response.json();
  }

  /**
   * Get recent crypto auto-trades
   */
  async getCryptoAutoTradingTrades(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/trades`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get crypto auto-trading trades");
    return response.json();
  }

  /**
   * Get AI messages
   */
  async getCryptoAutoTradingMessages(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/messages`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get crypto AI messages");
    return response.json();
  }

  /**
   * Get OCO orders
   */
  async getCryptoOcoOrders(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/oco-orders`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get OCO orders");
    return response.json();
  }

  /**
   * Start crypto auto-trading
   */
  async startCryptoAutoTrading(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/start`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to start crypto auto-trading");
    }
    return response.json();
  }

  /**
   * Pause crypto auto-trading
   */
  async pauseCryptoAutoTrading(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/pause`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to pause crypto auto-trading");
    return response.json();
  }

  /**
   * Resume crypto auto-trading
   */
  async resumeCryptoAutoTrading(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/resume`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to resume crypto auto-trading");
    return response.json();
  }

  /**
   * Stop crypto auto-trading
   */
  async stopCryptoAutoTrading(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/stop`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to stop crypto auto-trading");
    return response.json();
  }

  /**
   * Reset crypto auto-trading session
   */
  async resetCryptoAutoTrading(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/reset`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to reset crypto auto-trading");
    return response.json();
  }

  /**
   * Execute crypto auto-trades now (manual trigger)
   */
  async executeCryptoAutoTradeNow(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/execute-now`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to execute crypto auto-trades");
    }
    return response.json();
  }

  /**
   * Execute a single crypto trade (for testing)
   */
  async executeCryptoSingleTrade(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/execute-single`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to execute single crypto trade");
    }
    return response.json();
  }

  /**
   * Get testnet connection status for auto-trading
   */
  async getCryptoAutoTradingConnection(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auto-trading/connection`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get connection status");
    return response.json();
  }
}

export const binanceTestnetService = new BinanceTestnetService();
